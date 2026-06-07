"use client";

import { useScrollReveal } from "./useScrollReveal";

const ITEMS = [
  {
    ix: "/ 01",
    title: "Every creative, verified.",
    desc: "Real portfolios, real references, real receipts. We screen every applicant manually before they go live on the platform.",
  },
  {
    ix: "/ 02",
    title: "Escrow on every project.",
    desc: "Funds are held until milestones are signed off. Creatives never chase invoices. Clients never pay for work that didn't happen.",
  },
  {
    ix: "/ 03",
    title: "Curated, not crowdsourced.",
    desc: "Your brief goes to a shortlist matched by style, rate, region and availability — not to a stampede of cold pitches.",
  },
  {
    ix: "/ 04",
    title: "Built in South Africa.",
    desc: "Local rates, local rights, local realities. The platform speaks the language of the industry it serves.",
  },
] as const;

export function VendrWhy() {
  const headRef = useScrollReveal<HTMLDivElement>();
  const descRef = useScrollReveal<HTMLParagraphElement>();

  return (
    <section
      id="why"
      style={{ position: "relative", zIndex: 2, padding: "160px 36px" }}
    >
      {/* Header */}
      <div
        className="vendr-featured-head"
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", alignItems: "end", gap: 60, marginBottom: 80 }}
      >
        <div ref={headRef} className="vendr-reveal">
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28 }}>
            <span style={{ width: 36, height: 1, background: "rgba(207,233,255,.4)", display: "inline-block" }} />
            <span style={{ fontFamily: "var(--display)", fontSize: 11, letterSpacing: "0.4em", textTransform: "uppercase", color: "rgba(207,233,255,.55)" }}>
              05 · Why Vendr
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
            Built like a{" "}
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
              studio,
            </em>
            <br />
            run like a marketplace.
          </h2>
        </div>
        <p
          ref={descRef}
          className="vendr-reveal d1"
          style={{ fontFamily: "var(--body)", fontWeight: 300, fontSize: 15, lineHeight: 1.6, color: "rgba(231,236,243,.6)", maxWidth: "42ch" }}
        >
          We don&apos;t list everyone. We curate the few who can deliver — and
          we stand behind every project.
        </p>
      </div>

      {/* List */}
      <div>
        {ITEMS.map((item, i) => (
          <WhyItem key={item.ix} item={item} delay={i * 0.08} />
        ))}
      </div>
    </section>
  );
}

function WhyItem({
  item,
  delay,
}: {
  item: (typeof ITEMS)[number];
  delay: number;
}) {
  const ref = useScrollReveal<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className="vendr-reveal vendr-why-item"
      style={{
        transitionDelay: `${delay}s`,
        display: "grid",
        gridTemplateColumns: "110px 1fr",
        gap: 40,
        alignItems: "start",
        padding: "36px 0",
        borderTop: "1px solid rgba(207,233,255,.10)",
        cursor: "default",
      }}
    >
      <div
        style={{
          fontFamily: "var(--display)",
          fontSize: 12,
          letterSpacing: "0.3em",
          color: "rgba(207,233,255,.5)",
          paddingTop: 8,
        }}
      >
        {item.ix}
      </div>
      <div>
        <h4
          style={{
            fontFamily: "var(--display)",
            fontWeight: 400,
            fontSize: "clamp(24px, 2.6vw, 38px)",
            letterSpacing: "-0.01em",
            textTransform: "uppercase",
            marginBottom: 14,
            color: "rgba(207,233,255,.85)",
          }}
        >
          {item.title}
        </h4>
        <p
          style={{
            fontFamily: "var(--body)",
            fontWeight: 300,
            fontSize: 14.5,
            lineHeight: 1.65,
            color: "rgba(231,236,243,.6)",
            maxWidth: "56ch",
          }}
        >
          {item.desc}
        </p>
      </div>
    </div>
  );
}
