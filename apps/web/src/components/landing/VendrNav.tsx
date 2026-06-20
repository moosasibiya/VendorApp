"use client";

import { useEffect, useState } from "react";

export function VendrNav() {
  const [scrolled, setScrolled] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const s = window.scrollY;
      setScrolled(s > 30);
      const docH = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(docH > 0 ? Math.min(100, (s / docH) * 100) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToJoin = (e: React.MouseEvent) => {
    e.preventDefault();
    document.getElementById("join")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <header className={`v-header${scrolled ? " scrolled" : ""}`} aria-label="Vendr navigation">
      <div className="v-progress" style={{ width: `${progress}%` }} />

      <a href="#top" className="v-logo">
        VENDR<span>.</span>STUDIO
      </a>

      <a href="#join" onClick={scrollToJoin} className="v-nav-cta">
        <span className="v-nav-dot" aria-hidden="true" />
        Join the Movement
      </a>
    </header>
  );
}
