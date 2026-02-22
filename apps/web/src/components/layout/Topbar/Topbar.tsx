"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { logout as logoutRequest } from "@/lib/api";
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
  const [searchQuery, setSearchQuery] = useState("");
  const [compactSearch, setCompactSearch] = useState(false);

  // Match exact route or sub-routes (e.g. /creatives/123)
  const route =
    Object.keys(ROUTE_META).find(
      (key) => pathname === key || pathname.startsWith(key + "/"),
    ) ?? "/dashboard";

  const { title, subtitle } = ROUTE_META[route];

  useEffect(() => {
    let frame = 0;

    const updateCompact = () => {
      const shouldCompact = window.scrollY > 16;
      setCompactSearch((current) =>
        current === shouldCompact ? current : shouldCompact,
      );
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        updateCompact();
      });
    };

    updateCompact();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const toggleTheme = () => {
    const root = document.documentElement;
    const next =
      root.getAttribute("data-theme") === "light" ? "dark" : "light";
    root.setAttribute("data-theme", next);
    localStorage.setItem("vendrman_theme", next);
  };

  const logout = async () => {
    try {
      await logoutRequest();
    } finally {
      window.location.href = "/";
    }
  };

  return (
    <header className={styles.topbar} data-compact={compactSearch}>
      <div className={styles.left}>
        <div className={styles.title}>{title}</div>
        <div className={styles.subtitle}>{subtitle}</div>
      </div>

      <div className={styles.right}>
        <div className={styles.search}>
          <span className="material-symbols-outlined">search</span>
          <span className={styles.searchSummary}>
            {searchQuery.trim() || "Search"}
          </span>
          <input
            placeholder="Search creatives, bookings..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </div>

        <button className={styles.iconBtn} type="button" onClick={toggleTheme}>
          <span className="material-symbols-outlined">contrast</span>
        </button>

        <button className={styles.iconBtn} type="button" title="Notifications">
          <span className="material-symbols-outlined">notifications</span>
        </button>

        <button className={styles.logoutBtn} type="button" onClick={() => void logout()}>
          <span className="material-symbols-outlined">logout</span>
          Logout
        </button>

        <div className={styles.avatar} title="Profile">
          MS
        </div>
      </div>
    </header>
  );
}
