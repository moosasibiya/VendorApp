"use client";

import { useState } from "react";
import { ApiError, createInsiderSignup } from "@/lib/api";

type FormState = "idle" | "loading" | "success" | "error";
type UserType = "CLIENT" | "ARTIST";

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  role: "client" | "creative" | "both" | "";
}

const toApiUserType = (v: FormData["role"]): UserType | null => {
  if (v === "client") return "CLIENT";
  if (v === "creative" || v === "both") return "ARTIST";
  return null;
};

function SuccessView() {
  return (
    <div style={{ textAlign: "center", padding: "20px 0", animation: "vendr-rise-in .8s ease forwards" }}>
      {/* Icon */}
      <div style={{
        width: 72, height: 72, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(207,233,255,.4), rgba(101,34,99,.3))",
        border: "1px solid rgba(207,233,255,.4)",
        margin: "0 auto 24px",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 0 60px rgba(207,233,255,.4)",
      }}>
        <svg width="28" height="20" viewBox="0 0 28 20" fill="none">
          <path d="M2 10 L10 18 L26 2" stroke="#CFE9FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <h3 style={{ fontFamily: "var(--display)", fontWeight: 300, fontSize: "clamp(28px, 3.4vw, 44px)", letterSpacing: "-0.02em", textTransform: "uppercase", marginBottom: 14, color: "var(--ice)" }}>
        You&apos;re in{" "}
        <em style={{ fontStyle: "normal", fontWeight: 500 }}>the spotlight.</em>
      </h3>
      <p style={{ fontFamily: "var(--body)", fontSize: 15, color: "rgba(231,236,243,.7)", maxWidth: "38ch", margin: "0 auto 36px" }}>
        We&apos;ll be in touch before launch. In the meantime — follow us to fast-track your verification.
      </p>
      <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
        {[
          { label: "Instagram", href: "https://instagram.com/vendr.studio" },
          { label: "TikTok",    href: "https://tiktok.com/@vendr.studio" },
        ].map(({ label, href }) => (
          <a
            key={label}
            href={href}
            target="_blank"
            rel="noreferrer"
            className="vendr-social-btn"
            style={{
              padding: "14px 22px",
              border: "1px solid rgba(207,233,255,.18)",
              borderRadius: 999,
              fontFamily: "var(--display)", fontSize: 11, letterSpacing: "0.32em",
              textTransform: "uppercase", color: "var(--ice)",
              display: "inline-flex", alignItems: "center", gap: 10,
            }}
          >
            {label}
          </a>
        ))}
      </div>
    </div>
  );
}

const ROLE_OPTIONS = [
  { value: "client",   label: "Client — I want to book creatives" },
  { value: "creative", label: "Creative — I want to be booked" },
] as const;

