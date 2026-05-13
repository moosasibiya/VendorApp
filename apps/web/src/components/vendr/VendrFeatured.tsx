"use client";

import { useScrollReveal } from "./useScrollReveal";

const CARDS = [
  {
    num: "01 / 24", city: "CAPE TOWN", role: "PHOTOGRAPHY · FASHION", name: "Lerato Mokoena",
    bg: "radial-gradient(60% 50% at 30% 20%, rgba(207,233,255,.18), transparent 70%), radial-gradient(80% 80% at 80% 100%, rgba(101,34,99,.45), transparent 60%), linear-gradient(160deg, #0a0a30, #00001E)",
  },
  {
    num: "02 / 24", city: "JOHANNESBURG", role: "CINEMATOGRAPHY", name: "Sipho Dube",
    bg: "radial-gradient(70% 60% at 60% 30%, rgba(31,45,107,.5), transparent 70%), radial-gradient(50% 50% at 20% 100%, rgba(207,233,255,.18), transparent 70%), linear-gradient(180deg, #04042a, #00001E)",
  },
  {
    num: "03 / 24", city: "DURBAN", role: "EDITORIAL", name: "Anna Pretorius",
    bg: "radial-gradient(60% 70% at 50% 0%, rgba(207,233,255,.22), transparent 70%), radial-gradient(40% 60% at 80% 80%, rgba(101,34,99,.4), transparent 70%), linear-gradient(180deg, #0a0a2a, #00001E)",
  },
  {
    num: "04 / 24", city: "PRETORIA", role: "DIRECTION · MOTION", name: "Thandi Khoza",
    bg: "radial-gradient(60% 40% at 40% 80%, rgba(101,34,99,.5), transparent 70%), radial-gradient(40% 40% at 70% 20%, rgba(31,45,107,.45), transparent 70%), linear-gradient(180deg, #04062a, #00001E)",
  },
] as const;

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28 }}>
      <span style={{ width: 36, height: 1, background: "rgba(207,233,255,.4)", display: "inline-block" }} />
      <span style={{ fontFamily: "var(--display)", fontSize: 11, letterSpacing: "0.4em", textTransform: "uppercase" as const, color: "rgba(207,233,255,.55)" }}>
        {children}
      </span>
    </div>
  );
}

export function VendrFeatured() {
  const headRef = useScrollReveal<HTMLDivElement>();
  const descRef = useScrollReveal<HTMLParagraphElement>();

  return (
    <section
      id="featured"
      style={{ position: "relative", zIndex: 2, padding: "160px 36px" }}
    >
      {/* Header */}
      <div
        className="vendr-featured-head"
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", alignItems: "end", gap: 60, marginBottom: 80 }}
      >
        <div ref={headRef} className="vendr-reveal">
          <Kicker>02 · Featured Creatives</Kicker>
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
            The cast,
            <br />
            not the{" "}
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
              crowd.
            </em>
          </h2>
        </div>
        <p
          ref={descRef}
          className="vendr-reveal d1"
          style={{ fontFamily: "var(--body)", fontWeight: 300, fontSize: 15, lineHeight: 1.6, color: "rgba(231,236,243,.6)", maxWidth: "42ch" }}
        >
          Hand-picked, vetted, contract-ready. Every creative on Vendr is
          verified for portfolio, professionalism and reliability — so you book
          the talent, not the gamble.
        </p>
      </div>

      {/* Cards */}
      <div
        className="vendr-featured-cards"
        style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 18 }}
      >
        {CARDS.map((card, i) => (
          <CreativeCard key={card.name} card={card} delay={i * 0.08} />
        ))}
      </div>
    </section>
  );
}

function CreativeCard({
  card,
  delay,
}: {
  card: (typeof CARDS)[number];
  delay: number;
}) {
  const ref = useScrollReveal<HTMLElement>();

  return (
    <article
      ref={ref}
      className="vendr-reveal vendr-card"
      style={{
        transitionDelay: `${delay}s`,
        position: "relative",
        aspectRatio: "3/4",
        borderRadius: 4,
        overflow: "hidden",
        background: "linear-gradient(180deg, #0a0d33 0%, #00001E 100%)",
        border: "1px solid rgba(207,233,255,.10)",
        isolation: "isolate",
        cursor: "pointer",
      }}
    >
      {/* Gradient photo stand-in */}
      <div className="vendr-card-ph" style={{ position: "absolute", inset: 0, background: card.bg }} />

      {/* Dark overlay gradient */}
      <div
        style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(180deg, transparent 40%, rgba(0,0,15,.85) 100%)",
          zIndex: 1,
        }}
      />

      {/* Number */}
      <div style={{ position: "absolute", top: 18, left: 18, zIndex: 3, fontFamily: "var(--display)", fontSize: 10, letterSpacing: "0.3em", color: "rgba(207,233,255,.45)" }}>
        {card.num}
      </div>

      {/* City */}
      <div style={{ position: "absolute", top: 18, right: 18, zIndex: 3, fontFamily: "var(--display)", fontSize: 10, letterSpacing: "0.3em", color: "rgba(207,233,255,.45)" }}>
        {card.city}
      </div>

      {/* Meta */}
      <div style={{ position: "absolute", left: 18, right: 18, bottom: 18, zIndex: 3 }}>
        <div style={{ fontFamily: "var(--display)", fontSize: 10, letterSpacing: "0.35em", color: "rgba(207,233,255,.6)", marginBottom: 8 }}>
          {card.role}
        </div>
        <div style={{ fontFamily: "var(--display)", fontWeight: 400, fontSize: 22, letterSpacing: "-0.01em", color: "var(--ice)" }}>
          {card.name}
        </div>
      </div>
    </article>
  );
}
