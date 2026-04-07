"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { fetchMe, logout as logoutRequest } from "@/lib/api";
import styles from "./PublicHeader.module.css";

function titleCaseSlug(value: string): string {
  return value
    .replace(/[-_]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function PublicHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const drawerRef = useRef<HTMLDivElement | null>(null);
  const homeMode = pathname === "/home";
  const onboardingMode = pathname === "/";
  const profileMode = pathname.startsWith("/artists/") && pathname !== "/artists";
  const publicSwitchHref = pathname === "/" ? "/home" : "/";
  const publicSwitchLabel = pathname === "/" ? "Public Home" : "Onboarding";
  const profileCurrentLabel = profileMode
    ? titleCaseSlug(pathname.split("/").filter(Boolean).at(-1) ?? "Artist")
    : "";
  const profileMessageHref = `${pathname}?message=1#profile-actions`;
  const profileBookHref = `${pathname}#profile-actions`;

  useEffect(() => {
    let cancelled = false;

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

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 24);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
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
    <header
      className={`${styles.header} ${scrolled ? styles.scrolled : ""} ${
        homeMode ? styles.discoveryHeader : ""
      } ${profileMode ? styles.profileHeader : ""}`}
    >
      <div className={styles.inner}>
        <Link href="/" className={styles.brand}>
          Vendr<span>Man</span>
        </Link>

        {profileMode ? (
          <div className={styles.breadcrumb}>
            <Link href="/home">Discover</Link>
            <span className={styles.breadcrumbSep}>/</span>
            <Link href="/artists">Artists</Link>
            <span className={styles.breadcrumbSep}>/</span>
            <span className={styles.breadcrumbCurrent}>{profileCurrentLabel}</span>
          </div>
        ) : (
          <nav className={styles.nav}>
            {homeMode ? (
              <>
                <Link href="/home" className={styles.activeLink}>
                  Discover
                </Link>
                <Link href="/artists">Artists</Link>
                <Link href="/home#categories">Categories</Link>
                <Link href="/home#how-it-works">How it works</Link>
              </>
            ) : (
              <>
                <Link href="/artists">Artists</Link>
                <Link href="/home">Explore</Link>
                <Link href="/home#how-it-works">How it works</Link>
              </>
            )}
          </nav>
        )}

        <div className={styles.actions}>
          {profileMode ? (
            <>
              <Link href={profileMessageHref} className={styles.profileGhostBtn}>
                Message
              </Link>
              <Link href={profileBookHref} className={styles.primaryBtn}>
                Book Now
              </Link>
            </>
          ) : homeMode ? (
            <>
              <Link href="/home#command" className={styles.searchPill}>
                <span className="material-symbols-outlined">search</span>
                Quick search
              </Link>

              {authed ? (
                <Link href="/dashboard" className={styles.ghostBtn}>
                  Dashboard
                </Link>
              ) : null}

              {authed ? (
                <button
                  type="button"
                  className={styles.primaryBtn}
                  onClick={() => void logout()}
                >
                  Logout
                </button>
              ) : (
                <Link href="/signup" className={styles.primaryBtn}>
                  Sign Up
                </Link>
              )}
            </>
          ) : (
            <>
              {!onboardingMode ? (
                <Link href={publicSwitchHref} className={styles.ghostBtn}>
                  {publicSwitchLabel}
                </Link>
              ) : null}

              {authed ? (
                <Link href="/dashboard" className={styles.ghostBtn}>
                  Dashboard
                </Link>
              ) : (
                <Link href="/login" className={styles.ghostBtn}>
                  Login
                </Link>
              )}

              {authed ? (
                <button type="button" className={styles.primaryBtn} onClick={() => void logout()}>
                  Logout
                </button>
              ) : (
                <Link href="/signup" className={styles.primaryBtn}>
                  Sign Up
                </Link>
              )}
            </>
          )}
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
              {profileMode ? (
                <>
                  <Link href="/home" onClick={() => setOpen(false)}>
                    Discover
                  </Link>
                  <Link href={`${pathname}#overview`} onClick={() => setOpen(false)}>
                    Overview
                  </Link>
                  <Link href={`${pathname}#portfolio`} onClick={() => setOpen(false)}>
                    Portfolio
                  </Link>
                  <Link href={`${pathname}#reviews`} onClick={() => setOpen(false)}>
                    Reviews
                  </Link>
                  <Link href="/artists" onClick={() => setOpen(false)}>
                    Browse artists
                  </Link>
                </>
              ) : homeMode ? (
                <>
                  <Link href="/home" onClick={() => setOpen(false)}>
                    Discover
                  </Link>
                  <Link href="/artists" onClick={() => setOpen(false)}>
                    Artists
                  </Link>
                  <Link href="/home#categories" onClick={() => setOpen(false)}>
                    Categories
                  </Link>
                  <Link href="/home#how-it-works" onClick={() => setOpen(false)}>
                    How it works
                  </Link>
                  <Link href="/home#command" onClick={() => setOpen(false)}>
                    Quick search
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/artists" onClick={() => setOpen(false)}>
                    Browse artists
                  </Link>
                  <Link href="/home" onClick={() => setOpen(false)}>
                    Explore
                  </Link>
                  <Link href="/home#how-it-works" onClick={() => setOpen(false)}>
                    How it works
                  </Link>
                  {!onboardingMode ? (
                    <Link href={publicSwitchHref} onClick={() => setOpen(false)}>
                      {publicSwitchLabel}
                    </Link>
                  ) : null}
                </>
              )}
              {authed ? (
                <>
                  <Link href="/dashboard" onClick={() => setOpen(false)}>
                    Dashboard
                  </Link>
                  <button type="button" onClick={() => void logout()}>
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" onClick={() => setOpen(false)}>
                    Login
                  </Link>
                  <Link href="/signup" onClick={() => setOpen(false)}>
                    Create account
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
