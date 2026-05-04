"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useEffect, useMemo, useState } from "react";
import type { Artist, ArtistCategory, ArtistSearchParams } from "@vendorapp/shared";
import { ApiError, fetchArtists, fetchCategories } from "@/lib/api";
import { PUBLIC_FALLBACK_ARTISTS as FALLBACK_ARTISTS } from "@/lib/publicArtistFallbacks";
import styles from "./page.module.css";

const LOCATION_OPTIONS = [
  "All locations",
  "Cape Town",
  "Johannesburg",
  "Durban",
  "Pretoria",
  "Port Elizabeth",
];

const HERO_PROMPTS = [
  { label: "Wedding photographer", query: "Wedding photographer" },
  { label: "Cape Town videographer", query: "Cape Town videographer", location: "Cape Town" },
  { label: "Brand content creators", query: "Brand content creators", category: "content" },
  { label: "Event coverage", query: "Event coverage", category: "events" },
  { label: "Automotive shoot", query: "Automotive shoot", category: "automotive" },
];

const MARQUEE_FALLBACK = [
  "Wedding creators",
  "Commercial photography",
  "Event videography",
  "Brand content",
  "Fashion editorial",
  "Automotive shoots",
  "Product content",
  "Corporate film",
];

const TRUST_PILLS = [
  { icon: "verified", label: "Verified profiles", tone: "green" },
  { icon: "shield_locked", label: "Secure booking", tone: "blue" },
  { icon: "payments", label: "Pricing transparency", tone: "gold" },
  { icon: "support_agent", label: "Centralized support", tone: "violet" },
] as const;

const TRUST_MOMENTUM = [
  {
    number: "01",
    icon: "verified_user",
    title: "Verified profiles stay visible",
    body: "Every artist in this feed has passed manual identity and quality review before appearing here.",
    tone: "violet",
  },
  {
    number: "02",
    icon: "event_available",
    title: "Availability is easy to read",
    body: "Live availability indicators are surfaced up front so you are not guessing who can take the booking now.",
    tone: "blue",
  },
  {
    number: "03",
    icon: "trending_up",
    title: "Trending specialties surface first",
    body: "Discovery is shaped by recent bookings, ratings, and real marketplace engagement rather than vanity ordering.",
    tone: "green",
  },
  {
    number: "04",
    icon: "bolt",
    title: "Optimized toward faster booking",
    body: "Pricing, availability, trust, and role signals are all visible before you click into a profile.",
    tone: "gold",
  },
] as const;

const HOW_STEPS = [
  {
    icon: "travel_explore",
    title: "Discover",
    body: "Browse curated rails, search by specialty, or use the command centre to filter by location and category. Every profile is reviewed before it appears here.",
  },
  {
    icon: "balance",
    title: "Compare",
    body: "Check portfolios, verified reviews, availability, and pricing signals in one place instead of stitching context together off-platform.",
  },
  {
    icon: "lock",
    title: "Book",
    body: "Move into booking with secure payment handling, clearer approval states, and centralized support when a project needs attention.",
  },
  {
    icon: "auto_awesome",
    title: "Create",
    body: "Your creative gets to work while the platform keeps delivery, payout, and verified review signals tied to the booking journey.",
  },
] as const;

const FALLBACK_CATEGORIES: ArtistCategory[] = [
  { id: "photography", name: "Photographers", slug: "photography" },
  { id: "videography", name: "Videographers", slug: "videography" },
  { id: "design", name: "Designers", slug: "design" },
  { id: "weddings", name: "Wedding creators", slug: "weddings" },
  { id: "events", name: "Event creators", slug: "events" },
  { id: "automotive", name: "Automotive specialists", slug: "automotive" },
  { id: "content", name: "Content creators", slug: "content" },
];

const FALLBACK_MEDIA_LIBRARY = {
  photography: [
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=900&q=80",
  ],
  videography: [
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80",
  ],
  design: [
    "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80",
  ],
  weddings: [
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=900&q=80",
  ],
  events: [
    "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80",
  ],
  automotive: [
    "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80",
  ],
  content: [
    "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=900&q=80",
  ],
  default: [
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80",
  ],
} as const;

