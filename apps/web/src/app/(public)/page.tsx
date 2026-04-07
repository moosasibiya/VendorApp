import Link from "next/link";
import styles from "./page.module.css";

const marqueeItems = [
  "Profiles You Can Trust",
  "Payments That Stay Protected",
  "Safe Booking Starts",
  "Support When Things Go Wrong",
  "Better Perks As You Grow",
  "Early Access For 100 Artists",
  "See Every Fee Upfront",
  "Built For South Africa",
];

const trustCards = [
  ["01", "badge", "violet", "Identity verification (KYC)", "Artists are reviewed before they can go live and accept work on the platform. Every profile you see is manually vetted."],
  ["02", "payments", "blue", "Secure payment tracking", "Payment, dispute windows, and payout release states stay visible to both sides at every stage of a booking."],
  ["03", "encrypted", "violet", "Booking start verification", "A client safety code confirms the job start before normal payout release can proceed. No silent starts."],
  ["04", "shield", "blue", "Internal support and disputes", "Support conversations and escalations stay inside platform messaging for full context and auditability."],
  ["05", "trending_up", "violet", "Tiered trust framework", "Verified platform performance powers progression instead of off-platform claims or unverifiable histories."],
  ["06", "admin_panel_settings", "blue", "Admin review tools", "Application vetting, payout overrides, and manual support triage remain fully auditable at the admin level."],
] as const;

const clientSteps = [
  ["01", "Browse verified creatives", "Explore portfolios from identity-checked artists and teams you can trust."],
  ["02", "Book and pay securely", "Payment is tracked through the platform with clear status updates and escrow protection."],
  ["03", "Approve or escalate", "Safety checks, disputes, and support all stay in one centralized place."],
] as const;

const artistSteps = [
  ["01", "Create your profile and apply", "Submit your artist profile for manual review before launch access opens."],
  ["02", "Join the prelaunch pool", "The first 100 valid applications enter the initial rollout pool automatically."],
  ["03", "Go live and level up", "Verified on-platform work unlocks visibility, payout speed, and tier rewards."],
] as const;

const pricingCards = [
  ["For artists", "Artist fees", "violet", ["No upfront onboarding payment during the current rollout.", "Normal commission stays configurable and visible in the dashboard.", "If onboarding recovery applies, it is taken once from the first completed booking only."]],
  ["For clients", "Client fees", "blue", ["Browse and message artists inside the platform with no cost to look.", "Booking payment and approval flow remain visible from start to payout release.", "Support, disputes, and refunds route into the centralized messaging area."]],
] as const;

const tiers = [
  ["1", "Tier 1", "Launch Entry", "Start here while you build verified booking history and profile quality on the platform.", "neutral"],
  ["2", "Tier 2", "Consistency", "Reliable platform activity can unlock stronger visibility and ranking boosts across search.", "blue"],
  ["3", "Tier 3", "Performance", "Higher-quality verified work can reduce payout delays and open more booking opportunities.", "violet"],
  ["4", "Tier 4", "Priority", "Top performers receive the strongest trust signals and platform access benefits available.", "gold"],
] as const;

const artistNotes = [
  "The first 100 valid artists enter the prelaunch pool automatically.",
  "Applications submitted after that join the waitlist for later review waves.",
  "Only a limited number of approved artists go live in the initial three-month rollout.",
  "There is no upfront onboarding payment right now.",
  "If onboarding recovery is enabled, it is handled through the first completed booking only.",
];

