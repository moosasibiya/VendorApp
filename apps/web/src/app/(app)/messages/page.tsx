import styles from "./page.module.css";

export default function MessagesPage() {
  return (
    <main className={styles.page}>
      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <div className={styles.search}>
            <span className="material-symbols-outlined">search</span>
            <input placeholder="Search conversations" />
          </div>
          <div className={styles.tabs}>
            {"Current,Upcoming,Requests,Completed".split(",").map((tab) => (
              <button key={tab} className={styles.tabBtn}>
                {tab}
              </button>
            ))}
          </div>
          <div className={styles.conversations}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className={styles.conversation}>
                <div className={styles.avatar}>JD</div>
                <div>
                  <div className={styles.name}>Jade Designs</div>
                  <div className={styles.preview}>We loved the draft...</div>
                </div>
                <span className={styles.time}>2h</span>
              </div>
            ))}
          </div>
        </aside>

        <section className={styles.thread}>
          <div className={styles.threadHeader}>
            <div>
              <h2>Jade Designs</h2>
              <p>Online ? Project: Brand refresh</p>
            </div>
            <div className={styles.threadActions}>
              <button type="button">
                <span className="material-symbols-outlined">info</span>
              </button>
              <button type="button">
                <span className="material-symbols-outlined">more_vert</span>
              </button>
            </div>
          </div>
          <div className={styles.messages}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className={i % 2 === 0 ? styles.msgIncoming : styles.msgOutgoing}
              >
                <p>Here is the latest update for the campaign assets.</p>
                <span>2:3{i} PM</span>
              </div>
            ))}
          </div>
          <div className={styles.compose}>
            <textarea placeholder="Write a message..." />
            <div className={styles.composeActions}>
              <button type="button">
                <span className="material-symbols-outlined">attach_file</span>
              </button>
              <button type="button" className={styles.sendBtn}>
                <span className="material-symbols-outlined">send</span>
              </button>
            </div>
          </div>
        </section>

        <aside className={styles.details}>
          <h3>Job Details</h3>
          <div className={styles.detailCard}>
            <p className={styles.detailLabel}>Event</p>
            <p>Brand refresh shoot</p>
            <p className={styles.detailLabel}>Location</p>
            <p>Sandton</p>
            <p className={styles.detailLabel}>Budget</p>
            <p>R18,000</p>
            <button type="button">View booking</button>
          </div>
        </aside>
      </div>
    </main>
  );
}
