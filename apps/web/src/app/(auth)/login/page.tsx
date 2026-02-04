"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "./page.module.css";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/dashboard";

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
        onSubmit={(event) => {
          event.preventDefault();
          localStorage.setItem("vendrman_token", "dev-token");
          router.push(next);
        }}
      >
        <div className={styles.field}>
          <label>Email</label>
          <input type="email" placeholder="you@email.com" />
        </div>

        <div className={styles.field}>
          <label>Password</label>
          <input type="password" placeholder="••••••••" />
        </div>

        <div className={styles.row}>
          <label className={styles.checkbox}>
            <input type="checkbox" />
            Remember me
          </label>
          <Link className={styles.link} href="#">
            Forgot password?
          </Link>
        </div>

        <button className={styles.primary} type="submit">
          <span className="material-symbols-outlined">login</span>
          Sign in
        </button>

        <div className={styles.divider}>
          <span>or continue with</span>
        </div>

        <div className={styles.socials}>
          <button type="button">
            <span className="material-symbols-outlined">mail</span>
            Google
          </button>
          <button type="button">
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
