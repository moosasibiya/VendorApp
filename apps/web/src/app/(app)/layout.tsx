"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import AppShell from "../../components/layout/AppShell/AppShell";

const AUTH_TOKEN_KEY = "vendrman_token";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const authed =
    typeof window !== "undefined" &&
    (!!localStorage.getItem(AUTH_TOKEN_KEY) ||
      !!sessionStorage.getItem(AUTH_TOKEN_KEY));

  useEffect(() => {
    if (!authed) {
      const next = encodeURIComponent(pathname || "/dashboard");
      router.replace(`/login?next=${next}`);
    }
  }, [authed, router, pathname]);

  if (!authed) return null;

  return <AppShell>{children}</AppShell>;
}