export function VendrSignup() {
  const [status, setStatus] = useState<FormState>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>({ firstName: "", lastName: "", email: "", phoneNumber: "", role: "" });
  const [dropOpen, setDropOpen] = useState(false);

  const setField = (key: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const setRole = (value: FormData["role"]) => {
    setForm((prev) => ({ ...prev, role: value }));
    setDropOpen(false);
  };

  const apiUserType = toApiUserType(form.role);
  const canSubmit =
    form.firstName.trim().length >= 2 &&
    form.lastName.trim().length >= 2 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()) &&
    form.phoneNumber.trim().length >= 7 &&
    apiUserType !== null &&
    status !== "loading";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !apiUserType) return;
    setStatus("loading");
    setErrorMsg(null);
    try {
      await createInsiderSignup({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim().toLowerCase(),
        phoneNumber: form.phoneNumber.trim(),
        userType: apiUserType,
      });
      setStatus("success");
    } catch (err) {
      setErrorMsg(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
      setStatus("error");
    }
  };

  return (
    <section
      id="signup"
      style={{
        position: "relative", padding: "20px 36px 60px",
        display: "flex", justifyContent: "center",
        overflow: "hidden", isolation: "isolate",
      }}
    >
      {/* Background */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute", inset: 0, zIndex: -1,
          background:
            "radial-gradient(40% 30% at 50% 50%, rgba(101,34,99,.35), transparent 65%), " +
            "radial-gradient(80% 60% at 50% 100%, rgba(31,45,107,.25), transparent 60%), " +
            "linear-gradient(180deg, #00001e, #00001e)",
        }}
      >
        <div style={{
          position: "absolute", inset: 0,
          background: "repeating-linear-gradient(45deg, transparent 0 24px, rgba(207,233,255,.02) 24px 25px)",
        }} />
      </div>

      {/* Card */}
      <div
        className=""
        style={{
          width: "100%", maxWidth: 780,
          padding: "80px 60px",
          border: "1px solid rgba(207,233,255,.10)",
          borderRadius: 12,
          background: "rgba(4, 6, 28, 0.75)",
        }}
      >
        {status === "success" ? (
          <SuccessView />
        ) : (
          <>
            {/* Kicker */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, marginBottom: 20 }}>
              <span style={{ width: 36, height: 1, background: "rgba(207,233,255,.4)", display: "inline-block" }} />
              <span style={{ fontFamily: "var(--display)", fontSize: 11, letterSpacing: "0.4em", textTransform: "uppercase", color: "rgba(207,233,255,.85)" }}>
                04 · Insider Programme
              </span>
              <span style={{ width: 36, height: 1, background: "rgba(207,233,255,.4)", display: "inline-block" }} />
            </div>

            {/* Headline */}
            <h2 style={{ fontFamily: "var(--display)", fontWeight: 300, fontSize: "clamp(36px, 4.6vw, 64px)", lineHeight: 1, letterSpacing: "-0.025em", textTransform: "uppercase", textAlign: "center", marginBottom: 18, color: "var(--ice)" }}>
              Step into the <em style={{ fontStyle: "normal", fontWeight: 500 }}>spotlight.</em>
            </h2>

            <p style={{ fontFamily: "var(--body)", textAlign: "center", fontSize: 15, lineHeight: 1.6, color: "rgba(207,233,255,.85)", marginBottom: 48, maxWidth: "42ch", marginLeft: "auto", marginRight: "auto" }}>
              Sign up. Get verified. Earn rewards before anyone else.
            </p>

            <form onSubmit={(e) => void submit(e)} noValidate>
              {/* Name row */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 18 }}>
                <div>
                  <label htmlFor="vd-fn" style={{ display: "block", fontFamily: "var(--display)", fontSize: 13, letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(207,233,255,0.85)", marginBottom: 10 }}>First name</label>
                  <input id="vd-fn" type="text" placeholder="First name" value={form.firstName} onChange={setField("firstName")} required style={{ width: "100%", padding: "14px 18px", background: "rgba(207,233,255,0.07)", border: "1px solid rgba(207,233,255,0.2)", borderRadius: 6, color: "var(--ice)", fontSize: 15, fontWeight: 300, fontFamily: "var(--body)" }} />
                </div>
                <div>
                  <label htmlFor="vd-ln" style={{ display: "block", fontFamily: "var(--display)", fontSize: 13, letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(207,233,255,0.85)", marginBottom: 10 }}>Last name</label>
                  <input id="vd-ln" type="text" placeholder="Last name" value={form.lastName} onChange={setField("lastName")} required style={{ width: "100%", padding: "14px 18px", background: "rgba(207,233,255,0.07)", border: "1px solid rgba(207,233,255,0.2)", borderRadius: 6, color: "var(--ice)", fontSize: 15, fontWeight: 300, fontFamily: "var(--body)" }} />
                </div>
              </div>

              {/* Email */}
              <div style={{ marginBottom: 18 }}>
                <label htmlFor="vd-em" style={{ display: "block", fontFamily: "var(--display)", fontSize: 13, letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(207,233,255,0.85)", marginBottom: 10 }}>Email address</label>
                <input id="vd-em" type="email" placeholder="you@email.com" value={form.email} onChange={setField("email")} required style={{ width: "100%", padding: "14px 18px", background: "rgba(207,233,255,0.07)", border: "1px solid rgba(207,233,255,0.2)", borderRadius: 6, color: "var(--ice)", fontSize: 15, fontWeight: 300, fontFamily: "var(--body)" }} />
              </div>

              {/* Phone */}
              <div style={{ marginBottom: 18 }}>
                <label htmlFor="vd-ph" style={{ display: "block", fontFamily: "var(--display)", fontSize: 13, letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(207,233,255,0.85)", marginBottom: 10 }}>Phone (with country code)</label>
                <input id="vd-ph" type="tel" placeholder="+27" value={form.phoneNumber} onChange={setField("phoneNumber")} required style={{ width: "100%", padding: "14px 18px", background: "rgba(207,233,255,0.07)", border: "1px solid rgba(207,233,255,0.2)", borderRadius: 6, color: "var(--ice)", fontSize: 15, fontWeight: 300, fontFamily: "var(--body)" }} />
              </div>

              {/* Role */}
              <div style={{ position: "relative", marginBottom: 0 }}>
                <label style={{ display: "block", fontFamily: "var(--display)", fontSize: 13, letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(207,233,255,0.85)", marginBottom: 10 }}>I am joining as</label>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setDropOpen((o) => !o)}
                  onKeyDown={(e) => e.key === "Enter" && setDropOpen((o) => !o)}
                  style={{
                    width: "100%", padding: "14px 18px", textAlign: "left",
                    background: "rgba(207,233,255,0.07)", border: "1px solid rgba(207,233,255,0.2)",
                    borderRadius: dropOpen ? "6px 6px 0 0" : 6,
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between",
                    transition: "border-color 0.3s", boxSizing: "border-box",
                  }}
                >
                  <span style={{ color: "#cfe9ff", fontSize: 15, fontWeight: 400, fontFamily: "var(--body)" }}>
                    {form.role ? ROLE_OPTIONS.find(o => o.value === form.role)?.label : "Choose your path"}
                  </span>
                  <svg width="12" height="8" viewBox="0 0 12 8" fill="none" style={{ transform: dropOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.3s", flexShrink: 0 }}>
                    <path d="M1 1L6 7L11 1" stroke="#cfe9ff" strokeWidth="1.4"/>
                  </svg>
                </div>
                {dropOpen && (
                  <div style={{
                    position: "absolute", left: 0, right: 0, zIndex: 50,
                    background: "#0b0e36", border: "1px solid rgba(207,233,255,0.2)",
                    borderTop: "none", borderRadius: "0 0 6px 6px", overflow: "hidden",
                  }}>
                    {ROLE_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setRole(opt.value)}
                        style={{
                          width: "100%", padding: "16px 18px", textAlign: "left",
                          background: form.role === opt.value ? "rgba(207,233,255,0.08)" : "transparent",
                          color: "rgba(207,233,255,0.85)", fontFamily: "var(--display)",
                          fontSize: 14, fontWeight: 300, cursor: "pointer",
                          borderBottom: "1px solid rgba(207,233,255,0.06)",
                          transition: "background 0.2s",
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = "rgba(207,233,255,0.1)")}
                        onMouseLeave={e => (e.currentTarget.style.background = form.role === opt.value ? "rgba(207,233,255,0.08)" : "transparent")}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit */}
              <div style={{ display: "flex", justifyContent: "center", marginTop: 18 }}>
              <button
                type="submit"
                disabled={!canSubmit}
                className="vendr-submit"
                style={{ opacity: 1, marginTop: 0 }}
              >
                <span style={{ position: "relative", zIndex: 2 }}>
                  {status === "loading" ? "..." : "Become an Insider"}
                </span>
                {status !== "loading" && (
                  <svg width="14" height="10" viewBox="0 0 14 10" fill="none" style={{ position: "relative", zIndex: 2 }} aria-hidden="true">
                    <path d="M1 5 H13 M9 1 L13 5 L9 9" stroke="currentColor" strokeWidth="1.4" />
                  </svg>
                )}
              </button>
              </div>

              {/* Error */}
              {status === "error" && errorMsg && (
                <p role="alert" style={{ marginTop: 14, fontFamily: "var(--body)", fontSize: 13, color: "#ff6b6b", textAlign: "center" }}>
                  {errorMsg}
                </p>
              )}

              {/* Fine print */}
              <p style={{ marginTop: 24, fontFamily: "var(--display)", fontSize: 10, letterSpacing: "0.28em", color: "rgba(207,233,255,.7)", textAlign: "center", textTransform: "uppercase", lineHeight: 1.8 }}>
                Follow{" "}
                <a href="https://instagram.com/vendr.studio" target="_blank" rel="noreferrer" style={{ color: "rgba(207,233,255,.7)", borderBottom: "1px solid rgba(207,233,255,.3)" }}>
                  @vendr.studio
                </a>
                {" "}on Instagram + TikTok to get verified faster.
              </p>
            </form>
          </>
        )}
      </div>
    </section>
  );
}
