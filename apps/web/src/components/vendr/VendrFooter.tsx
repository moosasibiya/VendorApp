const SOCIALS = ["Instagram", "TikTok"];

export function VendrFooter() {
  return (
    <footer
      style={{
        position: "relative",
        zIndex: 2,
        borderTop: "1px solid rgba(207,233,255,0.08)",
        padding: "32px 64px 28px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 24 }}>
        {/* Brand */}
        <a href="/" style={{ display: "flex", alignItems: "center" }}>
          <span style={{
            fontFamily: "var(--display)",
            fontWeight: 600,
            fontSize: 20,
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            color: "var(--ice)",
          }}>
            VENDR<span style={{ color: "#652263" }}>.</span>STUDIO
          </span>
        </a>

        {/* Socials */}
        <div style={{ display: "flex", gap: 32 }}>
          {SOCIALS.map((s) => (
            <a key={s} href="#" className="vendr-foot-link" style={{ fontFamily: "var(--display)", fontSize: 13, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(207,233,255,0.65)" }}>
              {s}
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
          paddingTop: 36,
          borderTop: "1px solid rgba(207,233,255,0.08)",
          fontFamily: "var(--display)",
          fontSize: 10,
          letterSpacing: "0.32em",
          textTransform: "uppercase",
          color: "rgba(207,233,255,0.35)",
        }}
      >
        <span>© 2026 VendrStudio (Pty) Ltd · South Africa</span>
        <span>The spotlight changes everything.</span>
      </div>
    </footer>
  );
}
