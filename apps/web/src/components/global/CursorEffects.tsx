"use client";

import { useEffect } from "react";

const INTERACTIVE_SELECTOR =
  "a, button, [role='button'], summary, input, textarea, select, label";
const SEARCH_FOCUS_SELECTOR = "input, textarea, select";

export default function CursorEffects() {
  useEffect(() => {
    const finePointer = window.matchMedia("(pointer: fine)").matches;
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (!finePointer) {
      return;
    }

    document.body.classList.add("has-custom-cursor");
    if (reducedMotion) {
      return () => {
        document.body.classList.remove("has-custom-cursor");
        document.body.classList.remove("cursor-hover");
      };
    }

    const cursor = document.getElementById("app-cursor");
    const ring = document.getElementById("app-cursor-ring");
    if (!cursor || !ring) {
      return;
    }

    let pointerX = window.innerWidth / 2;
    let pointerY = window.innerHeight / 2;
    let ringX = pointerX;
    let ringY = pointerY;
    let frameId = 0;

    const setPointer = (x: number, y: number) => {
      pointerX = x;
      pointerY = y;
      cursor.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    };

    const onMouseMove = (event: MouseEvent) => {
      setPointer(event.clientX, event.clientY);
    };

    const onMouseLeave = () => {
      document.body.classList.remove("cursor-hover");
      cursor.style.opacity = "0";
      ring.style.opacity = "0";
    };

    const onMouseEnter = () => {
      cursor.style.opacity = "1";
      ring.style.opacity = "1";
    };

    const onPointerOver = (event: Event) => {
      if ((event.target as Element | null)?.closest(INTERACTIVE_SELECTOR)) {
        document.body.classList.add("cursor-hover");
      }
    };

    const onPointerOut = (event: Event) => {
      if ((event.target as Element | null)?.closest(INTERACTIVE_SELECTOR)) {
        document.body.classList.remove("cursor-hover");
      }
    };

    const onFocusIn = (event: FocusEvent) => {
      if ((event.target as Element | null)?.closest(SEARCH_FOCUS_SELECTOR)) {
        document.body.classList.add("csearch");
      }
    };

    const onFocusOut = (event: FocusEvent) => {
      if ((event.target as Element | null)?.closest(SEARCH_FOCUS_SELECTOR)) {
        document.body.classList.remove("csearch");
      }
    };

    const animateRing = () => {
      ringX += (pointerX - ringX) * 0.16;
      ringY += (pointerY - ringY) * 0.16;
      ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`;
      frameId = window.requestAnimationFrame(animateRing);
    };

    setPointer(pointerX, pointerY);
    ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`;
    frameId = window.requestAnimationFrame(animateRing);

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("mouseout", onMouseLeave);
    window.addEventListener("mouseover", onMouseEnter);
    document.addEventListener("mouseover", onPointerOver);
    document.addEventListener("mouseout", onPointerOut);
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseout", onMouseLeave);
      window.removeEventListener("mouseover", onMouseEnter);
      document.removeEventListener("mouseover", onPointerOver);
      document.removeEventListener("mouseout", onPointerOut);
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
      document.body.classList.remove("has-custom-cursor");
      document.body.classList.remove("cursor-hover");
      document.body.classList.remove("csearch");
    };
  }, []);

  return (
    <>
      <div aria-hidden="true" id="app-cursor" />
      <div aria-hidden="true" id="app-cursor-ring" />
    </>
  );
}
