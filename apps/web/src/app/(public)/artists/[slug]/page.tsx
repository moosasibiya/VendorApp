import { Suspense } from "react";
import styles from "./page.module.css";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ApiError, fetchArtistBySlug, fetchArtistReviews } from "@/lib/api";
import { ArtistProfileActions } from "./ArtistProfileActions";

const navItems = [
  { label: "Overview", href: "#overview" },
  { label: "Portfolio", href: "#portfolio" },
  { label: "Reviews", href: "#reviews" },
  { label: "Browse artists", href: "/artists" },
  { label: "Explore categories", href: "/explore" },
];

type ArtistProfilePageProps = {
  params: Promise<{ slug: string }>;
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function formatCurrency(amount: number | undefined): string {
  if (!amount || amount <= 0) {
    return "On request";
  }

  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default async function ArtistProfilePage({ params }: ArtistProfilePageProps) {
  const { slug } = await params;

  let artist;
  try {
    artist = await fetchArtistBySlug(slug);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }
  const reviewsResponse = await fetchArtistReviews(slug, { page: 1, limit: 4 });
  const reviews = reviewsResponse.data;

  const initials = getInitials(artist.name);
  const tags =
    artist.specialties && artist.specialties.length > 0
      ? artist.specialties
      : artist.services && artist.services.length > 0
        ? artist.services
        : ["Open to bookings"];
  const bio =
    artist.bio?.trim() ||
    `${artist.role} based in ${artist.location}. Available for new projects and collaborations.`;
  const availabilitySummary = artist.availabilitySummary?.trim() || "Available this week";
  const pricingSummary = artist.pricingSummary?.trim() || "Pricing shared on request";
  const categoryLabel = artist.category?.name ?? "Independent creative";
  const portfolioLinks =
    artist.portfolioLinks?.filter((link) => typeof link === "string" && link.trim()) ?? [];

  return (
    <main className={styles.page}>
      <section className={styles.shell}>
        <aside className={styles.sideNav}>
          <div className={styles.welcome}>
            Meet <span>{artist.name.split(" ")[0]}</span>
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
          <div className={styles.profileCard} id="overview">
            <div className={styles.header}>
              <div>
                <p className={styles.kicker}>{categoryLabel}</p>
                <h1 className={styles.title}>{artist.name}</h1>
                <p className={styles.username}>@{artist.slug}</p>
              </div>
              <div className={styles.avatar}>{initials}</div>
            </div>

            <div className={styles.metaRow}>
              <span className={styles.badge}>{artist.role}</span>
              <span className={styles.badgeAlt}>{artist.location}</span>
              <span className={styles.badgeAlt}>{availabilitySummary}</span>
            </div>

            <div className={styles.stats}>
              <div>
                <div className={styles.statValue}>{formatCurrency(artist.hourlyRate)}</div>
                <div className={styles.statLabel}>Typical starting rate</div>
              </div>
              <div>
                <div className={styles.statValue}>
                  {artist.averageRating?.toFixed(1) ?? artist.rating}
                </div>
                <div className={styles.statLabel}>Rating</div>
              </div>
              <div>
                <div className={styles.statValue}>{artist.totalReviews ?? 0}</div>
                <div className={styles.statLabel}>Reviews</div>
              </div>
            </div>

            <p className={styles.bio}>{bio}</p>

            <div className={styles.tags}>
              {tags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>

            <div className={styles.actions}>
              <Suspense fallback={<button className={styles.ghostBtn}>Loading actions...</button>}>
                <ArtistProfileActions
                  artistId={artist.id}
                  artistSlug={artist.slug}
                  bookNowClassName={styles.primaryBtn}
                  messageClassName={styles.ghostBtn}
                  feedbackClassName={styles.actionFeedback}
                />
              </Suspense>
              {portfolioLinks[0] ? (
                <a
                  className={styles.ghostBtn}
                  href={portfolioLinks[0]}
                  target="_blank"
                  rel="noreferrer"
                >
                  View Portfolio
                </a>
              ) : (
                <button className={styles.ghostBtn}>View Portfolio</button>
              )}
            </div>
          </div>

          <section className={styles.section} id="portfolio">
            <div className={styles.sectionHeader}>
              <h2>Portfolio</h2>
              <div className={styles.filters}>
                <button className={styles.filterActive}>All</button>
                {tags.slice(0, 3).map((tag) => (
                  <button key={tag}>{tag}</button>
                ))}
              </div>
            </div>
            <div className={styles.portfolioGrid}>
              {portfolioLinks.length ? (
                portfolioLinks.map((link, index) => (
                  <a
                    key={link}
                    href={link}
                    target="_blank"
                    rel="noreferrer"
                    className={styles.portfolioCard}
                  >
                    <div className={styles.portfolioBadge}>Live link</div>
                    <div>
                      <h3>Portfolio {index + 1}</h3>
                      <p>{new URL(link).hostname}</p>
                    </div>
                  </a>
                ))
              ) : (
                <div className={styles.portfolioCard}>
                  <div className={styles.portfolioBadge}>Coming soon</div>
                  <div>
                    <h3>Portfolio update in progress</h3>
                    <p>{pricingSummary}</p>
                  </div>
                </div>
              )}
            </div>
          </section>

          <section className={styles.section} id="reviews">
            <div className={styles.sectionHeader}>
              <h2>Recent reviews</h2>
              <span className={styles.reviewCount}>{artist.totalReviews ?? 0} total</span>
            </div>
            <div className={styles.reviewList}>
              {reviews.length > 0 ? (
                reviews.map((review) => (
                  <article key={review.id} className={styles.reviewCard}>
                    <div className={styles.reviewMeta}>
                      <div>
                        <strong>{review.reviewer.name}</strong>
                        <p>{new Date(review.eventDate).toLocaleDateString("en-ZA")}</p>
                      </div>
                      <span className={styles.reviewRating}>{review.rating} / 5</span>
                    </div>
                    <p>{review.comment}</p>
                    <p className={styles.reviewBooking}>{review.bookingTitle}</p>
                  </article>
                ))
              ) : (
                <div className={styles.reviewEmpty}>
                  No public reviews yet. Completed bookings will appear here.
                </div>
              )}
            </div>
          </section>
        </div>

        <aside className={styles.rightCol}>
          <div className={styles.infoCard}>
            <h3>Booking details</h3>
            <p>{availabilitySummary}</p>
            <p>{pricingSummary}</p>
            <p>{artist.isAvailable ? "Accepting new requests" : "Currently unavailable"}</p>
            <p>{artist.isVerified ? "Verified by VendorApp" : "Verification pending"}</p>
          </div>
          <div className={styles.infoCard}>
            <h3>Profile summary</h3>
            <div className={styles.summaryRow}>
              <span>Category</span>
              <strong>{categoryLabel}</strong>
            </div>
            <div className={styles.summaryRow}>
              <span>Services</span>
              <strong>{artist.services?.length ?? 0}</strong>
            </div>
            <div className={styles.summaryRow}>
              <span>Specialties</span>
              <strong>{artist.specialties?.length ?? 0}</strong>
            </div>
            <div className={styles.summaryRow}>
              <span>Profile views</span>
              <strong>{artist.profileViews ?? 0}</strong>
            </div>
            <Link className={styles.ghostBtn} href="/artists">
              Browse more artists
            </Link>
          </div>
        </aside>
      </section>
    </main>
  );
}
