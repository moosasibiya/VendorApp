import styles from "./page.module.css";

function StatCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: string;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className={styles.stat}>
      <div className={styles.statIcon}>
        <span className="material-symbols-outlined">{icon}</span>
      </div>
      <div className={styles.statLabel}>{label}</div>
      <div className={styles.statValue}>{value}</div>
      <div className={styles.statHint}>{hint}</div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <main className={styles.page}>
      <section className={styles.stats}>
        <StatCard
          icon="groups"
          label="Creatives"
          value="128"
          hint="Verified profiles available"
        />
        <StatCard
          icon="event"
          label="Bookings"
          value="24"
          hint="Active this month"
        />
        <StatCard
          icon="star"
          label="Avg rating"
          value="4.8"
          hint="From recent clients"
        />
        <StatCard
          icon="payments"
          label="Revenue"
          value="R 42,300"
          hint="Estimated this month"
        />
      </section>

      <section className={styles.grid}>
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <div className={styles.panelTitle}>Recent activity</div>
              <div className={styles.panelSub}>Your latest actions</div>
            </div>
            <button className={styles.ghostBtn} type="button">
              View all
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>

          <div className={styles.list}>
            <div className={styles.listItem}>
              <span className="material-symbols-outlined">check_circle</span>
              <div className={styles.listMain}>
                <div className={styles.listTitle}>Booking confirmed</div>
                <div className={styles.listSub}>Johannesburg • 2 hours ago</div>
              </div>
              <div className={styles.pillGood}>Done</div>
            </div>

            <div className={styles.listItem}>
              <span className="material-symbols-outlined">pending</span>
              <div className={styles.listMain}>
                <div className={styles.listTitle}>Quote requested</div>
                <div className={styles.listSub}>Sandton • Yesterday</div>
              </div>
              <div className={styles.pillWarn}>Pending</div>
            </div>

            <div className={styles.listItem}>
              <span className="material-symbols-outlined">campaign</span>
              <div className={styles.listMain}>
                <div className={styles.listTitle}>Profile boosted</div>
                <div className={styles.listSub}>Campaign • 3 days ago</div>
              </div>
              <div className={styles.pill}>Info</div>
            </div>
          </div>
        </div>

        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <div className={styles.panelTitle}>Quick actions</div>
              <div className={styles.panelSub}>Get stuff done fast</div>
            </div>
          </div>

          <div className={styles.actions}>
            <a className={styles.actionBtn} href="#">
              <span className="material-symbols-outlined">person_add</span>
              Add creative
            </a>
            <a className={styles.actionBtn} href="#">
              <span className="material-symbols-outlined">post_add</span>
              Create booking
            </a>
            <a className={styles.actionBtn} href="#">
              <span className="material-symbols-outlined">tune</span>
              Filters
            </a>
            <a className={styles.actionBtn} href="#">
              <span className="material-symbols-outlined">settings</span>
              Settings
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
