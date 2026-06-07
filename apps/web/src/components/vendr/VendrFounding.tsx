"use client";

import { useEffect, useRef, useState } from "react";
import { fetchInsiderStats } from "@/lib/api";
import { useScrollReveal } from "./useScrollReveal";

const FOUNDING_TOTAL = 100;

export function VendrFounding() {
  const sectionRef = useScrollReveal<HTMLElement>();
  const fillRef = useRef<HTMLDivElement>(null);
  const countRef = useRef<HTMLSpanElement>(null);
  type CountState = { status: "loading" } | { status: "ready"; value: number } | { status: "error"; value: number };
  const [countState, setCountState] = useState<CountState>({ status: "loading" });
  const count = countState.status !== "loading" ? countState.value : null;

  const loadCount = () => {
    fetchInsiderStats()
      .then(({ insiderCount }) => setCountState({ status: "ready", value: insiderCount }))
      .catch(() => setCountState({ status: "error", value: 37 }));
  };

  useEffect(() => {
    loadCount();
    window.addEventListener("vendr:insider-signup", loadCount);
    return () => window.removeEventListener("vendr:insider-signup", loadCount);
  }, []);

  useEffect(() => {
    if (count === null) return;
    const target = count;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        if (fillRef.current) fillRef.current.style.width = `${(target / FOUNDING_TOTAL) * 100}%`;
        if (countRef.current) {
          const el = countRef.current;
          const dur = 2200;
          const start = performance.now();
          const step = (t: number) => {
            const p = Math.min(1, (t - start) / dur);
            const ease = 1 - Math.pow(1 - p, 3);
            el.textContent = String(Math.floor(target * ease));
            if (p < 1) requestAnimationFrame(step);
            else el.textContent = String(target);
          };
          requestAnimationFrame(step);
        }
        io.disconnect();
      },
      { threshold: 0.4 }
    );
    if (fillRef.current) io.observe(fillRef.current);
    return () => io.disconnect();
  }, [count]);

  return (
    <section
      ref={sectionRef}
      id="founding"
      className="vendr-reveal"
      style={{
        position: "relative", padding: "clamp(40px,6vw,60px) clamp(20px,5vw,36px) 20px",
        textAlign: "center", isolation: "isolate", overflow: "hidden",
      }}
    >
      {/* Background */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute", inset: 0, zIndex: -1,
          background:
            "radial-gradient(40% 30% at 50% 50%, rgba(101,34,99,.35), transparent 65%), " +
            "radial-gradient(80% 60% at 50% 100%, rgba(31,45,107,.25), transparent 60%), " +
            "linear-gradient(180deg, #00001e, #00001e)",
        }}
      >
        {/* Diagonal grid texture */}
        <div style={{
          position: "absolute", inset: 0,
          background: "repeating-linear-gradient(45deg, transparent 0 24px, rgba(207,233,255,.02) 24px 25px)",
        }} />
        {/* Bottom fade */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          height: 160,
          background: "linear-gradient(0deg, #00001e 0%, transparent 100%)",
        }} />
      </div>

      {/* Kicker */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, marginBottom: 28 }}>
        <span style={{ width: 36, height: 1, background: "rgba(207,233,255,.4)", display: "inline-block" }} />
        <span style={{ fontFamily: "var(--display)", fontSize: 11, letterSpacing: "0.4em", textTransform: "uppercase", color: "rgba(207,233,255,.55)" }}>
          03 · Founding 100
        </span>
        <span style={{ width: 36, height: 1, background: "rgba(207,233,255,.4)", display: "inline-block" }} />
      </div>

      {/* Headline */}
      <h2
        style={{
          fontFamily: "var(--display)", fontWeight: 300,
          fontSize: "clamp(32px, 6vw, 96px)", lineHeight: 0.95,
          letterSpacing: "-0.025em", textTransform: "uppercase",
          margin: "0 auto 28px", maxWidth: "14ch", color: "var(--ice)",
        }}
      >
        The first 100<br />
        get{" "}
        <em style={{ fontStyle: "italic", fontFamily: "var(--serif)", fontWeight: 400, color: "var(--violet-soft)", textTransform: "none", letterSpacing: "-0.02em" }}>
          founding
        </em>
        {" "}status.<br />
        Forever.
      </h2>

      {/* Lede */}
      <p
        className="vendr-founding-lede"
        style={{ fontFamily: "var(--body)", fontSize: "clamp(15px,3vw,20px)", lineHeight: 1.7, color: "rgba(231,236,243,.8)", maxWidth: "54ch", margin: "0 auto 64px" }}
      >
        Priority placement. Reduced commission. Featured at launch.
      </p>

      {/* Large counter */}
      <div
        style={{
          display: "flex", alignItems: "baseline", justifyContent: "center",
          gap: 8, marginBottom: 30,
          fontFamily: "var(--display)", fontWeight: 300, fontVariantNumeric: "tabular-nums",
        }}
      >
        <span
          ref={countRef}
          style={{
            fontSize: "clamp(48px, 12vw, 180px)", lineHeight: 1, letterSpacing: "-0.045em",
            background: "linear-gradient(180deg, #ffffff 0%, #cfe9ff 50%, #7aa8d6 100%)",
            WebkitBackgroundClip: "text", backgroundClip: "text",
            color: "transparent", WebkitTextFillColor: "transparent",
            filter: "drop-shadow(0 4px 30px rgba(207,233,255,.25))",
            opacity: countState.status === "loading" ? 0.3 : 1,
            transition: "opacity 0.4s ease",
          }}
        >
          {countState.status === "loading" ? "—" : "0"}
        </span>
        <span style={{ fontSize: "clamp(60px, 8vw, 120px)", color: "rgba(207,233,255,.3)", lineHeight: 1 }}>/</span>
        <span style={{ fontSize: "clamp(60px, 8vw, 120px)", color: "rgba(207,233,255,.55)", lineHeight: 1, letterSpacing: "-0.04em" }}>100</span>
      </div>

      {/* Progress bar */}
      <div style={{ maxWidth: 760, margin: "0 auto 40px" }}>
        <div className="vendr-progress-bar">
          <div ref={fillRef} className="vendr-progress-fill" />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14, fontFamily: "var(--display)", fontSize: 10, letterSpacing: "0.35em", color: "rgba(207,233,255,.45)", textTransform: "uppercase" }}>
          {["00", "25", "50", "75", "100"].map((t) => <span key={t}>{t}</span>)}
        </div>
      </div>


      {/* CTA */}
      <a
        href="#signup"
        onClick={(e) => { e.preventDefault(); document.getElementById("signup")?.scrollIntoView({ behavior: "smooth" }); }}
        className="vendr-btn-ghost vendr-magnetic"
        style={{
          display: "inline-flex", alignItems: "center", gap: 12, margin: "0 auto",
          fontFamily: "var(--display)", fontSize: 12, letterSpacing: "0.28em",
          textTransform: "uppercase", color: "rgba(231,236,243,.85)",
          border: "1px solid rgba(207,233,255,.18)", background: "rgba(255,255,255,.02)",
          padding: "18px 30px", borderRadius: 999,
          transition: "color 0.3s, border-color 0.3s, background 0.3s",
        }}
      >
        <span>Claim your spot</span>
        <svg width="14" height="10" viewBox="0 0 14 10" fill="none" aria-hidden="true">
          <path d="M1 5 H13 M9 1 L13 5 L9 9" stroke="currentColor" strokeWidth="1.4" />
        </svg>
      </a>
    </section>
  );
}
