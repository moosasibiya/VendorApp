import type {
  AdminDashboardData,
  AccountType,
  ApiResponse as ApiEnvelope,
  Agency,
  Artist,
  ArtistCategory,
  ArtistProfileInput,
  ArtistSearchParams,
  AuthResponse,
  BookingAction,
  Booking,
  BookingVerificationStatusValue,
  ChangePasswordInput,
  ConversationMessage,
  ConversationSummary,
  CreateConversationInput,
  CreateBookingInput,
  CreateReviewInput,
  CreateSupportThreadInput,
  CursorApiResponse,
  DashboardStats,
  LoginRequest,
  MessageTypeValue,
  MyReviewsOverview,
  NotificationFeed,
  NotificationItem,
  OnboardingAgencyInput,
  OnboardingClientInput,
  PaymentCheckoutSession,
  PlatformSettings,
  PayoutStatusValue,
  ReviewItem,
  SignupRequest,
  UpcomingBookingItem,
  UpdateSupportThreadInput,
  UpdateUserProfileInput,
  User,
} from "@vendorapp/shared";
export type {
  AdminDashboardData,
  Agency,
  Artist,
  ArtistCategory,
  ArtistProfileInput,
  ArtistSearchParams,
  Booking,
  BookingVerificationStatusValue,
  ChangePasswordInput,
  ConversationMessage,
  ConversationSummary,
  CreateConversationInput,
  CreateBookingInput,
  CreateReviewInput,
  CreateSupportThreadInput,
  CursorApiResponse,
  DashboardStats,
  MessageTypeValue,
  MyReviewsOverview,
  NotificationFeed,
  NotificationItem,
  OnboardingAgencyInput,
  OnboardingClientInput,
  PaymentCheckoutSession,
  PlatformSettings,
  PayoutStatusValue,
  ReviewItem,
  UpcomingBookingItem,
  UpdateSupportThreadInput,
  UpdateUserProfileInput,
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

export async function fetchArtists(
  query?: ArtistSearchParams,
): Promise<ApiEnvelope<Artist[]>> {
  const params = new URLSearchParams();
  if (query?.category) params.set("category", query.category);
  if (query?.location) params.set("location", query.location);
  if (query?.minRate !== undefined) params.set("minRate", String(query.minRate));
  if (query?.maxRate !== undefined) params.set("maxRate", String(query.maxRate));
  if (query?.available !== undefined) {
    params.set("available", String(query.available));
  }
  if (query?.tags && query.tags.length > 0) {
    params.set("tags", query.tags.join(","));
  }
  if (query?.q) params.set("q", query.q);
  if (query?.page) params.set("page", String(query.page));
  if (query?.limit) params.set("limit", String(query.limit));
  if (query?.sortBy) params.set("sortBy", query.sortBy);

  const suffix = params.toString() ? `?${params.toString()}` : "";
  return getJson<ApiEnvelope<Artist[]>>(`/artists${suffix}`);
}

export async function fetchCategories(): Promise<ArtistCategory[]> {
  const response = await getJson<ApiEnvelope<ArtistCategory[]>>("/categories");
  return response.data;
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
  payoutStatus?: PayoutStatusValue;
  verificationStatus?: BookingVerificationStatusValue;
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
}): Promise<ApiEnvelope<Booking[]>> {
  const params = new URLSearchParams();
  if (query?.status) {
    params.set("status", query.status);
  }
  if (query?.payoutStatus) {
    params.set("payoutStatus", query.payoutStatus);
  }
  if (query?.verificationStatus) {
    params.set("verificationStatus", query.verificationStatus);
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

export async function fetchArtistReviews(
  slug: string,
  query?: { page?: number; limit?: number },
): Promise<ApiEnvelope<ReviewItem[]>> {
  const params = new URLSearchParams();
  if (query?.page) {
    params.set("page", String(query.page));
  }
  if (query?.limit) {
    params.set("limit", String(query.limit));
  }

  const suffix = params.toString() ? `?${params.toString()}` : "";
  return getJson<ApiEnvelope<ReviewItem[]>>(
    `/artists/${encodeURIComponent(slug)}/reviews${suffix}`,
  );
}

export async function createReview(input: CreateReviewInput): Promise<ReviewItem> {
  const response = await getJson<ApiEnvelope<ReviewItem>>("/reviews", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return response.data;
}

export async function fetchMyReviews(): Promise<MyReviewsOverview> {
  return getJson<MyReviewsOverview>("/reviews/me");
}

export async function createConversation(
  input: CreateConversationInput,
): Promise<ConversationSummary> {
  const response = await getJson<ApiEnvelope<ConversationSummary>>("/conversations", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return response.data;
}

export async function fetchConversations(): Promise<ConversationSummary[]> {
  const response = await getJson<ApiEnvelope<ConversationSummary[]>>("/conversations");
  return response.data;
}

export async function createSupportThread(
  input: CreateSupportThreadInput,
): Promise<ConversationSummary> {
  const response = await getJson<ApiEnvelope<ConversationSummary>>("/support/threads", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return response.data;
}

export async function updateSupportThread(input: {
  conversationId: string;
  status?: UpdateSupportThreadInput["status"];
  assignedAdminUserId?: string | null;
  internalNote?: string | null;
}): Promise<ConversationSummary> {
  const response = await getJson<ApiEnvelope<ConversationSummary>>(
    `/support/threads/${encodeURIComponent(input.conversationId)}`,
    {
      method: "PATCH",
      body: JSON.stringify({
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.assignedAdminUserId !== undefined
          ? { assignedAdminUserId: input.assignedAdminUserId }
          : {}),
        ...(input.internalNote !== undefined ? { internalNote: input.internalNote } : {}),
      }),
    },
  );
  return response.data;
}

export async function fetchConversationMessages(input: {
  conversationId: string;
  cursor?: string | null;
  limit?: number;
}): Promise<CursorApiResponse<ConversationMessage[]>> {
  const params = new URLSearchParams();
  if (input.cursor) {
    params.set("cursor", input.cursor);
  }
  if (input.limit) {
    params.set("limit", String(input.limit));
  }

  const suffix = params.toString() ? `?${params.toString()}` : "";
  return getJson<CursorApiResponse<ConversationMessage[]>>(
    `/conversations/${encodeURIComponent(input.conversationId)}/messages${suffix}`,
  );
}

export async function sendConversationMessage(input: {
  conversationId: string;
  content: string;
  type?: MessageTypeValue;
  fileUrl?: string;
}): Promise<ConversationMessage> {
  const response = await getJson<ApiEnvelope<ConversationMessage>>(
    `/conversations/${encodeURIComponent(input.conversationId)}/messages`,
    {
      method: "POST",
      body: JSON.stringify({
        content: input.content,
        ...(input.type ? { type: input.type } : {}),
        ...(input.fileUrl ? { fileUrl: input.fileUrl } : {}),
      }),
    },
  );
  return response.data;
}

export async function markConversationRead(
  conversationId: string,
): Promise<{ success: true }> {
  return getJson<{ success: true }>(
    `/conversations/${encodeURIComponent(conversationId)}/read`,
    {
      method: "PATCH",
    },
  );
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

export async function verifyBookingStartCode(input: {
  bookingId: string;
  code: string;
}): Promise<Booking> {
  const response = await getJson<ApiEnvelope<Booking>>(
    `/bookings/${encodeURIComponent(input.bookingId)}/start-code/verify`,
    {
      method: "POST",
      body: JSON.stringify({ code: input.code }),
    },
  );
  return response.data;
}

export async function applyAdminBookingOverride(input: {
  bookingId: string;
  action: "verify_without_code" | "hold_payout" | "release_payout" | "resolve_dispute";
  reason?: string;
}): Promise<Booking> {
  const response = await getJson<ApiEnvelope<Booking>>(
    `/bookings/${encodeURIComponent(input.bookingId)}/admin-override`,
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

export async function initiateBookingPayment(
  bookingId: string,
): Promise<PaymentCheckoutSession> {
  const response = await getJson<ApiEnvelope<PaymentCheckoutSession>>(
    `/bookings/${encodeURIComponent(bookingId)}/payment/initiate`,
    {
      method: "POST",
    },
  );
  return response.data;
}

export async function fetchNotifications(query?: {
  cursor?: string | null;
  limit?: number;
}): Promise<NotificationFeed> {
  const params = new URLSearchParams();
  if (query?.cursor) {
    params.set("cursor", query.cursor);
  }
  if (query?.limit) {
    params.set("limit", String(query.limit));
  }

  const suffix = params.toString() ? `?${params.toString()}` : "";
  return getJson<NotificationFeed>(`/notifications${suffix}`);
}

export async function markNotificationRead(id: string): Promise<NotificationItem> {
  return getJson<NotificationItem>(`/notifications/${encodeURIComponent(id)}/read`, {
    method: "PATCH",
  });
}

export async function markAllNotificationsRead(): Promise<{ success: true }> {
  return getJson<{ success: true }>("/notifications/read-all", {
    method: "PATCH",
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

export async function changePassword(
  input: ChangePasswordInput,
): Promise<{ success: true }> {
  return getJson<{ success: true }>("/auth/change-password", {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function fetchMyStats(): Promise<DashboardStats> {
  return getJson<DashboardStats>("/users/me/stats");
}

export async function fetchMyUpcomingBookings(): Promise<UpcomingBookingItem[]> {
  return getJson<UpcomingBookingItem[]>("/users/me/upcoming-bookings");
}

export async function updateCurrentUser(input: UpdateUserProfileInput): Promise<User> {
  return getJson<User>("/users/me", {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function deleteCurrentUser(): Promise<{ success: true }> {
  return getJson<{ success: true }>("/users/me", {
    method: "DELETE",
  });
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

export async function fetchAdminDashboard(): Promise<AdminDashboardData> {
  return getJson<AdminDashboardData>("/admin/dashboard");
}

export async function updatePlatformSettings(
  input: Partial<PlatformSettings>,
): Promise<PlatformSettings> {
  return getJson<PlatformSettings>("/admin/settings", {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function updateArtistApplication(input: {
  artistId: string;
  action: "under_review" | "approve" | "reject" | "go_live";
  note?: string;
}): Promise<AdminDashboardData> {
  return getJson<AdminDashboardData>(
    `/admin/artists/${encodeURIComponent(input.artistId)}/application`,
    {
      method: "PATCH",
      body: JSON.stringify({
        action: input.action,
        ...(input.note ? { note: input.note } : {}),
      }),
    },
  );
}

export async function updateArtistTier(input: {
  artistId: string;
  tierId?: string | null;
  reason?: string | null;
}): Promise<AdminDashboardData> {
  return getJson<AdminDashboardData>(
    `/admin/artists/${encodeURIComponent(input.artistId)}/tier`,
    {
      method: "PATCH",
      body: JSON.stringify({
        ...(input.tierId !== undefined ? { tierId: input.tierId } : {}),
        ...(input.reason !== undefined ? { reason: input.reason } : {}),
      }),
    },
  );
}

export async function updateTierDefinition(input: {
  tierId: string;
  name?: string;
  description?: string | null;
  sortOrder?: number;
  isActive?: boolean;
  thresholds?: Record<string, unknown>;
  benefits?: Record<string, unknown>;
}): Promise<AdminDashboardData> {
  return getJson<AdminDashboardData>(`/admin/tiers/${encodeURIComponent(input.tierId)}`, {
    method: "PATCH",
    body: JSON.stringify({
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      ...(input.thresholds !== undefined ? { thresholds: input.thresholds } : {}),
      ...(input.benefits !== undefined ? { benefits: input.benefits } : {}),
    }),
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
    case "SUB_ADMIN":
    case "ADMIN":
      return "/admin";
    case "ARTIST":
    default:
      return "/dashboard";
  }
}

export function getApiOrigin(): string {
  return new URL(API_BASE_URL).origin;
}
