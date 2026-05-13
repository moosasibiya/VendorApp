"use client";

import { useScrollReveal } from "./useScrollReveal";

const ARROW = (
  <svg viewBox="0 0 14 10" width="14" height="10" fill="none" aria-hidden="true">
    <path d="M1 5 H13 M9 1 L13 5 L9 9" stroke="currentColor" strokeWidth="1.4" />
  </svg>
);

const CARDS = [
  {
    side: "left",
    ix: "01",
    label: "For Clients",
    titleBefore: "Book with ",
    titleEm: "certainty",
    titleAfter: ",",
    titleLine2Before: "",
    titleLine2Si: "not",
    titleLine2After: " faith.",
    body: "Browse verified portfolios. Book securely. Your payment is protected until the job is done. If they don't show, you get a full refund.",
    items: [
      "Manually verified portfolios & references",
      "Transparent rates — no surprise quotes",
      "Vendr-backed delivery guarantee",
      "One brief, multiple curated shortlists",
    ],
    cta: "Join as a client",
    bg: "radial-gradient(120% 80% at 0% 0%, rgba(31,45,107,.45), transparent 60%), linear-gradient(180deg, #04062a, #00001E)",
  },
  {
    side: "right",
    ix: "02",
    label: "For Creatives",
    titleBefore: "Get booked.",
    titleEm: "",
    titleAfter: "",
    titleLine2Before: "Get paid. ",
    titleLine2Si: "Get",
    titleLine2After: " ",
    titleLine2Em: "respected",
    titleLine2End: ".",
    body: "Your own profile. Your own rates. Paid within 48 hours. A verified badge that separates you from the noise. Merit, not followers.",
    items: [
      "Verified profile & protected portfolio rights",
      "Briefs matched to your style, rate & city",
      "Contracts, milestones & escrow — handled",
      "Community of South Africa's working creatives",
    ],
    cta: "Join as a creative",
    bg: "radial-gradient(120% 80% at 100% 0%, rgba(101,34,99,.45), transparent 60%), linear-gradient(180deg, #0a0a2a, #00001E)",
  },
] as const;

