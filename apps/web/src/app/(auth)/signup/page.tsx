"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

export default function SignupPage() {
  const router = useRouter();

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
        onSubmit={(event) => {
          event.preventDefault();
          localStorage.setItem("vendrman_token", "dev-token");
          router.push("/onboarding");
        }}
      >
        <div className={styles.grid}>
          <label className={styles.field}>
            Full name
            <input placeholder="Moosa Sibiya" />
          </label>

          <label className={styles.field}>
            Username
            <input placeholder="@moosa" />
          </label>
        </div>

        <label className={styles.field}>
          Email
          <input type="email" placeholder="you@email.com" />
        </label>

        <div className={styles.grid}>
          <label className={styles.field}>
            Password
            <input type="password" placeholder="••••••••" />
          </label>
          <label className={styles.field}>
            Confirm password
            <input type="password" placeholder="••••••••" />
          </label>
        </div>

        <label className={styles.field}>
          Account type
          <select>
            <option>Creative</option>
            <option>Client</option>
            <option>Agency</option>
          </select>
        </label>

        <label className={styles.checkbox}>
          <input type="checkbox" /> I agree to the Terms of Service and Privacy
          Policy.
        </label>

        <button className={styles.primary} type="submit">
          <span className="material-symbols-outlined">person_add</span>
          Create account
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
