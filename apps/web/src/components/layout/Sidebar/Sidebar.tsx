"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppSession } from "@/components/session/AppSessionContext";
import { logout as logoutRequest } from "@/lib/api";
import styles from "./Sidebar.module.css";

const NavItem = ({
  href,
  icon,
  label,
}: {
  href: string;
  icon: string;
  label: string;
}) => {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href + "/");

  return (
    <Link
      href={href}
      className={`${styles.navItem} ${isActive ? styles.active : ""}`}
    >
      <span className={"material-symbols-outlined " + styles.icon}>{icon}</span>
      <span className={styles.label}>{label}</span>
    </Link>
  );
};

export default function Sidebar() {
  const { user } = useAppSession();

  const handleLogout = async () => {
    try {
      await logoutRequest();
    } finally {
      window.location.href = "/login";
    }
  };

  return (
    <aside className={styles.sidebar}>
      <Link href="/" className={styles.brand}>
        Vendr<span>Man</span>
      </Link>

      <div className={styles.sectionTitle}>Workspace</div>
      <nav className={styles.nav}>
        <NavItem href="/dashboard" icon="dashboard" label="Dashboard" />
        <NavItem href="/projects" icon="assignment" label="Projects" />
        <NavItem href="/calendar" icon="calendar_month" label="Calendar" />
        <NavItem href="/creatives" icon="groups" label="Creatives" />
        <NavItem href="/messages" icon="chat" label="Messages" />
        <NavItem href="/studio" icon="dashboard_customize" label="Studio" />
        <NavItem href="/reviews" icon="star" label="Reviews" />
        <NavItem href="/settings" icon="settings" label="Settings" />
        <NavItem href="/support" icon="support_agent" label="Support" />
      </nav>

      {user?.role === "ADMIN" || user?.role === "SUB_ADMIN" ? (
        <>
          <div className={styles.sectionTitle}>Admin</div>
          <nav className={styles.nav}>
            <NavItem href="/admin" icon="shield_person" label="Admin Dashboard" />
            <NavItem href="/admin/users" icon="manage_accounts" label="Users" />
            <NavItem href="/admin/creatives" icon="groups" label="Creatives" />
            <NavItem href="/admin/projects" icon="assignment" label="Projects" />
            <NavItem href="/admin/payouts" icon="payments" label="Payouts" />
            <NavItem href="/admin/reports" icon="monitoring" label="Reports" />
            <NavItem href="/admin/settings" icon="admin_panel_settings" label="Settings" />
          </nav>
        </>
      ) : null}

      <div className={styles.spacer} />

      <div className={styles.footer}>
        <div className={styles.footerLinks}>
          <Link href="/login">Login</Link>
          <Link href="/signup">Sign up</Link>
          <Link href="/home">Public home</Link>
        </div>
        <button
          className={styles.footerBtn}
          type="button"
          onClick={() => void handleLogout()}
        >
          <span className="material-symbols-outlined">logout</span>
          Logout
        </button>
      </div>
    </aside>
  );
}
