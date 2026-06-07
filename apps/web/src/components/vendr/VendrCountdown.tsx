"use client";

import { Fragment, useEffect, useState } from "react";

const LAUNCH = new Date("2026-07-01T00:00:00+02:00").getTime();
const pad = (n: number) => String(Math.max(0, n)).padStart(2, "0");

type Time = { d: string; h: string; m: string; s: string };

function calc(): Time {
  const diff = LAUNCH - Date.now();
  if (diff <= 0) return { d: "00", h: "00", m: "00", s: "00" };
  return {
    d: pad(Math.floor(diff / 864e5)),
    h: pad(Math.floor((diff % 864e5) / 36e5)),
    m: pad(Math.floor((diff % 36e5) / 6e4)),
    s: pad(Math.floor((diff % 6e4) / 1e3)),
  };
}

const UNITS = [
  { key: "d" as const, label: "Days" },
  { key: "h" as const, label: "Hours" },
  { key: "m" as const, label: "Minutes" },
  { key: "s" as const, label: "Seconds" },
];

export function VendrCountdown() {
  // Placeholder keeps server and client HTML identical until the first effect runs.
  // Calling setTime synchronously on mount is intentional: we need the real clock value
  // only after hydration, so the SSR output is always "-- -- -- --".
  const [time, setTime] = useState<Time>({ d: "--", h: "--", m: "--", s: "--" });

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTime(calc());
    const id = setInterval(() => setTime(calc()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div>
      {/* Label */}
      <div
        style={{
          fontFamily: "var(--display)", fontSize: "clamp(10px,3vw,16px)", fontWeight: 600, letterSpacing: "0.3em",
          color: "rgba(207,233,255,0.85)", textTransform: "uppercase",
          marginBottom: 24,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 14,
        }}
      >
        <span className="vendr-countdown-label-deco" style={{ width: 42, height: 1, background: "rgba(207,233,255,0.3)", display: "inline-block" }} />
        Until the spotlight turns on
        <span className="vendr-countdown-label-deco" style={{ width: 42, height: 1, background: "rgba(207,233,255,0.3)", display: "inline-block" }} />
      </div>

      {/* Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 1,
          background: "#0b0e36",
          border: "1px solid rgba(207,233,255,0.25)",
          borderRadius: 8,
          overflow: "hidden",
          boxShadow: "0 0 40px rgba(207,233,255,0.08), 0 0 80px rgba(101,34,99,0.15), inset 0 1px 0 rgba(207,233,255,0.1)",
        }}
      >
        {UNITS.map(({ key, label }, i) => (
          <Fragment key={key}>
            <div className="vendr-cu" style={{ textAlign: "center" }}>
              {/* Colon separator */}
              {i < 3 && (
                <span className="vendr-cu-colon" aria-hidden="true">:</span>
              )}

              {/* Digit display */}
              <div
                style={{
                  fontFamily: "var(--display)", fontWeight: 300,
                  fontSize: "clamp(24px, 5vw, 64px)",
                  lineHeight: 1, letterSpacing: "-0.04em",
                  color: "var(--ice)", fontVariantNumeric: "tabular-nums",
                  filter: "drop-shadow(0 0 12px rgba(207,233,255,0.5))",
                  display: "flex", justifyContent: "center", gap: 2,
                }}
              >
                {time[key].split("").map((ch, ci) => (
                  <span key={ci} style={{ display: "inline-block", minWidth: "0.6em", textAlign: "center" }}>
                    {ch}
                  </span>
                ))}
              </div>

              {/* Label */}
              <div
                style={{
                  fontFamily: "var(--display)", fontSize: 10, letterSpacing: "0.35em",
                  color: "rgba(207,233,255,0.45)", textTransform: "uppercase", marginTop: 14,
                }}
              >
                {label}
              </div>
            </div>
          </Fragment>
        ))}
      </div>
    </div>
  );
}
