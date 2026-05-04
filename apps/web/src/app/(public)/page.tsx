import type { Metadata } from "next";
import Link from "next/link";
import InsiderSignupForm from "./InsiderSignupForm";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "VendrStudio Insider Programme",
  description:
    "Vendr Studios connects clients with photographers and videographers. Join the VendrStudio Insider Programme for early access before launch.",
  alternates: { canonical: "https://vendr.studio/" },
  openGraph: {
    title: "VendrStudio Insider Programme",
    description:
      "Join Vendr Studios for early access before the 1 July 2026 launch.",
    url: "https://vendr.studio/",
    siteName: "Vendr Studios",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "VendrStudio Insider Programme",
    description:
      "Early access for South African clients, photographers, and videographers.",
  },
};

const steps = [
  ["01", "Choose your role", "Join as a client looking to book creatives or as a photographer or videographer."],
  ["02", "Join the Insider Programme", "Submit your details so the team can create your pending Insider record."],
  ["03", "Follow, verify, invite", "Follow Instagram and TikTok, get manually verified, then unlock your personal invite link."],
] as const;

const bannerItems = [
  "Where moments meet creatives",
  "Verified insiders unlock invite links",
  "Early access before 1 July 2026",
  "R2,500 photoshoot draw entries",
  "R50 artist referral bonuses",
  "Built for South African creatives",
] as const;

const faqs = [
  ["What is Vendr Studios?", "Vendr Studios is a South African platform being built to connect clients with trusted photographers and videographers."],
  ["Who can join?", "Clients, photographers, videographers, and creative teams can join before public launch."],
  ["Is this a waitlist?", "It is an Insider Programme. Signup creates a pending Insider record; verification unlocks referral rewards and invite links."],
  ["Why follow Instagram and TikTok?", "Social follows help the team confirm real early supporters while the programme is manually verified."],
  ["How do referrals work?", "Verified Insiders receive a personal invite link. Referral rewards only count after the referred person is also verified."],
  ["When do rewards count?", "Rewards count only after the referred person submits valid details, follows Instagram and TikTok, and is manually verified."],
  ["When does the platform launch?", "Vendr Studios is scheduled to launch on 1 July 2026."],
  ["When must the R2,500 prize be redeemed?", "Photoshoot draw prizes must be redeemed by 31 December 2026."],
  ["How do artists earn the referral bonus?", "Artists earn R50 on their first payout per verified referral, capped at R500."],
] as const;

