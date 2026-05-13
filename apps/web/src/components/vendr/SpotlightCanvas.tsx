"use client";

import { useEffect, useRef } from "react";

export function SpotlightCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let W = 0, H = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let mx = 0, my = 0, t = 0;

    const resize = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      mx = W / 2;
      my = H * 0.4;
    };
    resize();

    const onMouseMove = (e: MouseEvent) => { mx = e.clientX; my = e.clientY; };
    window.addEventListener("resize", resize, { passive: true });
    window.addEventListener("mousemove", onMouseMove, { passive: true });

    const frame = () => {
      t += 0.005;
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = "lighter";

      // Primary soft bloom — drifts with slow sine + follows mouse subtly
      const cx = W / 2 + Math.sin(t) * 60 + (mx - W / 2) * 0.05;
      const cy = H * 0.4 + Math.cos(t * 0.7) * 40 + (my - H / 2) * 0.05;
      const g1 = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(W, H) * 0.55);
      g1.addColorStop(0, "rgba(207,233,255,.10)");
      g1.addColorStop(0.35, "rgba(101,34,99,.05)");
      g1.addColorStop(1, "rgba(0,0,15,0)");
      ctx.fillStyle = g1;
      ctx.fillRect(0, 0, W, H);

      // Secondary violet bloom — fixed lower-right
      const cx2 = W * 0.78 + Math.sin(t * 1.3) * 40;
      const cy2 = H * 0.7 + Math.cos(t * 0.9) * 30;
      const g2 = ctx.createRadialGradient(cx2, cy2, 0, cx2, cy2, Math.max(W, H) * 0.3);
      g2.addColorStop(0, "rgba(181,139,214,.08)");
      g2.addColorStop(1, "rgba(0,0,15,0)");
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, W, H);

      rafRef.current = requestAnimationFrame(frame);
    };
    rafRef.current = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 1 }}
    />
  );
}
