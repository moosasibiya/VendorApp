import styles from "./page.module.css";

const sections = [
  "Account & Profile",
  "Verification & Compliance",
  "Payments & Wallet",
  "Bookings & Availability",
  "Notifications",
  "Privacy & Security",
  "Communication Preferences",
  "Support & Legal",
];

export default function SettingsPage() {
  return (
    <main className={styles.page}>
      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <h1>Settings</h1>
          <nav>
            {sections.map((section) => (
              <button key={section} className={styles.navBtn}>
                {section}
              </button>
            ))}
          </nav>
        </aside>

        <section className={styles.content}>
          <div className={styles.section}>
            <h2>Account & Profile</h2>
            <div className={styles.formGrid}>
              <label>
                Full Name
                <input placeholder="Maria Soto" />
              </label>
              <label>
                Email
                <input placeholder="maria@vendrman.co.za" />
              </label>
              <label>
                Phone
                <input placeholder="+27 82 000 1234" />
              </label>
              <label>
                Account Type
                <input placeholder="Artist" disabled />
              </label>
            </div>
          </div>

          <div className={styles.section}>
            <h2>Verification & Compliance</h2>
            <div className={styles.notice}>Status: Pending KYC verification</div>
            <button className={styles.ghostBtn}>Upload documents</button>
          </div>

          <div className={styles.section}>
            <h2>Payments & Wallet</h2>
            <div className={styles.formGrid}>
              <label>
                Payout Frequency
                <input placeholder="Monthly" />
              </label>
              <label>
                Primary Bank
                <input placeholder="ABSA ? **** 8921" />
              </label>
            </div>
          </div>

          <div className={styles.section}>
            <h2>Bookings & Availability</h2>
            <div className={styles.formGrid}>
              <label>
                Minimum lead time
                <input placeholder="7 days" />
              </label>
              <label>
                Max bookings/month
                <input placeholder="10" />
              </label>
            </div>
          </div>

          <div className={styles.section}>
            <h2>Notifications</h2>
            <div className={styles.toggleList}>
              {[
                "Email notifications",
                "Push notifications",
                "SMS alerts",
              ].map((label) => (
                <label key={label} className={styles.toggle}>
                  <input type="checkbox" /> {label}
                </label>
              ))}
            </div>
          </div>

          <div className={styles.section}>
            <h2>Privacy & Security</h2>
            <div className={styles.formGrid}>
              <label>
                Current password
                <input type="password" />
              </label>
              <label>
                New password
                <input type="password" />
              </label>
            </div>
            <button className={styles.ghostBtn}>Enable 2FA</button>
          </div>

          <div className={styles.section}>
            <h2>Communication Preferences</h2>
            <div className={styles.formGrid}>
              <label>
                Who can message you
                <input placeholder="Clients only" />
              </label>
              <label>
                Response time expectation
                <input placeholder="Within 12 hours" />
              </label>
            </div>
          </div>

          <div className={styles.section}>
            <h2>Support & Legal</h2>
            <div className={styles.linkGrid}>
              <button>Help centre</button>
              <button>Report a problem</button>
              <button>Terms of service</button>
              <button>Privacy policy</button>
            </div>
          </div>

          <div className={styles.saveBar}>
            <button className={styles.ghostBtn}>Cancel</button>
            <button className={styles.primaryBtn}>Save Changes</button>
          </div>
        </section>
      </div>
    </main>
  );
}
