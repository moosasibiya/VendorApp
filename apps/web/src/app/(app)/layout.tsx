"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import AppShell from "../../components/layout/AppShell/AppShell";
import type { User } from "@vendorapp/shared";
import { AppSessionProvider } from "@/components/session/AppSessionContext";
import { defaultAppPathForUser, fetchMe } from "@/lib/api";

function getRequestedPath(pathname: string | null): string {
  const basePath = pathname || "/dashboard";
  if (typeof window === "undefined") {
    return basePath;
  }
  return `${basePath}${window.location.search || ""}`;
}

function isOnboardingPreviewPath(pathname: string | null): boolean {
  if (typeof window === "undefined" || pathname !== "/onboarding") {
    return false;
  }
  return new URLSearchParams(window.location.search).get("preview") === "1";
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const currentUser = await fetchMe();
        if (!cancelled) setUser(currentUser);
      } catch {
        if (!cancelled) setUser(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  useEffect(() => {
    if (user === null) {
      const next = encodeURIComponent(getRequestedPath(pathname));
      router.replace(`/login?next=${next}`);
      return;
    }

    if (!user) {
      return;
    }

    if (
      user.onboardingCompleted &&
      pathname === "/onboarding" &&
      !isOnboardingPreviewPath(pathname)
    ) {
      router.replace(defaultAppPathForUser(user));
    }
  }, [pathname, router, user]);

  if (!user) return null;

  return (
    <AppSessionProvider user={user}>
      <AppShell>{children}</AppShell>
    </AppSessionProvider>
  );
}
