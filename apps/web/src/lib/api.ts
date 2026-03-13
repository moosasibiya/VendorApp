import type {
  AccountType,
  ApiResponse as ApiEnvelope,
  Agency,
  Artist,
  ArtistProfileInput,
  AuthResponse,
  BookingAction,
  Booking,
  CreateBookingInput,
  LoginRequest,
  OnboardingAgencyInput,
  OnboardingClientInput,
  SignupRequest,
  User,
} from "@vendorapp/shared";
export type {
  Agency,
  Artist,
  ArtistProfileInput,
  Booking,
  CreateBookingInput,
  OnboardingAgencyInput,
  OnboardingClientInput,
} from "@vendorapp/shared";

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message?: string, details?: unknown) {
    super(message ?? `API request failed: ${status}`);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

function toApiError(error: unknown, fallbackMessage: string): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  if (error instanceof Error) {
    return new ApiError(0, fallbackMessage, { cause: error.message });
  }

  return new ApiError(0, fallbackMessage);
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api";
const CSRF_COOKIE_NAME = "vendrman_csrf";
const CSRF_HEADER_NAME = "X-CSRF-Token";

function isSafeHttpMethod(method: string): boolean {
  const upper = method.toUpperCase();
  return upper === "GET" || upper === "HEAD" || upper === "OPTIONS";
}

function getCookieValue(name: string): string | null {
  if (typeof document === "undefined") return null;
  const prefix = `${name}=`;
  const cookie = document.cookie
    .split(";")
    .map((chunk) => chunk.trim())
    .find((chunk) => chunk.startsWith(prefix));
  if (!cookie) return null;
  return decodeURIComponent(cookie.slice(prefix.length));
}

async function ensureCsrfToken(): Promise<string | null> {
  const existing = getCookieValue(CSRF_COOKIE_NAME);
  if (existing) return existing;

  if (typeof window === "undefined") return null;
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/auth/csrf`, {
      method: "GET",
      cache: "no-store",
      credentials: "include",
    });
  } catch (error) {
    throw toApiError(
      error,
      "Unable to reach the API. Start the API server and database, then try again.",
    );
  }
  if (!response.ok) {
    throw new ApiError(response.status, "Unable to initialize CSRF token");
  }

  try {
    const data = (await response.json()) as { csrfToken?: string };
    if (typeof data.csrfToken === "string" && data.csrfToken) {
      return data.csrfToken;
    }
  } catch {
    // Fall back to cookie read below.
  }

  return getCookieValue(CSRF_COOKIE_NAME);
}

async function getJson<T>(path: string, init?: RequestInit): Promise<T> {
  const method = (init?.method ?? "GET").toUpperCase();
  const csrfToken = isSafeHttpMethod(method) ? null : await ensureCsrfToken();
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      cache: "no-store",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(csrfToken ? { [CSRF_HEADER_NAME]: csrfToken } : {}),
        ...(init?.headers ?? {}),
      },
    });
  } catch (error) {
    throw toApiError(
      error,
      "Unable to reach the API. Start the API server and database, then try again.",
    );
  }

  if (!response.ok) {
    let errorMessage: string | undefined;
    let details: unknown;

    try {
      const data = (await response.json()) as { message?: string | string[] };
      details = data;
      if (Array.isArray(data.message)) {
        errorMessage = data.message.join(", ");
      } else {
        errorMessage = data.message;
      }
    } catch {
      errorMessage = undefined;
    }

    throw new ApiError(response.status, errorMessage, details);
  }

  return (await response.json()) as T;
}

export async function fetchArtists(): Promise<Artist[]> {
  return getJson<Artist[]>("/artists");
}

export async function fetchArtistBySlug(slug: string): Promise<Artist> {
  return getJson<Artist>(`/artists/${slug}`);
}

export async function fetchMyArtistProfile(): Promise<Artist | null> {
  return getJson<Artist | null>("/artists/me/profile");
}

export async function updateMyArtistProfile(
  input: ArtistProfileInput,
): Promise<Artist> {
  return getJson<Artist>("/artists/me/profile", {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export async function fetchBookings(query?: {
  status?: Booking["status"];
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
}): Promise<ApiEnvelope<Booking[]>> {
  const params = new URLSearchParams();
  if (query?.status) {
    params.set("status", query.status);
  }
  if (query?.page) {
    params.set("page", String(query.page));
  }
  if (query?.limit) {
    params.set("limit", String(query.limit));
  }
  if (query?.startDate) {
    params.set("startDate", query.startDate);
  }
  if (query?.endDate) {
    params.set("endDate", query.endDate);
  }

  const suffix = params.toString() ? `?${params.toString()}` : "";
  return getJson<ApiEnvelope<Booking[]>>(`/bookings${suffix}`);
}

export async function createBooking(input: CreateBookingInput): Promise<Booking> {
  const response = await getJson<ApiEnvelope<Booking>>("/bookings", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return response.data;
}

export async function fetchBooking(id: string): Promise<Booking> {
  const response = await getJson<ApiEnvelope<Booking>>(`/bookings/${id}`);
  return response.data;
}

export async function updateBookingStatus(input: {
  bookingId: string;
  action: BookingAction;
  reason?: string;
}): Promise<Booking> {
  const response = await getJson<ApiEnvelope<Booking>>(
    `/bookings/${encodeURIComponent(input.bookingId)}/status`,
    {
      method: "PATCH",
      body: JSON.stringify({
        action: input.action,
        ...(input.reason ? { reason: input.reason } : {}),
      }),
    },
  );
  return response.data;
}

export async function signup(input: SignupRequest): Promise<AuthResponse> {
  return getJson<AuthResponse>("/auth/signup", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function login(input: LoginRequest): Promise<AuthResponse> {
  return getJson<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function fetchMe(): Promise<User> {
  return getJson<User>("/auth/me");
}

export async function requestPasswordReset(email: string): Promise<{ success: true; resetToken?: string }> {
  return getJson<{ success: true; resetToken?: string }>("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function resetPassword(input: {
  token: string;
  newPassword: string;
}): Promise<{ success: true }> {
  return getJson<{ success: true }>("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function verifyEmail(token: string): Promise<{ success: true; email: string }> {
  return getJson<{ success: true; email: string }>(
    `/auth/verify-email?token=${encodeURIComponent(token)}`,
  );
}

export async function resendVerificationEmail(email: string): Promise<{ success: true }> {
  return getJson<{ success: true }>("/auth/verify-email/resend", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function updateClientOnboarding(input: OnboardingClientInput): Promise<User> {
  return getJson<User>("/users/me/onboarding/client", {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function fetchMyAgency(): Promise<Agency | null> {
  return getJson<Agency | null>("/agencies/me");
}

export async function createAgency(input: OnboardingAgencyInput): Promise<Agency> {
  return getJson<Agency>("/agencies", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function logout(): Promise<void> {
  try {
    await getJson<{ success: boolean }>("/auth/logout", {
      method: "POST",
    });
  } catch (error) {
    if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
      return;
    }
    throw error;
  }
}

export function buildGoogleAuthStartUrl(input: {
  mode: "login" | "signup";
  nextPath?: string;
  accountType?: AccountType;
}): string {
  const params = new URLSearchParams({
    mode: input.mode,
    next: input.nextPath ?? (input.mode === "signup" ? "/onboarding" : "/dashboard"),
  });
  if (input.accountType) {
    params.set("accountType", input.accountType);
  }
  return `${API_BASE_URL}/auth/google/start?${params.toString()}`;
}

export function defaultAppPathForUser(user: User): string {
  if (!user.onboardingCompleted) {
    return "/onboarding";
  }

  switch (user.role) {
    case "CLIENT":
      return "/explore";
    case "AGENCY":
      return "/agency/dashboard";
    case "ADMIN":
      return "/admin";
    case "ARTIST":
    default:
      return "/dashboard";
  }
}
