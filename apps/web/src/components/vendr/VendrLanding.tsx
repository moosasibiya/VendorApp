"use client";

import { SpotlightCanvas } from "./SpotlightCanvas";
import { VendrCursor } from "./VendrCursor";
import { VendrLoader } from "./VendrLoader";
import { VendrNav } from "./VendrNav";
import { VendrHero } from "./VendrHero";
import { VendrTicker } from "./VendrTicker";
import { VendrPromise } from "./VendrPromise";
import { VendrFounding } from "./VendrFounding";
import { VendrSignup } from "./VendrSignup";
import { VendrFooter } from "./VendrFooter";

const GRAIN_SVG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.4' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 .55 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E";

export function VendrLanding() {
  return (
    <div
      className="vendr-landing"
      style={{ minHeight: "100vh", overflowX: "hidden", position: "relative" }}
    >
      {/* Loader */}
      <VendrLoader />

      {/* Custom cursor */}
      <VendrCursor />

      {/* Film grain */}
      <div
        className="vendr-grain"
        aria-hidden="true"
        style={{ backgroundImage: `url("${GRAIN_SVG}")` }}
      />

      {/* Scanlines */}
      <div className="vendr-scanlines" aria-hidden="true" />

      {/* Edge vignette */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed", inset: 0, pointerEvents: "none", zIndex: 3,
          background: "radial-gradient(130% 90% at 50% 45%, transparent 50%, rgba(0,0,5,.92) 100%)",
        }}
      />

      {/* Soft spotlight canvas */}
      <SpotlightCanvas />

      {/* Fixed nav */}
      <VendrNav />

      {/* Page sections */}
      <main style={{ position: "relative", zIndex: 4 }}>
        {/* 01 — Hero */}
        <VendrHero />

        {/* Ticker */}
        <VendrTicker />

        {/* 02 — The Promise */}
        <VendrPromise />

        {/* 03 — Founding 100 */}
        <VendrFounding />

        {/* 04 — Early-access signup */}
        <VendrSignup />
      </main>

      <VendrFooter />
    </div>
  );
}
