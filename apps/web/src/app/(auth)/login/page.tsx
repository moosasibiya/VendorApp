"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ApiError, buildGoogleAuthStartUrl, login } from "@/lib/api";
import styles from "./page.module.css";

export default function LoginPage() {
  const router = useRouter();
  const [nextPath, setNextPath] = useState("/dashboard");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const googleAuthUrl = useMemo(
    () =>
      buildGoogleAuthStartUrl({
        mode: "login",
        nextPath,
      }),
    [nextPath],
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const next = params.get("next");
    if (next && next.startsWith("/") && !next.startsWith("//")) {
      setNextPath(next);
    }

    const oauthError = params.get("error");
    if (!oauthError) return;
    if (oauthError === "google_auth") {
      setError("Google sign-in failed. Please try again.");
      return;
    }
    if (oauthError === "missing_code_or_state") {
      setError("Google sign-in was cancelled or interrupted.");
      return;
    }
    setError("Unable to sign in with Google.");
  }, []);

  return (
    <div className={styles.stack}>
      <div className={styles.hero}>
        <p className={styles.kicker}>Welcome back</p>
        <h1 className={styles.title}>Log in to your workspace</h1>
        <p className={styles.muted}>
          Manage bookings, messages, and payments with your creative team.
        </p>
      </div>

      <form
        className={styles.form}
        onSubmit={async (event) => {
          event.preventDefault();
          setError(null);

          if (!email.trim() || !password.trim()) {
            setError("Email and password are required.");
            return;
          }

          setIsSubmitting(true);
          try {
            await login({
              email: email.trim(),
              password,
            });
            router.push(nextPath);
          } catch (err) {
            if (err instanceof ApiError) {
              setError(err.message);
            } else {
              setError("Unable to sign in right now.");
            }
          } finally {
            setIsSubmitting(false);
          }
        }}
      >
        {error ? <div className={styles.error}>{error}</div> : null}

        <div className={styles.field}>
          <label>Email</label>
          <input
            type="email"
            placeholder="you@email.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
          />
        </div>

        <div className={styles.field}>
          <label>Password</label>
          <input
            type="password"
            placeholder="********"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
          />
        </div>

        <div className={styles.row}>
          <div />
          <Link className={styles.link} href="#">
            Forgot password?
          </Link>
        </div>

        <button className={styles.primary} type="submit" disabled={isSubmitting}>
          <span className="material-symbols-outlined">login</span>
          {isSubmitting ? "Signing in..." : "Sign in"}
        </button>

        <div className={styles.divider}>
          <span>or continue with</span>
        </div>

        <div className={styles.socials}>
          <button
            type="button"
            onClick={() => {
              window.location.assign(googleAuthUrl);
            }}
            disabled={isSubmitting}
          >
            <span className="material-symbols-outlined">mail</span>
            Google
          </button>
          <button type="button" disabled>
            <span className="material-symbols-outlined">public</span>
            LinkedIn
          </button>
        </div>

        <div className={styles.footer}>
          <span>New here?</span>
          <Link className={styles.link} href="/signup">
            Create an account
          </Link>
          <Link className={styles.link} href="/">
            Back to home
          </Link>
        </div>
      </form>
    </div>
  );
}
