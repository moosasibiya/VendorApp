"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { fetchMe, logout as logoutRequest } from "@/lib/api";
import styles from "./PublicHeader.module.css";

export default function PublicHeader() {
  const [open, setOpen] = useState(false);
  const [authed, setAuthed] = useState(false);
  const drawerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        await fetchMe();
        if (!cancelled) setAuthed(true);
      } catch {
        if (!cancelled) setAuthed(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    const focusable = () =>
      Array.from(
        drawerRef.current?.querySelectorAll<HTMLElement>(
          "a, button, input, select, textarea, [tabindex]:not([tabindex='-1'])",
        ) ?? [],
      );

    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
      if (event.key !== "Tab") return;

      const items = focusable();
      if (!items.length) return;

      const first = items[0];
      const last = items[items.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    const items = focusable();
    if (items.length) items[0].focus();

    document.addEventListener("keydown", handleKeydown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
      document.removeEventListener("keydown", handleKeydown);
    };
  }, [open]);

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
      setAuthed(false);
      setOpen(false);
      window.location.href = "/";
    }
  };

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href="/" className={styles.brand}>
          Vendr<span>Man</span>
        </Link>

        <nav className={styles.nav}>
          <Link href="/artists">Artists</Link>
          <Link href="/explore">Explore</Link>
          <button className={styles.themeBtn} onClick={toggleTheme} type="button">
            <span className="material-symbols-outlined">contrast</span>
          </button>
          {authed ? <Link href="/dashboard">Dashboard</Link> : <Link href="/login">Login</Link>}
          {authed ? (
            <button className={styles.themeBtn} onClick={() => void logout()} type="button">
              Logout
            </button>
          ) : (
            <Link href="/signup" className={styles.cta}>
              Sign Up
            </Link>
          )}
        </nav>

        <button
          type="button"
          className={styles.menuBtn}
          onClick={() => setOpen(true)}
        >
          <span className="material-symbols-outlined">menu</span>
        </button>
      </div>

      {open && (
        <div className={styles.drawer}>
          <div className={styles.drawerPanel} ref={drawerRef}>
            <div className={styles.drawerHeader}>
              <span>Menu</span>
              <button type="button" onClick={() => setOpen(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className={styles.drawerLinks}>
              <Link href="/artists">Browse artists</Link>
              <Link href="/explore">Explore</Link>
              <Link href="/dashboard">Client dashboard</Link>
              {authed ? (
                <Link href="/messages">Messages</Link>
              ) : (
                <Link href="/#how-it-works">How it works</Link>
              )}
              {!authed ? (
                <Link href="/login?next=/messages">Messages (sign in)</Link>
              ) : null}
              {authed ? (
                <button type="button" onClick={() => void logout()}>
                  Sign out
                </button>
              ) : (
                <Link href="/login">Sign in</Link>
              )}
              {!authed ? <Link href="/signup">Create account</Link> : null}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
