const ITEMS = [
  { text: "Johannesburg · Durban · Pretoria", em: "" },
  { text: "Built in", em: "South Africa" },
  { text: "Launching", em: "01/07/2026" },
  { text: "Verified", em: "creatives" },
  { text: "Escrowed", em: "payments" },
  { text: "Real", em: "contracts" },
  { text: "No more", em: "ghosting" },
  { text: "For the creatives, by the", em: "creatives" },
] as const;

export function VendrTicker() {
  return (
    <div className="v-marquee" aria-label="Vendr Studios highlights">
      <div className="v-track">
        <span>
          {ITEMS.map(({ text, em }, i) => (
            <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 46 }}>
              {text}{em && <> <em>{em}</em></>}
              <span className="v-dot" aria-hidden="true" />
            </span>
          ))}
        </span>
        <span aria-hidden="true">
          {ITEMS.map(({ text, em }, i) => (
            <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 46 }}>
              {text}{em && <> <em>{em}</em></>}
              <span className="v-dot" aria-hidden="true" />
            </span>
          ))}
        </span>
      </div>
    </div>
  );
}
