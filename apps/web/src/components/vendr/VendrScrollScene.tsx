"use client";

import { useEffect, useRef } from "react";

const ORB_GRADIENTS = [
  "radial-gradient(circle at 35% 30%, #cfe9ff 0%, #7aa8d6 45%, #1F2D6B 100%)",
  "radial-gradient(circle at 40% 25%, #d6c3ff 0%, #b58bd6 45%, #652263 100%)",
  "radial-gradient(circle at 30% 30%, #cfe9ff 0%, #b58bd6 50%, #1F2D6B 100%)",
  "radial-gradient(circle at 40% 30%, #ffffff 0%, #cfe9ff 35%, #652263 100%)",
  "radial-gradient(circle at 30% 25%, #d6c3ff 0%, #7aa8d6 45%, #1F2D6B 100%)",
] as const;

const WORDS = ["Verified", "Crafted", "Matched", "Booked", "Paid"] as const;

export function VendrScrollScene() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const sec = sectionRef.current;
    const stage = stageRef.current;
    if (!sec || !stage) return;

    let lastP = -1;

    const update = () => {
      rafRef.current = 0;
      const r = sec.getBoundingClientRect();
      const total = sec.offsetHeight - window.innerHeight;
      const p = Math.max(0, Math.min(1, -r.top / total));
      if (Math.abs(p - lastP) < 0.001) return;
      lastP = p;

      const seg = (a: number, b: number) =>
        Math.max(0, Math.min(1, (p - a) / (b - a)));

      stage.style.setProperty("--p0", seg(0.0,  0.22).toFixed(3));
      stage.style.setProperty("--p1", seg(0.18, 0.42).toFixed(3));
      stage.style.setProperty("--p2", seg(0.40, 0.62).toFixed(3));
      stage.style.setProperty("--p3", seg(0.58, 0.88).toFixed(3));
      stage.style.setProperty("--p",  p.toFixed(3));
    };

    const onScroll = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(update);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    update();

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <section ref={sectionRef} className="vendr-scene-scroll">
      <div className="vendr-scene-pin">
        <div
          ref={stageRef}
          style={{ position: "relative", width: "100%", maxWidth: 1400, height: "100%", padding: "0 36px", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          {/* Stage 1 — kicker + headline */}
          <div className="vendr-ss-kicker">
            <span style={{ width: 36, height: 1, background: "rgba(207,233,255,.5)", display: "inline-block" }} />
            The Five Marks
            <span style={{ width: 36, height: 1, background: "rgba(207,233,255,.5)", display: "inline-block" }} />
          </div>

          <h2 className="vendr-ss-headline">
            Five{" "}
            <em style={{
              fontStyle: "italic", fontFamily: "var(--serif)", fontWeight: 400,
              background: "linear-gradient(110deg, #cfe9ff 0%, #b58bd6 50%, #cfe9ff 100%)",
              backgroundSize: "280% 100%",
              WebkitBackgroundClip: "text", backgroundClip: "text",
              color: "transparent", WebkitTextFillColor: "transparent",
              animation: "vendr-grad-flow 10s linear infinite",
            }}>
              marks
            </em>{" "}
            of a Vendr creative.
          </h2>

          {/* Stage 3 — orbs */}
          <div className="vendr-ss-orbs">
            {ORB_GRADIENTS.map((bg, i) => (
              <div key={i} className="vendr-ss-orb-wrap">
                <span className="vendr-ss-ring" />
                <div className="vendr-ss-orb" style={{ background: bg }} />
              </div>
            ))}
          </div>

          {/* Stage 2 — words */}
          <div className="vendr-ss-words">
            {WORDS.map((word, i) => (
              <div key={word} className="vendr-ss-word">
                <span style={{ display: "block", fontSize: 9, letterSpacing: "0.35em", color: "rgba(207,233,255,.35)", marginBottom: 10 }}>
                  / 0{i + 1}
                </span>
                {word}
              </div>
            ))}
          </div>

          {/* Tail caption */}
          <div className="vendr-ss-tail">
            Built{" "}
            <em style={{ fontStyle: "italic", fontFamily: "var(--serif)", color: "var(--violet-soft)", fontSize: 18, margin: "0 6px", letterSpacing: "-0.01em" }}>for</em>
            {" "}the creatives,{" "}
            <em style={{ fontStyle: "italic", fontFamily: "var(--serif)", color: "var(--violet-soft)", fontSize: 18, margin: "0 6px", letterSpacing: "-0.01em" }}>by</em>
            {" "}the creatives.
          </div>

        </div>
      </div>
    </section>
  );
}
