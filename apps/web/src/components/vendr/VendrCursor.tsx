"use client";

import { useEffect, useRef, useState } from "react";

export function VendrCursor() {
  const ringRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    let tx = window.innerWidth / 2;
    let ty = window.innerHeight / 2;
    let x = tx, y = ty;
    let rafId: number;

    const onMove = (e: MouseEvent) => {
      tx = e.clientX;
      ty = e.clientY;
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${tx}px,${ty}px) translate(-50%,-50%)`;
      }
    };

    const tick = () => {
      x += (tx - x) * 0.18;
      y += (ty - y) * 0.18;
      if (ringRef.current) {
        ringRef.current.style.transform = `translate(${x}px,${y}px) translate(-50%,-50%)`;
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    window.addEventListener("mousemove", onMove, { passive: true });

    const enter = () => setHovered(true);
    const leave = () => setHovered(false);
    const targets = document.querySelectorAll(
      "a, button, .vendr-card, .vendr-why-item, .vendr-tile"
    );
    targets.forEach((el) => {
      el.addEventListener("mouseenter", enter);
      el.addEventListener("mouseleave", leave);
    });

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", onMove);
      targets.forEach((el) => {
        el.removeEventListener("mouseenter", enter);
        el.removeEventListener("mouseleave", leave);
      });
    };
  }, []);

  return (
    <>
      {/* Lagging ring */}
      <div
        ref={ringRef}
        aria-hidden="true"
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          pointerEvents: "none",
          zIndex: 9999,
          mixBlendMode: "difference",
          width: hovered ? 62 : 34,
          height: hovered ? 62 : 34,
          border: `1px solid ${hovered ? "rgba(207,233,255,.9)" : "rgba(207,233,255,.45)"}`,
          borderRadius: "50%",
          background: hovered ? "rgba(207,233,255,.08)" : "transparent",
          transition:
            "width .25s ease, height .25s ease, border-color .25s ease, background .25s ease",
        }}
      />
      {/* Instant dot */}
      <div
        ref={dotRef}
        aria-hidden="true"
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          pointerEvents: "none",
          zIndex: 9999,
          mixBlendMode: "difference",
          width: 5,
          height: 5,
          background: "#cfe9ff",
          borderRadius: "50%",
        }}
      />
    </>
  );
}