const GRADIENTS = [
  "linear-gradient(135deg, #0f0c29 0%, #302b63 55%, #24243e 100%)",
  "linear-gradient(135deg, #0d1b2a 0%, #1b3a5c 55%, #0d2137 100%)",
  "linear-gradient(135deg, #1a0533 0%, #3d1060 55%, #1a0533 100%)",
  "linear-gradient(135deg, #0a1628 0%, #1e3a5f 40%, #2d1b69 100%)",
  "linear-gradient(135deg, #12001f 0%, #3b0764 50%, #1c0a3b 100%)",
  "linear-gradient(135deg, #080e1a 0%, #0f2d5e 50%, #1a3d7c 100%)",
  "linear-gradient(135deg, #1a0a00 0%, #4a1a00 50%, #2d1500 100%)",
  "linear-gradient(135deg, #001a1a 0%, #003d3d 50%, #001f1f 100%)",
];

type DiscoveryDataSets = {
  topRated: Artist[];
  newest: Artist[];
  premium: Artist[];
  weddings: Artist[];
  events: Artist[];
  content: Artist[];
};

type RailTone = "violet" | "blue" | "gold" | "pink";

type DiscoveryRail = {
  key: string;
  eyebrow: string;
  title: string;
  copy: string;
  countLabel: string;
  href: string;
  tone: RailTone;
  artists: Artist[];
};

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

function buildDiscoveryHref(params: {
  q?: string;
  location?: string;
  category?: string;
  tags?: string[];
  available?: boolean;
  sortBy?: ArtistSearchParams["sortBy"];
}): string {
  const query = new URLSearchParams();

  if (params.q) query.set("q", params.q);
  if (params.location && params.location !== "All locations") {
    query.set("location", params.location);
  }
  if (params.category && params.category !== "all") query.set("category", params.category);
  if (params.tags && params.tags.length > 0) query.set("tags", params.tags.join(","));
  if (params.available) query.set("available", "true");
  if (params.sortBy) query.set("sortBy", params.sortBy);

  const suffix = query.toString();
  return suffix ? `/artists?${suffix}` : "/artists";
}

