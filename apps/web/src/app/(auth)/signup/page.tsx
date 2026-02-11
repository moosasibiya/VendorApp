"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { AccountType } from "@vendorapp/shared";
import { ApiError, signup } from "@/lib/api";
import styles from "./page.module.css";

const AUTH_TOKEN_KEY = "vendrman_token";

export default function SignupPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [accountType, setAccountType] = useState<AccountType>("CREATIVE");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <div className={styles.stack}>
      <div className={styles.hero}>
        <p className={styles.kicker}>Create your profile</p>
        <h1 className={styles.title}>Join VendrMan</h1>
        <p className={styles.muted}>
          Build a profile, showcase your work, and start accepting bookings.
        </p>
      </div>

      <form
        className={styles.form}
        onSubmit={async (event) => {
          event.preventDefault();
          setError(null);

          if (!fullName.trim() || !username.trim() || !email.trim()) {
            setError("Full name, username, and email are required.");
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
          if (!acceptedTerms) {
            setError("You must accept the Terms of Service and Privacy Policy.");
            return;
          }

          setIsSubmitting(true);
          try {
            const response = await signup({
              fullName: fullName.trim(),
              username: username.trim().replace(/^@+/, ""),
              email: email.trim(),
              password,
              accountType,
            });
            localStorage.setItem(AUTH_TOKEN_KEY, response.token);
            router.push("/onboarding");
          } catch (err) {
            if (err instanceof ApiError) {
              setError(err.message);
            } else {
              setError("Unable to create account right now.");
            }
          } finally {
            setIsSubmitting(false);
          }
        }}
      >
        {error ? <div className={styles.error}>{error}</div> : null}

        <div className={styles.grid}>
          <label className={styles.field}>
            Full name
            <input
              placeholder="Moosa Sibiya"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              autoComplete="name"
            />
          </label>

          <label className={styles.field}>
            Username
            <input
              placeholder="moosa"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
            />
          </label>
        </div>

        <label className={styles.field}>
          Email
          <input
            type="email"
            placeholder="you@email.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
          />
        </label>

        <div className={styles.grid}>
          <label className={styles.field}>
            Password
            <input
              type="password"
              placeholder="********"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
            />
          </label>
          <label className={styles.field}>
            Confirm password
            <input
              type="password"
              placeholder="********"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
            />
          </label>
        </div>

        <label className={styles.field}>
          Account type
          <select
            value={accountType}
            onChange={(event) => setAccountType(event.target.value as AccountType)}
          >
            <option value="CREATIVE">Creative</option>
            <option value="CLIENT">Client</option>
            <option value="AGENCY">Agency</option>
          </select>
        </label>

        <label className={styles.checkbox}>
          <input
            type="checkbox"
            checked={acceptedTerms}
            onChange={(event) => setAcceptedTerms(event.target.checked)}
          />
          I agree to the Terms of Service and Privacy Policy.
        </label>

        <button className={styles.primary} type="submit" disabled={isSubmitting}>
          <span className="material-symbols-outlined">person_add</span>
          {isSubmitting ? "Creating account..." : "Create account"}
        </button>

        <div className={styles.footer}>
          <span>Already have an account?</span>
          <Link className={styles.link} href="/login">
            Sign in
          </Link>
          <Link className={styles.link} href="/">
            Back to home
          </Link>
        </div>
      </form>
    </div>
  );
}
