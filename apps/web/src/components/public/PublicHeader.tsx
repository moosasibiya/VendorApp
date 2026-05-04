"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { fetchMe, logout as logoutRequest } from "@/lib/api";
import styles from "./PublicHeader.module.css";

export default function PublicHeader() {
  const [open, setOpen] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [scrolling, setScrolling] = useState(false);
  const drawerRef = useRef<HTMLDivElement | null>(null);
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    const runAuthCheck = () => {
      void (async () => {
        try {
          await fetchMe();
          if (!cancelled) {
            setAuthed(true);
          }
        } catch {
          if (!cancelled) {
            setAuthed(false);
          }
        }
      })();
    };

    if ("requestIdleCallback" in window) {
      const idleId = window.requestIdleCallback(runAuthCheck, { timeout: 1200 });
      return () => {
        cancelled = true;
        window.cancelIdleCallback(idleId);
      };
    }

    const timeoutId = globalThis.setTimeout(runAuthCheck, 250);

    return () => {
      cancelled = true;
      globalThis.clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    setScrolled(window.scrollY > 24);

    const onScroll = () => {
      setScrolled(window.scrollY > 24);
      setScrolling(true);
      if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
      scrollTimerRef.current = setTimeout(() => setScrolling(false), 300);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const panel = drawerRef.current;
    const firstFocusable = panel?.querySelector<HTMLElement>(
      "a, button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])",
    );
    firstFocusable?.focus();
  }, [open]);

  const logout = async () => {
    try {
      await logoutRequest();
    } finally {
      setAuthed(false);
      setOpen(false);
      window.location.assign("/");
    }
  };

  return (
    <header className={`${styles.header} ${scrolled ? styles.scrolled : ""} ${scrolling ? styles.scrolling : ""}`}>
      <div className={styles.inner}>
        <Link href="/" className={styles.brand}>
          Vendr<span>Studios</span>
        </Link>

        <nav className={styles.nav} aria-label="Pre-launch navigation">
          <a href="#how-it-works" onClick={(e) => {
            e.preventDefault();
            document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
          }}>How it works</a>
          <Link href="/insider-rules">Insider programme</Link>
        </nav>

        {authed ? (
          <div className={styles.actions}>
            <Link href="/dashboard" className={styles.ghostBtn}>
              Dashboard
            </Link>
            <button type="button" className={styles.primaryBtn} onClick={() => void logout()}>
              Logout
            </button>
          </div>
        ) : (
          <div className={styles.actions} />
        )}

        <button
          type="button"
          className={styles.menuBtn}
          aria-label="Open navigation menu"
          aria-expanded={open}
          onClick={() => setOpen(true)}
        >
          <span className="material-symbols-outlined">menu</span>
        </button>
      </div>

      {open ? (
        <div className={styles.drawer}>
          <div className={styles.drawerPanel} ref={drawerRef}>
            <div className={styles.drawerHeader}>
              <span>Navigation</span>
              <button
                type="button"
                className={styles.closeBtn}
                aria-label="Close navigation menu"
                onClick={() => setOpen(false)}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className={styles.drawerLinks}>
              <a href="#how-it-works" onClick={(e) => { e.preventDefault(); setOpen(false); document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" }); }}>
                How it works
              </a>
              <Link href="/insider-rules" onClick={() => setOpen(false)}>
                Insider programme
              </Link>
              {authed ? (
                <>
                  <Link href="/dashboard" onClick={() => setOpen(false)}>
                    Dashboard
                  </Link>
                  <button type="button" onClick={() => void logout()}>
                    Logout
                  </button>
                </>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
