"use client";

import { type CSSProperties } from "react";

const scrollToJoinWithRole = (role: "client" | "creative") => (e: React.MouseEvent) => {
  e.preventDefault();
  window.dispatchEvent(new CustomEvent("vendr:select-role", { detail: role }));
  document.getElementById("join")?.scrollIntoView({ behavior: "smooth" });
};

export function VendrHero() {
  return (
    <section className="v-hero" id="top">
      {/* Conic-ray fan */}
      <div className="v-rays" aria-hidden="true" />
      {/* Glow orb */}
      <div className="v-glow" aria-hidden="true" />

      {/* Eyebrow */}
      <span
        className="v-eyebrow v-anim"
        style={{ "--d": ".5s" } as CSSProperties}
      >
        Launching 01 · 07 · 2026
      </span>

      {/* Headline */}
      <h1 aria-label="Before the light, there is darkness.">
        <span className="v-line">
          <i className="v-anim" style={{ "--d": ".7s" } as CSSProperties}>Before the light,</i>
        </span>
        <span className="v-line">
          <i className="v-anim" style={{ "--d": ".85s" } as CSSProperties}>there is</i>
        </span>
        <span className="v-line">
          <i className="v-anim v-grad-text" style={{ "--d": "1s" } as CSSProperties}>darkness.</i>
        </span>
      </h1>

      {/* Lead */}
      <p
        className="v-lead v-anim"
        style={{ marginTop: 34, "--d": "1.25s" } as CSSProperties}
      >
        The trusted marketplace for <b>verified</b> photographers and videographers
        in South Africa. No more ghosting. No more scams. <b>Just craft.</b>
      </p>

      {/* CTAs */}
      <div
        className="v-anim"
        style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center", marginTop: 40, "--d": "1.45s" } as CSSProperties}
      >
        <a
          href="#join"
          onClick={scrollToJoinWithRole("client")}
          className="v-btn v-btn-outline"
        >
          I want to book creatives
          <span className="v-arr" aria-hidden="true">→</span>
        </a>
        <a
          href="#join"
          onClick={scrollToJoinWithRole("creative")}
          className="v-btn v-btn-ghost"
        >
          I am a creative
          <span className="v-arr" aria-hidden="true">→</span>
        </a>
      </div>

      {/* Scroll cue */}
    </section>
  );
}
