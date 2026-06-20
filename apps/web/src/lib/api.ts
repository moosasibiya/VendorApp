const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api";

const CSRF_COOKIE_NAME = "vendrman_csrf";
const CSRF_HEADER_NAME = "X-CSRF-Token";

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
  if (error instanceof ApiError) return error;
  if (error instanceof Error) return new ApiError(0, fallbackMessage, { cause: error.message });
  return new ApiError(0, fallbackMessage);
}

function getCookieValue(name: string): string | null {
  if (typeof document === "undefined") return null;
  const prefix = `${name}=`;
  const cookie = document.cookie
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(prefix));
  return cookie ? decodeURIComponent(cookie.slice(prefix.length)) : null;
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
    throw toApiError(error, "Unable to reach the API.");
  }

  if (!response.ok) throw new ApiError(response.status, "Unable to initialize CSRF token");

  try {
    const data = (await response.json()) as { csrfToken?: string };
    if (typeof data.csrfToken === "string" && data.csrfToken) return data.csrfToken;
  } catch { /* fall through */ }

  return getCookieValue(CSRF_COOKIE_NAME);
}

async function getJson<T>(path: string, init?: RequestInit): Promise<T> {
  const method = (init?.method ?? "GET").toUpperCase();
  const isReadOnly = method === "GET" || method === "HEAD" || method === "OPTIONS";
  const csrfToken = isReadOnly ? null : await ensureCsrfToken();

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
    throw toApiError(error, "Unable to reach the API.");
  }

  if (!response.ok) {
    let errorMessage: string | undefined;
    let details: unknown;
    try {
      const data = (await response.json()) as { message?: string | string[] };
      details = data;
      errorMessage = Array.isArray(data.message) ? data.message.join(", ") : data.message;
    } catch { /* ignore */ }
    throw new ApiError(response.status, errorMessage, details);
  }

  return (await response.json()) as T;
}

// ─── Types ───────────────────────────────────────────────────────────────────

export type InsiderUserType = "CLIENT" | "ARTIST";

export type InsiderSignupInput = {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  userType: InsiderUserType;
  referredBy?: string;
};

export type InsiderSignupResponse = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  userType: InsiderUserType;
  referralCode: string;
  inviteLink: string;
  referredBy?: string | null;
  insiderStatus: "PENDING" | "VERIFIED";
  instagramFollowed: boolean;
  tiktokFollowed: boolean;
  referralCount: number;
  createdAt: string;
  verifiedAt?: string | null;
  duplicate: boolean;
};

// ─── API calls ────────────────────────────────────────────────────────────────

export async function createInsiderSignup(
  input: InsiderSignupInput,
): Promise<InsiderSignupResponse> {
  const response = await getJson<{ data: InsiderSignupResponse; message?: string }>(
    "/prelaunch/insiders",
    { method: "POST", body: JSON.stringify(input) },
  );
  return response.data;
}

export async function fetchInsiderStats(): Promise<{ insiderCount: number; total: number }> {
  const response = await getJson<{ data: { insiderCount: number; total: number } }>(
    "/prelaunch/stats",
  );
  return response.data;
}
