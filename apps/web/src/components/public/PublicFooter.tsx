import Link from "next/link";
import styles from "./PublicFooter.module.css";

export default function PublicFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.col}>
          <h4>Support</h4>
          <Link href="#">Refund Policy</Link>
          <Link href="#">Customer Support</Link>
          <Link href="#">Safety & Trust</Link>
          <Link href="#">FAQ</Link>
          <Link href="#">Status Page</Link>
        </div>
        <div className={styles.col}>
          <h4>For Clients</h4>
          <Link href="/bookings">My Bookings</Link>
          <Link href="/payments">Payment Methods</Link>
          <Link href="/settings">Profile</Link>
          <Link href="/explore">How It Works</Link>
          <Link href="/artists">Browse Artists</Link>
        </div>
        <div className={styles.col}>
          <h4>For Artists</h4>
          <Link href="/dashboard">Artist Dashboard</Link>
          <Link href="/onboarding">Become an Artist</Link>
          <Link href="/messages">Messages</Link>
          <Link href="/payments">Earnings & Payouts</Link>
          <Link href="/settings">Resources</Link>
        </div>
      </div>
      <div className={styles.legal}>
        <span>© 2026 VendrMan. All rights reserved.</span>
        <div className={styles.legalLinks}>
          <Link href="#">Terms</Link>
          <Link href="#">Privacy</Link>
          <Link href="#">POPIA</Link>
        </div>
      </div>
    </footer>
  );
}
