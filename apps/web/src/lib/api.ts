import type {
  AccountType,
  Artist,
  AuthResponse,
  Booking,
  LoginRequest,
  SignupRequest,
  User,
} from "@vendorapp/shared";
export type { Artist, Booking } from "@vendorapp/shared";

export type CreateBookingInput = Pick<
  Booking,
  "artistName" | "artistInitials" | "title" | "location" | "date" | "amount"
>;

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
  const response = await fetch(`${API_BASE_URL}/auth/csrf`, {
    method: "GET",
    cache: "no-store",
    credentials: "include",
  });
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
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    cache: "no-store",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(csrfToken ? { [CSRF_HEADER_NAME]: csrfToken } : {}),
      ...(init?.headers ?? {}),
    },
  });

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

export async function fetchBookings(): Promise<Booking[]> {
  return getJson<Booking[]>("/bookings");
}

export async function createBooking(input: CreateBookingInput): Promise<Booking> {
  return getJson<Booking>("/bookings", {
    method: "POST",
    body: JSON.stringify(input),
  });
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
