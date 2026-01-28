import styles from "./page.module.css";

export default function SettingsPage() {
  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Settings</h1>
      <p className={styles.sub}>Brand, profile, and platform configuration.</p>

      <div className={styles.panel}>
        <div className={styles.row}>
          <div>
            <div className={styles.rowTitle}>Theme</div>
            <div className={styles.rowSub}>Dark gradient dashboard</div>
          </div>
          <button className={styles.ghostBtn} type="button">
            Change
          </button>
        </div>

        <div className={styles.row}>
          <div>
            <div className={styles.rowTitle}>Notifications</div>
            <div className={styles.rowSub}>Email and in-app alerts</div>
          </div>
          <button className={styles.ghostBtn} type="button">
            Manage
          </button>
        </div>
      </div>
    </main>
  );
}
