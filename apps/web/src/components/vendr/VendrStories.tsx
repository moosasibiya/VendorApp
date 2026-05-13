"use client";

import { useScrollReveal } from "./useScrollReveal";

const STORIES = [
  {
    quote:
      "Vendr is the first platform that treats my work like a portfolio, not a feed. I've booked three brand campaigns since joining — without sending a single cold DM.",
    name: "LERATO MOKOENA",
    role: "PHOTOGRAPHER · CAPE TOWN",
    av: "linear-gradient(135deg, #652263, #1F2D6B)",
  },
  {
    quote:
      "The brief came in on a Tuesday. By Friday we were on location with the client, with the contract already signed. The friction is just… gone.",
    name: "SIPHO DUBE",
    role: "CINEMATOGRAPHER · JOBURG",
    av: "linear-gradient(135deg, #1F2D6B, #CFE9FF)",
  },
  {
    quote:
      "I used to spend more time chasing invoices than shooting. With escrow on every project, I just create. That's the whole point.",
    name: "ANNA PRETORIUS",
    role: "EDITORIAL · DURBAN",
    av: "linear-gradient(135deg, #CFE9FF, #652263)",
  },
] as const;

export function VendrStories() {
  const headRef = useScrollReveal<HTMLDivElement>();
  const descRef = useScrollReveal<HTMLParagraphElement>();

  return (
    <section style={{ position: "relative", zIndex: 2, padding: "160px 36px" }}>
      {/* Header */}
      <div
        className="vendr-featured-head"
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", alignItems: "end", gap: 60, marginBottom: 80 }}
      >
        <div ref={headRef} className="vendr-reveal">
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28 }}>
            <span style={{ width: 36, height: 1, background: "rgba(207,233,255,.4)", display: "inline-block" }} />
            <span style={{ fontFamily: "var(--display)", fontSize: 11, letterSpacing: "0.4em", textTransform: "uppercase", color: "rgba(207,233,255,.55)" }}>
              07 · Creator Stories
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
            Voices from the{" "}
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
              floor.
            </em>
          </h2>
        </div>
        <p
          ref={descRef}
          className="vendr-reveal d1"
          style={{ fontFamily: "var(--body)", fontWeight: 300, fontSize: 15, lineHeight: 1.6, color: "rgba(231,236,243,.6)", maxWidth: "42ch" }}
        >
          What it&apos;s like on the other side of the lens, from creatives
          building careers on Vendr.
        </p>
      </div>

      {/* Story cards */}
      <div
        className="vendr-stories-grid"
        style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}
      >
        {STORIES.map((story, i) => (
          <StoryCard key={story.name} story={story} delay={i * 0.08} />
        ))}
      </div>
    </section>
  );
}

function StoryCard({
  story,
  delay,
}: {
  story: (typeof STORIES)[number];
  delay: number;
}) {
  const ref = useScrollReveal<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className="vendr-reveal vendr-story"
      style={{
        transitionDelay: `${delay}s`,
        padding: "48px 40px",
        border: "1px solid rgba(207,233,255,.10)",
        borderRadius: 6,
        background: "rgba(255,255,255,.015)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Decorative quote mark */}
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          top: -12, right: 24,
          fontFamily: "var(--display)",
          fontSize: 120,
          lineHeight: 1,
          color: "rgba(101,34,99,.35)",
          fontWeight: 500,
          pointerEvents: "none",
        }}
      >
        &ldquo;
      </span>

      <p style={{ fontFamily: "var(--body)", fontWeight: 300, fontSize: 17, lineHeight: 1.55, marginBottom: 30, color: "rgba(231,236,243,.85)", position: "relative" }}>
        {story.quote}
      </p>

      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div
          style={{
            width: 42, height: 42,
            borderRadius: "50%",
            background: story.av,
            border: "1px solid rgba(207,233,255,.3)",
            flexShrink: 0,
          }}
          aria-hidden="true"
        />
        <div>
          <div style={{ fontFamily: "var(--display)", fontSize: 13, letterSpacing: "0.04em", color: "var(--ice)", marginBottom: 4 }}>
            {story.name}
          </div>
          <div style={{ fontFamily: "var(--display)", fontSize: 10, letterSpacing: "0.3em", color: "rgba(207,233,255,.5)" }}>
            {story.role}
          </div>
        </div>
      </div>
    </div>
  );
}
