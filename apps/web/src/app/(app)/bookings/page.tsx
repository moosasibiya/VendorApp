import styles from "./page.module.css";

export default function BookingsPage() {
  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Bookings</h1>
      <p className={styles.sub}>Track new, active, and completed bookings.</p>

      <div className={styles.panel}>
        <div className={styles.rowHeader}>
          <div className={styles.h}>Latest bookings</div>
          <button className={styles.ghostBtn} type="button">
            View all
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>

        <div className={styles.list}>
          <div className={styles.item}>
            <span className="material-symbols-outlined">event</span>
            <div className={styles.info}>
              <div className={styles.name}>Golf 8R Shoot</div>
              <div className={styles.meta}>Johannesburg • Fri 14:00</div>
            </div>
            <div className={styles.pillWarn}>Pending</div>
          </div>

          <div className={styles.item}>
            <span className="material-symbols-outlined">check_circle</span>
            <div className={styles.info}>
              <div className={styles.name}>Dealer content batch</div>
              <div className={styles.meta}>Sandton • Completed</div>
            </div>
            <div className={styles.pillGood}>Done</div>
          </div>
        </div>
      </div>
    </main>
  );
}