export default function PublicOnboardingPage() {
  return (
    <main className={styles.page}>
      <section className={styles.insiderHero}>
        <div className={styles.heroBackground} />
        <div className={styles.heroGrid} />
        <div className={styles.heroContent}>
          <div className={styles.heroBadge}>
            <span>Launching</span>
            <strong>21 July 2026</strong>
          </div>
          <h1 className={styles.heroTitle} aria-label="Book trusted creatives">
            <span className={`${styles.heroTitleRow} ${styles.heroTitleRowBook}`}>
              <span className={`${styles.heroTitleLine} ${styles.heroTitleLineOne}`}>Book</span>
            </span>
            <span className={`${styles.heroTitleRow} ${styles.heroTitleRowTrusted}`}>
              <em className={`${styles.heroTitleAccent} ${styles.heroTitleLineTwo}`}>trusted</em>
            </span>
            <span className={`${styles.heroTitleRow} ${styles.heroTitleRowCreatives}`}>
              <span className={`${styles.heroTitleLine} ${styles.heroTitleLineThree}`}>Creatives</span>
            </span>
          </h1>
          <p className={styles.heroCopy}>
            A secure marketplace for photographers, videographers, and creative talent built with verified identities, transparent booking, and the VendrStudio Insider Programme.
          </p>
          <div className={styles.heroActions}>
            <Link href="/join" className={styles.primaryHeroBtn}>I want to book creatives</Link>
            <Link href="/artists" className={styles.secondaryHeroBtn}>I am a creative</Link>
          </div>
        </div>
      </section>

      <section id="how-it-works" className={styles.lightSection}>
        <div className={styles.sectionHeaderLight}>
          <span className={styles.sectionLabelBlue}>How it works</span>
          <h2 className={styles.sectionTitleLight}>Three steps to early access</h2>
        </div>
        <div className={styles.featureGrid}>
          {steps.map(([number, title, copy]) => (
            <article key={number} className={styles.featureCard}>
              <span>{number}</span>
              <h3>{title}</h3>
              <p>{copy}</p>
            </article>
          ))}
        </div>
      </section>

      <div className={styles.insiderMarquee} aria-label="VendrStudio Insider Programme highlights">
        <div className={styles.insiderMarqueeTrack}>
          {[...bannerItems, ...bannerItems].map((item, index) => (
            <span key={`${item}-${index}`} className={styles.insiderMarqueeItem}>
              {item}
            </span>
          ))}
        </div>
      </div>

      <section className={styles.splitSection}>
        <article>
          <span className={styles.sectionLabelBlue}>For clients</span>
          <h2>Book trusted creative talent earlier</h2>
          <ul>
            <li>Discover trusted photographers and videographers.</li>
            <li>Book creative talent more easily when the platform opens.</li>
            <li>Get early access before public launch.</li>
            <li>Earn one R2,500 photoshoot draw entry per verified referral.</li>
          </ul>
          <Link href="/join" className={styles.primaryHeroBtn}>Join as a client</Link>
        </article>
        <article>
          <span className={styles.sectionLabelBlue}>For artists</span>
          <h2>Join the founding creative community</h2>
          <ul>
            <li>Get early access to paid opportunities.</li>
            <li>Build visibility before launch.</li>
            <li>Earn R50 per verified referral, capped at R500.</li>
            <li>Be part of the founding Vendr Studios creative community.</li>
          </ul>
          <Link href="/artists" className={styles.primaryHeroBtn}>Join as a creative</Link>
        </article>
      </section>

      <section className={styles.darkSection}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionLabel}>Insider Programme</span>
          <h2 className={styles.sectionTitle}>Follow. Verify. Invite.</h2>
          <p className={styles.sectionCopy}>
            Every signup starts as pending. Follow Instagram and TikTok, reply Done, and the team will manually verify your status. Verified Insiders receive a personal invite link, and referrals count only once the referred user is verified.
          </p>
        </div>
        <div className={styles.signupPanel}>
          <InsiderSignupForm defaultUserType="CLIENT" />
        </div>
      </section>

      <section className={styles.spotlightSection}>
        <div className={styles.spotlightIntro}>
          <span className={styles.sectionLabelViolet}>Artist spotlight</span>
          <h2>Founding creatives are being curated</h2>
          <p>
            Approved photographer and videographer profiles will appear here once real founding artists are ready. No fake testimonials, borrowed portfolios, or invented jobs.
          </p>
        </div>

        <div className={styles.spotlightGrid}>
          <article className={styles.rosterPreview} aria-label="Founding artist preview slots">
            <div className={styles.rosterHeader}>
              <span>Founding roster</span>
              <strong>Opening soon</strong>
            </div>
            <div className={styles.rosterCards}>
              {["Photography", "Videography", "Events"].map((label, index) => (
                <div key={label} className={styles.rosterCard}>
                  <span className={styles.rosterNumber}>0{index + 1}</span>
                  <strong>{label}</strong>
                  <p>Verified profile slot</p>
                </div>
              ))}
            </div>
          </article>

          <article className={styles.opportunityPanel}>
            <span className={styles.sectionLabelBlue}>Upcoming opportunities</span>
            <h3>Job board coming soon</h3>
            <p>
              Paid opportunities will be published when real client demand is ready for the launch rollout. Insider artists will be first in line for visibility.
            </p>
            <div className={styles.opportunityRows}>
              <div>
                <span>Launch priority</span>
                <strong>Verified artists first</strong>
              </div>
              <div>
                <span>Client demand</span>
                <strong>Published only when real</strong>
              </div>
              <div>
                <span>Reward path</span>
                <strong>R50 per verified referral</strong>
              </div>
            </div>
            <Link href="/artists" className={styles.primaryHeroBtn}>Join as a creative</Link>
          </article>
        </div>
      </section>

      <section className={styles.faqSection} id="faq">
        <div className={styles.sectionHeader}>
          <span className={styles.sectionLabel}>Questions</span>
          <h2 className={styles.sectionTitle}>FAQ</h2>
        </div>
        <div className={styles.faqList}>
          {faqs.map(([question, answer]) => (
            <details key={question} className={styles.faqItem}>
              <summary>{question}</summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </section>
    </main>
  );
}
