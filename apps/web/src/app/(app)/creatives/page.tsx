import styles from "./page.module.css";

export default function CreativesPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Creatives</h1>
          <p className={styles.sub}>
            Browse, verify, and manage creative profiles.
          </p>
        </div>

        <div className={styles.actions}>
          <button className={styles.ghostBtn} type="button">
            <span className="material-symbols-outlined">tune</span>
            Filters
          </button>
          <button className={styles.primaryBtn} type="button">
            <span className="material-symbols-outlined">person_add</span>
            Add creative
          </button>
        </div>
      </header>

      <section className={styles.grid}>
        <div className={styles.card}>
          <div className={styles.cardTop}>
            <div className={styles.avatar}>PJ</div>
            <div className={styles.cardInfo}>
              <div className={styles.name}>Primo Jay</div>
              <div className={styles.meta}>Photographer • Johannesburg</div>
            </div>
            <div className={styles.pillGood}>Verified</div>
          </div>

          <div className={styles.cardBottom}>
            <div className={styles.stat}>
              <div className={styles.statLabel}>Bookings</div>
              <div className={styles.statValue}>14</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statLabel}>Rating</div>
              <div className={styles.statValue}>4.9</div>
            </div>
            <button className={styles.smallBtn} type="button">
              View profile
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardTop}>
            <div className={styles.avatarAlt}>KM</div>
            <div className={styles.cardInfo}>
              <div className={styles.name}>Kamo Media</div>
              <div className={styles.meta}>Videographer • Sandton</div>
            </div>
            <div className={styles.pillWarn}>Pending</div>
          </div>

          <div className={styles.cardBottom}>
            <div className={styles.stat}>
              <div className={styles.statLabel}>Bookings</div>
              <div className={styles.statValue}>6</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statLabel}>Rating</div>
              <div className={styles.statValue}>4.7</div>
            </div>
            <button className={styles.smallBtn} type="button">
              Review
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
