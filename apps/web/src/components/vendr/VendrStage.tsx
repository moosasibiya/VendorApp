"use client";

import { useEffect, useRef } from "react";

const BEAM_COUNT = 15;
const BEAM_SPREAD = 130;

function buildBeamAngles(count: number, spread: number): number[] {
  return Array.from({ length: count }, (_, i) => {
    const t = i / (count - 1);
    return (t - 0.5) * spread;
  });
}

const LAMPS = [
  { style: { left: "22%", opacity: 0.95, bottom: "42%", height: "8%" } },
  { style: { left: "34%", opacity: 0.7,  bottom: "44%", height: "6%" } },
  { style: { left: "14%", opacity: 0.55, bottom: "45%", height: "5%" } },
  { style: { right: "22%", opacity: 0.95, bottom: "42%", height: "8%" } },
  { style: { right: "34%", opacity: 0.7,  bottom: "44%", height: "6%" } },
  { style: { right: "14%", opacity: 0.55, bottom: "45%", height: "5%" } },
];

const FOG_LAYERS = [
  {
    bottom: "-20%", opacity: 0.6, duration: "28s", delay: "0s",
    bg: "radial-gradient(ellipse at center, rgba(207,233,255,.18) 0%, rgba(101,34,99,.08) 35%, transparent 70%)",
  },
  {
    bottom: "5%", opacity: 0.45, duration: "36s", delay: "-8s",
    bg: "radial-gradient(ellipse at center, rgba(101,34,99,.18), rgba(31,45,107,.05) 40%, transparent 70%)",
  },
  {
    bottom: "25%", opacity: 0.3, duration: "42s", delay: "-14s",
    bg: "radial-gradient(ellipse at center, rgba(207,233,255,.12) 0%, rgba(101,34,99,.06) 35%, transparent 70%)",
  },
];

