import styles from "./page.module.css";

export default function PaymentsPage() {
  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Payments</h1>
      <p className={styles.sub}>Payouts, invoices, and earnings overview.</p>

      <div className={styles.grid}>
        <div className={styles.box}>
          <div className={styles.label}>This month</div>
          <div className={styles.value}>R 42,300</div>
          <div className={styles.muted}>Estimated earnings</div>
        </div>

        <div className={styles.box}>
          <div className={styles.label}>Pending payouts</div>
          <div className={styles.value}>R 8,100</div>
          <div className={styles.muted}>Waiting approval</div>
        </div>

        <div className={styles.box}>
          <div className={styles.label}>Invoices</div>
          <div className={styles.value}>12</div>
          <div className={styles.muted}>Generated</div>
        </div>
      </div>
    </main>
  );
}
