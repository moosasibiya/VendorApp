"use client";

import { useMemo, useState } from "react";
import { ApiError, createPrelaunchLead, type PrelaunchLeadInterest } from "@/lib/api";
import styles from "./page.module.css";

const interestOptions: Array<{ value: PrelaunchLeadInterest; label: string }> = [
  { value: "CREATIVE", label: "Artist / creative" },
  { value: "CLIENT", label: "Client / event booker" },
  { value: "AGENCY", label: "Agency / team" },
  { value: "GENERAL", label: "Just updates" },
];

function getFriendlyError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 429) {
      return "Too many requests. Please wait a minute and try again.";
    }
    if (error.status === 400) {
      return "Please enter a valid email address.";
    }
    return error.message || "Unable to save your email right now.";
  }
  return "Unable to save your email right now.";
}

export default function PrelaunchWaitlistForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [interestType, setInterestType] = useState<PrelaunchLeadInterest>("CREATIVE");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    return email.trim().length > 3 && status !== "submitting";
  }, [email, status]);

  return (
    <form
      className={styles.notifyForm}
      noValidate
      onSubmit={async (event) => {
        event.preventDefault();
        setMessage(null);

        const normalizedEmail = email.trim();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
          setStatus("error");
          setMessage("Please enter a valid email address.");
          return;
        }

        setStatus("submitting");
        try {
          await createPrelaunchLead({
            email: normalizedEmail,
            name: name.trim() || undefined,
            interestType,
            source: "PRELAUNCH_PAGE",
          });
          setStatus("success");
          setMessage(
            "You are on the Vendr Studios launch list. We will send updates before bookings open.",
          );
        } catch (error) {
          setStatus("error");
          setMessage(getFriendlyError(error));
        }
      }}
    >
      <div className={styles.notifyFields}>
        <label className={styles.srOnly} htmlFor="prelaunch-name">
          Name
        </label>
        <input
          id="prelaunch-name"
          type="text"
          name="name"
          className={styles.notifyInput}
          placeholder="Name (optional)"
          autoComplete="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />

        <label className={styles.srOnly} htmlFor="prelaunch-email">
          Email address
        </label>
        <input
          id="prelaunch-email"
          type="email"
          name="email"
          className={styles.notifyInput}
          placeholder="Email address"
          autoComplete="email"
          required
          value={email}
          aria-describedby={message ? "prelaunch-form-status" : undefined}
          onChange={(event) => setEmail(event.target.value)}
        />

        <label className={styles.srOnly} htmlFor="prelaunch-interest">
          Interest type
        </label>
        <select
          id="prelaunch-interest"
          name="interestType"
          className={styles.notifySelect}
          value={interestType}
          onChange={(event) => setInterestType(event.target.value as PrelaunchLeadInterest)}
        >
          {interestOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <button type="submit" className={styles.notifyButton} disabled={!canSubmit}>
        {status === "submitting" ? "Saving..." : "Notify me"}
      </button>

      {message ? (
        <p
          id="prelaunch-form-status"
          className={styles.notifyStatus}
          data-tone={status === "success" ? "success" : "error"}
          role={status === "error" ? "alert" : "status"}
        >
          {message}
        </p>
      ) : null}
    </form>
  );
}
