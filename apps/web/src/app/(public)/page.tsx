import styles from "./page.module.css";

export default function PublicHomePage() {
  return (
    <main className={styles.page}>
      <div className={styles.hero}>
        <div className={styles.badge}>
          <span className="material-symbols-outlined">auto_awesome</span>
          VendrMan • Marketplace for creatives
        </div>

        <h1 className={styles.title}>
          Find your perfect <span className={styles.grad}>Photographer</span>,
          <span className={styles.grad}> Videographer</span> & more.
        </h1>

        <p className={styles.subtitle}>
          A clean, modern platform layout — built with Next.js + TypeScript +
          CSS Modules.
        </p>

        <div className={styles.actions}>
          <a className={styles.primary} href="/dashboard">
            <span className="material-symbols-outlined">dashboard</span>
            Go to Dashboard
          </a>
          <a className={styles.secondary} href="/auth/login">
            <span className="material-symbols-outlined">login</span>
            Login
          </a>
        </div>

        <div className={styles.grid}>
          <div className={styles.card}>
            <div className={styles.cardIcon}>
              <span className="material-symbols-outlined">shield</span>
            </div>
            <div className={styles.cardTitle}>Reliable structure</div>
            <div className={styles.cardText}>
              Pages + layouts are organised using route groups.
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardIcon}>
              <span className="material-symbols-outlined">palette</span>
            </div>
            <div className={styles.cardTitle}>CSS Modules</div>
            <div className={styles.cardText}>
              Styles are scoped to components so nothing “leaks”.
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardIcon}>
              <span className="material-symbols-outlined">bolt</span>
            </div>
            <div className={styles.cardTitle}>Fast iteration</div>
            <div className={styles.cardText}>
              Easy to extend into real data + auth later.
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
