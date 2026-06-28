"use client";

import { useEffect, useRef } from "react";
import { useScrollReveal } from "./useScrollReveal";

function scrollToJoinWithRole(role: "client" | "creative") {
  return (e: React.MouseEvent) => {
    e.preventDefault();
    window.dispatchEvent(new CustomEvent("vendr:select-role", { detail: role }));
    document.getElementById("join")?.scrollIntoView({ behavior: "smooth" });
  };
}

function useTilt(ref: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width  - 0.5;  // −0.5 → +0.5
      const y = (e.clientY - r.top)  / r.height - 0.5;
      const rx = -y * 12;
      const ry =  x * 12;
      el.style.setProperty("--rx", `${rx.toFixed(2)}deg`);
      el.style.setProperty("--ry", `${ry.toFixed(2)}deg`);
      el.style.boxShadow = `${(-ry * 2).toFixed(1)}px ${(rx * 2).toFixed(1)}px 48px rgba(0,0,0,.5)`;
      el.classList.remove("v-tilt-leave");
      el.classList.add("v-tilting");
    };

    const onLeave = () => {
      el.style.setProperty("--rx", "0deg");
      el.style.setProperty("--ry", "0deg");
      el.style.boxShadow = "";
      el.classList.remove("v-tilting");
      el.classList.add("v-tilt-leave");
    };

    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, [ref]);
}

export function VendrPromise() {
  const eyebrowRef = useScrollReveal<HTMLSpanElement>();
  const headRef = useScrollReveal<HTMLDivElement>();
  const card0Ref = useRef<HTMLElement>(null);
  const card1Ref = useRef<HTMLElement>(null);

  useTilt(card0Ref);
  useTilt(card1Ref);

  useEffect(() => {
    const card0 = card0Ref.current;
    const card1 = card1Ref.current;
    if (!card0 || !card1) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          card0.classList.add("vendr-visible");
          card1.classList.add("vendr-visible");
          obs.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );

    obs.observe(card0);
    return () => obs.disconnect();
  }, []);

  return (
    <section className="v-promise">
      <div className="v-container">
        <span className="v-eyebrow left vendr-reveal" ref={eyebrowRef}>
          02 · The promise
        </span>

        <div className="v-promise-head vendr-reveal d1" ref={headRef}>
          <h2>
            Two sides.<br />
            <span className="v-grad-text">One spotlight.</span>
          </h2>
          <p>
            Built in South Africa, for South Africa. Where verified portfolios and real
            contracts replace ghosting, surprise quotes, and chasing invoices.
          </p>
        </div>

        <div className="v-cards">
          {/* Client card */}
          <article className="v-card vendr-reveal from-left" ref={card0Ref}>
            <div className="v-idx">01</div>
            <div className="v-tag">For clients</div>
            <h3>
              Book with<br />
              certainty,<br />
              <span className="v-ital">not</span> faith.
            </h3>
            <p className="v-body">
              Browse verified portfolios. Book securely. Your payment is protected until
              the job is done. If they don&apos;t show, you get a full refund.
            </p>
            <ul>
              <li>Manually verified portfolios &amp; references</li>
              <li>Transparent rates — no surprise quotes</li>
              <li>Vendr-backed delivery guarantee</li>
              <li>One brief, multiple curated shortlists</li>
            </ul>
            <a
              href="#join"
              onClick={scrollToJoinWithRole("client")}
              className="v-btn-link"
            >
              Join as a client <span className="v-arr">→</span>
            </a>
          </article>

          {/* Creative card */}
          <article className="v-card rose vendr-reveal from-right d2" ref={card1Ref}>
            <div className="v-idx">02</div>
            <div className="v-tag">For creatives</div>
            <h3>
              Get booked.<br />
              Get paid.<br />
              <span className="v-ital">Get</span> respected.
            </h3>
            <p className="v-body">
              Your own profile. Your own rates. Paid within 48 hours. A verified badge
              that separates you from the noise. Merit, not followers.
            </p>
            <ul>
              <li>Verified profile &amp; protected portfolio rights</li>
              <li>Briefs matched to your style, rate &amp; city</li>
              <li>Contracts, milestones &amp; escrow — handled</li>
              <li>Community of South Africa&apos;s working creatives</li>
            </ul>
            <a
              href="#join"
              onClick={scrollToJoinWithRole("creative")}
              className="v-btn-link"
            >
              Join as a creative <span className="v-arr">→</span>
            </a>
          </article>
        </div>
      </div>
    </section>
  );
}
