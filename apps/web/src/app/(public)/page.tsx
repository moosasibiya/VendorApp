import Link from "next/link";
import styles from "./page.module.css";

const clientSteps = [
  {
    number: "1",
    title: "Browse verified creatives",
    copy: "Explore portfolios from identity-checked artists and teams.",
  },
  {
    number: "2",
    title: "Book and pay securely",
    copy: "Payment is tracked through the platform with clear status updates.",
  },
  {
    number: "3",
    title: "Approve completion or escalate support",
    copy: "Safety checks, disputes, and support all stay in one place.",
  },
];

const artistSteps = [
  {
    number: "1",
    title: "Create your profile and apply",
    copy: "Submit your artist profile for manual review before launch access opens.",
  },
  {
    number: "2",
    title: "Join the prelaunch pool or waitlist",
    copy: "The first 100 valid applications enter the initial rollout pool.",
  },
  {
    number: "3",
    title: "Go live and level up through bookings",
    copy: "Verified on-platform work unlocks visibility, payout speed, and trust rewards.",
  },
];

const safetyCards = [
  {
    title: "Identity verification (KYC)",
    copy: "Artists are reviewed before they can go live and accept work on the platform.",
  },
  {
    title: "Secure payment tracking",
    copy: "Payment, dispute windows, and payout release states stay visible to both sides.",
  },
  {
    title: "Booking start verification",
    copy: "A client safety code confirms the job start before normal payout release can proceed.",
  },
  {
    title: "Internal support and disputes",
    copy: "Support conversations and escalations stay inside platform messaging for full context.",
  },
  {
    title: "Tiered trust framework",
    copy: "Verified platform performance powers progression instead of off-platform claims.",
  },
  {
    title: "Admin review tools",
    copy: "Application vetting, payout overrides, and manual support triage remain auditable.",
  },
];

const pricingCards = [
  {
    title: "Artists",
    items: [
      "No upfront onboarding payment during the current rollout.",
      "Normal commission stays configurable and visible in the dashboard.",
      "If onboarding recovery applies, it is taken once from the first completed booking only.",
    ],
  },
  {
    title: "Clients",
    items: [
      "Browse and message artists inside the platform.",
      "Booking payment and approval flow remain visible from start to payout release.",
      "Support, disputes, and refunds route into the centralized messaging area.",
    ],
  },
];

const tierSteps = [
  {
    label: "Tier 1",
    hint: "Launch entry",
    detail: "Start here while you build verified booking history and profile quality.",
  },
  {
    label: "Tier 2",
    hint: "Consistency",
    detail: "Reliable platform activity can unlock stronger visibility and ranking boosts.",
  },
  {
    label: "Tier 3",
    hint: "Performance",
    detail: "Higher-quality verified work can reduce payout delays and open more opportunities.",
  },
  {
    label: "Tier 4",
    hint: "Priority",
    detail: "Top performers can receive the strongest trust signals and platform access benefits.",
  },
];

const artistNotes = [
  "The first 100 valid artists enter the prelaunch pool automatically.",
  "Applications submitted after that join the waitlist for later review waves.",
  "Only a limited number of approved artists go live in the initial three-month rollout.",
  "There is no upfront onboarding payment right now.",
  "If onboarding recovery is enabled, it is handled through the first completed booking only.",
];

export default function PublicHomePage() {
  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.badge}>Launching soon</div>
          <h1>A safer way to book trusted photographers and videographers</h1>
          <p className={styles.heroCopy}>
            We are building a secure marketplace for booking photographers,
            videographers, and creative talent. The platform is in final
            rollout preparation with controlled artist onboarding and
            centralized support.
          </p>
          <div className={styles.heroActions}>
            <Link href="/signup?accountType=CREATIVE" className={styles.primaryBtn}>
              Join as an artist
            </Link>
            <a href="#launch-updates" className={styles.secondaryBtn}>
              Get launch updates
            </a>
          </div>
        </div>
      </section>

      <section className={styles.noticeWrap}>
        <article className={styles.noticeCard}>
          <strong>We are in the final preparation phase.</strong>
          <p>
            Clients can explore what is coming. Artists can create profiles and
            submit applications now, then move through review, approval, and
            staged live access as rollout capacity opens.
          </p>
        </article>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>How it works</h2>
          <p>Simple, secure, and transparent for both sides of the marketplace.</p>
        </div>
        <div className={styles.dualGrid}>
          <article className={styles.stepCard}>
            <h3>For clients</h3>
            <div className={styles.stepList}>
              {clientSteps.map((step) => (
                <div key={step.number} className={styles.stepItem}>
                  <span>{step.number}</span>
                  <div>
                    <strong>{step.title}</strong>
                    <p>{step.copy}</p>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className={styles.stepCard}>
            <h3>For artists</h3>
            <div className={styles.stepList}>
              {artistSteps.map((step) => (
                <div key={step.number} className={styles.stepItem}>
                  <span>{step.number}</span>
                  <div>
                    <strong>{step.title}</strong>
                    <p>{step.copy}</p>
                  </div>
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>

      <section className={styles.safetySection}>
        <div className={styles.sectionHeader}>
          <h2>Trust, safety and compliance</h2>
          <p>
            The platform is built around verification, transparent payout logic,
            and internal support tooling instead of fragmented communication.
          </p>
        </div>
        <div className={styles.cardGrid}>
          {safetyCards.map((card) => (
            <article key={card.title} className={styles.infoCard}>
              <h3>{card.title}</h3>
              <p>{card.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>Clear and fair pricing</h2>
          <p>No surprises. No hidden steps. Commission and recovery logic stay visible.</p>
        </div>
        <div className={styles.dualGrid}>
          {pricingCards.map((card) => (
            <article key={card.title} className={styles.pricingCard}>
              <h3>{card.title}</h3>
              <ul className={styles.bulletList}>
                {card.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
        <p className={styles.centerNote}>
          No subscriptions are required to start the current rollout.
        </p>
      </section>

      <section className={styles.growthSection}>
        <div className={styles.sectionHeader}>
          <h2>Grow as you work</h2>
          <p>
            Artists progress through four configurable performance tiers based on
            verified on-platform bookings, revenue, ratings, reliability, and
            repeat work.
          </p>
        </div>
        <div className={styles.tierTrack}>
          {tierSteps.map((tier) => (
            <article key={tier.label} className={styles.tierCard}>
              <div className={styles.tierDot} />
              <strong>{tier.label}</strong>
              <span>{tier.hint}</span>
              <p>{tier.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.artistSection}>
        <div className={styles.artistInner}>
          <h2>Artists: join early</h2>
          <p>
            Creatives can apply before public launch and start building their
            profiles while rollout capacity opens in controlled phases.
          </p>
          <div className={styles.artistCard}>
            <ul className={styles.bulletList}>
              {artistNotes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </div>
          <Link href="/signup?accountType=CREATIVE" className={styles.primaryBtn}>
            Create artist profile
          </Link>
        </div>
      </section>

      <section className={styles.section} id="launch-updates">
        <div className={styles.sectionHeader}>
          <h2>Be first to know</h2>
          <p>
            Sign up to receive launch updates when rollout expands and booking
            access opens more broadly.
          </p>
        </div>
        <form className={styles.signupCard} action="/signup" method="get">
          <input type="hidden" name="accountType" value="CLIENT" />
          <input
            className={styles.emailInput}
            type="email"
            name="email"
            placeholder="Enter your email"
            aria-label="Email"
          />
          <button type="submit" className={styles.primaryBtn}>
            Notify me
          </button>
        </form>
      </section>
    </main>
  );
}
