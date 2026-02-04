import styles from "./page.module.css";
import Link from "next/link";

const tabs = ["All", "Pending", "Confirmed", "Completed", "Cancelled"];

export default function BookingsPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>My Bookings</h1>
          <p>Track your upcoming and completed bookings.</p>
        </div>
        <Link className={styles.primaryBtn} href="/bookings/new">
          New Booking
        </Link>
      </header>

      <div className={styles.tabs}>
        {tabs.map((tab, index) => (
          <button
            key={tab}
            className={index === 0 ? styles.tabActive : styles.tabBtn}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className={styles.list}>
        {Array.from({ length: 3 }).map((_, i) => (
          <article key={i} className={styles.card}>
            <div className={styles.avatar}>AK</div>
            <div className={styles.cardBody}>
              <div className={styles.cardHeader}>
                <h3>Ayanda Khumalo</h3>
                <span className={styles.status}>Pending</span>
              </div>
              <p>Wedding shoot ? Cape Town ? 12 Aug 2025</p>
              <div className={styles.meta}>
                <span>R12,000</span>
                <span>3 applications</span>
              </div>
            </div>
            <div className={styles.cardActions}>
              <button>Message</button>
              <button>View Details</button>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
