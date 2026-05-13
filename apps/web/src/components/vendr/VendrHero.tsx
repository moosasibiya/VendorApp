"use client";

import { VendrCountdown } from "./VendrCountdown";

const scrollTo = (id: string) => (e: React.MouseEvent) => {
  e.preventDefault();
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
};

const BEAM_COUNT = 15;
const BEAM_SPREAD = 140;

function buildBeamAngles() {
  return Array.from({ length: BEAM_COUNT }, (_, i) => ({
    angle: ((i / (BEAM_COUNT - 1)) - 0.5) * BEAM_SPREAD,
    wide: i % 3 === 0,
    delay: `${i * 0.08}s`,
  }));
}


export function VendrHero() {
  const beams = buildBeamAngles();

  return (
    <section
      id="hero"
      style={{
        position: "relative", minHeight: "100vh",
        padding: "72px 36px 80px",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "flex-start",
        textAlign: "center", isolation: "isolate", overflow: "hidden",
      }}
    >
      {/* Background */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute", inset: 0, zIndex: -2,
          background:
            "radial-gradient(45% 50% at 50% 55%, rgba(31,45,107,.22), transparent 70%), " +
            "radial-gradient(30% 25% at 50% 75%, rgba(101,34,99,.18), transparent 70%), " +
            "linear-gradient(180deg, #000005 0%, #00001E 55%, #000003 100%)",
        }}
      />

      {/* Beams — fan upward from bottom center */}
      <div
        aria-hidden="true"
        style={{ position: "absolute", left: "50%", bottom: "-2%", width: 0, height: 0, zIndex: -1, animation: "vendr-spotlight-glow 4s ease-in-out infinite" }}
      >
        {beams.map(({ angle, wide, delay }, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: wide ? -15 : -3,
              bottom: 0,
              transformOrigin: "bottom center",
              width: wide ? 30 : 5,
              height: "200vh",
              borderRadius: "50% 50% 0 0 / 8% 8% 0 0",
              background: wide
                ? "linear-gradient(to top, rgba(207,233,255,0) 0%, rgba(207,233,255,.5) 6%, rgba(207,233,255,.15) 45%, rgba(207,233,255,0) 100%)"
                : "linear-gradient(to top, rgba(207,233,255,0) 0%, rgba(207,233,255,.85) 5%, rgba(207,233,255,.45) 45%, rgba(207,233,255,0) 100%)",
              filter: wide ? "blur(18px)" : "blur(3px)",
              mixBlendMode: "screen",
              opacity: 0,
              transform: `rotate(${angle}deg)`,
              animation: `vendr-bIn 1.8s cubic-bezier(.6,0,.25,1) ${delay} forwards, vendr-bPulse 5s ease-in-out ${delay} infinite`,
            }}
          />
        ))}
      </div>

      {/* Bloom */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute", left: "50%", bottom: "-2%",
          width: 560, height: 560,
          zIndex: -1,
          background: "radial-gradient(circle, rgba(207,233,255,.38) 0%, rgba(101,34,99,.15) 35%, transparent 70%)",
          mixBlendMode: "screen",
          animation: "vendr-bloom-glow 4s ease-in-out infinite",
        }}
      />

      {/* Horizon floor */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute", left: 0, right: 0, bottom: 0,
          height: "38%", zIndex: -1,
          background: "linear-gradient(180deg, transparent 0%, rgba(0,0,8,.85) 60%, #000003 100%)",
        }}
      >
        <div
          style={{
            position: "absolute", left: "50%", top: 0,
            transform: "translateX(-50%)", width: "70%", height: "100%",
            background: "radial-gradient(ellipse at 50% 0%, rgba(207,233,255,.18), rgba(101,34,99,.04) 35%, transparent 60%)",
            filter: "blur(20px)", mixBlendMode: "screen",
          }}
        />
        <div
          style={{
            position: "absolute", inset: 0,
            background: "repeating-linear-gradient(180deg, transparent 0 22px, rgba(207,233,255,.025) 22px 23px)",
            WebkitMaskImage: "linear-gradient(180deg, transparent 0%, #000 30%, #000 100%)",
            maskImage: "linear-gradient(180deg, transparent 0%, #000 30%, #000 100%)",
            animation: "vendr-horizon-shimmer 12s ease-in-out infinite",
          }}
        />
      </div>

      {/* Launching label */}
      <div
        style={{
          display: "inline-flex", alignItems: "center", gap: 18,
          marginBottom: 20,
          opacity: 0, animation: "vendr-rise-in 0.9s ease 4.0s forwards",
          fontFamily: "var(--display)", fontSize: 16, letterSpacing: "0.5em",
          color: "rgba(207,233,255,0.7)", textTransform: "uppercase",
        }}
      >
        <span style={{ width: 50, height: 1, background: "linear-gradient(90deg, transparent, rgba(207,233,255,.6), transparent)", display: "inline-block" }} />
        <span className="vendr-pulse-dot" aria-hidden="true" />
        <span>Launching 01 July 2026</span>
        <span className="vendr-pulse-dot" aria-hidden="true" />
        <span style={{ width: 50, height: 1, background: "linear-gradient(90deg, transparent, rgba(207,233,255,.6), transparent)", display: "inline-block" }} />
      </div>

      {/* Headline */}
      <h1
        style={{
          fontFamily: "var(--display)", fontWeight: 300,
          fontSize: "clamp(48px, 7.5vw, 124px)",
          lineHeight: 0.92, letterSpacing: "-0.025em",
          textTransform: "uppercase", color: "var(--ice)",
          marginBottom: 20, maxWidth: "18ch",
        }}
      >
        <span className="vendr-line" style={{ animationDelay: "4.1s" }}><span style={{ animationDelay: "4.1s" }}>Before the light,</span></span>
        <span className="vendr-line l2" style={{ animationDelay: "4.2s" }}>
          <span style={{ animationDelay: "4.2s" }}>there is</span>
        </span>
        <span className="vendr-line l3" style={{ animationDelay: "4.3s" }}><span style={{ animationDelay: "4.3s" }} className="vendr-darkness">darkness.</span></span>
      </h1>

      {/* Subtitle */}
      <p
        style={{
          fontFamily: "var(--body)", fontWeight: 400, fontSize: 22, lineHeight: 1.7,
          color: "rgba(207,233,255,0.88)", maxWidth: "54ch", marginBottom: 20,
          opacity: 0, animation: "vendr-rise-in 0.9s ease 4.5s forwards",
        }}
      >
        The trusted marketplace for booking{" "}
        <strong style={{ color: "var(--ice)", fontWeight: 600 }}>verified</strong>{" "}
        photographers and videographers in South Africa. No more ghosting. No more scams.{" "}
        <strong style={{ color: "var(--ice)", fontWeight: 600 }}>Just craft.</strong>
      </p>

      {/* CTA buttons */}
      <div
        style={{
          display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap",
          justifyContent: "center", marginBottom: 20,
          opacity: 0, animation: "vendr-rise-in 0.9s ease 4.7s forwards",
        }}
      >
        <a
          href="#signup"
          onClick={scrollTo("signup")}
          className="vendr-btn-primary vendr-magnetic"
          style={{
            display: "inline-flex", alignItems: "center", gap: 12,
            fontFamily: "var(--display)", fontSize: 12, letterSpacing: "0.28em", fontWeight: 700,
            textTransform: "uppercase", color: "#cfe9ff",
            background: "linear-gradient(135deg, #1f2d6b 0%, #652263 100%)",
            boxShadow: "0 18px 50px -12px rgba(101,34,99,.5), inset 0 1px 0 rgba(255,255,255,.15)",
            padding: "18px 30px", borderRadius: 999,
            transition: "transform 0.35s cubic-bezier(0.2,0.8,0.2,1)",
          }}
        >
          <span style={{ position: "relative", zIndex: 2 }}>I want to book creatives</span>
          <svg width="14" height="10" viewBox="0 0 14 10" fill="none" style={{ position: "relative", zIndex: 2 }} aria-hidden="true">
            <path d="M1 5 H13 M9 1 L13 5 L9 9" stroke="currentColor" strokeWidth="1.4" />
          </svg>
        </a>
        <a
          href="#signup"
          onClick={scrollTo("signup")}
          className="vendr-btn-ghost vendr-magnetic"
          style={{
            display: "inline-flex", alignItems: "center", gap: 12,
            fontFamily: "var(--display)", fontSize: 12, letterSpacing: "0.28em", fontWeight: 700,
            textTransform: "uppercase", color: "#00001e",
            border: "none",
            background: "#cfe9ff",
            padding: "18px 30px", borderRadius: 999,
            transition: "color 0.3s, border-color 0.3s, background 0.3s",
          }}
        >
          <span>I am a creative</span>
          <svg width="14" height="10" viewBox="0 0 14 10" fill="none" aria-hidden="true">
            <path d="M1 5 H13 M9 1 L13 5 L9 9" stroke="currentColor" strokeWidth="1.4" />
          </svg>
        </a>
      </div>

      {/* Countdown */}
      <div
        style={{
          opacity: 0, animation: "vendr-rise-in 0.9s ease 4.9s forwards",
          width: "100%", maxWidth: 760, marginTop: 60, marginBottom: 20,
        }}
      >
        <VendrCountdown />
      </div>

    </section>
  );
}
