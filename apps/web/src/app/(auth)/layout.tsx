import Link from "next/link";
import styles from "./auth.module.css";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <aside className={styles.intro}>
          <Link href="/" className={styles.logo}>
            Vendr<span>Man</span>
          </Link>
          <p className={styles.kicker}>Trusted creative marketplace</p>
          <h1 className={styles.title}>Built for premium bookings, trust, and rollout control.</h1>
          <p className={styles.copy}>
            Secure onboarding, verified identities, payment visibility, and
            centralized support all live in one premium workspace.
          </p>
          <div className={styles.points}>
            <div>Verified creative profiles before launch access</div>
            <div>Clear payout and dispute-state visibility</div>
            <div>Support threads that stay inside platform messaging</div>
          </div>
        </aside>

        <section className={styles.formPanel}>
          <div className={styles.header}>
            <div className={styles.headerLabel}>Access</div>
            <div className={styles.headerCopy}>Sign in or create an account</div>
          </div>
          <div className={styles.body}>{children}</div>
        </section>
      </div>
    </div>
  );
}
