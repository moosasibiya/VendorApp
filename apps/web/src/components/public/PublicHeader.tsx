"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import styles from "./PublicHeader.module.css";

export default function PublicHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [scrolling, setScrolling] = useState(false);
  const drawerRef = useRef<HTMLDivElement | null>(null);
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  return (
    <header className={`${styles.header} ${scrolled ? styles.scrolled : ""} ${scrolling ? styles.scrolling : ""}`}>
      <div className={styles.inner}>
        <Link href="/" className={styles.brand}>
          Vendr<span>Studios</span>
        </Link>

        <nav className={styles.nav} aria-label="Public navigation">
          <Link href="/explore">Explore</Link>
          <Link href="/how-it-works">How It Works</Link>
          <Link href="/pricing">Pricing</Link>
          <Link href="/about">About</Link>
          <Link href="/join">Join</Link>
        </nav>

        <div className={styles.actions}>
          <Link href="/login" className={styles.ghostBtn}>
            Login
          </Link>
          <Link href="/signup" className={styles.primaryBtn}>
            Sign Up
          </Link>
        </div>

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
              <Link href="/explore" onClick={() => setOpen(false)}>Explore</Link>
              <Link href="/how-it-works" onClick={() => setOpen(false)}>How It Works</Link>
              <Link href="/pricing" onClick={() => setOpen(false)}>Pricing</Link>
              <Link href="/about" onClick={() => setOpen(false)}>About</Link>
              <Link href="/join" onClick={() => setOpen(false)}>Join</Link>
              <Link href="/login" onClick={() => setOpen(false)}>Login</Link>
              <Link href="/signup" onClick={() => setOpen(false)}>Sign Up</Link>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
