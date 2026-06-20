"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, createInsiderSignup, type InsiderSignupResponse } from "@/lib/api";
import { useScrollReveal } from "./useScrollReveal";

type FormState = "idle" | "loading" | "success" | "error";
type UserType = "CLIENT" | "ARTIST";

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  role: "client" | "creative" | "";
}

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
      className={`v-copy-btn${copied ? " copied" : ""}`}
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function SuccessView({ result }: { result: InsiderSignupResponse }) {
  const isDuplicate = result.duplicate;
  return (
    <div className="v-success">
      <div className="v-success-icon">
        <svg width="28" height="20" viewBox="0 0 28 20" fill="none" aria-hidden="true">
          <path d="M2 10 L10 18 L26 2" stroke="#d2dbff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {isDuplicate ? (
        <>
          <h3>You&apos;re already <span className="v-ital">on the list.</span></h3>
          <p className="v-lead" style={{ margin: "0 auto 28px", textAlign: "center" }}>
            Your spot is saved. Share your referral link to move up the queue and earn founding benefits.
          </p>
        </>
      ) : (
        <>
          <h3>You&apos;re in <span className="v-ital">the spotlight.</span></h3>
          <p className="v-lead" style={{ margin: "0 auto 28px", textAlign: "center" }}>
            We&apos;ll be in touch before launch. Share your link — every referral moves you up the founding list.
          </p>
        </>
      )}

      <div className="v-referral-box">
        <div className="v-referral-row">
          <div>
            <div style={{ fontFamily: "Manrope, sans-serif", fontSize: 9, letterSpacing: ".4em", textTransform: "uppercase", color: "var(--v-muted)", marginBottom: 4 }}>Your code</div>
            <div style={{ fontFamily: "Oswald, sans-serif", fontSize: 18, letterSpacing: ".18em", color: "var(--v-paper)", fontWeight: 500 }}>{result.referralCode}</div>
          </div>
          <CopyButton text={result.referralCode} />
        </div>
        <div className="v-referral-row">
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: "Manrope, sans-serif", fontSize: 9, letterSpacing: ".4em", textTransform: "uppercase", color: "var(--v-muted)", marginBottom: 4 }}>Invite link</div>
            <div style={{ fontFamily: "Manrope, sans-serif", fontSize: 13, color: "var(--v-mist)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{result.inviteLink}</div>
          </div>
          <CopyButton text={result.inviteLink} />
        </div>
      </div>

      {result.referralCount > 0 && (
        <p style={{ fontFamily: "Manrope, sans-serif", fontSize: 12, letterSpacing: ".2em", textTransform: "uppercase", color: "var(--v-muted)", marginBottom: 24 }}>
          {result.referralCount} referral{result.referralCount !== 1 ? "s" : ""} so far
        </p>
      )}

      <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
        {[
          { label: "Instagram", href: "https://instagram.com/vendr.studio" },
          { label: "TikTok", href: "https://tiktok.com/@vendr.studio" },
        ].map(({ label, href }) => (
          <a key={label} href={href} target="_blank" rel="noreferrer" className="v-social-btn">
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

  const eyebrowRef = useScrollReveal<HTMLSpanElement>();
  const formWrapRef = useScrollReveal<HTMLDivElement>();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setDropOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const role = (e as CustomEvent<string>).detail;
      if (role === "client" || role === "creative") setForm(prev => ({ ...prev, role }));
    };
    window.addEventListener("vendr:select-role", handler);
    return () => window.removeEventListener("vendr:select-role", handler);
  }, []);

  const setField = (key: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    if (status === "error") { setStatus("idle"); setErrorMsg(null); }
    if (key === "phoneNumber") setPhoneError(null);
    setForm(prev => ({ ...prev, [key]: e.target.value }));
  };

  const setRole = (value: FormData["role"]) => {
    setForm(prev => ({ ...prev, role: value }));
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

  const onDropKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setDropOpen(o => !o); }
    if (e.key === "Escape") setDropOpen(false);
  };

  return (
    <section id="join" className="v-section" style={{ padding: "120px 0" }}>
      <div className="v-container">
        <div className="v-form-wrap">
          <span className="v-eyebrow vendr-reveal" ref={eyebrowRef}>
            04 · Early access
          </span>

          <h2>Step into the <span className="v-grad-text">spotlight.</span></h2>

          <p className="v-lead" style={{ margin: "18px auto 0", textAlign: "center" }}>
            Sign up. Get verified. Earn rewards before anyone else.
          </p>

          <div className="v-form vendr-reveal d1" ref={formWrapRef}>
            {status === "success" && signupResult ? (
              <SuccessView result={signupResult} />
            ) : (
              <form onSubmit={e => void submit(e)} noValidate>
                <div className="v-grid2">
                  <div className="v-field">
                    <label htmlFor="vd-fn">First name</label>
                    <input id="vd-fn" type="text" placeholder="First name" value={form.firstName} onChange={setField("firstName")} required />
                  </div>
                  <div className="v-field">
                    <label htmlFor="vd-ln">Last name</label>
                    <input id="vd-ln" type="text" placeholder="Last name" value={form.lastName} onChange={setField("lastName")} required />
                  </div>
                </div>

                <div className="v-field">
                  <label htmlFor="vd-em">Email address</label>
                  <input id="vd-em" type="email" placeholder="you@email.com" value={form.email} onChange={setField("email")} required />
                </div>

                <div className="v-field">
                  <label htmlFor="vd-ph">Phone (with country code)</label>
                  <input
                    id="vd-ph"
                    type="tel"
                    placeholder="+27 82 000 0000"
                    value={form.phoneNumber}
                    onChange={setField("phoneNumber")}
                    onBlur={validatePhone}
                    required
                    style={phoneError ? { borderColor: "rgba(255,107,107,.6)" } : undefined}
                  />
                  {phoneError && (
                    <p role="alert" style={{ marginTop: 6, fontFamily: "Manrope, sans-serif", fontSize: 12, color: "#ff6b6b" }}>{phoneError}</p>
                  )}
                </div>

                {/* Role dropdown */}
                <div className="v-field" ref={dropRef} style={{ position: "relative" }}>
                  <label id={dropLabelId} htmlFor={dropTriggerId}>I am joining as</label>
                  <div
                    id={dropTriggerId}
                    role="button"
                    tabIndex={0}
                    aria-haspopup="listbox"
                    aria-expanded={dropOpen}
                    aria-labelledby={dropLabelId}
                    aria-controls={listboxId}
                    className={`v-select-trigger${dropOpen ? " open" : ""}`}
                    onClick={() => setDropOpen(o => !o)}
                    onKeyDown={onDropKeyDown}
                  >
                    <span style={{ color: form.role ? "var(--v-paper)" : "var(--v-muted-dim)" }}>
                      {form.role ? ROLE_OPTIONS.find(o => o.value === form.role)?.label : "Choose your path"}
                    </span>
                    <svg width="12" height="8" viewBox="0 0 12 8" fill="none" aria-hidden="true" style={{ transform: dropOpen ? "rotate(180deg)" : "none", transition: "transform .3s", flexShrink: 0 }}>
                      <path d="M1 1L6 7L11 1" stroke="var(--v-muted)" strokeWidth="1.4" />
                    </svg>
                  </div>
                  {dropOpen && (
                    <ul id={listboxId} role="listbox" aria-labelledby={dropLabelId} className="v-select-listbox">
                      {ROLE_OPTIONS.map(opt => (
                        <li
                          key={opt.value}
                          role="option"
                          aria-selected={form.role === opt.value}
                          className="v-select-option"
                          onClick={() => setRole(opt.value)}
                          onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setRole(opt.value); } }}
                          tabIndex={0}
                        >
                          {opt.label}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div style={{ display: "flex", justifyContent: "center", marginTop: 18 }}>
                  <button
                    type={canSubmit ? "submit" : "button"}
                    onClick={!canSubmit ? () => router.push("/confirmed?code=VENDR-001&link=https%3A%2F%2Fvendr.studio%2Fr%2FVENDR-001&name=Preview&num=42&role=ARTIST") : undefined}
                    className="v-btn v-btn-grad"
                    style={{ width: "100%", justifyContent: "center" }}
                  >
                    {status === "loading" ? "Submitting..." : "Join early access →"}
                  </button>
                </div>

                {status === "error" && errorMsg && (
                  <p role="alert" style={{ marginTop: 14, fontFamily: "Manrope, sans-serif", fontSize: 13, color: "#ff6b6b", textAlign: "center" }}>{errorMsg}</p>
                )}

                <p className="v-form-note" style={{ marginTop: 24 }}>
                  Follow <em>@vendr.studio</em> on{" "}
                  <a href="https://instagram.com/vendr.studio" target="_blank" rel="noreferrer">Instagram</a>
                  {" "}+{" "}
                  <a href="https://tiktok.com/@vendr.studio" target="_blank" rel="noreferrer">TikTok</a>
                  {" "}to get verified faster.
                </p>

                <p className="v-popia">
                  Your details are used solely to manage your Vendr prelaunch access, product updates, and referral tracking.
                  We process personal information in accordance with POPIA.{" "}
                  <a href="/privacy">Privacy policy</a>.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