export function VendrStage() {
  const stageRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  /* ── Particles canvas ── */
  useEffect(() => {
    const cvs = canvasRef.current;
    const stage = stageRef.current;
    if (!cvs || !stage) return;
    const ctx = cvs.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0, h = 0;

    const resize = () => {
      const r = stage.getBoundingClientRect();
      w = r.width; h = r.height;
      cvs.width = w * dpr; cvs.height = h * dpr;
      cvs.style.width = `${w}px`; cvs.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const N = 70;
    const parts = Array.from({ length: N }, () => ({
      x: Math.random() * (w || 600),
      y: Math.random() * (h || 500),
      r: Math.random() * 1.6 + 0.2,
      vx: (Math.random() - 0.5) * 0.15,
      vy: -Math.random() * 0.25 - 0.05,
      a: Math.random() * 0.5 + 0.2,
      tw: Math.random() * 0.04 + 0.01,
      ph: Math.random() * Math.PI * 2,
    }));

    const handleResize = () => {
      resize();
      parts.forEach((p) => { p.x = Math.random() * w; p.y = Math.random() * h; });
    };
    window.addEventListener("resize", handleResize, { passive: true });

    const frame = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of parts) {
        p.x += p.vx; p.y += p.vy; p.ph += p.tw;
        if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; }
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;
        const alpha = p.a * (0.5 + 0.5 * Math.sin(p.ph));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(207,233,255,${alpha})`;
        ctx.shadowColor = "rgba(207,233,255,0.6)";
        ctx.shadowBlur = 6;
        ctx.fill();
      }
      rafRef.current = requestAnimationFrame(frame);
    };
    rafRef.current = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  /* ── Mouse parallax ── */
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const stage = stageRef.current;
    const scene = sceneRef.current;
    if (!stage || !scene) return;
    const r = stage.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    scene.style.transform = `translate3d(${x * -14}px, ${y * -10}px, 0) scale(1.02)`;
  };
  const handleMouseLeave = () => {
    if (sceneRef.current) sceneRef.current.style.transform = "";
  };

  const beamAngles = buildBeamAngles(BEAM_COUNT, BEAM_SPREAD);

  return (
    <div
      ref={stageRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="vendr-stage"
      style={{
        position: "relative",
        height: "78vh",
        minHeight: 560,
        borderRadius: 6,
        overflow: "hidden",
        background:
          "radial-gradient(50% 40% at 50% 60%, rgba(31,45,107,.22), transparent 75%), linear-gradient(180deg, #000005 0%, #00010f 50%, #000005 100%)",
        isolation: "isolate",
        boxShadow: "0 30px 80px -30px rgba(0,0,30,.8), inset 0 0 0 1px rgba(207,233,255,.05)",
      }}
    >
      {/* Mouse-reactive scene layer */}
      <div
        ref={sceneRef}
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
          willChange: "transform",
          transition: "transform 0.5s cubic-bezier(0.2,0.8,0.2,1)",
        }}
      >
        {/* Sky depth */}
        <div
          style={{
            position: "absolute", inset: 0, zIndex: 0,
            background:
              "radial-gradient(40% 25% at 50% 55%, rgba(101,34,99,.12), transparent 70%), radial-gradient(60% 35% at 50% 70%, rgba(31,45,107,.18), transparent 70%)",
          }}
        />

        {/* Skyline silhouette */}
        <div
          style={{
            position: "absolute", left: 0, right: 0, top: "48%", height: "14%", zIndex: 1,
            background:
              "linear-gradient(180deg, rgba(0,0,15,0) 0%, rgba(0,0,15,.9) 70%, rgba(0,0,15,1)), repeating-linear-gradient(90deg, rgba(207,233,255,.04) 0 1px, transparent 1px 22px), linear-gradient(180deg, rgba(207,233,255,.08), rgba(0,0,30,1))",
          }}
        />

        {/* Background haze */}
        <div
          style={{
            position: "absolute", left: 0, right: 0, top: "25%", bottom: "42%", zIndex: 1,
            opacity: 0.55,
            background: "linear-gradient(180deg, transparent, rgba(207,233,255,.025) 30%, transparent 95%)",
          }}
        />

        {/* Street lamps */}
        {LAMPS.map((lamp, i) => (
          <div
            key={i}
            className="vendr-lamp"
            style={{ position: "absolute", zIndex: 6, ...lamp.style }}
          />
        ))}

        {/* Beams — fan upward from apex */}
        <div
          aria-hidden="true"
          style={{ position: "absolute", left: "50%", top: "64%", transform: "translateX(-50%)", width: 0, height: 0, zIndex: 2 }}
        >
          {beamAngles.map((angle, i) => {
            const isWide = i % 3 === 0;
            const delay = `${i * 0.08}s`;
            return (
              <div
                key={i}
                className={`vendr-beam${isWide ? " wide" : ""}`}
                style={{
                  height: "75vh",
                  transform: `rotate(${angle}deg)`,
                  animation: isWide
                    ? `vendr-beam-in 1.8s cubic-bezier(.6,0,.25,1) ${delay} forwards, vendr-beam-glow 6s ease-in-out ${delay} infinite`
                    : `vendr-beam-in 1.6s cubic-bezier(.6,0,.25,1) ${delay} forwards, vendr-beam-pulse 4.5s ease-in-out ${delay} infinite`,
                }}
              />
            );
          })}
        </div>

        {/* Bloom at apex */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            left: "50%", top: "64%",
            width: 320, height: 320,
            transform: "translate(-50%,-50%)",
            background: "radial-gradient(circle, rgba(207,233,255,.6) 0%, rgba(101,34,99,.15) 35%, transparent 70%)",
            filter: "blur(22px)",
            zIndex: 2,
            mixBlendMode: "screen",
            animation: "vendr-bloom-pulse 4s ease-in-out infinite",
          }}
        />

        {/* Fog layers */}
        <div style={{ position: "absolute", inset: 0, zIndex: 3, pointerEvents: "none", mixBlendMode: "screen" }}>
          {FOG_LAYERS.map((fog, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: "-30%", right: "-30%",
                height: "60%",
                bottom: fog.bottom,
                background: fog.bg,
                filter: "blur(40px)",
                opacity: fog.opacity,
                animation: `vendr-fog-drift ${fog.duration} ease-in-out infinite alternate`,
                animationDelay: fog.delay,
              }}
            />
          ))}
        </div>

        {/* Silhouette (photographer) */}
        <svg
          viewBox="0 0 60 180"
          fill="none"
          aria-hidden="true"
          style={{
            position: "absolute",
            left: "50%", bottom: "18%",
            transform: "translateX(-50%)",
            zIndex: 5,
            width: 62, height: 180,
            filter: "drop-shadow(0 0 18px rgba(207,233,255,.18))",
          }}
        >
          <defs>
            <linearGradient id="vendr-sil-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#02021a" />
              <stop offset="100%" stopColor="#000010" />
            </linearGradient>
          </defs>
          <ellipse cx="30" cy="20" rx="9" ry="11" fill="url(#vendr-sil-grad)" />
          <path d="M14 38 C 18 30, 42 30, 46 38 L 48 92 L 12 92 Z" fill="url(#vendr-sil-grad)" />
          <path d="M16 92 L 22 170 L 30 170 L 32 92 Z" fill="url(#vendr-sil-grad)" />
          <path d="M28 92 L 30 170 L 38 170 L 44 92 Z" fill="url(#vendr-sil-grad)" />
          <path d="M46 42 L 52 78 L 48 88 L 44 78 Z" fill="url(#vendr-sil-grad)" />
          <rect x="46" y="86" width="12" height="8" rx="1" fill="url(#vendr-sil-grad)" />
          <path d="M14 38 C 18 30, 42 30, 46 38" stroke="rgba(207,233,255,.25)" strokeWidth=".6" fill="none" />
          <ellipse cx="30" cy="20" rx="9" ry="11" stroke="rgba(207,233,255,.15)" strokeWidth=".6" fill="none" />
        </svg>

        {/* Wet floor */}
        <div
          style={{
            position: "absolute", left: 0, right: 0, bottom: 0, height: "30%",
            zIndex: 4, pointerEvents: "none",
            background:
              "linear-gradient(180deg, transparent 0%, rgba(0,0,8,.85) 60%, #000005 100%), radial-gradient(ellipse at 50% 0%, rgba(207,233,255,.22), transparent 60%)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute", left: "50%", top: 0,
              transform: "translateX(-50%)",
              width: "65%", height: "100%",
              background: "radial-gradient(ellipse at 50% 0%, rgba(207,233,255,.35), rgba(101,34,99,.08) 35%, transparent 65%)",
              filter: "blur(18px)",
              mixBlendMode: "screen",
            }}
          />
        </div>

        {/* Particles canvas */}
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          style={{ position: "absolute", inset: 0, zIndex: 6, pointerEvents: "none" }}
        />
      </div>

      {/* ── UI Chrome ── */}
      {/* Corner brackets */}
      <div aria-hidden="true" style={{ position: "absolute", inset: 14, pointerEvents: "none", zIndex: 9 }}>
        {(
          [
            { top: -1, left: -1, borderRight: "0", borderBottom: "0" },
            { top: -1, right: -1, borderLeft: "0", borderBottom: "0" },
            { bottom: -1, left: -1, borderRight: "0", borderTop: "0" },
            { bottom: -1, right: -1, borderLeft: "0", borderTop: "0" },
          ] as React.CSSProperties[]
        ).map((style, i) => (
          <span
            key={i}
            style={{
              position: "absolute",
              width: 18, height: 18,
              border: "1px solid rgba(207,233,255,.35)",
              ...style,
            }}
          />
        ))}
      </div>

      {/* Inner frame */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute", inset: 14,
          border: "1px solid rgba(207,233,255,.07)",
          pointerEvents: "none", zIndex: 8,
        }}
      />

      {/* Camera meta top-right */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute", top: 24, right: 28, zIndex: 9,
          fontFamily: "var(--display)",
          fontSize: 10, letterSpacing: "0.4em",
          color: "rgba(207,233,255,.45)", textAlign: "right",
          lineHeight: 1.6,
        }}
      >
        SCENE 01<br />
        <span style={{ opacity: 0.5 }}>F2.8 · 24MM · ISO 800</span>
      </div>

      {/* REC tag bottom-left */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute", bottom: 24, left: 28, zIndex: 9,
          fontFamily: "var(--display)",
          fontSize: 10, letterSpacing: "0.4em",
          color: "rgba(207,233,255,.45)",
          display: "flex", alignItems: "center", gap: 10,
        }}
      >
        <span
          style={{
            display: "inline-block",
            width: 6, height: 6,
            borderRadius: "50%",
            background: "#ff3b3b",
            boxShadow: "0 0 8px #ff3b3b",
            animation: "vendr-blink 1.4s ease-in-out infinite",
          }}
        />
        REC · 00:04:21:18
      </div>

      {/* Label bottom-right */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute", bottom: 24, right: 28, zIndex: 9,
          fontFamily: "var(--display)",
          fontSize: 10, letterSpacing: "0.4em",
          color: "rgba(207,233,255,.25)",
        }}
      >
        WEBSITE HERO
      </div>
    </div>
  );
}
