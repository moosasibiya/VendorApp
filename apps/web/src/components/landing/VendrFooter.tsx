import Link from "next/link";

const PREVIEW_HREF =
  "/confirmed?code=VENDR-001&link=https%3A%2F%2Fvendr.studio%2Fr%2FVENDR-001&name=Preview&num=42&role=ARTIST";

export function VendrFooter() {
  return (
    <footer className="v-footer">
      <div className="v-container">
        <a href="#top" className="v-logo">
          VENDR<span>.</span>STUDIO
        </a>
        <p>For the creatives, by the creatives · Launching 01 · 07 · 2026</p>
        <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
          <Link
            href="/privacy"
            style={{ fontFamily: "Manrope, sans-serif", fontSize: 10, letterSpacing: ".28em", textTransform: "uppercase", color: "var(--v-muted-dim)", textDecoration: "none" }}
          >
            Privacy Policy
          </Link>
          <Link
            href={PREVIEW_HREF}
            style={{ fontFamily: "Manrope, sans-serif", fontSize: 10, letterSpacing: ".28em", textTransform: "uppercase", color: "var(--v-muted-dim)", textDecoration: "none" }}
          >
            Confirmation screen
          </Link>
        </div>
      </div>
    </footer>
  );
}
