"use client";

import { useRef } from "react";
import { useScrollReveal } from "./useScrollReveal";

const TILES = [
  {
    tag: "CASE / 01", runtime: "02:14",
    title: "Standard Bank · ", titleEm: "Future of Us",
    meta: "DIR. LERATO MOKOENA", sub: "CAPE TOWN · 2025",
    bg: "radial-gradient(60% 50% at 30% 30%, rgba(207,233,255,.35), transparent 70%), radial-gradient(80% 70% at 70% 100%, rgba(101,34,99,.5), transparent 60%), linear-gradient(180deg, #0a0a30, #00001E)",
  },
  {
    tag: "CASE / 02", runtime: "01:48",
    title: "Maxhosa · ", titleEm: "Heritage in Motion",
    meta: "DIR. SIPHO DUBE", sub: "JOHANNESBURG · 2025",
    bg: "radial-gradient(60% 60% at 60% 20%, rgba(31,45,107,.6), transparent 70%), radial-gradient(50% 50% at 20% 100%, rgba(101,34,99,.4), transparent 70%), linear-gradient(180deg, #04042a, #00001E)",
  },
  {
    tag: "CASE / 03", runtime: "03:02",
    title: "Castle Lite · ", titleEm: "After Dark",
    meta: "DIR. ANNA PRETORIUS", sub: "DURBAN · 2026",
    bg: "radial-gradient(70% 50% at 50% 0%, rgba(207,233,255,.25), transparent 70%), radial-gradient(40% 60% at 80% 80%, rgba(31,45,107,.5), transparent 70%), linear-gradient(180deg, #0a0a2a, #00001E)",
  },
  {
    tag: "CASE / 04", runtime: "02:36",
    title: "MTN · ", titleEm: "Signal of a New Continent",
    meta: "DIR. THANDI KHOZA", sub: "PRETORIA · 2026",
    bg: "radial-gradient(60% 40% at 40% 80%, rgba(101,34,99,.45), transparent 70%), radial-gradient(40% 40% at 70% 20%, rgba(207,233,255,.25), transparent 70%), linear-gradient(180deg, #04062a, #00001E)",
  },
] as const;

