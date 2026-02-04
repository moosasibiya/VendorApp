import styles from "./page.module.css";

export default function PaymentsPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>Wallet & Payments</h1>
          <p>Track earnings, payouts, and payment methods.</p>
        </div>
      </header>

      <section className={styles.wallet}>
        <div>
          <h2>Wallet Balance</h2>
          <p>Available balance</p>
          <div className={styles.balance}>R28,450</div>
        </div>
        <div className={styles.walletStats}>
          <div>
            <span>Pending payouts</span>
            <strong>R6,200</strong>
          </div>
          <div>
            <span>Next payout</span>
            <strong>15 Aug 2025</strong>
          </div>
          <div>
            <span>Total earned</span>
            <strong>R220,000</strong>
          </div>
        </div>
      </section>

      <section className={styles.grid}>
        <div className={styles.card}>
          <h3>Payment Methods</h3>
          <div className={styles.cardRow}>
            <div>
              <p>Visa ???? 4242</p>
              <span>Primary</span>
            </div>
            <button type="button">Edit</button>
          </div>
          <button type="button" className={styles.ghostBtn}>
            Add payment method
          </button>
        </div>

        <div className={styles.card}>
          <h3>Bank Account</h3>
          <p>ABSA ? **** 8921</p>
          <span>Verified</span>
          <button type="button" className={styles.ghostBtn}>
            Update bank
          </button>
        </div>
      </section>
    </main>
  );
}
