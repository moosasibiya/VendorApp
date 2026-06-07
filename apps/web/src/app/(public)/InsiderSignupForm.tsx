"use client";

import { useMemo, useState } from "react";
import {
  ApiError,
  createInsiderSignup,
  type InsiderSignupResponse,
  type InsiderUserType,
} from "@/lib/api";
import styles from "./page.module.css";

type Props = {
  defaultUserType: InsiderUserType;
  referredBy?: string;
};

function friendlyError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 409) return "This email is already registered.";
    if (error.status === 429) return "Too many attempts. Please wait a minute and try again.";
    return error.message || "Unable to join right now.";
  }
  return "Unable to join right now.";
}

export default function InsiderSignupForm({ defaultUserType, referredBy }: Props) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [userType, setUserType] = useState<InsiderUserType>(defaultUserType);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [result, setResult] = useState<InsiderSignupResponse | null>(null);

  const canSubmit = useMemo(() => {
    return (
      firstName.trim().length >= 2 &&
      lastName.trim().length >= 2 &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) &&
      phoneNumber.trim().length >= 7 &&
      status !== "submitting"
    );
  }, [email, firstName, lastName, phoneNumber, status]);

  return (
    <form
      className={styles.insiderForm}
      noValidate
      onSubmit={async (event) => {
        event.preventDefault();
        setMessage(null);
        setResult(null);

        if (!canSubmit) {
          setStatus("error");
          setMessage("Please complete your name, email, and phone number.");
          return;
        }

        setStatus("submitting");
        try {
          const insider = await createInsiderSignup({
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.trim().toLowerCase(),
            phoneNumber: phoneNumber.trim(),
            userType,
            referredBy,
          });
          setResult(insider);
          setStatus("success");
          setMessage(
            insider.duplicate
              ? "You are already on the Vendr Studio early-access list. Follow Instagram and TikTok, then reply Done."
              : "You are in. Follow Instagram and TikTok, then reply Done so the team can manually verify you.",
          );
        } catch (error) {
          setStatus("error");
          setMessage(friendlyError(error));
        }
      }}
    >
      <div className={styles.formGrid}>
        <label className={styles.formField}>
          First name
          <input value={firstName} onChange={(event) => setFirstName(event.target.value)} autoComplete="given-name" required />
        </label>
        <label className={styles.formField}>
          Last name
          <input value={lastName} onChange={(event) => setLastName(event.target.value)} autoComplete="family-name" required />
        </label>
        <label className={styles.formField}>
          Email
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required />
        </label>
        <label className={styles.formField}>
          Phone number
          <input value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} autoComplete="tel" required />
        </label>
        <label className={`${styles.formField} ${styles.formFieldFull}`}>
          I am joining as
          <select value={userType} onChange={(event) => setUserType(event.target.value as InsiderUserType)}>
            <option value="CLIENT">Client</option>
            <option value="ARTIST">Creative</option>
          </select>
        </label>
      </div>

      <button type="submit" className={styles.primaryHeroBtn} disabled={!canSubmit}>
        {status === "submitting" ? "Joining..." : "Join early access"}
      </button>

      {message ? (
        <div className={styles.formStatus} data-tone={status === "success" ? "success" : "error"} role={status === "error" ? "alert" : "status"}>
          <p>{message}</p>
          {status === "success" ? (
            <div className={styles.socialActions}>
              <a href="https://instagram.com/vendr.studio" target="_blank" rel="noreferrer">Follow Instagram</a>
              <a href="https://tiktok.com/@vendr.studio" target="_blank" rel="noreferrer">Follow TikTok</a>
            </div>
          ) : null}
          {result?.insiderStatus === "VERIFIED" ? (
            <p>Your invite link: {result.inviteLink}</p>
          ) : null}
        </div>
      ) : null}
    </form>
  );
}
