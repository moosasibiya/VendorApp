"use client";

import { useEffect } from "react";
import { VendrLoader } from "./VendrLoader";
import { VendrNav } from "./VendrNav";
import { VendrHero } from "./VendrHero";
import { VendrCountdown } from "./VendrCountdown";
import { VendrTicker } from "./VendrTicker";
import { VendrPromise } from "./VendrPromise";
import { VendrFounding } from "./VendrFounding";
import { VendrSignup } from "./VendrSignup";
import { VendrFooter } from "./VendrFooter";

export function VendrLanding() {
  // Update CSS spotlight position on pointer move
  useEffect(() => {
    const el = document.querySelector<HTMLElement>(".vendr-landing");
    if (!el) return;
    const onMove = (e: PointerEvent) => {
      el.style.setProperty("--v-mx", `${e.clientX}px`);
      el.style.setProperty("--v-my", `${e.clientY}px`);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  return (
    <div className="vendr-landing" style={{ minHeight: "100vh", overflowX: "hidden", position: "relative" }}>
        {/* Curtain loader */}
        <VendrLoader />

        {/* Background layers */}
        <div className="v-vig" aria-hidden="true" />
        <div className="v-spot" aria-hidden="true" />

        {/* Fixed nav */}
        <VendrNav />

        {/* Page sections */}
        <main style={{ position: "relative", zIndex: 4 }}>
          <VendrHero />
          <VendrCountdown />
          <VendrTicker />
          <VendrPromise />
          <VendrFounding />
          <VendrSignup />
        </main>

        <VendrFooter />
      </div>
  );
}
