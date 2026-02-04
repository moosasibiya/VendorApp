import styles from "./page.module.css";

export default function ReviewsPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>Ratings & Reviews</h1>
          <p>Track feedback, star breakdowns, and response activity.</p>
        </div>
      </header>

      <section className={styles.stats}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>4.9</div>
          <div className={styles.statLabel}>Average Rating</div>
          <div className={styles.statHint}>From 214 reviews</div>
        </div>
        <div className={styles.breakdown}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={styles.breakRow}>
              <span>{5 - i}?</span>
              <div className={styles.bar}>
                <div className={styles.fill} style={{ width: `${80 - i * 12}%` }} />
              </div>
              <span>{80 - i * 12}%</span>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.list}>
        {Array.from({ length: 4 }).map((_, i) => (
          <article key={i} className={styles.reviewCard}>
            <div className={styles.reviewHeader}>
              <div className={styles.avatar}>LK</div>
              <div>
                <h3>Lebo K.</h3>
                <p>Brand shoot ? June 2025</p>
              </div>
              <div className={styles.rating}>? 4.{i + 5}</div>
            </div>
            <p>
              The visuals were stunning, communication was clear, and delivery
              was fast. We will book again.
            </p>
            <button type="button">Respond</button>
          </article>
        ))}
      </section>
    </main>
  );
}
