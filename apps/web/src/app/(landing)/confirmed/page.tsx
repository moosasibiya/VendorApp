"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";

// ─── Countdown ────────────────────────────────────────────────────────────────
const LAUNCH = new Date("2026-07-01T00:00:00+02:00").getTime();

function useCountdown() {
  const [t, setT] = useState({ d: "00", h: "00", m: "00", s: "00" });
  useEffect(() => {
    const tick = () => {
      let diff = Math.max(0, LAUNCH - Date.now());
      const d = Math.floor(diff / 86400000); diff -= d * 86400000;
      const h = Math.floor(diff / 3600000);  diff -= h * 3600000;
      const m = Math.floor(diff / 60000);    diff -= m * 60000;
      const s = Math.floor(diff / 1000);
      const p = (n: number) => String(n).padStart(2, "0");
      setT({ d: p(d), h: p(h), m: p(m), s: p(s) });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return t;
}

// ─── Copy button ──────────────────────────────────────────────────────────────
function CopyBtn({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1900);
    });
  };
  return (
    <button
      type="button"
      onClick={copy}
      style={{
        flexShrink: 0, whiteSpace: "nowrap",
        padding: "9px 18px", borderRadius: 999,
        border: `1px solid ${copied ? "rgba(74,222,128,.35)" : "rgba(207,233,255,.18)"}`,
        background: copied ? "rgba(74,222,128,.06)" : "transparent",
        fontFamily: "var(--display)", fontWeight: 400,
        fontSize: 9.5, letterSpacing: "0.3em", textTransform: "uppercase",
        color: copied ? "#4ade80" : "rgba(207,233,255,.62)",
        cursor: "pointer",
        display: "inline-flex", alignItems: "center", gap: 8,
        transition: "color .35s, background .35s, border-color .35s",
      }}
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {copied
          ? <polyline points="20 6 9 17 4 12" />
          : <><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></>}
      </svg>
      {copied ? "Copied" : label}
    </button>
  );
}

// ─── Serif accent ─────────────────────────────────────────────────────────────
function Ser({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <em style={{ fontFamily: "'DM Serif Display', serif", fontStyle: "italic", fontWeight: 400, letterSpacing: 0, ...style }}>
      {children}
    </em>
  );
}

