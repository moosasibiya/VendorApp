import type { Metadata } from "next";
import styles from "../page.module.css";

export const metadata: Metadata = {
  title: "Insider Programme Rules",
  description: "VendrStudio Insider Programme rules and reward terms.",
  alternates: { canonical: "https://vendr.studio/insider-rules" },
};

const rules = [
  "The programme is for early access before the Vendr Studios public launch.",
  "Signup alone does not make a user Verified.",
  "Users must follow both Instagram and TikTok.",
  "Verification is manual for now.",
  "Referrals count only after the referred user is verified.",
  "Fake, duplicate, incomplete, or unverifiable signups may be rejected.",
  "Client reward: one R2,500 photoshoot draw entry per verified referral.",
  "Artist reward: R50 bonus on first payout per verified referral, capped at R500.",
  "Prize redemption deadline: 31 December 2026.",
  "Launch date: 1 July 2026.",
  "Vendr Studios may update rules before launch if needed.",
];

export default function InsiderRulesPage() {
  return (
    <main className={styles.page}>
      <section className={styles.rulesPage}>
        <span className={styles.sectionLabelBlue}>Programme rules</span>
        <h1>VendrStudio Insider Programme rules</h1>
        <ul>
          {rules.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
      </section>
    </main>
  );
}
