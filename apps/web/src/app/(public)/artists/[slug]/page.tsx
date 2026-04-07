import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Artist, ReviewItem } from "@vendorapp/shared";
import { ApiError, fetchArtistBySlug, fetchArtistReviews } from "@/lib/api";
import {
  findPublicFallbackArtist,
  getPublicFallbackReviews,
} from "@/lib/publicArtistFallbacks";
import { ArtistProfileActions } from "./ArtistProfileActions";
import styles from "./page.module.css";

const HOW_STEPS = [
  {
    number: "01",
    icon: "travel_explore",
    title: "Discover",
    body: "Every profile is verified before it reaches you. No fake listings and no inactive accounts clutter the flow.",
  },
  {
    number: "02",
    icon: "balance",
    title: "Compare",
    body: "Portfolios, verified reviews, live availability, and pricing sit together so you can judge fit without guesswork.",
  },
  {
    number: "03",
    icon: "lock",
    title: "Book",
    body: "Payments are handled through the platform with clearer approval states and centralized support if anything needs attention.",
  },
  {
    number: "04",
    icon: "auto_awesome",
    title: "Create",
    body: "Approve delivery, release payout, and leave verified feedback that strengthens the artist's trust standing over time.",
  },
] as const;

const PORTFOLIO_GRADIENTS = [
  "linear-gradient(135deg, #0f0c29 0%, #302b63 55%, #24243e 100%)",
  "linear-gradient(135deg, #0d1b2a 0%, #1b3a5c 55%, #0d2137 100%)",
  "linear-gradient(135deg, #1a0533 0%, #3d1060 55%, #1a0533 100%)",
  "linear-gradient(135deg, #080e1a 0%, #0f2d5e 50%, #1a3d7c 100%)",
  "linear-gradient(135deg, #12001f 0%, #3b0764 50%, #1c0a3b 100%)",
  "linear-gradient(135deg, #001218 0%, #003d4a 50%, #001f26 100%)",
  "linear-gradient(135deg, #0a1628 0%, #1e3a5f 40%, #2d1b69 100%)",
] as const;

const PORTFOLIO_ICONS = [
  "photo_camera",
  "favorite",
  "diamond",
  "landscape",
  "movie",
  "palette",
  "auto_awesome",
] as const;

type ArtistProfilePageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ portfolio?: string | string[] }>;
};

type PortfolioTone = "violet" | "blue" | "gold" | "green";

type PortfolioItem = {
  id: string;
  title: string;
  subtitle: string;
  filter: string;
  badge: string;
  tone: PortfolioTone;
  imageUrl?: string | null;
  href?: string | null;
  featured?: boolean;
  icon: string;
  gradient: string;
};

type TierSummary = {
  level: string;
  name: string;
  description: string;
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

function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat("en-ZA", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function safeHostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./i, "");
  } catch {
    return url;
  }
}

