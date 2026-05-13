"use client";

import { useEffect, useState } from "react";

const GRAIN =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.4' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 .55 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E";

// Animation beat map (seconds):
//  0.00 — logo drifts in (blur → sharp, scale → 1) over 1.5s
//  0.20 — ambient haze blooms in slowly
//  0.50 — progress bar + caption appear
//  1.50 — bloom flash fires (logo fully settled)
//  1.85 — shimmer sweep crosses logo
//  2.10 — sustained glow ring fades in
//  3.20 — done → exit fade (1.4s)
//  4.60 — component removed

export function VendrLoader() {
  const [done, setDone] = useState(false);
  const [removed, setRemoved] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setDone(true), 3200);
    const t2 = setTimeout(() => setRemoved(true), 3900);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  if (removed) return null;

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 10000,
        background: "radial-gradient(ellipse at 50% 36%, #07091d 0%, #000003 62%)",
        display: "flex", alignItems: "center", justifyContent: "center",
        overflow: "hidden",
        animation: done ? "vendr-loader-out 0.6s cubic-bezier(0.4,0,1,1) forwards" : "none",
      }}
    >
      {/* Film grain */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute", top: "-100%", left: "-100%",
          width: "300%", height: "300%",
          opacity: 0.04, pointerEvents: "none",
          backgroundImage: `url("${GRAIN}")`,
          animation: "vendr-grain-shift 0.8s steps(8) infinite",
        }}
      />

      {/* Subtle scanlines */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute", inset: 0, pointerEvents: "none", zIndex: 1,
          backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.04) 3px, rgba(0,0,0,0.04) 4px)",
        }}
      />


      {/* Ambient haze — large, barely-there, rises slowly behind everything */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          width: 800, height: 800,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(207,233,255,0.05) 0%, rgba(207,233,255,0.015) 50%, transparent 72%)",
          opacity: 0,
          animation: "vendr-loader-ambient 2.4s cubic-bezier(0.25,0.46,0.45,0.94) 0.2s both",
          pointerEvents: "none",
        }}
      />

      {/* Logo + layered effects */}
      <div style={{ position: "relative", display: "inline-flex", zIndex: 2 }}>

        {/* Bloom — sharp white flash from V focal point, expands and dissolves */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            left: "50%", top: "46%",
            width: 140, height: 140,
            borderRadius: "50%",
            opacity: 0,
            background: "radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(207,233,255,0.5) 35%, transparent 70%)",
            pointerEvents: "none",
            animation: "vendr-loader-bloom 1.1s cubic-bezier(0.22,1,0.36,1) 1.5s both",
          }}
        />

        {/* Sustained ice glow ring — settles after bloom fades */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            left: "50%", top: "46%",
            transform: "translate(-50%, -50%)",
            width: 320, height: 320,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(207,233,255,0.09) 0%, rgba(207,233,255,0.03) 55%, transparent 75%)",
            opacity: 0,
            pointerEvents: "none",
            animation: "vendr-loader-fade 1.4s ease 2.1s both",
          }}
        />

        {/* Logo — drifts in from slightly out-of-focus, resolves to crisp */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/Vendr loading logo.png"
          alt="Vendr Studio"
          width={420}
          style={{
            position: "relative", zIndex: 1,
            opacity: 0,
            animation: "vendr-logo-enter 1.5s cubic-bezier(0.22,1,0.36,1) 0s both",
          }}
        />

      </div>

      {/* Full-screen shimmer sweep — inline transform keeps it off-screen during delay */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed", inset: 0, zIndex: 3,
          background: "linear-gradient(108deg, transparent 22%, rgba(255,255,255,0.11) 50%, transparent 78%)",
          transform: "translateX(-105%)",
          pointerEvents: "none",
          animation: "vendr-loader-shimmer 1s cubic-bezier(0.4,0,0.2,1) 1.85s forwards",
        }}
      />

      {/* Progress bar */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute", bottom: "16%", left: "50%", transform: "translateX(-50%)",
          width: 160, height: 1,
          background: "rgba(207,233,255,0.06)",
          overflow: "hidden",
          opacity: 0, animation: "vendr-loader-fade 0.9s ease 0.5s both",
        }}
      >
        <div
          style={{
            position: "absolute", left: "-40%", top: 0, height: "100%", width: "40%",
            background: "linear-gradient(90deg, transparent, rgba(207,233,255,0.7), transparent)",
            animation: "vendr-loader-bar 2s cubic-bezier(0.4,0,0.6,1) 0.5s infinite",
          }}
        />
      </div>

      {/* Caption */}
      <span
        aria-hidden="true"
        style={{
          position: "absolute", bottom: "9%", left: "50%", transform: "translateX(-50%)",
          fontFamily: "var(--display)", fontSize: 13, letterSpacing: "0.5em",
          textTransform: "uppercase", color: "rgba(181,139,214,0.7)", whiteSpace: "nowrap",
          opacity: 0, animation: "vendr-loader-fade 1s ease 0.7s both",
        }}
      >
        Preparing the stage
      </span>
    </div>
  );
}
