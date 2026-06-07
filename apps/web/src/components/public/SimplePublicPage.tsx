import Link from "next/link";

type SimplePublicPageProps = {
  eyebrow: string;
  title: string;
  intro: string;
  points?: string[];
  ctaLabel?: string;
  ctaHref?: string;
};

export function SimplePublicPage({
  eyebrow,
  title,
  intro,
  points = [],
  ctaLabel = "Explore creatives",
  ctaHref = "/explore",
}: SimplePublicPageProps) {
  return (
    <main
      style={{
        minHeight: "72vh",
        padding: "clamp(104px, 12vw, 154px) clamp(20px, 5vw, 64px) 90px",
      }}
    >
      <section
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          display: "grid",
          gap: 22,
        }}
      >
        <div
          style={{
            position: "relative",
            overflow: "hidden",
            border: "1px solid var(--border)",
            borderRadius: 8,
            padding: "clamp(28px, 5vw, 58px)",
            background:
              "linear-gradient(90deg, rgba(207,233,255,0.075), transparent 60%), rgba(207,233,255,0.035)",
            boxShadow: "var(--shadow-card)",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              background:
                "radial-gradient(ellipse at 22% 0%, rgba(207,233,255,0.14), transparent 42%)",
            }}
          />
          <p
            style={{
              position: "relative",
              color: "var(--muted)",
              fontSize: 12,
              fontWeight: 900,
              letterSpacing: "0.28em",
              marginBottom: 18,
              textTransform: "uppercase",
            }}
          >
            {eyebrow}
          </p>
          <h1
            style={{
              position: "relative",
              color: "var(--text)",
              fontSize: "clamp(42px, 8vw, 96px)",
              maxWidth: "13ch",
              marginBottom: 24,
              letterSpacing: "0.02em",
            }}
          >
            {title}
          </h1>
          <p
            style={{
              position: "relative",
              color: "var(--muted-strong)",
              fontSize: "clamp(17px, 2.4vw, 22px)",
              lineHeight: 1.7,
              maxWidth: 760,
              marginBottom: 34,
            }}
          >
            {intro}
          </p>
          <Link
            href={ctaHref}
            style={{
              position: "relative",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 48,
              borderRadius: 999,
              border: "1px solid var(--border-strong)",
              background: "rgba(207,233,255,0.1)",
              color: "var(--text)",
              fontWeight: 900,
              padding: "0 22px",
            }}
          >
            {ctaLabel}
          </Link>
        </div>

        {points.length > 0 ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 14,
            }}
          >
            {points.map((point) => (
              <div
                key={point}
                style={{
                  border: "1px solid var(--border-strong)",
                  borderRadius: 8,
                  background: "rgba(207, 233, 255, 0.04)",
                  color: "var(--text)",
                  padding: "20px",
                  minHeight: 112,
                  boxShadow: "var(--shadow-card)",
                }}
              >
                {point}
              </div>
            ))}
          </div>
        ) : null}
      </section>
    </main>
  );
}