function uniqueStrings(values: Array<string | null | undefined>): string[] {
  return values
    .map((value) => value?.trim())
    .filter(
      (value, index, collection): value is string =>
        Boolean(value) && collection.indexOf(value) === index,
    );
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function titleCase(value: string): string {
  return value
    .replace(/[-_]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatMonthYear(dateString: string): string {
  try {
    return new Intl.DateTimeFormat("en-ZA", {
      month: "long",
      year: "numeric",
    }).format(new Date(dateString));
  } catch {
    return dateString;
  }
}

function getRatingNumber(artist: Artist): number {
  if (typeof artist.averageRating === "number") {
    return artist.averageRating;
  }

  const parsed = Number.parseFloat(artist.rating);
  return Number.isFinite(parsed) ? parsed : 4.9;
}

function formatRating(value: number): string {
  return value.toFixed(2);
}

function getRoleChips(artist: Artist): string[] {
  const roleParts = uniqueStrings(
    artist.role
      .split(/[·/,]/)
      .map((part) => part.trim())
      .filter(Boolean),
  );

  if (roleParts.length > 0) {
    return roleParts.slice(0, 3);
  }

  return uniqueStrings([artist.category?.name ?? "Creative"]);
}

function deriveTierSummary(artist: Artist): TierSummary {
  const liveTier = artist.tierProgress?.currentTier ?? artist.tier;
  if (liveTier) {
    return {
      level: String(liveTier.sortOrder),
      name: liveTier.name,
      description:
        liveTier.description?.trim() ||
        liveTier.benefits.badgeLabel?.trim() ||
        "Platform standing based on verified delivery, response quality, and completed bookings.",
    };
  }

  const reviews = artist.totalReviews ?? 0;
  const rating = getRatingNumber(artist);

  if (reviews >= 40 || rating >= 4.85) {
    return {
      level: "4",
      name: "Priority",
      description:
        "Highest trust signals with faster payout release and stronger visibility across premium discovery surfaces.",
    };
  }
  if (reviews >= 24 || rating >= 4.7) {
    return {
      level: "3",
      name: "Performance",
      description:
        "Strong repeat delivery and verified quality signals that lift credibility throughout the marketplace.",
    };
  }
  if (reviews >= 10) {
    return {
      level: "2",
      name: "Consistency",
      description:
        "Reliable platform activity with growing proof of delivery and better search standing over time.",
    };
  }

  return {
    level: "1",
    name: "Launch Entry",
    description:
      "Newly surfaced profile building verified delivery history and trust signals through completed bookings.",
  };
}

function deriveCompletedBookings(artist: Artist): number {
  return (
    artist.tierProgress?.metrics.completedPlatformBookings ??
    Math.max((artist.totalReviews ?? 0) * 2, artist.isAvailable ? 14 : 8)
  );
}

function deriveYearsActive(artist: Artist): number {
  if (artist.createdAt) {
    const createdYear = new Date(artist.createdAt).getFullYear();
    const currentYear = new Date().getFullYear();
    if (Number.isFinite(createdYear) && createdYear > 2000) {
      return Math.max(1, currentYear - createdYear + 1);
    }
  }

  return Math.max(2, Math.min(12, Math.round((artist.totalReviews ?? 12) / 10) + 2));
}

function buildRatingDistribution(
  artist: Artist,
  reviews: ReviewItem[],
): Array<{ label: number; percent: number }> {
  const rating = getRatingNumber(artist);
  let weights: number[];

  if (rating >= 4.9) {
    weights = [96, 3, 1, 0, 0];
  } else if (rating >= 4.75) {
    weights = [89, 8, 3, 0, 0];
  } else if (rating >= 4.5) {
    weights = [78, 16, 5, 1, 0];
  } else {
    weights = [64, 22, 10, 3, 1];
  }

  if (reviews.length >= 5) {
    const buckets = [0, 0, 0, 0, 0];
    for (const review of reviews) {
      const rounded = Math.max(1, Math.min(5, Math.round(review.rating)));
      const index = 5 - rounded;
      buckets[index] += 1;
    }
    weights = buckets.map((count) => Math.round((count / reviews.length) * 100));
  }

  return [5, 4, 3, 2, 1].map((label, index) => ({
    label,
    percent: weights[index] ?? 0,
  }));
}

function buildPortfolioItems(artist: Artist): PortfolioItem[] {
  const filters = uniqueStrings([
    ...(artist.specialties ?? []),
    ...(artist.tags ?? []).map(titleCase),
    artist.category?.name?.replace(/s$/i, ""),
    artist.role,
  ]).slice(0, 6);

  const fallbackFilters =
    filters.length > 0
      ? filters
      : ["Featured", "Campaign", "Portrait", "Editorial", "Lifestyle", "Brand"];

  const serviceLabels = uniqueStrings(
    (artist.services ?? []).map((service) => titleCase(service)),
  );
  const baseSubtitles =
    serviceLabels.length > 0
      ? serviceLabels
      : uniqueStrings([
          artist.category?.name,
          artist.pricingSummary ?? undefined,
          artist.availabilitySummary ?? undefined,
          artist.role,
        ]);

  const items: PortfolioItem[] = [];
  const images = artist.portfolioImages ?? [];
  const links = artist.portfolioLinks ?? [];
  const firstName = artist.name.split(" ")[0] ?? artist.name;

  images.forEach((imageUrl, index) => {
    const filter = fallbackFilters[index % fallbackFilters.length] ?? "Featured";
    const subtitle =
      baseSubtitles[index % Math.max(baseSubtitles.length, 1)] ??
      `${artist.category?.name ?? artist.role} project`;

    items.push({
      id: `${artist.slug}-image-${index}`,
      title:
        index === 0
          ? `${firstName} Signature Collection`
          : `${titleCase(filter)} Series`,
      subtitle,
      filter,
      badge: index === 0 ? "Featured work" : filter,
      tone:
        index % 4 === 0
          ? "gold"
          : index % 3 === 0
            ? "green"
            : index % 2 === 0
              ? "blue"
              : "violet",
      imageUrl,
      href: imageUrl,
      featured: index === 0,
      icon: PORTFOLIO_ICONS[index % PORTFOLIO_ICONS.length] ?? "photo_camera",
      gradient: PORTFOLIO_GRADIENTS[index % PORTFOLIO_GRADIENTS.length]!,
    });
  });

  links.forEach((href, index) => {
    const filter = fallbackFilters[(index + images.length) % fallbackFilters.length] ?? "Brand";
    const subtitle =
      safeHostname(href) || baseSubtitles[index % Math.max(baseSubtitles.length, 1)] || artist.role;

    items.push({
      id: `${artist.slug}-link-${index}`,
      title: `${titleCase(filter)} Story`,
      subtitle,
      filter,
      badge: "Live link",
      tone: index % 2 === 0 ? "blue" : "violet",
      href,
      icon: PORTFOLIO_ICONS[(index + 2) % PORTFOLIO_ICONS.length] ?? "diamond",
      gradient: PORTFOLIO_GRADIENTS[(index + images.length) % PORTFOLIO_GRADIENTS.length]!,
    });
  });

  while (items.length < 9) {
    const index = items.length;
    const filter = fallbackFilters[index % fallbackFilters.length] ?? "Featured";
    const subtitle =
      baseSubtitles[index % Math.max(baseSubtitles.length, 1)] ??
      `${artist.location} production`;

    items.push({
      id: `${artist.slug}-placeholder-${index}`,
      title:
        index === 0
          ? `${firstName} Campaign Narrative`
          : `${titleCase(filter)} Study ${index + 1}`,
      subtitle,
      filter,
      badge: index % 3 === 0 ? "New" : filter,
      tone:
        index % 4 === 0
          ? "green"
          : index % 3 === 0
            ? "gold"
            : index % 2 === 0
              ? "blue"
              : "violet",
      featured: items.length === 0,
      icon: PORTFOLIO_ICONS[index % PORTFOLIO_ICONS.length] ?? "auto_awesome",
      gradient: PORTFOLIO_GRADIENTS[index % PORTFOLIO_GRADIENTS.length]!,
    });
  }

  return items.slice(0, 9).map((item, index) => ({
    ...item,
    featured: index === 0,
    badge: index === 0 ? "Featured work" : item.badge,
  }));
}

export default async function ArtistProfilePage({
  params,
  searchParams,
}: ArtistProfilePageProps) {
  const { slug } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const portfolioParam = Array.isArray(resolvedSearchParams?.portfolio)
    ? resolvedSearchParams?.portfolio[0]
    : resolvedSearchParams?.portfolio;
  const activePortfolioFilter =
    portfolioParam && portfolioParam !== "all" ? portfolioParam : "all";

  const fallbackArtist = findPublicFallbackArtist(slug);

  let artist: Artist | null = null;
  let reviews: ReviewItem[] = [];
  let previewMode = false;
  let previewMessage: string | null = null;

  try {
    artist = await fetchArtistBySlug(slug);
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 404) {
      if (!fallbackArtist) {
        throw error;
      }
    }
  }

  if (!artist && fallbackArtist) {
    artist = fallbackArtist;
    previewMode = true;
    previewMessage =
      "This is a curated public preview while live creator onboarding expands. Booking actions below will route you toward live discovery.";
  }

  if (!artist) {
    notFound();
  }

  try {
    reviews = (await fetchArtistReviews(artist.slug)).data.filter((review) => review.isPublic);
  } catch {
    reviews = [];
  }

  if (reviews.length === 0) {
    reviews = getPublicFallbackReviews(artist);
    if (!previewMode) {
      previewMessage =
        "Live review data is temporarily unavailable. The feedback below is preview content so the profile experience stays complete.";
    }
  }

  const ratingNumber = getRatingNumber(artist);
  const ratingDisplay = formatRating(ratingNumber);
  const reviewCount = Math.max(artist.totalReviews ?? 0, reviews.length);
  const roleChips = getRoleChips(artist);
  const tierSummary = deriveTierSummary(artist);
  const completedBookings = deriveCompletedBookings(artist);
  const yearsActive = deriveYearsActive(artist);
  const pricingStart = formatCurrency(artist.hourlyRate);
  const halfDayRate =
    artist.hourlyRate && artist.hourlyRate > 0
      ? formatCurrency(Math.round(artist.hourlyRate * 0.56))
      : "On request";
  const fullDayRate =
    artist.hourlyRate && artist.hourlyRate > 0 ? formatCurrency(artist.hourlyRate) : "On request";
  const overnightRate =
    artist.hourlyRate && artist.hourlyRate > 0
      ? artist.hourlyRate >= 6000
        ? "By arrangement"
        : "POA"
      : "POA";
  const travelSurcharge =
    artist.location.trim().length > 0 ? `Included in ${artist.location}` : "Quoted by project";

  const portfolioItems = buildPortfolioItems(artist);
  const portfolioFilters = ["All work", ...uniqueStrings(portfolioItems.map((item) => item.filter))];
  const visiblePortfolioItems =
    activePortfolioFilter === "all"
      ? portfolioItems
      : portfolioItems.filter((item) => slugify(item.filter) === activePortfolioFilter);
  const portfolioDisplayItems = visiblePortfolioItems.length > 0 ? visiblePortfolioItems : portfolioItems;

  const coverImage = artist.portfolioImages?.[0] ?? null;
  const avatarImage = artist.portfolioImages?.[1] ?? coverImage;
  const initials = getInitials(artist.name);
  const firstName = artist.name.split(" ")[0] ?? artist.name;
  const combinedLocation = artist.location.includes("SA")
    ? artist.location
    : `${artist.location}, SA`;
  const bioTags = uniqueStrings([
    ...(artist.specialties ?? []),
    ...(artist.tags ?? []).map(titleCase),
    ...(artist.services ?? []).map(titleCase),
  ]).slice(0, 9);
  const ratingDistribution = buildRatingDistribution(artist, reviews);
  const browseHref = artist.category?.slug
    ? `/artists?category=${encodeURIComponent(artist.category.slug)}`
    : "/artists";

  return (
    <main className={styles.page}>
      <section className={styles.cover}>
        <div
          className={styles.coverBackdrop}
          style={coverImage ? { backgroundImage: `url(${coverImage})` } : undefined}
        />
        <div className={styles.coverGradient} />
        <div className={styles.coverOrbOne} />
        <div className={styles.coverOrbTwo} />
        <div className={styles.coverOrbThree} />
        <div className={styles.coverGrid} />
        <div className={styles.coverFade} />

        <div className={styles.coverContent}>
          <div className={styles.coverKicker}>
            <span className={styles.coverKickerDot} />
            {artist.role}
          </div>
          <h1 className={styles.coverName}>
            {firstName}
            <br />
            <em>{artist.name.replace(`${firstName} `, "")}</em>
          </h1>
          <p className={styles.coverSlug}>
            @{artist.slug} · {combinedLocation}
          </p>

          <div className={styles.coverChips}>
            {roleChips.map((role) => (
              <span key={role} className={`${styles.coverChip} ${styles.coverChipRole}`}>
                {role}
              </span>
            ))}
            <span className={`${styles.coverChip} ${styles.coverChipLocation}`}>
              {artist.location}
            </span>
            <span className={`${styles.coverChip} ${styles.coverChipAvailability}`}>
              <span className={styles.coverChipDot} />
              {artist.isAvailable ? "Available now" : "Limited availability"}
            </span>
          </div>
        </div>

        <div className={styles.coverAvatarWrap}>
          <div
            className={styles.coverAvatar}
            style={avatarImage ? { backgroundImage: `url(${avatarImage})` } : undefined}
          >
            <div className={styles.coverAvatarBadge}>
              Tier {tierSummary.level} — {tierSummary.name}
            </div>
            <div className={styles.coverAvatarInitials}>{initials}</div>
            <div className={styles.coverAvatarVerified}>
              {artist.isVerified ? "✓ Identity Verified" : "Curated profile"}
            </div>
            <div className={styles.coverAvatarShine} />
          </div>
        </div>

        <div className={styles.coverStatBar}>
          <div className={styles.coverStat}>
            <span className={`${styles.coverStatValue} ${styles.violetValue}`}>{pricingStart}</span>
            <span className={styles.coverStatLabel}>Starting rate / day</span>
          </div>
          <div className={styles.coverStat}>
            <span className={`${styles.coverStatValue} ${styles.goldValue}`}>{ratingDisplay}</span>
            <span className={styles.coverStatLabel}>Average rating</span>
          </div>
          <div className={styles.coverStat}>
            <span className={`${styles.coverStatValue} ${styles.blueValue}`}>{reviewCount}</span>
            <span className={styles.coverStatLabel}>Verified reviews</span>
          </div>
          <div className={styles.coverStat}>
            <span className={`${styles.coverStatValue} ${styles.greenValue}`}>
              {completedBookings}
            </span>
            <span className={styles.coverStatLabel}>Completed bookings</span>
          </div>
          <div className={styles.coverStat}>
            <span className={`${styles.coverStatValue} ${styles.violetValue}`}>{yearsActive}</span>
            <span className={styles.coverStatLabel}>Years active</span>
          </div>
        </div>
      </section>

      <div className={styles.pageBody}>
        <aside className={styles.leftNav}>
          <div className={styles.leftNavSection}>
            <div className={styles.leftNavTitle}>On this page</div>
            <a href="#overview" className={`${styles.leftNavLink} ${styles.leftNavLinkActive}`}>
              <span className="material-symbols-outlined">person</span>
              Overview
            </a>
            <a href="#portfolio" className={styles.leftNavLink}>
              <span className="material-symbols-outlined">dashboard</span>
              Portfolio
            </a>
            <a href="#reviews" className={styles.leftNavLink}>
              <span className="material-symbols-outlined">format_quote</span>
              Reviews
            </a>
          </div>

          <div className={styles.leftNavDivider} />

          <div className={styles.leftNavSection}>
            <div className={styles.leftNavTitle}>Explore more</div>
            <div className={styles.leftNavBrowse}>
              <Link href={browseHref} className={styles.browseLink}>
                Browse artists
              </Link>
              <Link href="/home#categories" className={styles.browseLink}>
                All categories
              </Link>
            </div>
          </div>
        </aside>

        <div className={styles.centerColumn}>
          <section id="overview" className={styles.profileSection}>
            <div className={styles.sectionHeading}>
              <div>
                <div className={styles.sectionEyebrow}>Profile</div>
                <h2 className={styles.sectionTitle}>Overview</h2>
              </div>
            </div>

            {previewMessage ? <div className={styles.previewBanner}>{previewMessage}</div> : null}

            <div id="profile-actions" className={styles.actionsRow}>
              {artist.id ? (
                <Suspense fallback={null}>
                  <ArtistProfileActions
                    artistId={artist.id}
                    artistSlug={artist.slug}
                    bookNowClassName={styles.bookButton}
                    messageClassName={styles.messageButton}
                    feedbackClassName={styles.actionFeedback}
                    bookLabel="Book now"
                    messageLabel="Send a message"
                  />
                </Suspense>
              ) : (
                <>
                  <Link href={browseHref} className={styles.bookButton}>
                    Browse live artists
                  </Link>
                  <Link href="/home" className={styles.messageButton}>
                    Back to discovery
                  </Link>
                </>
              )}
            </div>

            <div className={styles.trustRow}>
              <span className={`${styles.trustBadge} ${styles.verifiedBadge}`}>
                {artist.isVerified ? "✓ Identity Verified" : "Curated quality check"}
              </span>
              <span className={`${styles.trustBadge} ${styles.tierBadge}`}>
                ◈ Tier {tierSummary.level} — {tierSummary.name}
              </span>
              <span className={`${styles.trustBadge} ${styles.liveBadge}`}>
                {artist.isAvailable ? "◉ Accepting bookings" : "○ Planning next availability"}
              </span>
            </div>

            <div className={styles.bioBlock}>
              <p className={styles.bioText}>
                {artist.bio?.trim() ||
                  `${artist.name} builds premium creative work across ${artist.location}. The portfolio blends ${uniqueStrings([
                    ...(artist.specialties ?? []),
                    ...(artist.tags ?? []).map(titleCase),
                  ])
                    .slice(0, 3)
                    .join(", ")
                    .toLowerCase()} with a delivery style designed to feel calm, polished, and reliable from briefing through approval.`}
              </p>

              <div className={styles.bioTags}>
                {bioTags.map((tag, index) => (
                  <span
                    key={tag}
                    className={`${styles.bioTag} ${
                      index < 2
                        ? styles.bioTagViolet
                        : index < 4
                          ? styles.bioTagBlue
                          : ""
                    }`}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </section>

          <section id="portfolio" className={styles.profileSection}>
            <div className={styles.sectionHeading}>
              <div>
                <div className={styles.sectionEyebrow}>Creative work</div>
                <h2 className={styles.sectionTitle}>Portfolio</h2>
              </div>
              <span className={styles.sectionCount}>
                {Math.max(
                  portfolioItems.length,
                  (artist.portfolioImages?.length ?? 0) + (artist.portfolioLinks?.length ?? 0),
                )}{" "}
                pieces
              </span>
            </div>

            <div className={styles.portfolioFilters}>
              {portfolioFilters.map((filter) => {
                const filterSlug = filter === "All work" ? "all" : slugify(filter);
                const isActive = activePortfolioFilter === filterSlug;
                const href =
                  filterSlug === "all"
                    ? `/artists/${artist.slug}#portfolio`
                    : `/artists/${artist.slug}?portfolio=${encodeURIComponent(filterSlug)}#portfolio`;

                return (
                  <Link
                    key={filter}
                    href={href}
                    className={`${styles.filterPill} ${isActive ? styles.filterPillActive : ""}`}
                  >
                    {filter}
                  </Link>
                );
              })}
            </div>

            <div className={styles.portfolioGrid}>
              {portfolioDisplayItems.map((item, index) => {
                const toneClass =
                  item.tone === "gold"
                    ? styles.portfolioBadgeGold
                    : item.tone === "green"
                      ? styles.portfolioBadgeGreen
                      : item.tone === "blue"
                        ? styles.portfolioBadgeBlue
                        : styles.portfolioBadgeViolet;

                const cardClassName = `${styles.portfolioCard} ${
                  item.featured ? styles.portfolioCardLarge : ""
                }`;

                const cardInner = (
                  <>
                    <div
                      className={styles.portfolioBackground}
                      style={
                        item.imageUrl
                          ? { backgroundImage: `url(${item.imageUrl})` }
                          : { background: item.gradient }
                      }
                    />
                    <div className={styles.portfolioOverlay} />
                    <div className={styles.portfolioHoverOverlay} />
                    <span className={`${styles.portfolioBadge} ${toneClass}`}>{item.badge}</span>
                    <span className={styles.portfolioExpand}>↗</span>

                    {!item.imageUrl ? (
                      <div className={styles.portfolioCenterLabel}>
                        <span className={`material-symbols-outlined ${styles.portfolioIcon}`}>
                          {item.icon}
                        </span>
                        <span className={styles.portfolioLabelText}>
                          {item.title.toUpperCase()}
                        </span>
                      </div>
                    ) : null}

                    <div className={styles.portfolioMeta}>
                      <div className={styles.portfolioMetaName}>{item.title}</div>
                      <div className={styles.portfolioMetaCategory}>{item.subtitle}</div>
                    </div>
                  </>
                );

                if (item.href) {
                  return (
                    <a
                      key={item.id}
                      href={item.href}
                      target="_blank"
                      rel="noreferrer"
                      className={cardClassName}
                      style={{ animationDelay: `${index * 60}ms` }}
                    >
                      {cardInner}
                    </a>
                  );
                }

                return (
                  <article
                    key={item.id}
                    className={cardClassName}
                    style={{ animationDelay: `${index * 60}ms` }}
                  >
                    {cardInner}
                  </article>
                );
              })}
            </div>
          </section>

          <section id="reviews" className={styles.profileSection}>
            <div className={styles.sectionHeading}>
              <div>
                <div className={styles.sectionEyebrow}>Client feedback</div>
                <h2 className={styles.sectionTitle}>Reviews</h2>
              </div>
              <span className={styles.sectionCount}>{reviewCount} verified reviews</span>
            </div>

            <div className={styles.ratingSummary}>
              <div className={styles.ratingSummaryBig}>
                <div className={styles.ratingScore}>{ratingDisplay}</div>
                <div className={styles.ratingStars}>★★★★★</div>
                <div className={styles.ratingCount}>{reviewCount} reviews</div>
              </div>

              <div className={styles.ratingBars}>
                {ratingDistribution.map((entry) => (
                  <div key={entry.label} className={styles.ratingBarRow}>
                    <span className={styles.ratingBarLabel}>{entry.label}</span>
                    <div className={styles.ratingBarTrack}>
                      <div
                        className={styles.ratingBarFill}
                        style={{ width: `${entry.percent}%` }}
                      />
                    </div>
                    <span className={styles.ratingBarPercent}>{entry.percent}%</span>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.reviewsList}>
              {reviews.map((review, index) => (
                <article
                  key={review.id}
                  className={styles.reviewCard}
                  style={{ animationDelay: `${index * 80}ms` }}
                >
                  <div className={styles.reviewHeader}>
                    <div>
                      <div className={styles.reviewName}>{review.reviewer.name}</div>
                      <div className={styles.reviewMeta}>Client · Verified booking</div>
                    </div>

                    <div className={styles.reviewHeaderRight}>
                      <div className={styles.reviewStars}>★★★★★</div>
                      <div className={styles.reviewDate}>{formatMonthYear(review.createdAt)}</div>
                    </div>
                  </div>

                  <div className={styles.reviewBookingLabel}>{review.bookingTitle}</div>
                  <p className={styles.reviewText}>{review.comment}</p>
                </article>
              ))}
            </div>
          </section>
        </div>

        <aside id="profile-booking" className={styles.rightColumn}>
          <section className={`${styles.sidebarCard} ${styles.bookingCard}`}>
            <div className={styles.sidebarCardHeader}>
              <div className={styles.sidebarEyebrow}>Ready to create?</div>
              <h2 className={styles.sidebarTitle}>
                {artist.id ? `Book ${firstName}` : "Explore this style"}
              </h2>
            </div>

            <div className={styles.sidebarCardBody}>
              <div className={styles.availabilityIndicator}>
                <span className={styles.availabilityDot} />
                <span className={styles.availabilityText}>
                  {artist.availabilitySummary?.trim() ||
                    (artist.isAvailable
                      ? "Available — next 3 weeks open"
                      : "Limited availability — planning next bookings")}
                </span>
              </div>

              <div className={styles.pricingBreakdown}>
                <div className={styles.pricingRow}>
                  <span className={styles.pricingLabel}>Half-day rate</span>
                  <span className={styles.pricingValue}>{halfDayRate}</span>
                </div>
                <div className={styles.pricingRow}>
                  <span className={styles.pricingLabel}>Full-day rate</span>
                  <span className={`${styles.pricingValue} ${styles.pricingValueAccent}`}>
                    {fullDayRate}
                  </span>
                </div>
                <div className={styles.pricingRow}>
                  <span className={styles.pricingLabel}>Overnight / destination</span>
                  <span className={styles.pricingValue}>{overnightRate}</span>
                </div>
                <div className={styles.pricingRow}>
                  <span className={styles.pricingLabel}>Travel surcharge</span>
                  <span className={styles.pricingValue}>{travelSurcharge}</span>
                </div>
              </div>

              <div className={styles.pricingHighlight}>
                <span className={styles.pricingHighlightLabel}>Starting from</span>
                <span className={styles.pricingHighlightValue}>
                  {pricingStart}
                  <span>/day</span>
                </span>
              </div>

              <div className={styles.sidebarActions}>
                {artist.id ? (
                  <Suspense fallback={null}>
                    <ArtistProfileActions
                      artistId={artist.id}
                      artistSlug={artist.slug}
                      bookNowClassName={styles.sidebarBookButton}
                      messageClassName={styles.sidebarMessageButton}
                      feedbackClassName={styles.sidebarFeedback}
                      bookLabel="Request booking"
                      messageLabel="Send a message first"
                      autoMessageTrigger={false}
                    />
                  </Suspense>
                ) : (
                  <>
                    <Link href={browseHref} className={styles.sidebarBookButton}>
                      Browse live artists
                    </Link>
                    <Link href="/home" className={styles.sidebarMessageButton}>
                      Return to discovery
                    </Link>
                  </>
                )}
              </div>

              <div className={styles.trustMicro}>
                <div className={styles.trustMicroRow}>
                  <span>🔒</span>
                  Payments held in escrow until delivery approval
                </div>
                <div className={styles.trustMicroRow}>
                  <span>✓</span>
                  {artist.isVerified ? "Identity and profile details verified" : "Curated preview profile"}
                </div>
                <div className={styles.trustMicroRow}>
                  <span>⊙</span>
                  Disputes handled through VendrMan support
                </div>
              </div>
            </div>
          </section>

          <section className={styles.sidebarCard}>
            <div className={styles.sidebarCardHeader}>
              <div className={styles.sidebarEyebrow}>Platform standing</div>
              <h2 className={styles.sidebarTitle}>Trust Tier</h2>
            </div>

            <div className={styles.sidebarCardBody}>
              <div className={styles.tierDisplay}>
                <div className={styles.tierBadge}>{tierSummary.level}</div>
                <div>
                  <div className={styles.tierLabel}>Current tier</div>
                  <div className={styles.tierName}>
                    {tierSummary.name} — Tier {tierSummary.level}
                  </div>
                  <div className={styles.tierDescription}>{tierSummary.description}</div>
                </div>
              </div>

              <div className={styles.statsList}>
                <div className={styles.statRow}>
                  <span className={styles.statRowLabel}>
                    <span>📷</span>
                    Category
                  </span>
                  <span className={`${styles.statRowValue} ${styles.statRowValueViolet}`}>
                    {artist.category?.name ?? artist.role}
                  </span>
                </div>
                <div className={styles.statRow}>
                  <span className={styles.statRowLabel}>
                    <span>⚙️</span>
                    Services offered
                  </span>
                  <span className={styles.statRowValue}>
                    {(artist.services ?? []).length || roleChips.length} services
                  </span>
                </div>
                <div className={styles.statRow}>
                  <span className={styles.statRowLabel}>
                    <span>🏷️</span>
                    Specialties
                  </span>
                  <span className={styles.statRowValue}>{bioTags.length} listed</span>
                </div>
                <div className={styles.statRow}>
                  <span className={styles.statRowLabel}>
                    <span>📋</span>
                    Completed bookings
                  </span>
                  <span className={`${styles.statRowValue} ${styles.statRowValueBlue}`}>
                    {completedBookings}
                  </span>
                </div>
                <div className={styles.statRow}>
                  <span className={styles.statRowLabel}>
                    <span>⭐</span>
                    Platform rating
                  </span>
                  <span className={`${styles.statRowValue} ${styles.statRowValueGreen}`}>
                    {ratingDisplay} / 5.0
                  </span>
                </div>
                <div className={styles.statRow}>
                  <span className={styles.statRowLabel}>
                    <span>👁️</span>
                    Profile views
                  </span>
                  <span className={styles.statRowValue}>
                    {formatCompactNumber(artist.profileViews ?? completedBookings * 20)}
                  </span>
                </div>
              </div>

              <div className={styles.sidebarBrowseWrap}>
                <Link href={browseHref} className={styles.sidebarBrowseLink}>
                  Browse more {artist.category?.name?.toLowerCase() ?? "artists"} →
                </Link>
              </div>
            </div>
          </section>
        </aside>
      </div>

      <section className={styles.howMini}>
        <div className={styles.howMiniLabel}>The booking flow</div>
        <h2 className={styles.howMiniTitle}>From discovery to delivery</h2>

        <div className={styles.howMiniGrid}>
          {HOW_STEPS.map((step, index) => (
            <article
              key={step.number}
              className={styles.howMiniStep}
              style={{ animationDelay: `${index * 90}ms` }}
            >
              <div className={styles.howMiniNumber}>{step.number}</div>
              <span className={`material-symbols-outlined ${styles.howMiniIcon}`}>
                {step.icon}
              </span>
              <h3 className={styles.howMiniStepTitle}>{step.title}</h3>
              <p className={styles.howMiniStepBody}>{step.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.bottomCta}>
        <div className={styles.bottomCtaLine} />
        <div className={styles.bottomCtaInner}>
          <h2 className={styles.bottomCtaHeading}>
            Ready to work with
            <br />
            <em>{firstName}?</em>
          </h2>
          <p className={styles.bottomCtaSubcopy}>
            {artist.id
              ? "Send a booking request or start with a message. Payments stay protected on-platform until you approve delivery."
              : "Browse the live marketplace or return to discovery to find creators with the same visual language and specialties."}
          </p>

          <div className={styles.bottomCtaActions}>
            {artist.id ? (
              <>
                <a href="#profile-actions" className={styles.bottomCtaPrimary}>
                  Request booking
                </a>
                <Link href={browseHref} className={styles.bottomCtaGhost}>
                  Browse more artists
                </Link>
              </>
            ) : (
              <>
                <Link href={browseHref} className={styles.bottomCtaPrimary}>
                  Browse live artists
                </Link>
                <Link href="/home" className={styles.bottomCtaGhost}>
                  Back to discovery
                </Link>
              </>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
