"use client";

import { useScrollReveal } from "./useScrollReveal";

const BEAM_ANGLES = [-65, -40, -20, 0, 20, 40, 65, -52, -30, 30, 52, -10, 10];

export function VendrCTA() {
  const ref = useScrollReveal<HTMLDivElement>();

  return (
    <section
      id="cta"
      style={{
        position: "relative",
        zIndex: 2,
        padding: "200px 36px",
        textAlign: "center",
        overflow: "hidden",
        isolation: "isolate",
      }}
    >
      {/* Background */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          zIndex: -1,
          background:
            "radial-gradient(60% 50% at 50% 60%, rgba(101,34,99,.45), transparent 60%), radial-gradient(40% 30% at 50% 30%, rgba(207,233,255,.18), transparent 60%), linear-gradient(180deg, #00001E, #00001E)",
        }}
      />

      {/* Beams */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          zIndex: -1,
          opacity: 0.6,
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
        }}
      >
        <div style={{ position: "relative", width: 0, height: 0, bottom: "15%" }}>
          {BEAM_ANGLES.map((angle, i) => {
            const isWide = i % 3 === 0;
            const delay = `${i * 0.08}s`;
            return (
              <div
                key={i}
                className={`vendr-beam${isWide ? " wide" : ""}`}
                style={{
                  height: "80vh",
                  transform: `rotate(${angle}deg)`,
                  animation: isWide
                    ? `vendr-beam-in 1.8s cubic-bezier(.6,0,.25,1) ${delay} forwards, vendr-beam-glow 6s ease-in-out ${delay} infinite`
                    : `vendr-beam-in 1.6s cubic-bezier(.6,0,.25,1) ${delay} forwards, vendr-beam-pulse 4.5s ease-in-out ${delay} infinite`,
                }}
              />
            );
          })}
        </div>
      </div>

      <div ref={ref} className="vendr-reveal">
        {/* Kicker */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, marginBottom: 40 }}>
          <span style={{ width: 36, height: 1, background: "rgba(207,233,255,.4)", display: "inline-block" }} />
          <span style={{ fontFamily: "var(--display)", fontSize: 11, letterSpacing: "0.4em", textTransform: "uppercase", color: "rgba(207,233,255,.55)" }}>
            Join the Movement
          </span>
          <span style={{ width: 36, height: 1, background: "rgba(207,233,255,.4)", display: "inline-block" }} />
        </div>

        {/* Headline */}
        <h2
          style={{
            fontFamily: "var(--display)",
            fontWeight: 300,
            fontSize: "clamp(48px, 7vw, 120px)",
            letterSpacing: "-0.025em",
            lineHeight: 0.95,
            textTransform: "uppercase",
            maxWidth: "18ch",
            margin: "0 auto 40px",
            color: "var(--ice)",
          }}
        >
          Step into the{" "}
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
            spotlight.
          </em>
        </h2>

        {/* Lede */}
        <p
          style={{
            fontFamily: "var(--body)",
            fontWeight: 300,
            fontSize: 16,
            lineHeight: 1.65,
            color: "rgba(231,236,243,.72)",
            maxWidth: "48ch",
            margin: "0 auto 50px",
          }}
        >
          A curated marketplace for South Africa&apos;s working creatives.
          Whether you&apos;re planning the shoot or behind the camera — your
          next chapter starts here.
        </p>

        {/* Buttons */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 28, flexWrap: "wrap" }}>
          <a
            href="#join"
            onClick={(e) => { e.preventDefault(); document.getElementById("join")?.scrollIntoView({ behavior: "smooth" }); }}
            className="vendr-btn-primary"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 12,
              fontFamily: "var(--display)",
              fontSize: 12,
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              color: "#fff",
              background: "linear-gradient(135deg, #1F2D6B 0%, #652263 100%)",
              boxShadow: "0 18px 50px -12px rgba(101,34,99,.6), inset 0 1px 0 rgba(255,255,255,.18)",
              padding: "18px 30px",
              borderRadius: 999,
              transition: "transform 0.35s cubic-bezier(0.2,0.8,0.2,1), box-shadow 0.35s ease",
            }}
          >
            <span style={{ position: "relative", zIndex: 2 }}>Apply as a creative</span>
            <svg width="14" height="10" viewBox="0 0 14 10" fill="none" style={{ position: "relative", zIndex: 2 }} aria-hidden="true">
              <path d="M1 5 H13 M9 1 L13 5 L9 9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="square" />
            </svg>
          </a>
          <a
            href="#join"
            onClick={(e) => { e.preventDefault(); document.getElementById("join")?.scrollIntoView({ behavior: "smooth" }); }}
            className="vendr-btn-ghost"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 12,
              fontFamily: "var(--display)",
              fontSize: 12,
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              color: "rgba(231,236,243,.85)",
              border: "1px solid rgba(207,233,255,.10)",
              background: "rgba(255,255,255,.02)",
              padding: "18px 30px",
              borderRadius: 999,
              transition: "color 0.3s ease, border-color 0.3s ease, background 0.3s ease",
            }}
          >
            Start a brief
          </a>
        </div>
      </div>
    </section>
  );
}
