"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { ApiError, login } from "@/lib/api";
import styles from "./page.module.css";

const AUTH_TOKEN_KEY = "vendrman_token";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
            const response = await login({
              email: email.trim(),
              password,
            });
            if (rememberMe) {
              localStorage.setItem(AUTH_TOKEN_KEY, response.token);
            } else {
              sessionStorage.setItem(AUTH_TOKEN_KEY, response.token);
              localStorage.removeItem(AUTH_TOKEN_KEY);
            }
            router.push(next);
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
          <label className={styles.checkbox}>
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(event) => setRememberMe(event.target.checked)}
            />
            Remember me
          </label>
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
          <button type="button" disabled>
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
