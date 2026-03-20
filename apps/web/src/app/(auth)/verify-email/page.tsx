"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ApiError, resendVerificationEmail, verifyEmail } from "@/lib/api";
import styles from "../flow.module.css";

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className={styles.info}>Loading verification flow...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = useMemo(() => searchParams.get("token")?.trim() ?? "", [searchParams]);
  const emailQuery = useMemo(() => searchParams.get("email")?.trim() ?? "", [searchParams]);
  const redirectVerified = useMemo(() => searchParams.get("verified") === "1", [searchParams]);
  const redirectError = useMemo(() => searchParams.get("error")?.trim() ?? "", [searchParams]);
  const [email, setEmail] = useState(emailQuery);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(redirectVerified);
  const [isVerifying, setIsVerifying] = useState(Boolean(token));
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    setEmail(emailQuery);
  }, [emailQuery]);

  useEffect(() => {
    if (redirectVerified) {
      setIsVerified(true);
      setIsVerifying(false);
      setError(null);
      setSuccess("Email verified. You can sign in now.");
      return;
    }

    if (!token) {
      setIsVerified(false);
      setIsVerifying(false);
      setSuccess(null);
      setError(redirectError ? getVerifyEmailErrorMessage(redirectError) : null);
      return;
    }

    let cancelled = false;
    void (async () => {
      setIsVerified(false);
      setIsVerifying(true);
      setError(null);
      setSuccess(null);
      try {
        const result = await verifyEmail(token);
        if (!cancelled) {
          setEmail(result.email);
          setIsVerified(true);
          setSuccess("Email verified. You can sign in now.");
        }
      } catch (err) {
        if (!cancelled) {
          setIsVerified(false);
          setError(err instanceof ApiError ? err.message : "Unable to verify your email right now.");
        }
      } finally {
        if (!cancelled) {
          setIsVerifying(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [redirectError, redirectVerified, token]);

  return (
    <div className={styles.stack}>
      <div className={styles.copy}>
        <p className={styles.kicker}>Email verification</p>
        <h1 className={styles.title}>Verify your email address</h1>
        <p className={styles.muted}>
          Check your inbox for the verification link. If the email did not arrive, you can resend it here.
        </p>
      </div>

      <form
        className={styles.form}
        onSubmit={async (event) => {
          event.preventDefault();
          setError(null);
          setSuccess(null);

          if (!email.trim()) {
            setError("Email is required to resend verification.");
            return;
          }

          setIsResending(true);
          try {
            await resendVerificationEmail(email.trim());
            setSuccess("Verification email sent. Check your inbox.");
          } catch (err) {
            setError(err instanceof ApiError ? err.message : "Unable to resend the verification email right now.");
          } finally {
            setIsResending(false);
          }
        }}
      >
        {isVerifying ? <div className={styles.info}>Verifying your email...</div> : null}
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

        {isVerified ? (
          <Link
            className={styles.secondary}
            href={email ? `/login?email=${encodeURIComponent(email)}` : "/login"}
          >
            Continue to login
          </Link>
        ) : (
          <button className={styles.primary} type="submit" disabled={isResending || isVerifying}>
            {isResending ? "Sending..." : "Resend verification email"}
          </button>
        )}

        <div className={styles.row}>
          <Link href="/login" className={styles.link}>
            Back to login
          </Link>
        </div>
      </form>
    </div>
  );
}

function getVerifyEmailErrorMessage(code: string): string {
  switch (code) {
    case "missing_token":
      return "The verification link is missing a token.";
    case "invalid_or_expired":
      return "This verification link is invalid or has expired. Request a new one below.";
    default:
      return "Unable to verify your email right now.";
  }
}
