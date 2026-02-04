"use client";

import { useMemo, useState } from "react";
import styles from "./page.module.css";

const steps = ["Event Details", "Pricing & Add-ons", "Review", "Confirmation"];

export default function NewBookingPage() {
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const summary = useMemo(
    () => ({
      artist: "Ayanda Khumalo",
      location: "Cape Town",
      date: "12 Aug 2025",
      time: "09:00 - 17:00",
      service: "Full-day wedding coverage",
      subtotal: "R12,000",
      addOns: "R1,800",
      fee: "R420",
      total: "R14,220",
    }),
    [],
  );

  const next = () => setStep((prev) => Math.min(prev + 1, steps.length - 1));
  const prev = () => setStep((prev) => Math.max(prev - 1, 0));

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <header className={styles.header}>
          <div>
            <h1>Create Booking</h1>
            <p>
              Step {step + 1} of {steps.length} · {steps[step]}
            </p>
          </div>
          <div className={styles.progress}>
            <div
              className={styles.progressBar}
              style={{ width: `${((step + 1) / steps.length) * 100}%` }}
            />
          </div>
        </header>

        {error ? <div className={styles.error}>{error}</div> : null}

        {step === 0 && (
          <div className={styles.form}>
            <label>
              Event Type
              <input placeholder="Wedding, Corporate, Portrait" />
            </label>
            <label>
              Location
              <input placeholder="Cape Town" />
            </label>
            <label>
              Date
              <input placeholder="Select date" />
            </label>
            <label>
              Time Range
              <input placeholder="09:00 - 17:00" />
            </label>
            <label className={styles.fullRow}>
              Description
              <textarea placeholder="Tell us about the project" />
            </label>
          </div>
        )}

        {step === 1 && (
          <div className={styles.form}>
            <label>
              Service Type
              <input placeholder="Full-day wedding coverage" />
            </label>
            <label>
              Duration
              <input placeholder="Full day" />
            </label>
            <label className={styles.fullRow}>
              Add-ons
              <div className={styles.checkboxRow}>
                <label>
                  <input type="checkbox" /> Drone footage (+R900)
                </label>
                <label>
                  <input type="checkbox" /> Highlight reel (+R650)
                </label>
                <label>
                  <input type="checkbox" /> Same-day edits (+R250)
                </label>
              </div>
            </label>
            <div className={styles.pricingBox}>
              <div>
                <span>Base price</span>
                <strong>{summary.subtotal}</strong>
              </div>
              <div>
                <span>Add-ons</span>
                <strong>{summary.addOns}</strong>
              </div>
              <div>
                <span>Platform fee</span>
                <strong>{summary.fee}</strong>
              </div>
              <div className={styles.totalRow}>
                <span>Total</span>
                <strong>{summary.total}</strong>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className={styles.review}>
            <div className={styles.reviewCard}>
              <h2>Booking Summary</h2>
              <div className={styles.reviewRow}>
                <span>Artist</span>
                <strong>{summary.artist}</strong>
              </div>
              <div className={styles.reviewRow}>
                <span>Location</span>
                <strong>{summary.location}</strong>
              </div>
              <div className={styles.reviewRow}>
                <span>Date</span>
                <strong>{summary.date}</strong>
              </div>
              <div className={styles.reviewRow}>
                <span>Time</span>
                <strong>{summary.time}</strong>
              </div>
              <div className={styles.reviewRow}>
                <span>Service</span>
                <strong>{summary.service}</strong>
              </div>
              <div className={styles.reviewRow}>
                <span>Total</span>
                <strong>{summary.total}</strong>
              </div>
            </div>
            <div className={styles.reviewNote}>
              Card will be authorized but not charged until the booking is
              confirmed.
            </div>
          </div>
        )}

        {step === 3 && (
          <div className={styles.confirmation}>
            <div className={styles.successIcon}>✓</div>
            <h2>Booking Submitted</h2>
            <p>Your request has been sent to the creative.</p>
            <div className={styles.confirmCard}>
              <p>Confirmation #: VM-2045</p>
              <p>We will notify you once it is accepted.</p>
            </div>
            <div className={styles.confirmActions}>
              <button className={styles.primaryBtn}>View booking</button>
              <button className={styles.ghostBtn}>Message artist</button>
            </div>
          </div>
        )}

        <div className={styles.actions}>
          <button
            className={styles.ghostBtn}
            onClick={prev}
            disabled={step === 0}
          >
            Previous
          </button>
          {step < steps.length - 1 ? (
            <button
              className={styles.primaryBtn}
              onClick={async () => {
                setError(null);
                if (step === 0) {
                  setError("Please complete the event details.");
                  return;
                }
                if (step === 1) {
                  setError("Please confirm pricing and add-ons.");
                  return;
                }
                if (step === 2) {
                  setIsSubmitting(true);
                  await new Promise((resolve) => setTimeout(resolve, 800));
                  setIsSubmitting(false);
                }
                next();
              }}
            >
              {step === 2 ? (isSubmitting ? "Submitting..." : "Send Request") : "Next"}
            </button>
          ) : null}
        </div>
      </section>
    </main>
  );
}
