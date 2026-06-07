"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Artist, ArtistCategory } from "@vendorapp/shared";
import { fetchArtists, fetchCategories } from "@/lib/api";
import styles from "./page.module.css";

const locations = ["All locations", "Cape Town", "Johannesburg", "Durban"];
const ratings = ["Any rating", "4.5+", "4.8+"];
const services = ["Photography", "Videography", "Content Creation", "Creative Direction", "Design"];
const quickSearches = ["Editorial portraits", "Launch film", "Wedding content", "Product shoot"];

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

function coverImage(artist: Artist): string {
  return (
    artist.portfolioImages?.[0] ??
    "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=80"
  );
}

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export default function ExplorePage() {
  const [categories, setCategories] = useState<ArtistCategory[]>([]);
  const [creatives, setCreatives] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [location, setLocation] = useState("All locations");
  const [rating, setRating] = useState("Any rating");
  const [availableOnly, setAvailableOnly] = useState(true);
  const [service, setService] = useState("All services");
  const [savedSlugs, setSavedSlugs] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const [categoryData, creativeData] = await Promise.all([
          fetchCategories(),
          fetchArtists({ limit: 12, sortBy: "rating" }),
        ]);

        if (!cancelled) {
          setCategories(categoryData);
          setCreatives(creativeData.data);
        }
      } catch {
        if (!cancelled) {
          setCategories([]);
          setCreatives([]);
        }
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

  const filteredCreatives = useMemo(() => {
    const ratingFloor = rating === "4.8+" ? 4.8 : rating === "4.5+" ? 4.5 : 0;
    const term = query.trim().toLowerCase();

    return creatives.filter((creative) => {
      const searchable = [
        creative.name,
        creative.role,
        creative.location,
        creative.category?.name ?? "",
        ...(creative.services ?? []),
        ...(creative.specialties ?? []),
        ...(creative.tags ?? []),
      ]
        .join(" ")
        .toLowerCase();

      return (
        (!term || searchable.includes(term)) &&
        (category === "all" || creative.category?.slug === category) &&
        (location === "All locations" || creative.location.includes(location)) &&
        (!availableOnly || creative.isAvailable !== false) &&
        (service === "All services" || (creative.services ?? []).includes(service)) &&
        (creative.averageRating ?? Number(creative.rating) ?? 0) >= ratingFloor
      );
    });
  }, [availableOnly, category, creatives, location, query, rating, service]);

  const featuredCreatives = filteredCreatives.slice(0, 3);
  const trendingCreatives = filteredCreatives
    .filter((creative) => (creative.totalReviews ?? 0) >= 20 || (creative.profileViews ?? 0) > 1000)
    .slice(0, 4);
  const recentlyActiveCreatives = filteredCreatives
    .filter((creative) => creative.isAvailable !== false)
    .slice(0, 4);

  const resetFilters = () => {
    setQuery("");
    setCategory("all");
    setLocation("All locations");
    setRating("Any rating");
    setAvailableOnly(false);
    setService("All services");
  };

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.kicker}>Discover</p>
          <h1>Find the creative team your next project deserves.</h1>
          <p>
            Search verified photographers, videographers, content teams, and directors
            by location, style, availability, rating, and project fit.
          </p>
          <div className={styles.quickSearches}>
            {quickSearches.map((item) => (
              <button key={item} type="button" onClick={() => setQuery(item)}>
                {item}
              </button>
            ))}
          </div>
        </div>
        <div className={styles.heroBoard} aria-hidden="true">
          <div className={styles.boardImage} />
          <div className={styles.boardNote}>
            <strong>Verified discovery</strong>
            <span>Match on style, trust, budget, response signals, and availability.</span>
          </div>
        </div>
      </section>

      <section className={styles.categoryRail} aria-label="Category navigation">
        <button
          type="button"
          data-active={category === "all"}
          onClick={() => setCategory("all")}
        >
          All
        </button>
        {categories.map((item) => (
          <button
            key={item.id}
            type="button"
            data-active={category === item.slug}
            onClick={() => setCategory(item.slug)}
          >
            {item.name}
          </button>
        ))}
      </section>

      <section className={styles.searchDock} aria-label="Creative search filters">
        <div className={styles.searchBar}>
          <span className="material-symbols-outlined">search</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by creative, service, location, or style"
          />
        </div>

        <div className={styles.filters}>
          <label>
            Category
            <select value={category} onChange={(event) => setCategory(event.target.value)}>
              <option value="all">All categories</option>
              {categories.map((item) => (
                <option key={item.id} value={item.slug}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Location
            <select value={location} onChange={(event) => setLocation(event.target.value)}>
              {locations.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label>
            Rating
            <select value={rating} onChange={(event) => setRating(event.target.value)}>
              {ratings.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label>
            Service
            <select value={service} onChange={(event) => setService(event.target.value)}>
              <option>All services</option>
              {services.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className={styles.availability}
            data-active={availableOnly}
            onClick={() => setAvailableOnly((current) => !current)}
          >
            <span className="material-symbols-outlined">radio_button_checked</span>
            Available now
          </button>
        </div>
      </section>

      <section className={styles.marketHeader}>
        <div>
          <p className={styles.kicker}>Marketplace</p>
          <h2>{loading ? "Curating creatives" : `${filteredCreatives.length} verified matches`}</h2>
        </div>
        <div className={styles.intent}>
          <span>Discover</span>
          <span>Match</span>
          <span>Plan</span>
          <span>Book</span>
          <span>Manage</span>
        </div>
      </section>

      {!loading && featuredCreatives.length > 0 ? (
        <section className={styles.featuredRail}>
          <div>
            <p className={styles.kicker}>Recommended</p>
            <h2>Strong matches for premium work</h2>
          </div>
          <div className={styles.featuredCards}>
            {featuredCreatives.map((creative) => (
              <Link key={creative.slug} href={`/creatives/${creative.slug}`}>
                <span>{creative.averageRating?.toFixed(1) ?? creative.rating} rating</span>
                <strong>{creative.name}</strong>
                <small>{creative.role} in {creative.location}</small>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className={styles.grid}>
        {loading
          ? Array.from({ length: 6 }).map((_, index) => (
              <article key={index} className={styles.skeleton} />
            ))
          : filteredCreatives.map((creative) => (
              <Link key={creative.slug} href={`/creatives/${creative.slug}`} className={styles.card}>
                <div
                  className={styles.cover}
                  style={{ backgroundImage: `url(${coverImage(creative)})` }}
                >
                  <span data-available={creative.isAvailable !== false}>
                    {creative.isAvailable !== false ? "Available" : "Planning ahead"}
                  </span>
                  <button
                    type="button"
                    className={styles.saveButton}
                    data-saved={savedSlugs.includes(creative.slug)}
                    onClick={(event) => {
                      event.preventDefault();
                      setSavedSlugs((current) =>
                        current.includes(creative.slug)
                          ? current.filter((slug) => slug !== creative.slug)
                          : [...current, creative.slug],
                      );
                    }}
                    aria-label={`Save ${creative.name}`}
                  >
                    <span className="material-symbols-outlined">
                      {savedSlugs.includes(creative.slug) ? "favorite" : "favorite_border"}
                    </span>
                  </button>
                </div>
                <div className={styles.cardBody}>
                  <div className={styles.profileRow}>
                    <div className={styles.avatar}>{initials(creative.name)}</div>
                    <div>
                      <h3>{creative.name}</h3>
                      <p>{creative.category?.name ?? creative.role}</p>
                    </div>
                  </div>
                  <p className={styles.bio}>{creative.bio}</p>
                  <div className={styles.trustSignals}>
                    <span>Verified</span>
                    <span>{creative.totalReviews ?? 12} reviews</span>
                    <span>{creative.profileViews ?? 420} views</span>
                  </div>
                  <div className={styles.metaGrid}>
                    <span>
                      <strong>{creative.location}</strong>
                      Location
                    </span>
                    <span>
                      <strong>{creative.averageRating?.toFixed(1) ?? creative.rating}</strong>
                      Rating
                    </span>
                    <span>
                      <strong>{formatCurrency(creative.hourlyRate)}</strong>
                      Starting at
                    </span>
                  </div>
                </div>
              </Link>
            ))}
      </section>

      {!loading && filteredCreatives.length === 0 ? (
        <section className={styles.emptyState}>
          <p className={styles.kicker}>No exact matches</p>
          <h2>Widen the brief and keep exploring.</h2>
          <p>
            Try removing availability, lowering the rating filter, or searching by project type
            instead of a specific location.
          </p>
          <button type="button" onClick={resetFilters}>Reset filters</button>
        </section>
      ) : null}

      {!loading && filteredCreatives.length > 0 ? (
        <section className={styles.discoveryRows}>
          <article>
            <p className={styles.kicker}>Trending</p>
            <h2>Creatives clients keep comparing</h2>
            <div>
              {(trendingCreatives.length ? trendingCreatives : filteredCreatives.slice(0, 3)).map((creative) => (
                <Link key={creative.slug} href={`/creatives/${creative.slug}`}>
                  <strong>{creative.name}</strong>
                  <span>{creative.totalReviews ?? 18} reviews · {formatCurrency(creative.hourlyRate)}</span>
                </Link>
              ))}
            </div>
          </article>
          <article>
            <p className={styles.kicker}>Recently active</p>
            <h2>Available to plan now</h2>
            <div>
              {(recentlyActiveCreatives.length ? recentlyActiveCreatives : filteredCreatives.slice(0, 3)).map((creative) => (
                <Link key={creative.slug} href={`/creatives/${creative.slug}`}>
                  <strong>{creative.name}</strong>
                  <span>{creative.availabilitySummary ?? "Ready for project planning"}</span>
                </Link>
              ))}
            </div>
          </article>
        </section>
      ) : null}
    </main>
  );
}
