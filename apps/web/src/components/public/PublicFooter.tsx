import Link from "next/link";
import styles from "./PublicFooter.module.css";

export default function PublicFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brandBlock}>
          <div className={styles.brand}>Vendr<span>Man</span></div>
          <p className={styles.brandCopy}>
            A premium marketplace for booking verified photographers,
            videographers, and creative talent across South Africa.
          </p>
        </div>

        <div className={styles.column}>
          <div className={styles.columnTitle}>Discover</div>
          <Link href="/artists?category=photography">Photographers</Link>
          <Link href="/artists?category=videography">Videographers</Link>
          <Link href="/artists?category=weddings">Wedding creators</Link>
          <Link href="/artists">Browse all</Link>
        </div>

        <div className={styles.column}>
          <div className={styles.columnTitle}>Platform</div>
          <Link href="/home#how-it-works">How it works</Link>
          <Link href="/home#featured-creatives">Featured creatives</Link>
          <Link href="/support">Trust and safety</Link>
          <Link href="/support">Help centre</Link>
        </div>

        <div className={styles.column}>
          <div className={styles.columnTitle}>For artists</div>
          <Link href="/signup?accountType=CREATIVE">Apply now</Link>
          <Link href="/">Tier system</Link>
          <Link href="/">Onboarding</Link>
          <Link href="/support">Artist FAQ</Link>
        </div>
      </div>

      <div className={styles.bottom}>
        <span>(c) 2026 VendrMan. South African governing law applies.</span>
        <span>ECT Act / Consumer Protection Act</span>
      </div>
    </footer>
  );
}
