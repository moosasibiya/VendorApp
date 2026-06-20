"use client";

import { useEffect, useState } from "react";
import { useScrollReveal } from "./useScrollReveal";

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
  const [time, setTime] = useState<Time>({ d: "--", h: "--", m: "--", s: "--" });
  const eyebrowRef = useScrollReveal<HTMLSpanElement>();
  const clockRef = useScrollReveal<HTMLDivElement>();

  useEffect(() => {
    setTime(calc());
    const id = setInterval(() => setTime(calc()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="v-section v-center">
      <span className="v-eyebrow vendr-reveal" ref={eyebrowRef}>
        Until the spotlight turns on
      </span>
      <div className="v-clock vendr-reveal d1" ref={clockRef}>
        {UNITS.map(({ key, label }) => (
          <div key={key} className="v-unit">
            <div className="v-num" style={{ fontVariantNumeric: "tabular-nums" }}>
              {time[key]}
            </div>
            <div className="v-lbl">{label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
