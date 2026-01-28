import styles from "./page.module.css";

export default function SignupPage() {
  return (
    <div className={styles.stack}>
      <h1 className={styles.title}>Create account</h1>
      <p className={styles.muted}>UI-only screen for now — wire auth later.</p>

      <form className={styles.form}>
        <label className={styles.label}>
          Full name
          <input className={styles.input} placeholder="Moosa Sibiya" />
        </label>

        <label className={styles.label}>
          Email
          <input className={styles.input} type="email" placeholder="you@email.com" />
        </label>

        <label className={styles.label}>
          Password
          <input className={styles.input} type="password" placeholder="••••••••" />
        </label>

        <button className={styles.primary} type="button">
          <span className="material-symbols-outlined">person_add</span>
          Create account
        </button>

        <div className={styles.row}>
          <a className={styles.link} href="/auth/login">Already have an account?</a>
          <a className={styles.link} href="/">Back to home</a>
        </div>
      </form>
    </div>
  );
}