// ─── Main content ─────────────────────────────────────────────────────────────
function ConfirmedContent() {
  const params = useSearchParams();
  const firstName = (params.get("name") ?? "").trim();
  const code      = params.get("code") ?? "";
  const rawLink   = params.get("link") ?? "";
  const pos       = Math.max(1, parseInt(params.get("num") ?? "47", 10));
  const total     = 500;
  const pct       = Math.min(100, Math.max(4, (pos / total) * 100));
  const inviteLink = rawLink || `vendr.studio/join?ref=${code}`;

  const { d, h, m, s } = useCountdown();

  // refs for animated elements
  const beamsRef  = useRef<HTMLDivElement>(null);
  const bloomRef  = useRef<HTMLDivElement>(null);
  const pfillRef  = useRef<HTMLDivElement>(null);
  const pmarkRef  = useRef<HTMLDivElement>(null);
  const ptrackRef = useRef<HTMLDivElement>(null);
  const motesRef  = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const dotRef    = useRef<HTMLDivElement>(null);

  // Load DM Serif Display
  useEffect(() => {
    if (document.getElementById("vc-serif-font")) return;
    const l = document.createElement("link");
    l.id = "vc-serif-font"; l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&display=swap";
    document.head.appendChild(l);
  }, []);

  // Build beams
  useEffect(() => {
    const host = beamsRef.current;
    if (!host || host.children.length) return;
    const N = 13, WIDE = 7, fan = 150;
    for (let i = 0; i < N; i++) {
      const t = i / (N - 1) - 0.5;
      const b = document.createElement("span");
      b.className = "vc-beam";
      b.style.transform = `rotate(${t * fan}deg)`;
      b.style.animationDelay = i * 0.12 + "s";
      host.appendChild(b);
    }
    for (let i = 0; i < WIDE; i++) {
      const t = i / (WIDE - 1) - 0.5;
      const b = document.createElement("span");
      b.className = "vc-beam vc-beam-wide";
      b.style.transform = `rotate(${t * fan * 0.85}deg)`;
      host.appendChild(b);
    }
    requestAnimationFrame(() => {
      host.classList.add("vc-lit");
      bloomRef.current?.classList.add("vc-lit");
    });
  }, []);

  // Spawn motes
  useEffect(() => {
    const host = motesRef.current;
    if (!host || host.children.length) return;
    for (let i = 0; i < 28; i++) {
      const s = document.createElement("span");
      const dur = 11 + Math.random() * 16;
      s.style.cssText = `
        position:absolute; bottom:-20px; border-radius:50%;
        background:#b58bd6; box-shadow:0 0 10px #b58bd6;
        mix-blend-mode:screen;
        width:${2 + Math.random() * 2.5}px; height:${2 + Math.random() * 2.5}px;
        left:${Math.random() * 100}vw;
        animation: vc-rise ${dur}s linear ${-Math.random() * dur}s infinite;
        --drift:${Math.random() * 80 - 40}px;
      `;
      host.appendChild(s);
    }
  }, []);

  // Progress bar animate in
  useEffect(() => {
    const id = setTimeout(() => {
      if (pfillRef.current)  pfillRef.current.style.width  = pct + "%";
      if (pmarkRef.current)  pmarkRef.current.style.left   = pct + "%";
      if (ptrackRef.current) ptrackRef.current.classList.add("vc-filled");
    }, 800);
    return () => clearTimeout(id);
  }, [pct]);

  // Scroll reveal
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-vc-reveal]"));
    const check = () => {
      const vh = window.innerHeight;
      els.forEach(el => {
        if (el.dataset.vcIn) return;
        const r = el.getBoundingClientRect();
        if (r.top < vh * 0.92 && r.bottom > 0) {
          const sibs = Array.from(el.parentElement!.querySelectorAll<HTMLElement>(":scope > [data-vc-reveal]"));
          const idx = sibs.indexOf(el);
          el.style.animationDelay = (idx >= 0 ? idx * 0.09 : 0) + "s";
          el.classList.add("vc-reveal-in");
          el.dataset.vcIn = "1";
        }
      });
    };
    check();
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    const fallback = setTimeout(() => els.forEach(el => { el.classList.add("vc-reveal-in"); el.dataset.vcIn = "1"; }), 2600);
    return () => { window.removeEventListener("scroll", check); window.removeEventListener("resize", check); clearTimeout(fallback); };
  }, []);

  // Custom cursor
  useEffect(() => {
    const cur = cursorRef.current;
    const dot = dotRef.current;
    if (!cur || !dot) return;
    let tx = innerWidth / 2, ty = innerHeight / 2, cx = tx, cy = ty;
    let raf: number;
    const onMove = (e: MouseEvent) => { tx = e.clientX; ty = e.clientY; };
    const loop = () => {
      cx += (tx - cx) * 0.18; cy += (ty - cy) * 0.18;
      cur.style.transform = `translate(${cx}px,${cy}px) translate(-50%,-50%)`;
      dot.style.transform = `translate(${tx}px,${ty}px) translate(-50%,-50%)`;
      raf = requestAnimationFrame(loop);
    };
    window.addEventListener("mousemove", onMove);
    raf = requestAnimationFrame(loop);
    const addHot = () => cur.classList.add("vc-cursor-hot");
    const remHot = () => cur.classList.remove("vc-cursor-hot");
    document.querySelectorAll("a,button").forEach(el => {
      el.addEventListener("mouseenter", addHot);
      el.addEventListener("mouseleave", remHot);
    });
    return () => { window.removeEventListener("mousemove", onMove); cancelAnimationFrame(raf); };
  }, []);

  return (
    <>
      <style>{`
        @keyframes vc-rise {
          0%   { transform:translateY(0) translateX(0); opacity:0; }
          10%  { opacity:0.8; }
          90%  { opacity:0.45; }
          100% { transform:translateY(-118vh) translateX(var(--drift,20px)); opacity:0; }
        }
        @keyframes vc-beamPulse { 0%,100%{opacity:.85} 50%{opacity:.45} }
        @keyframes vc-sealRing  { 0%,100%{transform:scale(1);opacity:.5} 50%{transform:scale(1.08);opacity:.15} }
        @keyframes vc-shimmer   { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }
        @keyframes vc-gemGlow   { 0%,100%{opacity:1;box-shadow:0 0 10px #652263} 50%{opacity:.5;box-shadow:0 0 4px #652263} }
        @keyframes vc-revealIn  { from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:none} }

        [data-vc-reveal] { opacity:0; transform:translateY(22px); }
        [data-vc-reveal].vc-reveal-in { animation: vc-revealIn 1.1s cubic-bezier(.2,.8,.2,1) both; }
        @media (prefers-reduced-motion:reduce) { [data-vc-reveal] { opacity:1;transform:none; } [data-vc-reveal].vc-reveal-in { animation:none; } }

        .vc-beam {
          position:absolute; left:0; top:0; width:1px; height:150vh;
          transform-origin:50% 0%;
          background:linear-gradient(to bottom, rgba(181,139,214,.5) 0%, rgba(181,139,214,.16) 32%, transparent 72%);
          filter:blur(.5px); border-radius:0 0 50% 50%/0 0 6% 6%;
          animation:vc-beamPulse 6s ease-in-out infinite;
        }
        .vc-beam-wide {
          width:18px;
          background:linear-gradient(to bottom, rgba(101,34,99,.34) 0%, transparent 62%);
          filter:blur(14px); opacity:.85;
        }
        .vc-beams { position:absolute; left:50%; top:-10vh; width:1px; height:1px; mix-blend-mode:screen; opacity:0; transition:opacity 2s cubic-bezier(.2,.8,.2,1); }
        .vc-beams.vc-lit { opacity:1; }

        .vc-bloom { opacity:0; transition:opacity 1.8s ease-out; }
        .vc-bloom.vc-lit { opacity:.9; }

        .vc-ptrack .vc-pfill { transition:width 1.6s cubic-bezier(.2,.8,.2,1); }
        .vc-ptrack .vc-pmark { opacity:0; transition:opacity .6s ease 1.4s, left 1.6s cubic-bezier(.2,.8,.2,1); }
        .vc-ptrack.vc-filled .vc-pmark { opacity:1; }

        .vc-cursor { position:fixed;top:0;left:0;pointer-events:none;z-index:200;width:30px;height:30px;border:1px solid rgba(207,233,255,.5);border-radius:50%;mix-blend-mode:difference;transition:width .3s cubic-bezier(.2,.8,.2,1),height .3s,border-color .3s; }
        .vc-cursor.vc-cursor-hot { width:56px;height:56px;border-color:#b58bd6; }
        .vc-cursor-dot { position:fixed;top:0;left:0;pointer-events:none;z-index:200;width:4px;height:4px;background:#cfe9ff;border-radius:50%; }
        @media (hover:none),(pointer:coarse) { .vc-cursor,.vc-cursor-dot{display:none!important} }

        .vc-step { transition:border-color .5s,transform .5s cubic-bezier(.2,.8,.2,1); }
        .vc-step::after { content:"";position:absolute;inset:0;background:radial-gradient(60% 80% at 0% 0%,rgba(181,139,214,0),transparent 60%);transition:background .5s;pointer-events:none; }
        .vc-step:hover { border-color:rgba(207,233,255,.18)!important;transform:translateY(-3px); }
        .vc-step:hover::after { background:radial-gradient(60% 80% at 0% 0%,rgba(181,139,214,.12),transparent 60%); }

        .vc-copy-btn { transition:color .35s,background .35s,border-color .35s; }
        .vc-copy-btn:hover { color:#cfe9ff!important;border-color:rgba(207,233,255,.18)!important;background:rgba(207,233,255,.04)!important; }
        .vc-soc { transition:color .35s,border-color .35s,background .35s; }
        .vc-soc:hover { color:#cfe9ff!important;border-color:rgba(207,233,255,.18)!important;background:rgba(207,233,255,.04)!important; }
        .vc-nav-pill { transition:color .4s,border-color .4s,background .4s; }
        .vc-nav-pill:hover { color:#cfe9ff!important;border-color:rgba(207,233,255,.18)!important;background:rgba(207,233,255,.03)!important; }
        footer a { transition:color .4s; }
        footer a:hover { color:#cfe9ff!important; }
      `}</style>

      {/* Custom cursor */}
      <div ref={cursorRef} className="vc-cursor" />
      <div ref={dotRef}    className="vc-cursor-dot" />

      {/* Scene */}
      <div aria-hidden="true" style={{ position:"fixed", inset:0, overflow:"hidden", zIndex:0, pointerEvents:"none" }}>
        {/* Gradients */}
        <div style={{
          position:"absolute", inset:"-10%",
          background:
            "radial-gradient(60% 50% at 50% 0%, rgba(101,34,99,.30) 0%, transparent 60%), " +
            "radial-gradient(70% 55% at 50% 110%, rgba(31,45,107,.30) 0%, transparent 70%), " +
            "linear-gradient(180deg, #00001e 0%, #000005 100%)",
        }} />
        <div style={{
          position:"absolute", inset:0,
          background:"radial-gradient(130% 100% at 50% 30%, transparent 40%, rgba(0,0,5,.7) 95%)",
        }} />
        {/* Beams */}
        <div ref={beamsRef} className="vc-beams" />
        {/* Bloom */}
        <div ref={bloomRef} className="vc-bloom" style={{
          position:"absolute", left:"50%", top:"-8vh",
          width:"80vmin", height:"70vmin", transform:"translateX(-50%)",
          background:"radial-gradient(circle at 50% 30%, rgba(181,139,214,.22) 0%, rgba(101,34,99,.10) 40%, transparent 70%)",
          filter:"blur(24px)",
        }} />
        {/* Motes */}
        <div ref={motesRef} style={{ position:"absolute", inset:0 }} />
        {/* Scanlines */}
        <div style={{
          position:"absolute", inset:0, mixBlendMode:"multiply", opacity:.5,
          backgroundImage:"repeating-linear-gradient(to bottom, transparent 0px, transparent 2px, rgba(0,0,30,.16) 3px, transparent 4px)",
        }} />
        {/* Grain */}
        <div style={{
          position:"absolute", inset:0, mixBlendMode:"overlay", opacity:.55,
          backgroundImage:`url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.10 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")`,
        }} />
      </div>

      <div style={{ position:"relative", zIndex:1, minHeight:"100vh", color:"#cfe9ff", fontFamily:"var(--body, 'Aileron', system-ui, sans-serif)", fontWeight:300, overflowX:"hidden" }}>

        {/* Nav */}
        <nav style={{
          position:"sticky", top:0, zIndex:60,
          padding:"16px clamp(20px,5vw,56px)",
          display:"flex", alignItems:"center", justifyContent:"space-between",
          background:"rgba(0,0,15,.55)",
          backdropFilter:"blur(16px)", WebkitBackdropFilter:"blur(16px)",
          borderBottom:"1px solid rgba(207,233,255,.09)",
        }}>
          <Link href="/" style={{
            fontFamily:"var(--display)", fontWeight:300, fontSize:"clamp(13px,2.2vw,16px)",
            letterSpacing:"0.36em", textTransform:"uppercase", color:"#cfe9ff", textDecoration:"none",
          }}>
            VENDR<span style={{ color:"#b58bd6" }}>.</span>STUDIO
          </Link>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <Link href="/#signup" className="vc-nav-pill" style={{
              display:"inline-flex", alignItems:"center", gap:8,
              fontFamily:"var(--display)", fontWeight:400, fontSize:10, letterSpacing:"0.3em",
              textTransform:"uppercase", color:"#cfe9ff", textDecoration:"none",
              padding:"9px 16px", borderRadius:999,
              background:"linear-gradient(135deg, #1f2d6b, #652263)", border:"none",
            }}>
              <svg width="12" height="10" viewBox="0 0 12 10" fill="none" aria-hidden="true">
                <path d="M11 5H1M5 1L1 5L5 9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Sign up
            </Link>
            <Link href="/" className="vc-nav-pill" style={{
              display:"inline-flex", alignItems:"center", gap:8,
              fontFamily:"var(--display)", fontWeight:400, fontSize:10, letterSpacing:"0.3em",
              textTransform:"uppercase", color:"rgba(207,233,255,.45)", textDecoration:"none",
              padding:"9px 16px", border:"1px solid rgba(207,233,255,.18)", borderRadius:999,
            }}>
              Home
            </Link>
          </div>
        </nav>

        {/* Hero */}
        <section style={{
          position:"relative", zIndex:2,
          padding:"clamp(56px,9vw,110px) clamp(20px,5vw,60px) clamp(36px,6vw,70px)",
          display:"flex", flexDirection:"column", alignItems:"center", textAlign:"center",
        }}>
          {/* Seal mark */}
          <div data-vc-reveal className="vc-reveal" style={{
            position:"relative", width:84, height:84, borderRadius:"50%",
            display:"flex", alignItems:"center", justifyContent:"center", marginBottom:30,
            background:"radial-gradient(circle at 38% 34%, rgba(207,233,255,.30), rgba(101,34,99,.22))",
            border:"1px solid rgba(207,233,255,.32)",
            boxShadow:"0 0 70px rgba(181,139,214,.32), 0 0 26px rgba(101,34,99,.4), inset 0 1px 0 rgba(255,255,255,.12)",
          }}>
            <div style={{
              position:"absolute", inset:-7, borderRadius:"50%",
              border:"1px solid rgba(207,233,255,.12)",
              animation:"vc-sealRing 3.4s ease-in-out infinite",
            }} />
            <svg width="32" height="24" viewBox="0 0 32 24" fill="none" aria-hidden="true" style={{ position:"relative", zIndex:2 }}>
              <path d="M2 13 L11 21 L30 3" stroke="#CFE9FF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          {/* Kicker */}
          <div data-vc-reveal style={{
            display:"inline-flex", alignItems:"center", gap:14, marginBottom:24,
            fontSize:10.5, letterSpacing:"0.46em", textTransform:"uppercase", color:"rgba(207,233,255,.66)",
          }}>
            <span style={{ width:34, height:1, background:"linear-gradient(90deg, transparent, rgba(207,233,255,.32), transparent)", display:"inline-block" }} />
            <span style={{ width:6, height:6, borderRadius:"50%", background:"linear-gradient(135deg,#652263,#cfe9ff)", boxShadow:"0 0 9px rgba(207,233,255,.55)", display:"inline-block" }} />
            Founding member
            <span style={{ width:6, height:6, borderRadius:"50%", background:"linear-gradient(135deg,#652263,#cfe9ff)", boxShadow:"0 0 9px rgba(207,233,255,.55)", display:"inline-block" }} />
            <span style={{ width:34, height:1, background:"linear-gradient(90deg, transparent, rgba(207,233,255,.32), transparent)", display:"inline-block" }} />
          </div>

          {/* Headline */}
          <h1 data-vc-reveal style={{
            margin:0, maxWidth:"16ch",
            fontFamily:"var(--display)", fontWeight:300,
            fontSize:"clamp(40px,8vw,104px)", lineHeight:0.95,
            letterSpacing:"-0.03em", textTransform:"uppercase", color:"#cfe9ff",
          }}>
            {firstName ? <>{firstName},</> : null}{" "}
            {firstName ? "you're " : "You're "}
            <Ser>in the spotlight.</Ser>
          </h1>

          {/* Subtitle */}
          <p data-vc-reveal style={{
            margin:"26px auto 0", maxWidth:"46ch",
            fontSize:"clamp(14px,2vw,18px)", lineHeight:1.7,
            color:"rgba(207,233,255,.66)", letterSpacing:"0.015em",
          }}>
            Your seat is held. We open the doors on{" "}
            <strong style={{ color:"#cfe9ff", fontWeight:400 }}>01 July 2026</strong>{" "}
            — and you&apos;ll be among the first through them. Share your link; every referral moves you up the founding list.
          </p>

          {/* Position strip */}
          <div data-vc-reveal style={{
            marginTop:34, width:"100%", maxWidth:460,
            border:"1px solid rgba(207,233,255,.09)", borderRadius:14,
            background:"rgba(4,6,28,.72)", backdropFilter:"blur(14px)",
            padding:"18px 22px 20px", textAlign:"left",
          }}>
            <div style={{ display:"flex", alignItems:"baseline", justifyContent:"space-between", gap:12 }}>
              <div>
                <div style={{ fontSize:9, letterSpacing:"0.42em", textTransform:"uppercase", color:"rgba(207,233,255,.32)", marginBottom:6 }}>
                  Your founding position
                </div>
                <div style={{ fontFamily:"var(--display)", fontWeight:300, fontSize:30, letterSpacing:"-0.01em", color:"#cfe9ff", lineHeight:1 }}>
                  <span style={{ color:"#b58bd6", marginRight:2 }}>#</span>
                  {String(pos).padStart(3, "0")}
                </div>
              </div>
              <div style={{ fontSize:11, letterSpacing:"0.16em", textTransform:"uppercase", color:"rgba(207,233,255,.45)", textAlign:"right" }}>
                of {total.toLocaleString("en-US")}<br />founding seats
              </div>
            </div>

            {/* Progress track */}
            <div ref={ptrackRef} className="vc-ptrack" style={{
              position:"relative", marginTop:16, height:4, borderRadius:999,
              background:"rgba(207,233,255,.07)", overflow:"visible",
            }}>
              <div ref={pfillRef} className="vc-pfill" style={{
                position:"absolute", inset:0, width:"0%", borderRadius:"inherit",
                background:"linear-gradient(90deg, #1f2d6b, #b58bd6)",
                boxShadow:"0 0 16px rgba(181,139,214,.4)",
              }} />
              <div ref={pmarkRef} className="vc-pmark" style={{
                position:"absolute", top:"50%", transform:"translate(-50%,-50%)", left:"0%",
                width:9, height:9, borderRadius:"50%", background:"#cfe9ff",
                boxShadow:"0 0 0 3px rgba(0,0,20,.9), 0 0 14px #b58bd6",
              }} />
            </div>

            <div style={{ marginTop:12, fontSize:11, letterSpacing:"0.04em", color:"rgba(207,233,255,.45)" }}>
              Top 25 unlock the <Ser style={{ color:"#b58bd6" }}>founders&apos; badge.</Ser> Keep climbing.
            </div>
          </div>
        </section>

        {/* Referral card */}
        <section style={{
          position:"relative", zIndex:2,
          padding:"0 clamp(20px,5vw,60px)",
          display:"flex", flexDirection:"column", alignItems:"center",
        }}>
          <div data-vc-reveal style={{
            width:"100%", maxWidth:560,
            marginTop:"clamp(40px,6vw,64px)",
            border:"1px solid rgba(207,233,255,.09)", borderRadius:16,
            background:"rgba(4,6,28,.72)", backdropFilter:"blur(20px)",
            overflow:"hidden",
            boxShadow:"0 30px 70px -28px rgba(0,0,0,.8), 0 10px 30px -14px rgba(101,34,99,.3)",
          }}>
            {/* Header */}
            <div style={{
              padding:"18px 26px", borderBottom:"1px solid rgba(207,233,255,.09)",
              background:"linear-gradient(135deg, rgba(31,45,107,.24), rgba(101,34,99,.16))",
              display:"flex", alignItems:"center", gap:12,
            }}>
              <span style={{ width:8, height:8, borderRadius:"50%", background:"linear-gradient(135deg,#652263,#cfe9ff)", boxShadow:"0 0 10px rgba(207,233,255,.5)", display:"inline-block" }} />
              <span style={{ fontSize:10, letterSpacing:"0.42em", textTransform:"uppercase", color:"rgba(207,233,255,.45)", flex:1 }}>Your referral details</span>
              <span style={{ fontSize:9, letterSpacing:"0.34em", textTransform:"uppercase", color:"rgba(207,233,255,.32)" }}>Founding · Vol.01</span>
            </div>

            {/* Code row */}
            {code && (
              <div style={{
                padding:"20px 26px", borderBottom:"1px solid rgba(207,233,255,.09)",
                display:"flex", alignItems:"center", justifyContent:"space-between", gap:16,
              }}>
                <div style={{ minWidth:0, flex:1 }}>
                  <div style={{ fontSize:9, letterSpacing:"0.42em", textTransform:"uppercase", color:"rgba(207,233,255,.32)", marginBottom:8 }}>Your code</div>
                  <div style={{ fontFamily:"var(--display)", fontWeight:300, fontSize:23, letterSpacing:"0.2em", color:"#cfe9ff" }}>{code}</div>
                </div>
                <CopyBtn text={code} />
              </div>
            )}

            {/* Link row */}
            <div style={{
              padding:"20px 26px",
              display:"flex", alignItems:"center", justifyContent:"space-between", gap:16,
            }}>
              <div style={{ minWidth:0, flex:1 }}>
                <div style={{ fontSize:9, letterSpacing:"0.42em", textTransform:"uppercase", color:"rgba(207,233,255,.32)", marginBottom:8 }}>Invite link</div>
                <div style={{ fontSize:13, color:"rgba(207,233,255,.62)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{inviteLink}</div>
              </div>
              <CopyBtn text={inviteLink} label="Copy link" />
            </div>

            {/* Share strip */}
            <div style={{
              padding:"16px 26px", borderTop:"1px solid rgba(207,233,255,.09)",
              background:"rgba(207,233,255,.02)",
              display:"flex", alignItems:"center", gap:10, flexWrap:"wrap",
            }}>
              <span style={{ flex:1, minWidth:110, fontSize:9, letterSpacing:"0.34em", textTransform:"uppercase", color:"rgba(207,233,255,.32)" }}>
                <Ser>Share</Ser> &amp; move up
              </span>
              {[
                { label:"Instagram", href:"https://instagram.com/vendr.studio" },
                { label:"TikTok",    href:"https://tiktok.com/@vendr.studio" },
              ].map(({ label, href }) => (
                <a key={label} href={href} target="_blank" rel="noreferrer" className="vc-soc" style={{
                  padding:"8px 16px", border:"1px solid rgba(207,233,255,.18)", borderRadius:999,
                  fontSize:9.5, letterSpacing:"0.28em", textTransform:"uppercase",
                  color:"rgba(207,233,255,.62)", textDecoration:"none",
                }}>
                  {label}
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* What happens next */}
        <section style={{
          position:"relative", zIndex:2,
          padding:"0 clamp(20px,5vw,60px)",
          marginTop:"clamp(60px,9vw,110px)",
          display:"flex", flexDirection:"column", alignItems:"center",
        }}>
          <div data-vc-reveal style={{
            width:"100%", maxWidth:560, height:1,
            background:"linear-gradient(90deg, transparent, rgba(207,233,255,.18), transparent)",
            marginBottom:"clamp(40px,6vw,64px)",
          }} />

          <div data-vc-reveal style={{
            display:"flex", alignItems:"center", gap:14,
            fontSize:10.5, letterSpacing:"0.44em", textTransform:"uppercase", color:"rgba(207,233,255,.45)",
          }}>
            <span style={{ width:28, height:1, background:"rgba(207,233,255,.32)", display:"inline-block" }} />
            What happens next
            <span style={{ width:28, height:1, background:"rgba(207,233,255,.32)", display:"inline-block" }} />
          </div>

          <div style={{
            marginTop:38, display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(210px,1fr))",
            gap:"clamp(14px,2.4vw,22px)", width:"100%", maxWidth:820,
          }}>
            {[
              { n:"01", t:"Follow us",      b:<>Stay close to <Ser>@vendr.studio</Ser> on Instagram and TikTok — early access details drop there first.</> },
              { n:"02", t:"Refer a friend", b:<>Share your invite link. Every referral moves you up the founding list and unlocks extra perks.</> },
              { n:"03", t:"Get verified",   b:<>We open the platform on <Ser>01 July 2026.</Ser> You&apos;ll be among the first through the door.</> },
            ].map(({ n, t, b }) => (
              <div key={n} data-vc-reveal className="vc-step" style={{
                position:"relative", padding:"28px 24px 26px",
                border:"1px solid rgba(207,233,255,.09)", borderRadius:14,
                background:"rgba(4,6,28,.5)", overflow:"hidden",
              }}>
                <div style={{
                  fontSize:9, letterSpacing:"0.5em", textTransform:"uppercase", color:"#b58bd6",
                  marginBottom:18, display:"flex", alignItems:"center", gap:10,
                }}>
                  <span style={{ width:5, height:5, borderRadius:"50%", background:"#b58bd6", boxShadow:"0 0 8px #b58bd6", display:"inline-block" }} />
                  {n}
                </div>
                <h3 style={{
                  margin:"0 0 12px", fontFamily:"var(--display)", fontWeight:400,
                  fontSize:"clamp(16px,2vw,20px)", letterSpacing:"0.01em",
                  textTransform:"uppercase", color:"#cfe9ff",
                }}>{t}</h3>
                <p style={{ margin:0, fontSize:13.5, lineHeight:1.68, color:"rgba(207,233,255,.45)" }}>{b}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Countdown */}
        <section style={{
          position:"relative", zIndex:2,
          marginTop:"clamp(64px,10vw,120px)",
          padding:"clamp(40px,6vw,72px) clamp(20px,5vw,60px)",
          background:"linear-gradient(135deg, rgba(31,45,107,.16), rgba(101,34,99,.13))",
          borderTop:"1px solid rgba(207,233,255,.09)",
          borderBottom:"1px solid rgba(207,233,255,.09)",
          display:"flex", flexDirection:"column", alignItems:"center",
        }}>
          <div data-vc-reveal style={{ fontSize:10, letterSpacing:"0.5em", textTransform:"uppercase", color:"rgba(207,233,255,.45)", marginBottom:26 }}>
            The doors open in
          </div>

          <div data-vc-reveal style={{ display:"flex", alignItems:"flex-start", gap:"clamp(14px,4vw,40px)" }}>
            {[
              { val: d, lbl:"Days" },
              { val: h, lbl:"Hours" },
              { val: m, lbl:"Mins" },
              { val: s, lbl:"Secs" },
            ].map(({ val, lbl }, i) => (
              <>
                {i > 0 && (
                  <span key={`colon-${i}`} style={{
                    fontFamily:"var(--display)", fontWeight:300,
                    fontSize:"clamp(30px,6vw,64px)", lineHeight:1,
                    color:"rgba(207,233,255,.32)", alignSelf:"flex-start",
                    marginTop:"clamp(2px,1vw,8px)",
                  }}>:</span>
                )}
                <div key={lbl} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:10 }}>
                  <span style={{
                    fontFamily:"var(--display)", fontWeight:300,
                    fontSize:"clamp(40px,9vw,88px)", lineHeight:0.9,
                    letterSpacing:"-0.02em", color:"#cfe9ff",
                    fontVariantNumeric:"tabular-nums",
                    textShadow:"0 0 40px rgba(181,139,214,.25)",
                  }}>{val}</span>
                  <span style={{ fontSize:9, letterSpacing:"0.4em", textTransform:"uppercase", color:"rgba(207,233,255,.32)" }}>{lbl}</span>
                </div>
              </>
            ))}
          </div>

          <div data-vc-reveal style={{ marginTop:30, display:"flex", alignItems:"center", gap:10 }}>
            <span style={{
              width:6, height:6, borderRadius:"50%", background:"#652263",
              boxShadow:"0 0 10px #652263", display:"inline-block",
              animation:"vc-gemGlow 2s ease-in-out infinite",
            }} />
            <span style={{ fontSize:10, letterSpacing:"0.34em", textTransform:"uppercase", color:"rgba(207,233,255,.45)" }}>
              Platform launches <strong style={{ color:"#cfe9ff", fontWeight:400 }}>01 July 2026</strong> · you&apos;re on the founding list
            </span>
          </div>
        </section>

        {/* Footer */}
        <footer style={{
          position:"relative", zIndex:2,
          padding:"clamp(28px,4vw,46px) clamp(20px,5vw,56px)",
          display:"flex", alignItems:"center", justifyContent:"space-between",
          flexWrap:"wrap", gap:16, borderTop:"1px solid rgba(207,233,255,.09)",
        }}>
          <span style={{ fontSize:9, letterSpacing:"0.3em", textTransform:"uppercase", color:"rgba(207,233,255,.32)" }}>
            © 2026 Vendr Studios (Pty) Ltd · South Africa
          </span>
          <div style={{ display:"flex", gap:22, flexWrap:"wrap" }}>
            <Link href="/privacy" style={{ fontSize:9, letterSpacing:"0.28em", textTransform:"uppercase", color:"rgba(207,233,255,.45)", textDecoration:"none" }}>Privacy Policy</Link>
            <Link href="/"        style={{ fontSize:9, letterSpacing:"0.28em", textTransform:"uppercase", color:"rgba(207,233,255,.45)", textDecoration:"none" }}>Back to Home</Link>
          </div>
        </footer>

      </div>
    </>
  );
}

export default function ConfirmedPage() {
  return (
    <Suspense>
      <ConfirmedContent />
    </Suspense>
  );
}
