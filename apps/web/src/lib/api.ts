import type {
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
const AUTH_TOKEN_KEY = "vendrman_token";

function getAuthTokenFromBrowser(): string | null {
  if (typeof window === "undefined") return null;
  return (
    localStorage.getItem(AUTH_TOKEN_KEY) ?? sessionStorage.getItem(AUTH_TOKEN_KEY)
  );
}

async function getJson<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAuthTokenFromBrowser();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
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
