"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import styles from "./DevRouteDrawer.module.css";

type DevRoute = {
  label: string;
  href: string;
};

type DevRouteGroup = {
  title: string;
  routes: DevRoute[];
};

const ROUTE_GROUPS: DevRouteGroup[] = [
  {
    title: "Landing + Public",
    routes: [
      { label: "Prelaunch Landing", href: "/" },
      { label: "Privacy", href: "/privacy" },
      { label: "Public Home", href: "/home" },
      { label: "Explore", href: "/explore" },
      { label: "Creative Profile", href: "/creatives/ava-maseko" },
      { label: "How It Works", href: "/how-it-works" },
      { label: "Pricing", href: "/pricing" },
      { label: "About", href: "/about" },
      { label: "FAQ", href: "/faq" },
      { label: "Contact", href: "/contact" },
      { label: "Join", href: "/join" },
    ],
  },
  {
    title: "Auth",
    routes: [
      { label: "Login", href: "/login" },
      { label: "Signup", href: "/signup" },
      { label: "Forgot Password", href: "/forgot-password" },
      { label: "Reset Password", href: "/reset-password" },
      { label: "Verify Email", href: "/verify-email" },
    ],
  },
  {
    title: "App",
    routes: [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Admin", href: "/admin" },
      { label: "Admin Users", href: "/admin/users" },
      { label: "Admin Creatives", href: "/admin/creatives" },
      { label: "Admin Projects", href: "/admin/projects" },
      { label: "Admin Payouts", href: "/admin/payouts" },
      { label: "Admin Reports", href: "/admin/reports" },
      { label: "Admin Settings", href: "/admin/settings" },
      { label: "Projects", href: "/projects" },
      { label: "Project Detail", href: "/projects/dev-project" },
      { label: "New Project", href: "/projects/new" },
      { label: "Calendar", href: "/calendar" },
      { label: "Creatives", href: "/creatives" },
      { label: "Messages", href: "/messages" },
      { label: "Studio", href: "/studio" },
      { label: "Reviews", href: "/reviews" },
      { label: "Settings", href: "/settings" },
      { label: "Support", href: "/support" },
    ],
  },
];

export function DevRouteDrawer() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.key.toLowerCase() === "d" &&
        (event.metaKey || event.ctrlKey) &&
        event.shiftKey
      ) {
        event.preventDefault();
        setOpen((current) => !current);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  if (process.env.NODE_ENV === "production") {
    return null;
  }

  return (
    <aside className={styles.root} aria-label="Development route navigation">
      {!open && (
        <button
          type="button"
          className={styles.toggle}
          onClick={() => setOpen(true)}
          aria-label="Open page navigation drawer"
        >
          <Menu size={18} aria-hidden="true" />
          <span className={styles.toggleLabel}>Pages</span>
        </button>
      )}

      {open && (
        <div className={styles.panel}>
          <div className={styles.header}>
            <div className={styles.title}>
              <span className={styles.eyebrow}>Temporary</span>
              <span className={styles.heading}>Page Drawer</span>
            </div>
            <button
              type="button"
              className={styles.close}
              onClick={() => setOpen(false)}
              aria-label="Close page navigation drawer"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>

          <div className={styles.content}>
            {ROUTE_GROUPS.map((group) => (
              <section key={group.title} className={styles.section}>
                <h2 className={styles.sectionTitle}>{group.title}</h2>
                {group.routes.map((route) => {
                  const targetPath = route.href.split("?")[0];
                  const isActive = pathname === targetPath;

                  return (
                    <Link
                      key={route.href}
                      className={`${styles.link} ${isActive ? styles.active : ""}`}
                      href={route.href}
                      onClick={() => setOpen(false)}
                    >
                      <span className={styles.label}>{route.label}</span>
                      <span className={styles.path}>{route.href}</span>
                    </Link>
                  );
                })}
              </section>
            ))}

            <p className={styles.note}>
              Protected app pages may redirect to login until you are signed in.
              Dynamic routes use development sample IDs.
            </p>
          </div>
        </div>
      )}
    </aside>
  );
}
