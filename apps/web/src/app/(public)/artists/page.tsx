"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import type { ApiResponse, Artist, ArtistCategory } from "@vendorapp/shared";
import { ApiError, fetchArtists, fetchCategories } from "@/lib/api";
import styles from "./page.module.css";

const TAG_OPTIONS = [
  "weddings",
  "editorial",
  "portraits",
  "brand",
  "events",
  "campaigns",
  "live music",
  "documentary",
] as const;

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

function updateSearchParams(
  current: URLSearchParams,
  updates: Record<string, string | null>,
): string {
  const next = new URLSearchParams(current.toString());

  for (const [key, value] of Object.entries(updates)) {
    if (!value) {
      next.delete(key);
      continue;
    }
    next.set(key, value);
  }

  const query = next.toString();
  return query ? `/artists?${query}` : "/artists";
}

function buildPreviewStyle(artist: Artist): { backgroundImage: string } {
  const seed = `${artist.slug}${artist.category?.slug ?? ""}`.length;
  const palettes = [
    "linear-gradient(135deg, rgba(209, 67, 67, 0.88), rgba(159, 43, 43, 0.72))",
    "linear-gradient(135deg, rgba(15, 118, 110, 0.82), rgba(8, 145, 178, 0.74))",
    "linear-gradient(135deg, rgba(37, 99, 235, 0.82), rgba(14, 165, 233, 0.74))",
    "linear-gradient(135deg, rgba(234, 88, 12, 0.84), rgba(202, 138, 4, 0.76))",
  ];

  return { backgroundImage: palettes[seed % palettes.length] };
}