export function VendrShowcase() {
  const trackRef = useRef<HTMLDivElement>(null);
  const headRef = useScrollReveal<HTMLDivElement>();

  const scroll = (dir: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({ left: dir * track.clientWidth * 0.66, behavior: "smooth" });
  };

  return (
    <section style={{ position: "relative", zIndex: 2, padding: "140px 0 160px" }}>
      {/* Head */}
      <div
        style={{
          padding: "0 36px",
          marginBottom: 56,
          display: "grid",
          gridTemplateColumns: "1fr auto",
          alignItems: "end",
          gap: 40,
        }}
      >
        <div ref={headRef} className="vendr-reveal">
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28 }}>
            <span style={{ width: 36, height: 1, background: "rgba(207,233,255,.4)", display: "inline-block" }} />
            <span style={{ fontFamily: "var(--display)", fontSize: 11, letterSpacing: "0.4em", textTransform: "uppercase", color: "rgba(207,233,255,.55)" }}>
              06 · Cinematic Showcase
            </span>
          </div>
          <h2
            style={{
              fontFamily: "var(--display)",
              fontWeight: 300,
              fontSize: "clamp(40px, 5vw, 76px)",
              lineHeight: 1,
              letterSpacing: "-0.02em",
              textTransform: "uppercase",
              color: "var(--ice)",
            }}
          >
            Work, in{" "}
            <em
              style={{
                fontWeight: 500,
                background: "linear-gradient(110deg, #cfe9ff 0%, #652263 60%, #1F2D6B 100%)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
                WebkitTextFillColor: "transparent",
              }}
            >
              full frame.
            </em>
          </h2>
        </div>

        {/* Prev / Next */}
        <div style={{ display: "flex", gap: 14 }}>
          {([-1, 1] as const).map((dir) => (
            <button
              key={dir}
              onClick={() => scroll(dir)}
              aria-label={dir === -1 ? "Previous" : "Next"}
              style={{
                width: 54, height: 54,
                border: "1px solid rgba(207,233,255,.10)",
                borderRadius: "50%",
                color: "rgba(207,233,255,.7)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "border-color 0.35s ease, color 0.35s ease, background 0.35s ease",
                cursor: "pointer",
                background: "none",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--ice)";
                (e.currentTarget as HTMLButtonElement).style.color = "var(--ice)";
                (e.currentTarget as HTMLButtonElement).style.background = "rgba(207,233,255,.05)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(207,233,255,.10)";
                (e.currentTarget as HTMLButtonElement).style.color = "rgba(207,233,255,.7)";
                (e.currentTarget as HTMLButtonElement).style.background = "none";
              }}
            >
              {dir === -1 ? (
                <svg width="16" height="12" viewBox="0 0 16 12" fill="none"><path d="M15 6 H1 M5 1 L1 6 L5 11" stroke="currentColor" strokeWidth="1.4" /></svg>
              ) : (
                <svg width="16" height="12" viewBox="0 0 16 12" fill="none"><path d="M1 6 H15 M11 1 L15 6 L11 11" stroke="currentColor" strokeWidth="1.4" /></svg>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Scroll track */}
      <div
        ref={trackRef}
        className="vendr-scroll-track"
        style={{
          display: "flex",
          gap: 24,
          padding: "0 36px 24px",
          overflowX: "auto",
          scrollSnapType: "x mandatory",
        }}
      >
        {TILES.map((tile, i) => (
          <ShowcaseTile key={tile.tag} tile={tile} delay={i * 0.08} />
        ))}
      </div>
    </section>
  );
}

function ShowcaseTile({
  tile,
  delay,
}: {
  tile: (typeof TILES)[number];
  delay: number;
}) {
  const ref = useScrollReveal<HTMLElement>();

  return (
    <article
      ref={ref}
      className="vendr-reveal vendr-tile"
      style={{
        transitionDelay: `${delay}s`,
        position: "relative",
        flexShrink: 0,
        width: "62vw",
        maxWidth: 980,
        aspectRatio: "16/9",
        borderRadius: 6,
        overflow: "hidden",
        scrollSnapAlign: "center",
        border: "1px solid rgba(207,233,255,.10)",
        isolation: "isolate",
      }}
    >
      {/* Background scene */}
      <div style={{ position: "absolute", inset: 0, background: tile.bg }}>
        {/* Mini beams */}
        {[-22, 0, 22].map((rot) => (
          <div
            key={rot}
            style={{
              position: "absolute",
              left: "50%", top: 0,
              width: 2, height: "60%",
              transformOrigin: "top center",
              transform: `translateX(-50%) rotate(${rot}deg)`,
              mixBlendMode: "screen",
              filter: "blur(3px)",
              opacity: 0.7,
              background: "linear-gradient(180deg, rgba(207,233,255,.7), transparent)",
            }}
          />
        ))}
      </div>

      {/* Bottom fade */}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 50%, rgba(0,0,15,.9) 100%)", zIndex: 2 }} />

      {/* Tag top-left */}
      <div style={{ position: "absolute", top: 24, left: 30, zIndex: 3, fontFamily: "var(--display)", fontSize: 10, letterSpacing: "0.35em", color: "rgba(207,233,255,.55)" }}>
        {tile.tag}
      </div>

      {/* Runtime top-right */}
      <div style={{ position: "absolute", top: 24, right: 30, zIndex: 3, fontFamily: "var(--display)", fontSize: 10, letterSpacing: "0.32em", color: "rgba(207,233,255,.55)", display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#ff3b3b", boxShadow: "0 0 8px #ff3b3b", animation: "vendr-blink 1.4s infinite", display: "inline-block" }} aria-hidden="true" />
        {tile.runtime}
      </div>

      {/* Info bottom */}
      <div style={{ position: "absolute", left: 32, right: 32, bottom: 30, zIndex: 3, display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 30 }}>
        <div style={{ fontFamily: "var(--display)", fontWeight: 300, fontSize: "clamp(22px, 2.4vw, 36px)", letterSpacing: "-0.01em", textTransform: "uppercase", color: "var(--ice)" }}>
          {tile.title}
          <em style={{ fontStyle: "normal", fontWeight: 500 }}>{tile.titleEm}</em>
        </div>
        <div style={{ fontFamily: "var(--display)", fontSize: 10, letterSpacing: "0.35em", color: "rgba(207,233,255,.55)", textAlign: "right", minWidth: 140 }}>
          {tile.meta}
          <br />
          <span style={{ opacity: 0.6 }}>{tile.sub}</span>
        </div>
      </div>
    </article>
  );
}
