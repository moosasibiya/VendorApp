"use client";

import { usePathname } from "next/navigation";
import styles from "./Topbar.module.css";

const ROUTE_META: Record<string, { title: string; subtitle: string }> = {
  "/dashboard": {
    title: "Dashboard",
    subtitle: "Overview of your workspace and activity.",
  },
  "/creatives": {
    title: "Creatives",
    subtitle: "Browse, verify, and manage creative profiles.",
  },
  "/bookings": {
    title: "Bookings",
    subtitle: "Track new, active, and completed bookings.",
  },
  "/messages": {
    title: "Messages",
    subtitle: "Conversations, delivery updates, and client notes.",
  },
  "/calendar": {
    title: "Calendar",
    subtitle: "Availability, upcoming shoots, and blocked time.",
  },
  "/reviews": {
    title: "Reviews",
    subtitle: "Ratings, testimonials, and feedback responses.",
  },
  "/payments": {
    title: "Payments",
    subtitle: "Payouts, invoices, and revenue insights.",
  },
  "/settings": {
    title: "Settings",
    subtitle: "Manage your profile and platform preferences.",
  },
  "/onboarding": {
    title: "Onboarding",
    subtitle: "Complete your artist setup and verification.",
  },
};

export default function Topbar() {
  const pathname = usePathname();

  // Match exact route or sub-routes (e.g. /creatives/123)
  const route =
    Object.keys(ROUTE_META).find(
      (key) => pathname === key || pathname.startsWith(key + "/"),
    ) ?? "/dashboard";

  const { title, subtitle } = ROUTE_META[route];

  const toggleTheme = () => {
    const root = document.documentElement;
    const next =
      root.getAttribute("data-theme") === "light" ? "dark" : "light";
    root.setAttribute("data-theme", next);
    localStorage.setItem("vendrman_theme", next);
  };

  return (
    <header className={styles.topbar}>
      <div className={styles.left}>
        <div className={styles.title}>{title}</div>
        <div className={styles.subtitle}>{subtitle}</div>
      </div>

      <div className={styles.right}>
        <div className={styles.search}>
          <span className="material-symbols-outlined">search</span>
          <input placeholder="Search creatives, bookings..." />
        </div>

        <button className={styles.iconBtn} type="button" onClick={toggleTheme}>
          <span className="material-symbols-outlined">contrast</span>
        </button>

        <button className={styles.iconBtn} type="button" title="Notifications">
          <span className="material-symbols-outlined">notifications</span>
        </button>

        <div className={styles.avatar} title="Profile">
          MS
        </div>
      </div>
    </header>
  );
}