export function VendrPromise() {
  const ref0 = useScrollReveal<HTMLElement>();
  const ref1 = useScrollReveal<HTMLElement>();
  const refs = [ref0, ref1];
  const headerRef = useScrollReveal<HTMLDivElement>();
  const subtitleRef = useScrollReveal<HTMLParagraphElement>();

  return (
    <section
      id="promise"
      style={{ position: "relative", zIndex: 2, padding: "60px 36px", background: "linear-gradient(180deg, #000005 0%, #00001e 100%)" }}
    >
      {/* Header */}
      <div
        className="vendr-featured-head"
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", alignItems: "end", gap: 60, marginBottom: 72 }}
      >
        <div className="vendr-reveal" ref={headerRef}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28 }}>
            <span style={{ width: 36, height: 1, background: "rgba(207,233,255,.4)", display: "inline-block" }} />
            <span style={{ fontFamily: "var(--display)", fontSize: 11, letterSpacing: "0.4em", textTransform: "uppercase", color: "rgba(207,233,255,.55)" }}>
              02 · The Promise
            </span>
          </div>
          <h2 style={{ fontFamily: "var(--display)", fontWeight: 300, fontSize: "clamp(40px, 5vw, 80px)", lineHeight: 0.98, letterSpacing: "-0.025em", textTransform: "uppercase", color: "var(--ice)" }}>
            Two sides.<br />
            One{" "}
            <em style={{ fontStyle: "normal", fontWeight: 500, background: "linear-gradient(110deg, #cfe9ff 0%, #b58bd6 50%, #cfe9ff 100%)", backgroundSize: "280% 100%", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent", WebkitTextFillColor: "transparent", animation: "vendr-grad-flow 10s linear infinite" }}>
              spotlight
            </em>
            .
          </h2>
        </div>
        <p className="vendr-reveal d1" ref={subtitleRef} style={{ fontFamily: "var(--body)", fontWeight: 400, fontSize: 20, lineHeight: 1.7, color: "rgba(231,236,243,.8)", maxWidth: "52ch" }}>
          Built in South Africa, for South Africa.<br />Where verified portfolios and real contracts replace ghosting, surprise quotes, and chasing invoices.
        </p>
      </div>

      {/* Cards */}
      <div
        className="vendr-split-grid"
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22 }}
      >
        {CARDS.map((card, i) => (
          <article
            key={card.side}
            ref={refs[i]}
            className={`vendr-reveal vendr-pcard${i > 0 ? " d1" : ""}`}
            data-card
            style={{
              padding: "64px 52px 52px", minHeight: 520,
              border: "1px solid rgba(207,233,255,.10)",
              borderRadius: 8, overflow: "hidden", isolation: "isolate",
              background: card.bg,
            }}
            onMouseMove={(e) => {
              const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
              (e.currentTarget as HTMLElement).style.setProperty("--mx", ((e.clientX - r.left) / r.width * 100) + "%");
              (e.currentTarget as HTMLElement).style.setProperty("--my", ((e.clientY - r.top) / r.height * 100) + "%");
            }}
          >
            {/* Index */}
            <div style={{ position: "absolute", top: 24, right: 28, fontFamily: "var(--display)", fontSize: 22, fontWeight: 600, letterSpacing: "0.1em", color: "rgba(207,233,255,.5)", zIndex: 2 }}>
              {card.ix}
            </div>

            {/* Label */}
            <div style={{ fontFamily: "var(--display)", fontSize: 15, letterSpacing: "0.3em", color: "rgba(207,233,255,.75)", textTransform: "uppercase", marginBottom: 28, display: "flex", alignItems: "center", gap: 14, position: "relative", zIndex: 2 }}>
              <span style={{ width: 28, height: 1, background: "rgba(207,233,255,.45)", display: "inline-block" }} />
              {card.label}
            </div>

            {/* Heading */}
            <h3 style={{ fontFamily: "var(--display)", fontWeight: 300, fontSize: "clamp(30px, 3.4vw, 46px)", letterSpacing: "-0.02em", lineHeight: 1.05, textTransform: "uppercase", marginBottom: 24, maxWidth: "14ch", position: "relative", zIndex: 2, color: "var(--ice)" }}>
              {card.titleBefore}
              {card.titleEm && <em style={{ fontStyle: "normal", fontWeight: 500 }}>{card.titleEm}</em>}
              {card.titleAfter}
              <br />
              {card.titleLine2Before}
              {"titleLine2Si" in card && card.titleLine2Si && card.titleLine2Before && <br />}
              {"titleLine2Si" in card && card.titleLine2Si && (
                <span style={{ fontFamily: "var(--serif)", fontStyle: "italic", fontWeight: 400, color: "var(--violet-soft)", textTransform: "none" }}>
                  {card.titleLine2Si}
                </span>
              )}
              {card.titleLine2After}
              {"titleLine2Em" in card && card.titleLine2Em && <em style={{ fontStyle: "normal", fontWeight: 500 }}>{card.titleLine2Em}</em>}
              {"titleLine2End" in card && card.titleLine2End}
            </h3>

            {/* Body */}
            <p style={{ fontFamily: "var(--body)", fontWeight: 300, color: "rgba(231,236,243,.72)", fontSize: 15, lineHeight: 1.65, maxWidth: "42ch", marginBottom: 44, position: "relative", zIndex: 2 }}>
              {card.body}
            </p>


            {/* CTA */}
            <a href="#signup" className="vendr-pcta" style={{ fontFamily: "var(--display)", fontSize: 16, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--ice)", paddingBottom: 10, borderBottom: "1px solid rgba(207,233,255,.3)", position: "relative", zIndex: 2 }}>
              {card.cta} {ARROW}
            </a>
          </article>
        ))}
      </div>
    </section>
  );
}
