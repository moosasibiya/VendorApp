"use client";

import { useEffect, useState } from "react";
import styles from "./page.module.css";

const artistSteps = [
  "Services",
  "Account",
  "Profile",
  "Portfolio",
  "Availability",
  "Review",
  "Payment/KYC",
];

const clientSteps = ["Account", "Profile"];

const STORAGE_KEY = "vendrman_onboarding";

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState<"artist" | "client">("artist");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return;
      const parsed = JSON.parse(saved);
      if (parsed?.step !== undefined) setStep(parsed.step);
      if (parsed?.mode) setMode(parsed.mode);
    } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ step, mode }));
  }, [step, mode]);

  const steps = mode === "artist" ? artistSteps : clientSteps;
  const next = () => setStep((prev) => Math.min(prev + 1, steps.length - 1));
  const prev = () => setStep((prev) => Math.max(prev - 1, 0));

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <aside className={styles.sidebar}>
          <h1>Artist Onboarding</h1>
          <p>Complete your setup in {steps.length} steps.</p>
          <div className={styles.stepList}>
            {steps.map((label, index) => (
              <div
                key={label}
                className={
                  index === step
                    ? `${styles.stepItem} ${styles.active}`
                    : styles.stepItem
                }
              >
                <div className={styles.stepCircle}>{index + 1}</div>
                <div>{label}</div>
              </div>
            ))}
          </div>
        </aside>

        <div className={styles.form}>
          <h2>
            Step {step + 1} · {steps[step]}
          </h2>

          {step === 0 && mode === "artist" && (
            <div className={styles.formGrid}>
              {[
                "Photography",
                "Videography",
                "Graphic Design",
                "Content Creation",
              ].map((service) => (
                <label key={service} className={styles.checkbox}>
                  <input type="checkbox" /> {service}
                </label>
              ))}
            </div>
          )}

          {(step === 0 && mode === "client") ||
          (step === 1 && mode === "artist") ? (
            <div className={styles.formGrid}>
              <label>
                Full legal name
                <input placeholder="Ayanda Khumalo" />
              </label>
              <label>
                Username
                <input placeholder="@ayanda" />
              </label>
              <label>
                Email
                <input placeholder="ayanda@email.com" />
              </label>
              <label>
                Phone
                <input placeholder="+27 82 000 1234" />
              </label>
              <label>
                Password
                <input type="password" placeholder="••••••••" />
              </label>
              <label>
                Account type
                <select
                  value={mode}
                  onChange={(event) =>
                    setMode(event.target.value as "artist" | "client")
                  }
                >
                  <option value="artist">Artist</option>
                  <option value="client">Client</option>
                </select>
              </label>
            </div>
          ) : null}

          {(step === 1 && mode === "client") ||
          (step === 2 && mode === "artist") ? (
            <div className={styles.formGrid}>
              <label>
                Bio
                <textarea placeholder="Tell clients about your style." />
              </label>
              <label>
                Location
                <input placeholder="Cape Town" />
              </label>
              <label>
                Specialties
                <input placeholder="Weddings, Editorial" />
              </label>
            </div>
          ) : null}

          {step === 3 && mode === "artist" && (
            <div className={styles.formGrid}>
              <div className={styles.uploadBox}>
                Drag & drop projects here or browse files.
              </div>
              <div className={styles.previewBox}>
                Portfolio preview (min 4 projects required)
              </div>
            </div>
          )}

          {step === 4 && mode === "artist" && (
            <div className={styles.formGrid}>
              <label>
                Availability days
                <input placeholder="Mon, Tue, Thu" />
              </label>
              <label>
                Pricing tiers
                <input placeholder="Wedding: R12k, Portrait: R3k" />
              </label>
            </div>
          )}

          {step === 5 && mode === "artist" && (
            <div className={styles.reviewBox}>
              <h3>Review your profile</h3>
              <p>Confirm your services, pricing, and portfolio before submit.</p>
              <label className={styles.checkbox}>
                <input type="checkbox" /> I agree to the terms and privacy
                policy.
              </label>
            </div>
          )}

          {step === 6 && mode === "artist" && (
            <div className={styles.formGrid}>
              <label>
                Bank account
                <input placeholder="ABSA · 123456" />
              </label>
              <label>
                ID number
                <input placeholder="800101 5009 087" />
              </label>
              <div className={styles.notice}>
                Upload ID + selfie to complete verification.
              </div>
            </div>
          )}

          <div className={styles.actions}>
            <button type="button" className={styles.ghostBtn} onClick={prev}>
              Previous
            </button>
            <button type="button" className={styles.primaryBtn} onClick={next}>
              {step === steps.length - 1 ? "Finish" : "Next Step"}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
