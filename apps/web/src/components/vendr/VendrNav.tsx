"use client";

import { useEffect, useState } from "react";

const NAV_LINKS = [
  { label: "Explore",       href: "#promise" },
  { label: "For Creatives", href: "#promise" },
  { label: "For Clients",   href: "#promise" },
  { label: "About",         href: "#founding" },
];

const scrollTo = (href: string) => (e: React.MouseEvent) => {
  e.preventDefault();
  const id = href.replace("#", "");
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
};

export function VendrNav() {
  const [scrolled, setScrolled] = useState(false);

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
        padding: "22px 36px 22px 64px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        transition: "background 0.4s ease, border-color 0.4s ease",
        background: scrolled ? "rgba(0,0,15,.65)" : "transparent",
        backdropFilter: scrolled ? "blur(16px) saturate(120%)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(16px) saturate(120%)" : "none",
        borderBottom: scrolled ? "1px solid rgba(207,233,255,.10)" : "1px solid transparent",
      }}
    >
      {/* Brand */}
      <a href="/" style={{ display: "flex", alignItems: "center" }}>
        <span style={{
          fontFamily: "var(--display)",
          fontWeight: 600,
          fontSize: 20,
          letterSpacing: "0.3em",
          textTransform: "uppercase",
          color: "var(--ice)",
        }}>
          VENDR<span style={{ color: "#652263" }}>.</span>STUDIO
        </span>
      </a>

      {/* CTA with pulsing dot */}
      <a
        href="#signup"
        onClick={scrollTo("#signup")}
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
    </nav>
  );
}
