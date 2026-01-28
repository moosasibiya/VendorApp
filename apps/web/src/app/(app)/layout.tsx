"use client";

import { useEffect, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import AppShell from "../../components/layout/AppShell/AppShell";

const AUTH_TOKEN_KEY = "vendrman_token";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const authed = useMemo(() => {
    // Runs during render on client — safe because this file is "use client"
    return (
      typeof window !== "undefined" && !!localStorage.getItem(AUTH_TOKEN_KEY)
    );
  }, []);

  useEffect(() => {
    if (!authed) {
      const next = encodeURIComponent(pathname || "/dashboard");
      router.replace(`/auth/login?next=${next}`);
    }
  }, [authed, router, pathname]);

  // If not authed, don't render the app shell (prevents flash)
  if (!authed) return null;

  return <AppShell>{children}</AppShell>;
}
