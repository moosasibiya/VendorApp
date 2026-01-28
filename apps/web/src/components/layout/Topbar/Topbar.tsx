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
  "/payments": {
    title: "Payments",
    subtitle: "Payouts, invoices, and revenue insights.",
  },
  "/settings": {
    title: "Settings",
    subtitle: "Manage your profile and platform preferences.",
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
