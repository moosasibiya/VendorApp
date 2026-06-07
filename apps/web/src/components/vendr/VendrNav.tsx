"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export function VendrNav() {
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const isLanding = pathname === "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      aria-label="Vendr navigation"
      style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 200,
        padding: "clamp(16px, 2vw, 22px) clamp(20px, 4vw, 64px)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        transition: "background 0.4s ease, border-color 0.4s ease",
        background: scrolled ? "rgba(0,0,15,.65)" : "transparent",
        backdropFilter: scrolled ? "blur(16px) saturate(120%)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(16px) saturate(120%)" : "none",
        borderBottom: scrolled ? "1px solid rgba(207,233,255,.10)" : "1px solid transparent",
      }}
    >
      {/* Brand */}
      <Link href="/" style={{ display: "flex", alignItems: "center" }}>
        <span style={{
          fontFamily: "var(--display)",
          fontWeight: 600,
          fontSize: "clamp(13px, 3vw, 20px)",
          letterSpacing: "0.3em",
          textTransform: "uppercase",
          color: "var(--ice)",
        }}>
          VENDR<span style={{ color: "#652263" }}>.</span>STUDIO
        </span>
      </Link>

      {/* CTA with pulsing dot */}
      {isLanding ? (
        <a
          href="#signup"
          onClick={(e) => { e.preventDefault(); document.getElementById("signup")?.scrollIntoView({ behavior: "smooth" }); }}
          className="vendr-nav-cta"
          style={{
            fontFamily: "var(--display)", fontSize: 11, letterSpacing: "0.32em",
            textTransform: "uppercase",
            padding: "12px 22px",
            border: "1px solid rgba(207,233,255,0.35)",
            borderRadius: 999, color: "var(--ice)",
            transition: "border-color 0.3s ease",
            display: "inline-flex", alignItems: "center", gap: 10,
          }}
        >
          <span className="vendr-pulse-dot" aria-hidden="true" />
          <span style={{ position: "relative", zIndex: 2 }}>Join the Movement</span>
        </a>
      ) : (
        <Link
          href="/#signup"
          className="vendr-nav-cta"
          style={{
            fontFamily: "var(--display)", fontSize: 11, letterSpacing: "0.32em",
            textTransform: "uppercase",
            padding: "12px 22px",
            border: "1px solid rgba(207,233,255,0.35)",
            borderRadius: 999, color: "var(--ice)",
            transition: "border-color 0.3s ease",
            display: "inline-flex", alignItems: "center", gap: 10,
            textDecoration: "none",
          }}
        >
          <span className="vendr-pulse-dot" aria-hidden="true" />
          <span style={{ position: "relative", zIndex: 2 }}>Join the Movement</span>
        </Link>
      )}
    </nav>
  );
}
