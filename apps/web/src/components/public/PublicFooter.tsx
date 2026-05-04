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
          <div className={styles.columnTitle}>Insider Programme</div>
          <Link href="/join">Join as Client</Link>
          <Link href="/artists">Join as Creative</Link>
          <Link href="/insider-rules">Insider rules</Link>
          <Link href="/#faq">FAQ</Link>
        </div>

        <div className={styles.column}>
          <div className={styles.columnTitle}>Social</div>
          <a href="https://instagram.com/vendr.studio" target="_blank" rel="noreferrer">Instagram</a>
          <a href="https://tiktok.com/@vendr.studio" target="_blank" rel="noreferrer">TikTok</a>
          <a href="https://www.linkedin.com/company/vendrstudio" target="_blank" rel="noreferrer">LinkedIn</a>
        </div>

        <div className={styles.column}>
          <div className={styles.columnTitle}>Rewards</div>
          <Link href="/insider-rules">Referral rewards</Link>
          <Link href="/join">Client early access</Link>
          <Link href="/artists">Creative early access</Link>
          <Link href="/#faq">Programme FAQ</Link>
        </div>
      </div>

      <div className={styles.bottom}>
        <span>(c) 2026 Vendr Studios. South African governing law applies.</span>
        <span>ECT Act / Consumer Protection Act</span>
      </div>
    </footer>
  );
}
