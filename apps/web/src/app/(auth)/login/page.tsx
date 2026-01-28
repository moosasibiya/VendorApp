"use client";

import Link from "next/link";
import styles from "./page.module.css";

export default function LoginPage() {
  return (
    <div className={styles.stack}>
      <h1 className={styles.title}>Login</h1>
      <p className={styles.muted}>This is a UI-only screen for now.</p>

      <form className={styles.form}>
        <label className={styles.label}>
          Email
          <input
            className={styles.input}
            type="email"
            placeholder="you@email.com"
          />
        </label>

        <label className={styles.label}>
          Password
          <input
            className={styles.input}
            type="password"
            placeholder="••••••••"
          />
        </label>

        <button
          className={styles.primary}
          type="button"
          onClick={() => {
            localStorage.setItem("vendrman_token", "dev-token");
            window.location.href = "/dashboard";
          }}
        >
          <span className="material-symbols-outlined">login</span>
          Sign in
        </button>

        <div className={styles.row}>
          <Link className={styles.link} href="/auth/signup">
            Create account
          </Link>
          <Link className={styles.link} href="/">
            Back to home
          </Link>
        </div>
      </form>
    </div>
  );
}
