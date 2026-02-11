"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, createBooking } from "@/lib/api";
import styles from "./page.module.css";

const steps = ["Event Details", "Pricing & Add-ons", "Review"];

function initialsFromName(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 3);
}

export default function NewBookingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [eventType, setEventType] = useState("Wedding");
  const [location, setLocation] = useState("Cape Town");
  const [date, setDate] = useState("12 Aug 2025");
  const [time, setTime] = useState("09:00 - 17:00");
  const [description, setDescription] = useState("");
  const [serviceType, setServiceType] = useState("Full-day wedding coverage");
  const [duration, setDuration] = useState("Full day");

  const summary = useMemo(
    () => ({
      artist: "Ayanda Khumalo",
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
              Step {step + 1} of {steps.length} - {steps[step]}
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
              <input
                placeholder="Wedding, Corporate, Portrait"
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
              />
            </label>
            <label>
              Location
              <input
                placeholder="Cape Town"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </label>
            <label>
              Date
              <input
                placeholder="Select date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </label>
            <label>
              Time Range
              <input
                placeholder="09:00 - 17:00"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </label>
            <label className={styles.fullRow}>
              Description
              <textarea
                placeholder="Tell us about the project"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </label>
          </div>
        )}

        {step === 1 && (
          <div className={styles.form}>
            <label>
              Service Type
              <input
                placeholder="Full-day wedding coverage"
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
              />
            </label>
            <label>
              Duration
              <input
                placeholder="Full day"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
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
                <strong>{location}</strong>
              </div>
              <div className={styles.reviewRow}>
                <span>Date</span>
                <strong>{date}</strong>
              </div>
              <div className={styles.reviewRow}>
                <span>Time</span>
                <strong>{time}</strong>
              </div>
              <div className={styles.reviewRow}>
                <span>Service</span>
                <strong>{serviceType}</strong>
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

        <div className={styles.actions}>
          <button
            className={styles.ghostBtn}
            onClick={prev}
            disabled={step === 0 || isSubmitting}
          >
            Previous
          </button>
          {step < steps.length - 1 ? (
            <button
              className={styles.primaryBtn}
              onClick={() => {
                setError(null);
                if (step === 0) {
                  if (!eventType.trim() || !location.trim() || !date.trim()) {
                    setError("Please complete event type, location, and date.");
                    return;
                  }
                }
                if (step === 1) {
                  if (!serviceType.trim() || !duration.trim()) {
                    setError("Please complete service type and duration.");
                    return;
                  }
                }
                next();
              }}
              disabled={isSubmitting}
            >
              Next
            </button>
          ) : (
            <button
              className={styles.primaryBtn}
              onClick={async () => {
                setError(null);
                setIsSubmitting(true);
                try {
                  await createBooking({
                    artistName: summary.artist,
                    artistInitials: initialsFromName(summary.artist),
                    title: `${eventType} - ${serviceType}`,
                    location,
                    date,
                    amount: summary.total,
                  });
                  router.push("/bookings");
                } catch (err) {
                  if (err instanceof ApiError) {
                    setError(err.message);
                  } else {
                    setError("Unable to submit booking right now.");
                  }
                } finally {
                  setIsSubmitting(false);
                }
              }}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Send Request"}
            </button>
          )}
        </div>
      </section>
    </main>
  );
}
