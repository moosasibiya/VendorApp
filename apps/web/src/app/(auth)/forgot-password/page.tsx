"use client";

import Link from "next/link";
import { useState } from "react";
import { ApiError, requestPasswordReset } from "@/lib/api";
import styles from "../flow.module.css";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <div className={styles.stack}>
      <div className={styles.copy}>
        <p className={styles.kicker}>Password reset</p>
        <h1 className={styles.title}>Reset your password</h1>
        <p className={styles.muted}>
          Enter the email you use for VendorApp and we&apos;ll send you a reset link.
        </p>
      </div>

      <form
        className={styles.form}
        onSubmit={async (event) => {
          event.preventDefault();
          setError(null);
          setSuccess(null);

          if (!email.trim()) {
            setError("Email is required.");
            return;
          }

          setIsSubmitting(true);
          try {
            await requestPasswordReset(email.trim());
            setSuccess("If that email exists, a reset link has been sent.");
          } catch (err) {
            if (err instanceof ApiError) {
              setError(err.message);
            } else {
              setError("Unable to request a password reset right now.");
            }
          } finally {
            setIsSubmitting(false);
          }
        }}
      >
        {error ? <div className={styles.error}>{error}</div> : null}
        {success ? <div className={styles.success}>{success}</div> : null}

        <label className={styles.field}>
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            placeholder="you@email.com"
          />
        </label>

        <button className={styles.primary} type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Sending..." : "Send reset link"}
        </button>

        <div className={styles.row}>
          <Link href="/login" className={styles.link}>
            Back to login
          </Link>
        </div>
      </form>
    </div>
  );
}
