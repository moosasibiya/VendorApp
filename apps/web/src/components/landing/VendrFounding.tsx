"use client";

import { useEffect, useRef } from "react";
import { fetchInsiderStats } from "@/lib/api";
import { useScrollReveal } from "./useScrollReveal";

const FOUNDING_TOTAL = 100;

export function VendrFounding() {
  const fillRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const countRef = useRef<HTMLSpanElement>(null);
  const eyebrowRef = useScrollReveal<HTMLSpanElement>();
  const headRef = useScrollReveal<HTMLHeadingElement>();
  const leadRef = useScrollReveal<HTMLParagraphElement>();
  const countWrapRef = useScrollReveal<HTMLDivElement>();
  const meterRef = useScrollReveal<HTMLDivElement>();
  const ticksRef = useScrollReveal<HTMLDivElement>();
  const ctaRef = useScrollReveal<HTMLDivElement>();

  useEffect(() => {
    let count = 37;

    const loadAndAnimate = () => {
      fetchInsiderStats()
        .then(({ insiderCount }) => { count = insiderCount; })
        .catch(() => { count = 37; })
        .finally(() => {
          const io = new IntersectionObserver(
            ([entry]) => {
              if (!entry.isIntersecting) return;
              const pct = Math.min(100, (count / FOUNDING_TOTAL) * 100);

              if (fillRef.current) fillRef.current.style.width = `${pct}%`;
              if (knobRef.current) knobRef.current.style.left = `${pct}%`;

              if (countRef.current) {
                const el = countRef.current;
                const dur = 2200;
                const start = performance.now();
                const step = (t: number) => {
                  const p = Math.min(1, (t - start) / dur);
                  const ease = 1 - Math.pow(1 - p, 3);
                  el.textContent = String(Math.floor(count * ease));
                  if (p < 1) requestAnimationFrame(step);
                  else el.textContent = String(count);
                };
                requestAnimationFrame(step);
              }
              io.disconnect();
            },
            { threshold: 0.4 }
          );
          if (fillRef.current) io.observe(fillRef.current);
        });
    };

    loadAndAnimate();
    window.addEventListener("vendr:insider-signup", loadAndAnimate);
    return () => window.removeEventListener("vendr:insider-signup", loadAndAnimate);
  }, []);

  return (
    <section className="v-section v-founding" id="founding">
      <div className="v-container">
        <span className="v-eyebrow vendr-reveal" ref={eyebrowRef}>
          03 · Founding 100
        </span>

        <h2 className="vendr-reveal d1" ref={headRef}>
          The first 100 get <span className="v-ital">founding</span> status. Forever.
        </h2>

        <p className="v-lead vendr-reveal d2" ref={leadRef}>
          Priority placement. Reduced commission. Featured at launch.
        </p>

        <div className="v-count vendr-reveal d2" ref={countWrapRef}>
          <span className="v-got" ref={countRef}>0</span>
          <span className="v-tot"> / 100</span>
        </div>

        <div className="v-meter vendr-reveal d2" ref={meterRef}>
          <div className="v-fill" ref={fillRef} />
          <div className="v-knob" ref={knobRef} />
        </div>

        <div className="v-meter-ticks vendr-reveal d3" ref={ticksRef}>
          <span>00</span><span>25</span><span>50</span><span>75</span><span>100</span>
        </div>

        <div className="vendr-reveal d3" ref={ctaRef} style={{ marginTop: 46 }}>
          <a
            href="#join"
            onClick={(e) => { e.preventDefault(); document.getElementById("join")?.scrollIntoView({ behavior: "smooth" }); }}
            className="v-btn v-btn-grad"
          >
            Claim your spot <span className="v-arr">→</span>
          </a>
        </div>
      </div>
    </section>
  );
}
