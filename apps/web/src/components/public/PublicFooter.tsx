import Link from "next/link";
import styles from "./PublicFooter.module.css";

export default function PublicFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brandBlock}>
          <div className={styles.brand}>Vendr<span>Studios</span></div>
          <p className={styles.brandCopy}>
            Vendr Studios is opening early access for South African clients,
            photographers, videographers, and creative talent before launch.
          </p>
        </div>

        <div className={styles.column}>
          <div className={styles.columnTitle}>Marketplace</div>
          <Link href="/explore">Explore</Link>
          <Link href="/how-it-works">How It Works</Link>
          <Link href="/pricing">Pricing</Link>
          <Link href="/join">Join as Creative</Link>
        </div>

        <div className={styles.column}>
          <div className={styles.columnTitle}>Social</div>
          <a href="https://instagram.com/vendr.studio" target="_blank" rel="noreferrer">Instagram</a>
          <a href="https://tiktok.com/@vendr.studio" target="_blank" rel="noreferrer">TikTok</a>
          <a href="https://www.linkedin.com/company/vendrstudio" target="_blank" rel="noreferrer">LinkedIn</a>
        </div>

        <div className={styles.column}>
          <div className={styles.columnTitle}>Company</div>
          <Link href="/about">About</Link>
          <Link href="/faq">FAQ</Link>
          <Link href="/contact">Contact</Link>
          <Link href="/privacy">Privacy</Link>
        </div>
      </div>

      <div className={styles.bottom}>
        <span>(c) 2026 Vendr Studios. South African governing law applies.</span>
        <span>ECT Act / Consumer Protection Act</span>
      </div>
    </footer>
  );
}
