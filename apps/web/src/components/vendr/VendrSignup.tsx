"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, createInsiderSignup, type InsiderSignupResponse } from "@/lib/api";

type FormState = "idle" | "loading" | "success" | "error";
type UserType = "CLIENT" | "ARTIST";

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  role: "client" | "creative" | "";
}

// Mirrors the backend regex: ^\+?[0-9][0-9\s().-]{6,30}$
const PHONE_RE = /^\+?[0-9][0-9\s().\-]{6,30}$/;

const toApiUserType = (v: FormData["role"]): UserType | null => {
  if (v === "client") return "CLIENT";
  if (v === "creative") return "ARTIST";
  return null;
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button
      type="button"
      onClick={copy}
      style={{
        padding: "6px 14px",
        border: "1px solid rgba(207,233,255,.25)",
        borderRadius: 999,
        fontFamily: "var(--display)",
        fontSize: 10,
        letterSpacing: "0.28em",
        textTransform: "uppercase",
        color: copied ? "#4ade80" : "rgba(207,233,255,.7)",
        background: copied ? "rgba(74,222,128,0.06)" : "transparent",
        transition: "color 0.3s, background 0.3s, border-color 0.3s",
        cursor: "pointer",
        flexShrink: 0,
      }}
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

interface SuccessViewProps {
  result: InsiderSignupResponse;
}

function SuccessView({ result }: SuccessViewProps) {
  const isDuplicate = result.duplicate;

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

      {isDuplicate ? (
        <>
          <h3 style={{ fontFamily: "var(--display)", fontWeight: 300, fontSize: "clamp(24px, 3.4vw, 40px)", letterSpacing: "-0.02em", textTransform: "uppercase", marginBottom: 12, color: "var(--ice)" }}>
            You&apos;re already{" "}
            <em style={{ fontStyle: "normal", fontWeight: 500 }}>on the list.</em>
          </h3>
          <p style={{ fontFamily: "var(--body)", fontSize: 15, color: "rgba(231,236,243,.7)", maxWidth: "38ch", margin: "0 auto 28px" }}>
            Your spot is saved. Share your referral link to move up the queue and earn founding benefits.
          </p>
        </>
      ) : (
        <>
          <h3 style={{ fontFamily: "var(--display)", fontWeight: 300, fontSize: "clamp(24px, 3.4vw, 40px)", letterSpacing: "-0.02em", textTransform: "uppercase", marginBottom: 12, color: "var(--ice)" }}>
            You&apos;re in{" "}
            <em style={{ fontStyle: "normal", fontWeight: 500 }}>the spotlight.</em>
          </h3>
          <p style={{ fontFamily: "var(--body)", fontSize: 15, color: "rgba(231,236,243,.7)", maxWidth: "38ch", margin: "0 auto 28px" }}>
            We&apos;ll be in touch before launch. Share your link — every referral moves you up the founding list.
          </p>
        </>
      )}

      {/* Referral code & invite link */}
      <div style={{
        maxWidth: 480, margin: "0 auto 28px",
        border: "1px solid rgba(207,233,255,.12)",
        borderRadius: 10,
        background: "rgba(4,6,28,.6)",
        overflow: "hidden",
      }}>
        {/* Code row */}
        <div style={{
          padding: "14px 20px",
          borderBottom: "1px solid rgba(207,233,255,.08)",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
        }}>
          <div>
            <div style={{ fontFamily: "var(--display)", fontSize: 9, letterSpacing: "0.4em", textTransform: "uppercase", color: "rgba(207,233,255,.4)", marginBottom: 4 }}>
              Your code
            </div>
            <div style={{ fontFamily: "var(--display)", fontSize: 18, letterSpacing: "0.18em", color: "var(--ice)", fontWeight: 600 }}>
              {result.referralCode}
            </div>
          </div>
          <CopyButton text={result.referralCode} />
        </div>

        {/* Invite link row */}
        <div style={{
          padding: "14px 20px",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
        }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: "var(--display)", fontSize: 9, letterSpacing: "0.4em", textTransform: "uppercase", color: "rgba(207,233,255,.4)", marginBottom: 4 }}>
              Invite link
            </div>
            <div style={{
              fontFamily: "var(--body)", fontSize: 13, color: "rgba(207,233,255,.7)",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {result.inviteLink}
            </div>
          </div>
          <CopyButton text={result.inviteLink} />
        </div>
      </div>

      {result.referralCount > 0 && (
        <p style={{ fontFamily: "var(--display)", fontSize: 12, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(207,233,255,.55)", marginBottom: 24 }}>
          {result.referralCount} referral{result.referralCount !== 1 ? "s" : ""} so far
        </p>
      )}

      {/* Social */}
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
  const router = useRouter();
  const [status, setStatus] = useState<FormState>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [signupResult, setSignupResult] = useState<InsiderSignupResponse | null>(null);
  const [form, setForm] = useState<FormData>({ firstName: "", lastName: "", email: "", phoneNumber: "", role: "" });
  const [dropOpen, setDropOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);
  const dropTriggerId = "vd-role-btn";
  const dropLabelId = "vd-role-label";
  const listboxId = "vd-role-listbox";

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setDropOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Listen for role pre-selection from CTAs on other sections
  useEffect(() => {
    const handler = (e: Event) => {
      const role = (e as CustomEvent<string>).detail;
      if (role === "client" || role === "creative") {
        setForm(prev => ({ ...prev, role }));
      }
    };
    window.addEventListener("vendr:select-role", handler);
    return () => window.removeEventListener("vendr:select-role", handler);
  }, []);

  const setField = (key: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (status === "error") { setStatus("idle"); setErrorMsg(null); }
    if (key === "phoneNumber") setPhoneError(null);
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const setRole = (value: FormData["role"]) => {
    setForm((prev) => ({ ...prev, role: value }));
    setDropOpen(false);
  };

  const validatePhone = (): boolean => {
    const ph = form.phoneNumber.trim();
    if (!PHONE_RE.test(ph)) {
      setPhoneError("Enter a valid number with country code, e.g. +27 82 000 0000");
      return false;
    }
    setPhoneError(null);
    return true;
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
    if (!validatePhone()) return;
    setStatus("loading");
    setErrorMsg(null);
    try {
      const result = await createInsiderSignup({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim().toLowerCase(),
        phoneNumber: form.phoneNumber.trim(),
        userType: apiUserType,
      });
      setSignupResult(result);
      setStatus("success");
      window.dispatchEvent(new CustomEvent("vendr:insider-signup"));
      const redirectParams = new URLSearchParams({
        code: result.referralCode,
        link: result.inviteLink,
        name: form.firstName.trim(),
        num: String(result.referralCount ?? 42),
        role: apiUserType ?? "ARTIST",
        ...(result.duplicate ? { dup: "1" } : {}),
      });
      router.push(`/confirmed?${redirectParams.toString()}`);
    } catch (err) {
      setErrorMsg(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
      setStatus("error");
    }
  };

  // Dropdown keyboard handler
  const onDropKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setDropOpen((o) => !o);
    }
    if (e.key === "Escape") setDropOpen(false);
  };

  return (
    <section
      id="signup"
      style={{
        position: "relative", padding: "20px clamp(16px,4vw,36px) 60px",
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
            "radial-gradient(130% 100% at 50% 30%, transparent 45%, rgba(0,0,5,.5) 95%), " +
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
        style={{
          width: "100%", maxWidth: 780,
          padding: "clamp(32px,6vw,80px) clamp(20px,5vw,60px)",
          border: "1px solid rgba(207,233,255,.10)",
          borderRadius: 12,
          background: "rgba(4, 6, 28, 0.75)",
        }}
      >
        {status === "success" && signupResult ? (
          <SuccessView result={signupResult} />
        ) : (
          <>
            {/* Kicker */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, marginBottom: 20 }}>
              <span style={{ width: 36, height: 1, background: "rgba(207,233,255,.4)", display: "inline-block" }} />
              <span style={{ fontFamily: "var(--display)", fontSize: 11, letterSpacing: "0.4em", textTransform: "uppercase", color: "rgba(207,233,255,.85)" }}>
                04 · Early access
              </span>
              <span style={{ width: 36, height: 1, background: "rgba(207,233,255,.4)", display: "inline-block" }} />
            </div>

            {/* Headline */}
            <h2 style={{ fontFamily: "var(--display)", fontWeight: 300, fontSize: "clamp(24px, 4.6vw, 64px)", lineHeight: 1, letterSpacing: "-0.025em", textTransform: "uppercase", textAlign: "center", marginBottom: 18, color: "var(--ice)" }}>
              Step into the <em style={{ fontStyle: "normal", fontWeight: 500 }}>spotlight.</em>
            </h2>

            <p style={{ fontFamily: "var(--body)", textAlign: "center", fontSize: 15, lineHeight: 1.6, color: "rgba(207,233,255,.85)", marginBottom: 48, maxWidth: "42ch", marginLeft: "auto", marginRight: "auto" }}>
              Sign up. Get verified. Earn rewards before anyone else.
            </p>

            <form onSubmit={(e) => void submit(e)} noValidate>
              {/* Name row */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 18, marginBottom: 18 }}>
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
                <input
                  id="vd-ph"
                  type="tel"
                  placeholder="+27 82 000 0000"
                  value={form.phoneNumber}
                  onChange={setField("phoneNumber")}
                  onBlur={validatePhone}
                  required
                  style={{
                    width: "100%", padding: "14px 18px",
                    background: "rgba(207,233,255,0.07)",
                    border: `1px solid ${phoneError ? "rgba(255,107,107,.6)" : "rgba(207,233,255,0.2)"}`,
                    borderRadius: 6, color: "var(--ice)", fontSize: 15, fontWeight: 300, fontFamily: "var(--body)",
                  }}
                />
                {phoneError && (
                  <p role="alert" style={{ marginTop: 6, fontFamily: "var(--body)", fontSize: 12, color: "#ff6b6b" }}>
                    {phoneError}
                  </p>
                )}
              </div>

              {/* Role — accessible custom dropdown */}
              <div ref={dropRef} style={{ position: "relative", marginBottom: 0 }}>
                <label
                  id={dropLabelId}
                  htmlFor={dropTriggerId}
                  style={{ display: "block", fontFamily: "var(--display)", fontSize: 13, letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(207,233,255,0.85)", marginBottom: 10 }}
                >
                  I am joining as
                </label>
                <div
                  id={dropTriggerId}
                  role="button"
                  tabIndex={0}
                  aria-haspopup="listbox"
                  aria-expanded={dropOpen}
                  aria-labelledby={dropLabelId}
                  aria-controls={listboxId}
                  onClick={() => setDropOpen((o) => !o)}
                  onKeyDown={onDropKeyDown}
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
                  <svg width="12" height="8" viewBox="0 0 12 8" fill="none" aria-hidden="true" style={{ transform: dropOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.3s", flexShrink: 0 }}>
                    <path d="M1 1L6 7L11 1" stroke="#cfe9ff" strokeWidth="1.4"/>
                  </svg>
                </div>
                {dropOpen && (
                  <ul
                    id={listboxId}
                    role="listbox"
                    aria-labelledby={dropLabelId}
                    style={{
                      position: "absolute", left: 0, right: 0, zIndex: 50,
                      background: "#0b0e36", border: "1px solid rgba(207,233,255,0.2)",
                      borderTop: "none", borderRadius: "0 0 6px 6px", overflow: "hidden",
                      listStyle: "none", margin: 0, padding: 0,
                    }}
                  >
                    {ROLE_OPTIONS.map((opt) => (
                      <li
                        key={opt.value}
                        role="option"
                        aria-selected={form.role === opt.value}
                        onClick={() => setRole(opt.value)}
                        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setRole(opt.value); } }}
                        tabIndex={0}
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
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Submit */}
              <div style={{ display: "flex", justifyContent: "center", marginTop: 18 }}>
                <button
                  type={canSubmit ? "submit" : "button"}
                  onClick={!canSubmit ? () => router.push("/confirmed?code=VENDR-001&link=https%3A%2F%2Fvendr.studio%2Fr%2FVENDR-001&name=Preview&num=42&role=ARTIST") : undefined}
                  className="vendr-submit"
                  style={{ opacity: 1, marginTop: 0 }}
                >
                  <span style={{ position: "relative", zIndex: 2 }}>
                    {status === "loading" ? "Submitting..." : "Join early access"}
                  </span>
                  {status !== "loading" && (
                    <svg width="14" height="10" viewBox="0 0 14 10" fill="none" style={{ position: "relative", zIndex: 2 }} aria-hidden="true">
                      <path d="M1 5 H13 M9 1 L13 5 L9 9" stroke="currentColor" strokeWidth="1.4" />
                    </svg>
                  )}
                </button>
              </div>

              {/* API error */}
              {status === "error" && errorMsg && (
                <p role="alert" style={{ marginTop: 14, fontFamily: "var(--body)", fontSize: 13, color: "#ff6b6b", textAlign: "center" }}>
                  {errorMsg}
                </p>
              )}

              {/* Social fine print */}
              <p style={{ marginTop: 24, fontFamily: "var(--display)", fontSize: 10, letterSpacing: "0.28em", color: "rgba(207,233,255,.7)", textAlign: "center", textTransform: "uppercase", lineHeight: 1.8 }}>
                Follow{" "}
                <a href="https://instagram.com/vendr.studio" target="_blank" rel="noreferrer" style={{ color: "rgba(207,233,255,.7)", borderBottom: "1px solid rgba(207,233,255,.3)" }}>
                  @vendr.studio
                </a>
                {" "}on Instagram + TikTok to get verified faster.
              </p>

              {/* POPIA notice */}
              <p style={{ marginTop: 14, fontFamily: "var(--display)", fontSize: 9, letterSpacing: "0.22em", color: "rgba(207,233,255,.35)", textAlign: "center", textTransform: "uppercase", lineHeight: 1.9 }}>
                Your details are used solely to manage your Vendr prelaunch access, product updates, and referral tracking.
                We process personal information in accordance with POPIA.{" "}
                <a href="/privacy" style={{ color: "rgba(207,233,255,.45)", borderBottom: "1px solid rgba(207,233,255,.2)" }}>
                  Privacy policy
                </a>
                .
              </p>
            </form>
          </>
        )}
      </div>
    </section>
  );
}
