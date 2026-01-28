import styles from "./auth.module.css";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.logo}>
            Vendr<span>Man</span>
          </div>
          <div className={styles.sub}>Sign in or create an account</div>
        </div>

        <div className={styles.body}>{children}</div>
      </div>
    </div>
  );
}
