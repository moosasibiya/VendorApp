import type { AccountType, User } from "@vendorapp/shared";

export type PreviewRole = "CLIENT" | "CREATIVE" | "ADMIN";

export const PREVIEW_ROLE_STORAGE_KEY = "vendr_dev_preview_role";

export function isDevPreviewMode(): boolean {
  const explicit =
    process.env.NEXT_PUBLIC_DEV_PREVIEW_MODE ?? process.env.DEV_PREVIEW_MODE;

  if (explicit === "true") {
    return true;
  }

  if (explicit === "false") {
    return false;
  }

  if (process.env.NODE_ENV === "development") {
    return true;
  }

  return (
    process.env.NEXT_PUBLIC_DEV_PREVIEW_MODE === "true" ||
    process.env.DEV_PREVIEW_MODE === "true"
  );
}

export function normalizePreviewRole(value: string | null | undefined): PreviewRole {
  if (value === "CREATIVE" || value === "ADMIN") {
    return value;
  }
  return "CLIENT";
}

export function getStoredPreviewRole(): PreviewRole {
  if (typeof window === "undefined") {
    return "CLIENT";
  }
  return normalizePreviewRole(window.localStorage.getItem(PREVIEW_ROLE_STORAGE_KEY));
}

export function createPreviewUser(role: PreviewRole): User {
  const accountType: AccountType = role === "CREATIVE" ? "CREATIVE" : "CLIENT";
  return {
    id: `preview-${role.toLowerCase()}`,
    fullName:
      role === "ADMIN"
        ? "Vendr Admin"
        : role === "CREATIVE"
          ? "Ava Maseko"
          : "Naledi Khumalo",
    username: `preview-${role.toLowerCase()}`,
    email: `preview-${role.toLowerCase()}@vendr.studio`,
    accountType,
    role: role === "ADMIN" ? "ADMIN" : role === "CREATIVE" ? "ARTIST" : "CLIENT",
    avatarUrl: null,
    location: role === "CREATIVE" ? "Cape Town" : "Johannesburg",
    clientEventTypes: ["Brand Campaign", "Portrait Session"],
    clientBudgetMin: 5000,
    clientBudgetMax: 35000,
    notificationPreferences: {
      email: true,
      bookingUpdates: true,
      newMessages: true,
      marketing: false,
    },
    isEmailVerified: true,
    isActive: true,
    onboardingCompleted: true,
    createdAt: new Date().toISOString(),
  };
}
