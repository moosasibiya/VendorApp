import Link from "next/link";
import styles from "./auth.module.css";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <div className={styles.header}>
          <Link href="/" className={styles.logo}>
            Vendr<span>Man</span>
          </Link>
          <div className={styles.sub}>Sign in or create an account</div>
        </div>

        <div className={styles.body}>{children}</div>
      </div>
    </div>
  );
}