function dedupeArtists(artists: Artist[]): Artist[] {
  const seen = new Set<string>();
  return artists.filter((artist) => {
    const key = artist.slug || artist.name;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function pickArtistsFromMany(limit: number, ...collections: Artist[][]): Artist[] {
  return dedupeArtists(collections.flat()).slice(0, limit);
}

function buildFallbackDataSets(): DiscoveryDataSets {
  return {
    topRated: FALLBACK_ARTISTS.slice(0, 5),
    newest: FALLBACK_ARTISTS.slice(1, 6),
    premium: [...FALLBACK_ARTISTS].sort(
      (left, right) => (right.hourlyRate ?? 0) - (left.hourlyRate ?? 0),
    ),
    weddings: FALLBACK_ARTISTS.filter((artist) =>
      (artist.tags ?? []).includes("weddings"),
    ),
    events: FALLBACK_ARTISTS.filter((artist) =>
      (artist.tags ?? []).includes("events"),
    ),
    content: FALLBACK_ARTISTS.filter((artist) =>
      (artist.tags ?? []).includes("content"),
    ),
  };
}

const FALLBACK_DATASETS = buildFallbackDataSets();

function artistMatchesCategory(artist: Artist, category: string): boolean {
  const haystack = [
    artist.category?.slug,
    artist.category?.name,
    artist.role,
    ...(artist.tags ?? []),
    ...(artist.services ?? []),
    ...(artist.specialties ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(category.toLowerCase());
}

function buildTopSpecialties(artists: Artist[]): string[] {
  const counts = new Map<string, number>();

  for (const artist of artists) {
    for (const specialty of [
      ...(artist.specialties ?? []),
      ...(artist.tags ?? []),
      artist.category?.name ?? "",
    ]) {
      if (!specialty) continue;
      counts.set(specialty, (counts.get(specialty) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 7)
    .map(([label]) => label);
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function getRoleLabel(artist: Artist): string {
  return artist.role || artist.category?.name || "Creative";
}

function getCategoryIcon(slug: string): string {
  const key = slug.toLowerCase();
  if (key.includes("photo")) return "photo_camera";
  if (key.includes("video")) return "videocam";
  if (key.includes("design")) return "draw";
  if (key.includes("wedding")) return "favorite";
  if (key.includes("event")) return "celebration";
  if (key.includes("auto") || key.includes("car")) return "directions_car";
  if (key.includes("content")) return "perm_media";
  return "category";
}

function getCategoryAccent(index: number): string {
  return ["blue", "violet", "pink", "gold", "green", "orange", "purple"][
    index % 7
  ]!;
}

function getCategoryCount(artists: Artist[], category: ArtistCategory): number {
  return artists.filter((artist) => artistMatchesCategory(artist, category.slug)).length;
}

function getRatingValue(artist: Artist): string {
  if (typeof artist.averageRating === "number") {
    return artist.averageRating.toFixed(2);
  }

  const parsed = Number.parseFloat(artist.rating);
  return Number.isFinite(parsed) ? parsed.toFixed(2) : "4.90";
}

function getReviewCount(artist: Artist): number {
  return artist.totalReviews ?? 0;
}

function getPricingValue(artist: Artist): string {
  if (artist.hourlyRate && artist.hourlyRate > 0) {
    return formatCurrency(artist.hourlyRate);
  }

  if (artist.pricingSummary) {
    return artist.pricingSummary.replace(/^From\s+/i, "").split(" ")[0] ?? "On request";
  }

  return "On request";
}

function getGradient(index: number): string {
  return GRADIENTS[index % GRADIENTS.length]!;
}

function hashString(value: string): number {
  return value.split("").reduce((total, char) => total + char.charCodeAt(0), 0);
}

function getArtistMediaKey(
  artist: Artist,
): keyof typeof FALLBACK_MEDIA_LIBRARY {
  const haystack = [
    artist.category?.slug,
    artist.category?.name,
    artist.role,
    ...(artist.specialties ?? []),
    ...(artist.tags ?? []),
    ...(artist.services ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (haystack.includes("wedding")) return "weddings";
  if (haystack.includes("event")) return "events";
  if (haystack.includes("auto") || haystack.includes("car")) return "automotive";
  if (haystack.includes("design")) return "design";
  if (haystack.includes("content") || haystack.includes("social")) return "content";
  if (haystack.includes("video") || haystack.includes("film")) return "videography";
  if (haystack.includes("photo")) return "photography";
  return "default";
}

function getArtistImage(artist: Artist, offset = 0): string | null {
  const directImage = artist.portfolioImages?.find(
    (image) => typeof image === "string" && image.trim().length > 0,
  );
  if (directImage) {
    return directImage.trim();
  }

  const mediaKey = getArtistMediaKey(artist);
  const pool = FALLBACK_MEDIA_LIBRARY[mediaKey] ?? FALLBACK_MEDIA_LIBRARY.default;
  const imageIndex = (hashString(`${artist.slug}-${artist.name}`) + offset) % pool.length;
  return pool[imageIndex] ?? pool[0] ?? null;
}

function getRailTrustLabel(artist: Artist, railKey: string): {
  label: string;
  state: "verified" | "premium" | "live" | "curated";
} {
  if (railKey === "premium") {
    return { label: "Premium", state: "premium" };
  }
  if (artist.isVerified) {
    return { label: "Verified", state: "verified" };
  }
  if (artist.isLive) {
    return { label: "Live", state: "live" };
  }
  return { label: "Curated", state: "curated" };
}

function ArtistCard({
  artist,
  index,
  railKey,
}: {
  artist: Artist;
  index: number;
  railKey: string;
}) {
  const trust = getRailTrustLabel(artist, railKey);
  const previewImage = getArtistImage(artist, index);

  return (
    <article
      className={styles.artistCard}
      data-reveal
      style={{ transitionDelay: `${index * 80}ms` }}
    >
      <div className={styles.artistCardMedia}>
        <div className={styles.artistCardGradient} style={{ background: getGradient(index) }} />
        {previewImage ? (
          <div
            aria-hidden="true"
            className={styles.artistCardImage}
            style={{ backgroundImage: `url(${previewImage})` }}
          />
        ) : null}
        <div className={styles.artistCardOverlay} />
        <div className={styles.artistCardAvatar}>{getInitials(artist.name)}</div>

        <div className={styles.artistCardTrustPill} data-state={trust.state}>
          {trust.label}
        </div>

        <div className={styles.artistCardPricing}>
          <div className={styles.artistCardPriceValue}>{getPricingValue(artist)}</div>
          <div className={styles.artistCardPriceNote}>starting price</div>
        </div>

        {artist.isAvailable ? (
          <div className={styles.artistCardAvailability}>
            <span className={styles.artistCardAvailabilityDot} />
            Available
          </div>
        ) : null}
      </div>

      <div className={styles.artistCardBody}>
        <div className={styles.artistCardRole}>{getRoleLabel(artist)}</div>
        <h3 className={styles.artistCardName}>{artist.name}</h3>

        <div className={styles.artistCardRating}>
          <span className={`material-symbols-outlined ${styles.artistCardStars}`}>star</span>
          <span className={styles.artistCardRatingValue}>{getRatingValue(artist)}</span>
          <span className={styles.artistCardRatingCount}>
            ({Math.max(getReviewCount(artist), 6)})
          </span>
        </div>

        <div className={styles.artistCardLocation}>
          <span className="material-symbols-outlined">location_on</span>
          {artist.location}
        </div>

        <p className={styles.artistCardBio}>
          {artist.bio ??
            "A premium creative profile with cleaner presentation, clearer trust cues, and better booking context."}
        </p>

        <div className={styles.artistCardTags}>
          {[artist.category?.name, ...(artist.specialties ?? []), ...(artist.tags ?? [])]
            .filter((tag, tagIndex, values): tag is string =>
              Boolean(tag) && values.indexOf(tag) === tagIndex,
            )
            .slice(0, 3)
            .map((tag) => (
              <span key={tag} className={styles.artistCardTag}>
                {tag}
              </span>
            ))}
        </div>
      </div>

      <div className={styles.artistCardFooter}>
        <Link href={`/artists/${artist.slug}`} className={styles.artistCardPrimary}>
          View profile
        </Link>
        <Link
          href={buildDiscoveryHref({
            category: artist.category?.slug,
            q: artist.name,
          })}
          className={styles.artistCardSecondary}
        >
          Similar picks
        </Link>
      </div>
    </article>
  );
}

function RailSection({
  rail,
  loading,
}: {
  rail: DiscoveryRail;
  loading: boolean;
}) {
  return (
    <div className={styles.rail}>
      <div className={styles.railHeader} data-reveal data-tone={rail.tone}>
        <div className={styles.railLeft}>
          <div className={styles.railEyebrow} data-tone={rail.tone}>
            {rail.eyebrow}
          </div>
          <div className={styles.railTitle}>{rail.title}</div>
          <div className={styles.railMicro}>{rail.copy}</div>
        </div>

        <div className={styles.railRight}>
          <span className={styles.railCount}>{rail.countLabel}</span>
          <Link href={rail.href} className={styles.railSeeAll}>
            See all
          </Link>
        </div>
      </div>

      <div className={styles.railScroll}>
        {loading
          ? Array.from({ length: 4 }).map((_, index) => (
              <article
                key={index}
                className={styles.artistCardSkeleton}
                data-reveal
                style={{ transitionDelay: `${index * 80}ms` }}
              />
            ))
          : rail.artists.map((artist, index) => (
              <ArtistCard
                key={`${rail.key}-${artist.slug}`}
                artist={artist}
                index={index}
                railKey={rail.key}
              />
            ))}
      </div>
    </div>
  );
}

export default function PublicHomePage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState(LOCATION_OPTIONS[0]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [compactSearch, setCompactSearch] = useState(false);
  const [categories, setCategories] = useState<ArtistCategory[]>(FALLBACK_CATEGORIES);
  const [dataSets, setDataSets] = useState<DiscoveryDataSets>(buildFallbackDataSets());
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setLoadError(null);

      try {
        const [categoryData, topRated, newest, premium, weddings, events, content] =
          await Promise.all([
            fetchCategories(),
            fetchArtists({ limit: 12, sortBy: "rating", available: true }),
            fetchArtists({ limit: 12, sortBy: "newest", available: true }),
            fetchArtists({ limit: 12, sortBy: "rate_desc", available: true }),
            fetchArtists({ limit: 12, available: true, tags: ["weddings"] }),
            fetchArtists({ limit: 12, available: true, tags: ["events"] }),
            fetchArtists({ limit: 12, available: true, tags: ["content"] }),
          ]);

        if (cancelled) return;

        setCategories(categoryData.length > 0 ? categoryData : FALLBACK_CATEGORIES);
        setDataSets({
          topRated: topRated.data,
          newest: newest.data,
          premium: premium.data,
          weddings: weddings.data,
          events: events.data,
          content: content.data,
        });
      } catch (error) {
        if (cancelled) return;
        setCategories(FALLBACK_CATEGORIES);
        setDataSets(buildFallbackDataSets());
        setLoadError(
          error instanceof ApiError
            ? error.message
            : "Showing curated preview data while live marketplace results load.",
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const onScroll = () => {
      setCompactSearch(window.scrollY > 400);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const targets = document.querySelectorAll<HTMLElement>("[data-reveal]");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      targets.forEach((target) => target.classList.add(styles.visible));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(styles.visible);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08 },
    );

    targets.forEach((target) => observer.observe(target));

    const magneticElements = document.querySelectorAll<HTMLElement>("[data-magnetic]");
    const handlers = Array.from(magneticElements).map((element) => {
      const onMove = (event: MouseEvent) => {
        const rect = element.getBoundingClientRect();
        const offsetX = (event.clientX - rect.left - rect.width / 2) * 0.16;
        const offsetY = (event.clientY - rect.top - rect.height / 2) * 0.16;
        element.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
      };
      const onLeave = () => {
        element.style.transform = "";
      };

      element.addEventListener("mousemove", onMove);
      element.addEventListener("mouseleave", onLeave);
      return () => {
        element.removeEventListener("mousemove", onMove);
        element.removeEventListener("mouseleave", onLeave);
      };
    });

    return () => {
      observer.disconnect();
      handlers.forEach((cleanup) => cleanup());
    };
  }, [loading, dataSets]);

  const allArtists = useMemo(
    () =>
      dedupeArtists([
        ...dataSets.topRated,
        ...dataSets.newest,
        ...dataSets.premium,
        ...dataSets.weddings,
        ...dataSets.events,
        ...dataSets.content,
      ]),
    [dataSets],
  );

  const displayArtists = useMemo(
    () => (allArtists.length > 0 ? allArtists : FALLBACK_ARTISTS),
    [allArtists],
  );

  const spotlightArtist =
    dataSets.premium[0] ??
    dataSets.topRated[0] ??
    dataSets.newest[0] ??
    displayArtists[0] ??
    FALLBACK_ARTISTS[0];

  const spotlightImage = getArtistImage(spotlightArtist, 1);

  const topSpecialties = useMemo(() => {
    const computed = buildTopSpecialties(displayArtists);
    return computed.length > 0 ? computed : MARQUEE_FALLBACK;
  }, [displayArtists]);

  const categoryCards = useMemo(
    () => (categories.length > 0 ? categories : FALLBACK_CATEGORIES).slice(0, 7),
    [categories],
  );

  const marqueeItems = useMemo(() => {
    const items = [...topSpecialties, ...MARQUEE_FALLBACK]
      .filter((item, index, values) => values.indexOf(item) === index)
      .slice(0, 8);
    return [...items, ...items];
  }, [topSpecialties]);

  const stats = useMemo(() => {
    const availableNow = displayArtists.filter((artist) => artist.isAvailable).length;
    const ratedArtists = displayArtists.filter(
      (artist) =>
        typeof artist.averageRating === "number" || Boolean(artist.rating),
    );
    const averageRating =
      ratedArtists.length > 0
        ? (
            ratedArtists.reduce((total, artist) => {
              const rating =
                typeof artist.averageRating === "number"
                  ? artist.averageRating
                  : Number.parseFloat(artist.rating);
              return total + (Number.isFinite(rating) ? rating : 0);
            }, 0) / ratedArtists.length
          ).toFixed(2)
        : "4.92";
    const locationsCovered = new Set(displayArtists.map((artist) => artist.location)).size;

    return [
      { value: `${Math.max(displayArtists.length, 12)}`, label: "Curated creators", tone: "violet" },
      { value: `${Math.max(availableNow, 6)}`, label: "Available now", tone: "blue" },
      { value: averageRating, label: "Average rating", tone: "green" },
      { value: `${Math.max(locationsCovered, 4)}`, label: "Cities covered", tone: "gold" },
    ];
  }, [displayArtists]);

  const discoveryRails = useMemo<DiscoveryRail[]>(() => {
    const trendingArtists = pickArtistsFromMany(
      5,
      dataSets.topRated,
      dataSets.newest,
      displayArtists,
      FALLBACK_DATASETS.topRated,
    );
    const premiumArtists = pickArtistsFromMany(
      5,
      dataSets.premium,
      dataSets.topRated,
      [...displayArtists].sort((left, right) => (right.hourlyRate ?? 0) - (left.hourlyRate ?? 0)),
      FALLBACK_DATASETS.premium,
    );
    const weddingArtists = pickArtistsFromMany(
      5,
      dataSets.weddings,
      displayArtists.filter((artist) => artistMatchesCategory(artist, "wedding")),
      FALLBACK_DATASETS.weddings,
      dataSets.topRated,
    );
    const newestArtists = pickArtistsFromMany(
      5,
      dataSets.newest,
      dataSets.content,
      displayArtists,
      FALLBACK_DATASETS.newest,
    );

    return [
      {
        key: "trending",
        eyebrow: "Live signal",
        title: "Trending now",
        copy: "Most opened and most booked creators in the marketplace right now.",
        countLabel: `${trendingArtists.length} creators`,
        href: buildDiscoveryHref({ sortBy: "rating", available: true }),
        tone: "violet",
        artists: trendingArtists,
      },
      {
        key: "premium",
        eyebrow: "Tier 4",
        title: "Premium creators",
        copy: "Higher-touch artists with stronger trust signals, sharper positioning, and top-end delivery.",
        countLabel: `${premiumArtists.length} creators`,
        href: buildDiscoveryHref({ sortBy: "rate_desc", available: true }),
        tone: "gold",
        artists: premiumArtists,
      },
      {
        key: "weddings",
        eyebrow: "Curated for weddings",
        title: "Wedding curation",
        copy: "Creators consistently chosen for ceremony days, editorial wedding work, and calm delivery under pressure.",
        countLabel: `${weddingArtists.length} creators`,
        href: buildDiscoveryHref({ tags: ["weddings"], available: true }),
        tone: "pink",
        artists: weddingArtists,
      },
      {
        key: "newest",
        eyebrow: "Fresh to the platform",
        title: "Just added",
        copy: "New verified creators and recent additions worth catching before the rest of the marketplace does.",
        countLabel: `${newestArtists.length} creators`,
        href: buildDiscoveryHref({ sortBy: "newest", available: true }),
        tone: "blue",
        artists: newestArtists,
      },
    ];
  }, [dataSets, displayArtists]);

  const submitSearch = () => {
    startTransition(() => {
      router.push(
        buildDiscoveryHref({
          q: query.trim() || undefined,
          location: selectedLocation,
          category: selectedCategory,
          available: true,
        }),
      );
    });
  };

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroBg} />
        <div className={styles.heroGrid} />
        <div className={`${styles.heroOrb} ${styles.heroOrbOne}`} />
        <div className={`${styles.heroOrb} ${styles.heroOrbTwo}`} />
        <div className={`${styles.heroOrb} ${styles.heroOrbThree}`} />

        <div className={styles.heroInner}>
          <div className={styles.heroLeft}>
            <div className={styles.heroEyebrow}>
              <span className={styles.eyebrowDot} />
              Premium discovery
            </div>

            <h1 className={styles.heroHeadline}>
              Discover creatives
              <br />
              who already feel
              <br />
              <em>worth booking</em>
            </h1>

            <p className={styles.heroSub}>
              Search with intent. Browse like an editor. Every profile on
              Vendr Studios is manually reviewed before it reaches you, so you are
              always looking at real talent.
            </p>

            <div className={styles.trustPills}>
              {TRUST_PILLS.map((pill) => (
                <div
                  key={pill.label}
                  className={styles.trustPill}
                  data-tone={pill.tone}
                >
                  <span className="material-symbols-outlined">{pill.icon}</span>
                  {pill.label}
                </div>
              ))}
            </div>

            <div className={styles.heroTags}>
              <div className={styles.heroTagsLabel}>Trending specialties</div>
              <div className={styles.tagList}>
                {topSpecialties.slice(0, 7).map((tag) => (
                  <Link
                    key={tag}
                    href={buildDiscoveryHref({ q: tag, available: true })}
                    className={styles.specialtyTag}
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            </div>

            <div className={styles.heroActions}>
              <Link href="/home#command" className={styles.heroPrimary} data-magnetic>
                Start searching
              </Link>
              <Link href="/home#featured-creatives" className={styles.heroGhost} data-magnetic>
                Browse creatives
              </Link>
            </div>
          </div>

          <div className={styles.heroRight}>
            <div className={styles.spotlightCard}>
              <div className={styles.spotlightMedia}>
                <div
                  className={styles.spotlightGradientBg}
                  style={{ background: getGradient(2) }}
                />
                {spotlightImage ? (
                  <div
                    aria-hidden="true"
                    className={styles.spotlightImage}
                    style={{ backgroundImage: `url(${spotlightImage})` }}
                  />
                ) : null}
                <div className={styles.spotlightAvatarLarge}>
                  {getInitials(spotlightArtist.name)}
                </div>
                <div className={styles.spotlightMediaOverlay} />

                <div className={styles.spotlightLabel}>
                  <div className={styles.spotlightBadge}>Editor&apos;s Spotlight</div>
                </div>
              </div>

              <div className={styles.spotlightBody}>
                <div className={styles.spotlightRole}>{getRoleLabel(spotlightArtist)}</div>
                <div className={styles.spotlightName}>{spotlightArtist.name}</div>
                <div className={styles.spotlightBio}>
                  {spotlightArtist.bio ??
                    "A premium creative profile positioned for confident, high-context discovery."}
                </div>

                <div className={styles.spotlightMeta}>
                  <div className={styles.spotlightMetaItem}>
                    <span className="material-symbols-outlined">location_on</span>
                    {spotlightArtist.location}
                  </div>
                  <div className={styles.spotlightMetaItem}>
                    <span className="material-symbols-outlined">star</span>
                    {getRatingValue(spotlightArtist)} / {Math.max(getReviewCount(spotlightArtist), 8)} reviews
                  </div>
                  <div className={styles.spotlightMetaItem} data-state="available">
                    <span className="material-symbols-outlined">radio_button_checked</span>
                    {spotlightArtist.isAvailable ? "Available now" : "Planning ahead"}
                  </div>
                </div>

                <div className={styles.spotlightFooter}>
                  <div>
                    <div className={styles.spotlightPriceLabel}>Starting from</div>
                    <div className={styles.spotlightPriceValue}>
                      {getPricingValue(spotlightArtist)} <span>starting price</span>
                    </div>
                  </div>

                  <Link
                    href={`/artists/${spotlightArtist.slug}`}
                    className={styles.spotlightButton}
                  >
                    View profile
                  </Link>
                </div>
              </div>

              <div className={styles.spotlightSignalGrid}>
                {stats.map((stat) => (
                  <div key={stat.label} className={styles.signalItem}>
                    <div className={styles.signalValue} data-tone={stat.tone}>
                      {stat.value}
                    </div>
                    <div className={styles.signalLabel}>{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className={styles.marqueeWrap}>
        <div className={styles.marqueeTrack}>
          {marqueeItems.map((item, index) => (
            <div key={`${item}-${index}`} className={styles.marqueeItem}>
              {item}
            </div>
          ))}
        </div>
      </div>

      <div
        id="command"
        className={`${styles.commandWrap} ${compactSearch ? styles.compact : ""}`}
      >
        <div className={styles.commandInner}>
          <div className={styles.commandLabel}>Discovery command centre</div>

          <form
            className={styles.commandBar}
            onSubmit={(event) => {
              event.preventDefault();
              submitSearch();
            }}
          >
            <div className={styles.commandInputWrap}>
              <span className="material-symbols-outlined">search</span>
              <input
                className={styles.commandInput}
                data-search-input
                placeholder="Search by name, style, specialty..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>

            <div className={styles.commandSelectWrap}>
              <select
                className={styles.commandSelect}
                data-search-input
                value={selectedLocation}
                onChange={(event) => setSelectedLocation(event.target.value)}
              >
                {LOCATION_OPTIONS.map((location) => (
                  <option key={location} value={location}>
                    {location}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.commandSelectWrap}>
              <select
                className={styles.commandSelect}
                data-search-input
                value={selectedCategory}
                onChange={(event) => setSelectedCategory(event.target.value)}
              >
                <option value="all">All categories</option>
                {categoryCards.map((category) => (
                  <option key={category.id} value={category.slug}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <button type="submit" className={styles.commandSearchButton}>
              Search
            </button>
          </form>

          <div className={styles.commandFooter}>
            <div className={styles.promptChips}>
              {HERO_PROMPTS.map((prompt) => (
                <button
                  key={prompt.label}
                  type="button"
                  className={styles.promptChip}
                  onClick={() => {
                    setQuery(prompt.query);
                    setSelectedLocation(prompt.location ?? LOCATION_OPTIONS[0]);
                    setSelectedCategory(prompt.category ?? "all");
                  }}
                >
                  {prompt.label}
                </button>
              ))}
            </div>

            <Link href="/artists" className={styles.commandBrowse}>
              Browse all creatives
            </Link>
          </div>
        </div>
      </div>

      <div className={styles.statsStrip}>
        <div className={styles.statsInner}>
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className={styles.statItem}
              data-reveal
              style={{ transitionDelay: `${index * 80}ms` }}
            >
              <div className={styles.statNumber} data-tone={stat.tone}>
                {stat.value}
              </div>
              <div className={styles.statLabel}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      <section id="categories" className={styles.categorySection}>
        <div className={styles.sectionInner}>
          <div className={styles.categoryHeader} data-reveal>
            <div>
              <div className={styles.sectionLabel} data-surface="light">
                Browse by specialty
              </div>
              <h2 className={styles.lightSectionTitle}>Category jump</h2>
            </div>

            <Link href="/artists" className={styles.categorySeeAll}>
              See all categories
            </Link>
          </div>

          <div className={styles.categoryGrid}>
            {categoryCards.map((category, index) => {
              const count = getCategoryCount(displayArtists, category);
              const accent = getCategoryAccent(index);

              return (
                <Link
                  key={category.id}
                  href={buildDiscoveryHref({
                    category: category.slug,
                    available: true,
                  })}
                  className={styles.categoryCard}
                  data-accent={accent}
                  data-reveal
                  style={{ transitionDelay: `${index * 60}ms` }}
                >
                  <div className={styles.categoryIconWrap} data-accent={accent}>
                    <span className="material-symbols-outlined">
                      {getCategoryIcon(category.slug)}
                    </span>
                  </div>
                  <div className={styles.categoryName}>{category.name}</div>
                  <div className={styles.categoryCount}>
                    {count > 0 ? `${count} creators` : "Curated creators"}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className={`${styles.darkSection} ${styles.trustSection}`}>
        <div className={styles.sectionInner}>
          <div className={styles.sectionIntro} data-reveal>
            <div className={styles.sectionLabel}>Why this works</div>
            <h2 className={styles.sectionTitle}>Trust and momentum</h2>
            <p className={styles.sectionSub}>
              Every signal on this page is built on verified, on-platform data,
              not claims or external reviews you cannot check.
            </p>
          </div>

          <div className={styles.trustGrid}>
            {TRUST_MOMENTUM.map((item, index) => (
              <article
                key={item.title}
                className={styles.trustCard}
                data-tone={item.tone}
                data-reveal
                style={{ transitionDelay: `${index * 80}ms` }}
              >
                <div className={styles.trustNumber}>{item.number}</div>
                <div className={styles.trustIcon} data-tone={item.tone}>
                  <span className="material-symbols-outlined">{item.icon}</span>
                </div>
                <div className={styles.trustTitle}>{item.title}</div>
                <div className={styles.trustBody}>{item.body}</div>
              </article>
            ))}
          </div>

          {loadError ? (
            <div className={styles.dataBanner} data-reveal>
              <span className="material-symbols-outlined">info</span>
              {loadError}
            </div>
          ) : null}
        </div>
      </section>

      <section id="featured-creatives" className={styles.railsSection}>
        {discoveryRails.map((rail) => (
          <RailSection key={rail.key} rail={rail} loading={loading} />
        ))}
      </section>

      <section id="how-it-works" className={styles.howSection}>
        <div className={styles.sectionInner}>
          <div className={styles.howHeader} data-reveal>
            <div className={styles.sectionLabel} data-surface="light">
              The booking flow
            </div>
            <h2 className={styles.lightSectionTitle}>How it works</h2>
            <p className={styles.lightSectionSub}>
              From discovery to final delivery, every step is designed to keep
              both sides protected and informed.
            </p>
          </div>

          <div className={styles.howGrid}>
            {HOW_STEPS.map((step, index) => (
              <article
                key={step.title}
                className={styles.howStep}
                data-tone={index}
                data-reveal
                style={{ transitionDelay: `${index * 90}ms` }}
              >
                <div className={styles.howStepNumber}>
                  {String(index + 1).padStart(2, "0")}
                </div>
                <div className={styles.howStepIcon}>
                  <span className="material-symbols-outlined">{step.icon}</span>
                </div>
                <div className={styles.howStepTitle}>{step.title}</div>
                <div className={styles.howStepBody}>{step.body}</div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.ctaSection}>
        <div className={styles.ctaBg} />
        <div className={styles.ctaLine} />
        <div className={styles.ctaInner} data-reveal>
          <h2 className={styles.ctaHeading}>
            Ready to find your
            <br />
            <em>next creative?</em>
          </h2>
          <p className={styles.ctaSub}>
            Start searching now or join as an artist before the prelaunch pool
            fills up.
          </p>
          <div className={styles.ctaButtons}>
            <Link href="/home#command" className={styles.heroPrimary} data-magnetic>
              Start searching
            </Link>
            <Link href="/" className={styles.heroGhost} data-magnetic>
              Join as an artist
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
