"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Artist, ArtistCategory } from "@vendorapp/shared";
import { fetchArtists, fetchCategories } from "@/lib/api";
import styles from "./page.module.css";

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

function buildPreviewStyle(seed: string): { backgroundImage: string } {
  const palettes = [
    "linear-gradient(135deg, rgba(209, 67, 67, 0.84), rgba(159, 43, 43, 0.74))",
    "linear-gradient(135deg, rgba(15, 118, 110, 0.82), rgba(8, 145, 178, 0.74))",
    "linear-gradient(135deg, rgba(37, 99, 235, 0.82), rgba(14, 165, 233, 0.74))",
    "linear-gradient(135deg, rgba(234, 88, 12, 0.82), rgba(202, 138, 4, 0.72))",
  ];
  return { backgroundImage: palettes[seed.length % palettes.length] };
}

export default function ExplorePage() {
  const [categories, setCategories] = useState<ArtistCategory[]>([]);
  const [featuredArtists, setFeaturedArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const [categoryData, artistData] = await Promise.all([
          fetchCategories(),
          fetchArtists({ limit: 4, sortBy: "rating", available: true }),
        ]);

        if (!cancelled) {
          setCategories(categoryData);
          setFeaturedArtists(artistData.data);
        }
      } catch {
        if (!cancelled) {
          setCategories([]);
          setFeaturedArtists([]);
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

  return (
    <main className={styles.page}>
      <section className={styles.shell}>
        <header className={styles.hero}>
          <div>
            <p className={styles.kicker}>Explore the marketplace</p>
            <h1>Start with a category, then narrow to the right artist.</h1>
            <p>
              Browse live categories, jump straight into discovery filters, and review a few
              of the artists currently ranking highest on the platform.
            </p>
            <Link href="/artists" className={styles.primaryBtn}>
              Browse all artists
            </Link>
          </div>
          <div className={styles.heroPanel}>
            <span>Live marketplace data</span>
            <strong>{loading ? "..." : `${categories.length} categories`}</strong>
            <strong>{loading ? "..." : `${featuredArtists.length} featured artists`}</strong>
          </div>
        </header>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Categories</h2>
            <Link href="/artists">Open full search</Link>
          </div>

          <div className={styles.categoryGrid}>
            {loading
              ? Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className={styles.categorySkeleton} />
                ))
              : categories.map((category) => (
                  <Link
                    key={category.id}
                    href={`/artists?category=${encodeURIComponent(category.slug)}`}
                    className={styles.categoryCard}
                  >
                    <span className="material-symbols-outlined">category</span>
                    <div>
                      <strong>{category.name}</strong>
                      <p>Filter artists in {category.name.toLowerCase()}.</p>
                    </div>
                  </Link>
                ))}
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Featured artists</h2>
            <Link href="/artists?sortBy=rating">See top rated</Link>
          </div>

          <div className={styles.artistGrid}>
            {loading
              ? Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className={styles.artistSkeleton} />
                ))
              : featuredArtists.map((artist) => (
                  <article key={artist.slug} className={styles.artistCard}>
                    <div className={styles.artistPreview} style={buildPreviewStyle(artist.slug)} />
                    <div className={styles.artistMeta}>
                      <div>
                        <strong>{artist.name}</strong>
                        <p>{artist.location}</p>
                      </div>
                      <span>{artist.averageRating?.toFixed(1) ?? artist.rating}</span>
                    </div>
                    <div className={styles.artistSummary}>
                      <span>{artist.category?.name ?? artist.role}</span>
                      <span>{formatCurrency(artist.hourlyRate)}</span>
                    </div>
                    <Link href={`/artists/${artist.slug}`} className={styles.artistLink}>
                      View profile
                    </Link>
                  </article>
                ))}
          </div>
        </section>
      </section>
    </main>
  );
}
