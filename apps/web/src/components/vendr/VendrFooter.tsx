import Link from "next/link";

const SOCIALS = [
  { label: "Instagram", href: "https://www.instagram.com/vendr.studio" },
  { label: "TikTok",    href: "https://www.tiktok.com/@vendr.studio" },
];

const PREVIEW_HREF =
  "/confirmed?code=VENDR-001&link=https%3A%2F%2Fvendr.studio%2Fr%2FVENDR-001&name=Preview&num=42&role=ARTIST";

export function VendrFooter() {
  return (
    <footer
      style={{
        position: "relative",
        zIndex: 2,
        borderTop: "1px solid rgba(207,233,255,0.08)",
        padding: "clamp(20px,4vw,32px) clamp(20px,5vw,64px) clamp(20px,4vw,28px)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 24 }}>
        {/* Brand */}
        <Link href="/" style={{ display: "flex", alignItems: "center" }}>
          <span style={{
            fontFamily: "var(--display)",
            fontWeight: 600,
            fontSize: "clamp(14px,4vw,20px)",
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            color: "var(--ice)",
          }}>
            VENDR<span style={{ color: "#652263" }}>.</span>STUDIO
          </span>
        </Link>

        {/* Socials */}
        <div className="vendr-footer-socials" style={{ display: "flex", gap: 32 }}>
          {SOCIALS.map(({ label, href }) => (
            <a key={label} href={href} target="_blank" rel="noreferrer" className="vendr-foot-link" style={{ fontFamily: "var(--display)", fontSize: 13, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(207,233,255,0.65)" }}>
              {label}
            </a>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
          paddingTop: "clamp(16px,3vw,36px)" as unknown as number,
          borderTop: "1px solid rgba(207,233,255,0.08)",
          fontFamily: "var(--display)",
          fontSize: 10,
          letterSpacing: "0.32em",
          textTransform: "uppercase",
          color: "rgba(207,233,255,0.35)",
        }}
      >
        <span>© 2026 VendrStudio (Pty) Ltd · South Africa</span>

        <div style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
          <Link
            href="/privacy"
            style={{ color: "rgba(207,233,255,0.35)", textDecoration: "none", letterSpacing: "0.28em", fontSize: 10, textTransform: "uppercase", fontFamily: "var(--display)" }}
          >
            Privacy Policy
          </Link>
          <Link
            href={PREVIEW_HREF}
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              color: "rgba(207,233,255,0.28)", textDecoration: "none",
              letterSpacing: "0.28em", fontSize: 10, textTransform: "uppercase",
              fontFamily: "var(--display)",
            }}
          >
            Confirmation screen
            <svg width="10" height="8" viewBox="0 0 14 10" fill="none" aria-hidden="true">
              <path d="M1 5H13M9 1L13 5L9 9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </Link>
        </div>
      </div>
    </footer>
  );
}
