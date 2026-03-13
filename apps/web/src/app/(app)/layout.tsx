"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import AppShell from "../../components/layout/AppShell/AppShell";
import type { User } from "@vendorapp/shared";
import { defaultAppPathForUser, fetchMe } from "@/lib/api";

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
      const next = encodeURIComponent(pathname || "/dashboard");
      router.replace(`/login?next=${next}`);
      return;
    }

    if (!user) {
      return;
    }

    if (!user.onboardingCompleted && pathname !== "/onboarding") {
      router.replace("/onboarding");
      return;
    }

    if (user.onboardingCompleted && pathname === "/onboarding") {
      router.replace(defaultAppPathForUser(user));
    }
  }, [pathname, router, user]);

  if (!user) return null;

  return <AppShell>{children}</AppShell>;
}