function ArtistsPageFallback() {
  return (
    <main className={styles.page}>
      <section className={styles.shell}>
        <header className={styles.header}>
          <div>
            <p className={styles.kicker}>Browse creatives</p>
            <h1 className={styles.title}>Discover artists ready for real bookings.</h1>
            <p className={styles.subtitle}>Loading live marketplace results...</p>
          </div>
        </header>
        <div className={styles.grid}>
          {Array.from({ length: 6 }).map((_, index) => (
            <article key={index} className={styles.skeletonCard}>
              <div className={styles.skeletonPreview} />
              <div className={styles.skeletonLine} />
              <div className={styles.skeletonLineShort} />
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

function ArtistsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const qFromUrl = searchParams.get("q") ?? "";
  const category = searchParams.get("category") ?? "";
  const location = searchParams.get("location") ?? "";
  const minRate = searchParams.get("minRate") ?? "";
  const maxRate = searchParams.get("maxRate") ?? "";
  const available = searchParams.get("available") === "true";
  const sortBy = searchParams.get("sortBy") ?? "rating";
  const page = Math.max(1, Number.parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const selectedTags = useMemo(
    () =>
      (searchParams.get("tags") ?? "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
    [searchParams],
  );

  const [searchInput, setSearchInput] = useState(qFromUrl);
  const [categories, setCategories] = useState<ArtistCategory[]>([]);
  const [response, setResponse] = useState<ApiResponse<Artist[]> | null>(null);
  const [loading, setLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSearchInput(qFromUrl);
  }, [qFromUrl]);

  useEffect(() => {
    let cancelled = false;

    const loadCategories = async () => {
      setCategoriesLoading(true);
      try {
        const data = await fetchCategories();
        if (!cancelled) {
          setCategories(data);
        }
      } catch {
        if (!cancelled) {
          setCategories([]);
        }
      } finally {
        if (!cancelled) {
          setCategoriesLoading(false);
        }
      }
    };

    void loadCategories();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const normalized = searchInput.trim();
      if (normalized === qFromUrl) {
        return;
      }

      router.replace(
        updateSearchParams(searchParams, {
          q: normalized || null,
          page: "1",
        }),
        { scroll: false },
      );
    }, 400);

    return () => {
      window.clearTimeout(timer);
    };
  }, [qFromUrl, router, searchInput, searchParams]);

  useEffect(() => {
    let cancelled = false;

    const loadArtists = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchArtists({
          category: category || undefined,
          location: location || undefined,
          minRate: minRate ? Number(minRate) : undefined,
          maxRate: maxRate ? Number(maxRate) : undefined,
          available: searchParams.has("available") ? available : undefined,
          tags: selectedTags.length > 0 ? selectedTags : undefined,
          q: qFromUrl || undefined,
          page,
          limit: 12,
          sortBy:
            sortBy === "rate_asc" ||
            sortBy === "rate_desc" ||
            sortBy === "newest" ||
            sortBy === "rating"
              ? sortBy
              : "rating",
        });
        if (!cancelled) {
          setResponse(data);
        }
      } catch (error) {
        if (cancelled) {
          return;
        }
        setError(
          error instanceof ApiError
            ? error.message
            : "Unable to load artists right now.",
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadArtists();

    return () => {
      cancelled = true;
    };
  }, [available, category, location, maxRate, minRate, page, qFromUrl, searchParams, selectedTags, sortBy]);

  const applyFilters = (updates: Record<string, string | null>) => {
    router.replace(
      updateSearchParams(searchParams, {
        ...updates,
        page: updates.page ?? "1",
      }),
      { scroll: false },
    );
  };

  const toggleTag = (tag: string) => {
    const nextTags = selectedTags.includes(tag)
      ? selectedTags.filter((value) => value !== tag)
      : [...selectedTags, tag];

    applyFilters({
      tags: nextTags.length > 0 ? nextTags.join(",") : null,
    });
  };

  const resetFilters = () => {
    router.replace("/artists", { scroll: false });
  };

  const artists = response?.data ?? [];
  const meta = response?.meta;
  const featuredArtist = artists[0] ?? null;

  return (
    <main className={styles.page}>
      <section className={styles.shell}>
        <header className={styles.header}>
          <div>
            <p className={styles.kicker}>Browse creatives</p>
            <h1 className={styles.title}>Discover artists ready for real bookings.</h1>
            <p className={styles.subtitle}>
              Search by category, location, pricing, availability, and tags. Every result
              below is pulled from live marketplace data.
            </p>
          </div>
        </header>

        <div className={styles.searchPill}>
          <div className={styles.searchLeft}>
            <span className="material-symbols-outlined">search</span>
            <input
              placeholder="Search artists, services, or styles..."
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
          </div>
          <div className={styles.searchRight}>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                checked={available}
                onChange={(event) =>
                  applyFilters({
                    available: event.target.checked ? "true" : null,
                  })
                }
              />
              Available now
            </label>
            <select
              value={sortBy}
              onChange={(event) =>
                applyFilters({
                  sortBy: event.target.value,
                })
              }
            >
              <option value="rating">Top rated</option>
              <option value="rate_asc">Lowest rate</option>
              <option value="rate_desc">Highest rate</option>
              <option value="newest">Newest</option>
            </select>
          </div>
        </div>

        <div className={styles.categoryRow}>
          <button
            type="button"
            className={!category ? styles.categoryActive : styles.categoryChip}
            onClick={() => applyFilters({ category: null })}
          >
            All categories
          </button>
          {categoriesLoading
            ? Array.from({ length: 4 }).map((_, index) => (
                <span key={index} className={styles.categorySkeleton} />
              ))
            : categories.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={
                    item.slug === category ? styles.categoryActive : styles.categoryChip
                  }
                  onClick={() =>
                    applyFilters({
                      category: item.slug === category ? null : item.slug,
                    })
                  }
                >
                  {item.name}
                </button>
              ))}
        </div>

        <div className={styles.layout}>
          <aside className={styles.filters}>
            <div className={styles.filterHeader}>
              <h3>Filters</h3>
              <button type="button" onClick={resetFilters}>
                Reset
              </button>
            </div>

            <label className={styles.filterField}>
              Category
              <select
                value={category}
                onChange={(event) =>
                  applyFilters({
                    category: event.target.value || null,
                  })
                }
              >
                <option value="">All categories</option>
                {categories.map((item) => (
                  <option key={item.id} value={item.slug}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>

            <label className={styles.filterField}>
              Location
              <input
                value={location}
                placeholder="Johannesburg, Cape Town..."
                onChange={(event) =>
                  applyFilters({
                    location: event.target.value.trim() || null,
                  })
                }
              />
            </label>

            <div className={styles.filterField}>
              <span>Rate range</span>
              <div className={styles.priceInputs}>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={minRate}
                  placeholder="Min"
                  onChange={(event) =>
                    applyFilters({
                      minRate: event.target.value || null,
                    })
                  }
                />
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={maxRate}
                  placeholder="Max"
                  onChange={(event) =>
                    applyFilters({
                      maxRate: event.target.value || null,
                    })
                  }
                />
              </div>
            </div>

            <div className={styles.filterField}>
              <span>Tags</span>
              <div className={styles.tagGrid}>
                {TAG_OPTIONS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    className={
                      selectedTags.includes(tag) ? styles.tagActive : styles.tagChip
                    }
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          <div className={styles.content}>
            {featuredArtist ? (
              <section className={styles.heroCard}>
                <div>
                  <p className={styles.heroKicker}>Featured match</p>
                  <h2>{featuredArtist.name}</h2>
                  <p>{featuredArtist.bio || `${featuredArtist.role} based in ${featuredArtist.location}.`}</p>
                  <div className={styles.heroMeta}>
                    <span>{featuredArtist.category?.name ?? featuredArtist.role}</span>
                    <span>{formatCurrency(featuredArtist.hourlyRate)}</span>
                    <span>{featuredArtist.averageRating?.toFixed(1) ?? featuredArtist.rating} rating</span>
                  </div>
                  <Link href={`/artists/${featuredArtist.slug}`} className={styles.primaryBtn}>
                    View profile
                  </Link>
                </div>
                <div className={styles.heroPreview} style={buildPreviewStyle(featuredArtist)} />
              </section>
            ) : null}

            <div className={styles.resultsHeader}>
              <div>
                <h2>Results</h2>
                <p>
                  {meta
                    ? `${meta.total} artists found${qFromUrl ? ` for "${qFromUrl}"` : ""}`
                    : "Searching artists..."}
                </p>
              </div>
            </div>

            {error ? <div className={styles.error}>{error}</div> : null}

            {loading ? (
              <div className={styles.grid}>
                {Array.from({ length: 6 }).map((_, index) => (
                  <article key={index} className={styles.skeletonCard}>
                    <div className={styles.skeletonPreview} />
                    <div className={styles.skeletonLine} />
                    <div className={styles.skeletonLineShort} />
                  </article>
                ))}
              </div>
            ) : artists.length === 0 ? (
              <div className={styles.emptyState}>
                <h3>No artists found</h3>
                <p>Try removing a few filters or broadening the search terms.</p>
                <button type="button" className={styles.primaryBtn} onClick={resetFilters}>
                  Reset filters
                </button>
              </div>
            ) : (
              <>
                <div className={styles.grid}>
                  {artists.map((artist) => (
                    <article key={artist.slug} className={styles.card}>
                      <div className={styles.preview} style={buildPreviewStyle(artist)} />
                      <div className={styles.cardTop}>
                        <div className={styles.cardBadge}>
                          {artist.category?.name ?? artist.role}
                        </div>
                        <div className={styles.cardRating}>
                          {artist.averageRating?.toFixed(1) ?? artist.rating}
                        </div>
                      </div>
                      <div className={styles.cardBody}>
                        <h3>{artist.name}</h3>
                        <p>{artist.location}</p>
                        <div className={styles.cardMeta}>
                          <span>{formatCurrency(artist.hourlyRate)}</span>
                          <span>
                            {artist.isAvailable ? "Available" : "Unavailable"}
                          </span>
                        </div>
                        <div className={styles.cardTags}>
                          {(artist.tags ?? artist.specialties ?? []).slice(0, 3).map((tag) => (
                            <span key={tag}>{tag}</span>
                          ))}
                        </div>
                      </div>
                      <Link className={styles.cardBtn} href={`/artists/${artist.slug}`}>
                        View profile
                        <span className="material-symbols-outlined">chevron_right</span>
                      </Link>
                    </article>
                  ))}
                </div>

                {meta ? (
                  <div className={styles.pagination}>
                    <button
                      type="button"
                      onClick={() =>
                        applyFilters({
                          page: page > 1 ? String(page - 1) : "1",
                        })
                      }
                      disabled={page <= 1}
                    >
                      Previous
                    </button>
                    <span>
                      Page {meta.page} of {Math.max(meta.totalPages, 1)}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        applyFilters({
                          page:
                            meta.page < meta.totalPages
                              ? String(meta.page + 1)
                              : String(meta.page),
                        })
                      }
                      disabled={meta.page >= meta.totalPages}
                    >
                      Next
                    </button>
                  </div>
                ) : null}
              </>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

export default function ArtistsPage() {
  return (
    <Suspense fallback={<ArtistsPageFallback />}>
      <ArtistsPageContent />
    </Suspense>
  );
}
