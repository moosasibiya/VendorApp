import styles from "./page.module.css";
import Link from "next/link";

const navItems = [
  { label: "Messages", href: "/messages" },
  { label: "Payments", href: "/payments" },
  { label: "Bookings", href: "/bookings" },
  { label: "Ratings", href: "/reviews" },
  { label: "Settings", href: "/settings" },
];

export default function ArtistProfilePage() {
  return (
    <main className={styles.page}>
      <section className={styles.shell}>
        <aside className={styles.sideNav}>
          <div className={styles.welcome}>
            Welcome <span>Ayanda</span>
          </div>
          <nav>
            {navItems.map((item) => (
              <Link key={item.label} href={item.href}>
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <div className={styles.main}>
          <div className={styles.profileCard}>
            <div className={styles.header}>
              <div>
                <p className={styles.kicker}>Creative Profile</p>
                <h1 className={styles.title}>Ayanda Khumalo</h1>
                <p className={styles.username}>@ayanda</p>
              </div>
              <div className={styles.avatar}>AK</div>
            </div>

            <div className={styles.metaRow}>
              <span className={styles.badge}>Photographer</span>
              <span className={styles.badgeAlt}>Cape Town</span>
              <span className={styles.badgeAlt}>Available this week</span>
            </div>

            <div className={styles.stats}>
              <div>
                <div className={styles.statValue}>1.2k</div>
                <div className={styles.statLabel}>Followers</div>
              </div>
              <div>
                <div className={styles.statValue}>4.9</div>
                <div className={styles.statLabel}>Rating</div>
              </div>
              <div>
                <div className={styles.statValue}>142</div>
                <div className={styles.statLabel}>Bookings</div>
              </div>
            </div>

            <p className={styles.bio}>
              South African storyteller capturing weddings, brands, and editorial
              portraits with a cinematic eye. Serving Western Cape & Gauteng.
            </p>

            <div className={styles.tags}>
              <span>Wedding</span>
              <span>Editorial</span>
              <span>Portrait</span>
              <span>Luxury</span>
            </div>

            <div className={styles.actions}>
              <button className={styles.primaryBtn}>Book Now</button>
              <button className={styles.ghostBtn}>Message</button>
              <button className={styles.ghostBtn}>View Portfolio</button>
            </div>
          </div>

          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2>Portfolio</h2>
              <div className={styles.filters}>
                <button className={styles.filterActive}>All</button>
                <button>Wedding</button>
                <button>Corporate</button>
                <button>Portraits</button>
              </div>
            </div>
            <div className={styles.portfolioGrid}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className={styles.portfolioCard}>
                  <div className={styles.portfolioBadge}>24 Photos</div>
                  <div>
                    <h3>Project {i + 1}</h3>
                    <p>June 2025 ? Cape Town</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className={styles.rightCol}>
          <div className={styles.infoCard}>
            <h3>Notifications</h3>
            <p>2 pending requests</p>
            <p>1 upcoming booking</p>
            <p>3 new messages</p>
          </div>
          <div className={styles.infoCard}>
            <h3>Dashboard summary</h3>
            <div className={styles.summaryRow}>
              <span>Total sales</span>
              <strong>R84,200</strong>
            </div>
            <div className={styles.summaryRow}>
              <span>Total bookings</span>
              <strong>142</strong>
            </div>
            <div className={styles.summaryRow}>
              <span>Upcoming</span>
              <strong>6</strong>
            </div>
            <button className={styles.ghostBtn}>Open dashboard</button>
          </div>
        </aside>
      </section>
    </main>
  );
}
