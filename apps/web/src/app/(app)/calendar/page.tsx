import styles from "./page.module.css";

export default function CalendarPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>Calendar</h1>
          <p>Manage availability, bookings, and blocked dates.</p>
        </div>
        <div className={styles.controls}>
          <button>Month</button>
          <button>Week</button>
          <button>Day</button>
        </div>
      </header>

      <section className={styles.calendar}>
        {Array.from({ length: 35 }).map((_, i) => (
          <div key={i} className={styles.cell}>
            <span>{i + 1}</span>
            <div className={styles.event}>Booking</div>
          </div>
        ))}
      </section>
    </main>
  );
}
