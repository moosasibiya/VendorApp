"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { ApiError, resetPassword } from "@/lib/api";
import styles from "../flow.module.css";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className={styles.info}>Loading reset link...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = useMemo(() => searchParams.get("token")?.trim() ?? "", [searchParams]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <div className={styles.stack}>
      <div className={styles.copy}>
        <p className={styles.kicker}>Password reset</p>
        <h1 className={styles.title}>Choose a new password</h1>
        <p className={styles.muted}>
          Set a new password for your VendorApp account. Reset links expire after one hour.
        </p>
      </div>

      <form
        className={styles.form}
        onSubmit={async (event) => {
          event.preventDefault();
          setError(null);
          setSuccess(null);

          if (!token) {
            setError("This reset link is missing or invalid.");
            return;
          }
          if (password.length < 8) {
            setError("Password must be at least 8 characters.");
            return;
          }
          if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
          }

          setIsSubmitting(true);
          try {
            await resetPassword({ token, newPassword: password });
            setSuccess("Password updated. You can sign in now.");
            setPassword("");
            setConfirmPassword("");
          } catch (err) {
            setError(err instanceof ApiError ? err.message : "Unable to reset your password right now.");
          } finally {
            setIsSubmitting(false);
          }
        }}
      >
        {error ? <div className={styles.error}>{error}</div> : null}
        {success ? <div className={styles.success}>{success}</div> : null}

        <label className={styles.field}>
          New password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
            placeholder="New password"
          />
        </label>

        <label className={styles.field}>
          Confirm password
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            autoComplete="new-password"
            placeholder="Confirm password"
          />
        </label>

        <button className={styles.primary} type="submit" disabled={isSubmitting || !token}>
          {isSubmitting ? "Saving..." : "Update password"}
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