export default function PublicOnboardingPage() {
  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroBackground} />
        <div className={styles.heroGrid} />
        <div className={`${styles.heroOrb} ${styles.heroOrbOne}`} />
        <div className={`${styles.heroOrb} ${styles.heroOrbTwo}`} />
        <div className={`${styles.heroOrb} ${styles.heroOrbThree}`} />
        <div className={`${styles.heroOrb} ${styles.heroOrbFour}`} />
        <div className={styles.heroBadge}>
          <span className={styles.badgeDot} />
          Launching Soon
        </div>
        <h1 className={styles.heroTitle}>
          <span className={styles.heroTitleLine}>Book</span>
          <em className={styles.heroTitleAccent}>trusted</em>
          <span className={styles.heroTitleLine}>creatives</span>
        </h1>
        <p className={styles.heroCopy}>
          A secure marketplace for photographers, videographers, and creative talent built with verified identities, transparent payments, and centralized support.
        </p>
        <div className={styles.heroActions}>
          <Link href="/signup?accountType=CREATIVE" className={styles.primaryHeroBtn}>
            Join as an artist
          </Link>
          <a href="#launch-updates" className={styles.secondaryHeroBtn}>
            Get launch updates
          </a>
        </div>
      
      </section>

      <div className={styles.marqueeWrap}>
        <div className={styles.marqueeTrack}>
          {[...marqueeItems, ...marqueeItems].map((item, index) => (
            <span key={`${item}-${index}`} className={styles.marqueeItem}>
              {item}
            </span>
          ))}
        </div>
      </div>

      <section className={styles.statsStrip}>
        <article className={styles.statCard}>
          <strong className={`${styles.statValue} ${styles.statViolet}`}>100</strong>
          <span className={styles.statLabel}>Prelaunch artist spots</span>
        </article>
        <article className={styles.statCard}>
          <strong className={`${styles.statValue} ${styles.statBlue}`}>4</strong>
          <span className={styles.statLabel}>Trust tier levels</span>
        </article>
        <article className={styles.statCard}>
          <strong className={`${styles.statValue} ${styles.statPink}`}>R0</strong>
          <span className={styles.statLabel}>Upfront onboarding cost</span>
        </article>
        <article className={styles.statCard}>
          <strong className={`${styles.statValue} ${styles.statGold}`}>100%</strong>
          <span className={styles.statLabel}>Verified artist profiles</span>
        </article>
      </section>

      <section className={styles.trustSection}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionLabel}>Built different</span>
          <h2 className={styles.sectionTitle}>Trust, Safety and Compliance</h2>
          <div className={styles.sectionDivider} />
          <p className={styles.sectionCopy}>
            The platform is built around verification, transparent payout logic, and internal support tooling instead of fragmented communication.
          </p>
        </div>
        <div className={styles.trustGrid}>
          {trustCards.map(([number, icon, tone, title, copy]) => (
            <article key={number} className={styles.trustCard} data-tone={tone}>
              <span className={styles.trustNumber}>{number}</span>
              <div className={styles.trustIcon}>
                <span className="material-symbols-outlined">{icon}</span>
              </div>
              <h3>{title}</h3>
              <p>{copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.howSection} id="how-it-works">
        <div className={styles.sectionHeaderLight}>
          <span className={styles.sectionLabelBlue}>Process</span>
          <h2 className={styles.sectionTitleLight}>How it works</h2>
          <p className={styles.sectionCopyLight}>Simple, secure, and transparent for both sides of the marketplace.</p>
        </div>
        <div className={styles.howGrid}>
          <article className={styles.howColumn}>
            <div className={styles.columnHeader}>
              <span className={`${styles.columnTag} ${styles.clientTag}`}>For clients</span>
              <h3 className={styles.columnTitle}>Book with confidence</h3>
              <span className={`${styles.columnDivider} ${styles.columnDividerBlue}`} />
            </div>
            <div className={styles.howSteps}>
              {clientSteps.map(([number, title, body]) => (
                <div key={number} className={styles.howStep}>
                  <span className={styles.stepNumberClient}>{number}</span>
                  <div>
                    <strong>{title}</strong>
                    <p>{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </article>
          <article className={styles.howColumn}>
            <div className={styles.columnHeader}>
              <span className={`${styles.columnTag} ${styles.artistTag}`}>For artists</span>
              <h3 className={styles.columnTitle}>Grow your reputation</h3>
              <span className={`${styles.columnDivider} ${styles.columnDividerViolet}`} />
            </div>
            <div className={styles.howSteps}>
              {artistSteps.map(([number, title, body]) => (
                <div key={number} className={styles.howStep}>
                  <span className={styles.stepNumberArtist}>{number}</span>
                  <div>
                    <strong>{title}</strong>
                    <p>{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>

      <section className={styles.pricingSection}>
        <div className={styles.sectionHeaderLight}>
          <span className={styles.sectionLabelViolet}>Transparent</span>
          <h2 className={styles.sectionTitleLight}>Clear and fair pricing</h2>
          <p className={styles.sectionCopyLight}>No surprises. No hidden steps. Commission and recovery logic stay visible in your dashboard.</p>
        </div>
        <div className={styles.pricingGrid}>
          {pricingCards.map(([tag, title, tone, items]) => (
            <article key={title} className={styles.pricingCard} data-tone={tone}>
              <span className={styles.pricingStripe} />
              <span className={styles.pricingTag}>{tag}</span>
              <h3>{title}</h3>
              <ul className={styles.pricingList}>
                {items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
        <p className={styles.pricingNote}>
          <strong>No subscriptions</strong> are required to start the current rollout.
        </p>
      </section>

      <section className={styles.tiersSection} id="artist-tiers">
        <div className={styles.tiersHeader}>
          <span className={styles.sectionLabel}>Gamification</span>
          <h2 className={styles.sectionTitle}>Grow as you work</h2>
          <p className={styles.sectionCopy}>Artists progress through four configurable performance tiers based on verified on-platform bookings, revenue, ratings, and reliability.</p>
        </div>
        <div className={styles.tiersGrid}>
          {tiers.map(([number, name, label, copy, tone]) => (
            <article key={number} className={styles.tierCard} data-tone={tone}>
              <span className={styles.tierAccent} />
              <span className={styles.tierName}>{name}</span>
              <h3>{label}</h3>
              <p>{copy}</p>
              <span className={styles.tierNumber}>{number}</span>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.artistCta}>
        <div className={styles.artistCtaBackground} />
        <div className={styles.artistCtaInner}>
          <h2 className={styles.artistCtaTitle}>
            Artists:
            <br />
            <em>join early</em>
          </h2>
          <p className={styles.artistCtaCopy}>Apply before public launch and start building your profile while rollout capacity opens in controlled phases.</p>
          <div className={styles.artistNoteCard}>
            {artistNotes.map((note) => (
              <div key={note} className={styles.artistNoteRow}>
                <span className={styles.artistNoteDot} />
                <span>{note}</span>
              </div>
            ))}
          </div>
          <Link href="/signup?accountType=CREATIVE" className={styles.primaryHeroBtn}>
            Create artist profile
          </Link>
        </div>
      </section>

      <section className={styles.notifySection} id="launch-updates">
        <div className={styles.notifyBox}>
          <span className={styles.sectionLabelBlue}>Stay in the loop</span>
          <h2 className={styles.notifyTitle}>Be first to know</h2>
          <p className={styles.notifyCopy}>Sign up to receive launch updates when rollout expands and booking access opens more broadly.</p>
          <form action="/signup" method="get" className={styles.notifyForm}>
            <input type="hidden" name="accountType" value="CLIENT" />
            <input type="email" name="email" className={styles.notifyInput} placeholder="Enter your email address" aria-label="Email address" />
            <button type="submit" className={styles.notifyButton}>
              Notify me
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
