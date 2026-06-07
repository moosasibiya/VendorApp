const ITEMS = [
  { text: "Verified", em: "creatives" },
  { text: "Escrowed", em: "payments" },
  { text: "Real", em: "contracts" },
  { text: "No more", em: "ghosting" },
  { text: "Cape Town ·", em: "Johannesburg · Durban · Pretoria" },
  { text: "Built in", em: "South Africa" },
  { text: "Launching", em: "01 / 07 / 2026" },
  { text: "For the creatives, by the", em: "creatives" },
] as const;

const ALL = [...ITEMS, ...ITEMS];

const DOT = (
  <span
    aria-hidden="true"
    style={{
      width: 8, height: 8, borderRadius: "50%",
      background: "var(--ice)", boxShadow: "0 0 12px var(--ice)",
      display: "inline-block", flexShrink: 0, marginLeft: 28,
    }}
  />
);

export function VendrTicker() {
  return (
    <div
      aria-label="Vendr Studios highlights"
      style={{
        position: "relative", zIndex: 2,
        borderTop: "1px solid rgba(207,233,255,.10)",
        borderBottom: "1px solid rgba(207,233,255,.10)",
        background: "rgba(0,0,5,0.6)",
        overflow: "hidden", padding: "16px 0",
      }}
    >
      <div
        style={{
          display: "flex", gap: 32,
          whiteSpace: "nowrap",
          animation: "vendr-ticker 70s linear infinite",
          width: "max-content",
        }}
      >
        {ALL.map(({ text, em }, i) => (
          <span
            key={i}
            style={{
              fontFamily: "var(--display)", fontSize: "clamp(14px, 3vw, 22px)", letterSpacing: "0.04em",
              color: "rgba(207,233,255,0.85)", textTransform: "uppercase",
              fontWeight: 300,
              display: "inline-flex", alignItems: "center", gap: 8,
            }}
          >
            {text}{" "}
            <em style={{
              fontStyle: "normal",
              fontFamily: "var(--display)",
              fontWeight: 300,
              color: "var(--violet)",
              fontSize: "clamp(14px, 3vw, 22px)",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}>
              {em}
            </em>
            {DOT}
          </span>
        ))}
      </div>
    </div>
  );
}
