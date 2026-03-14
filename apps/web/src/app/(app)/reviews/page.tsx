"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { MyReviewsOverview, ReviewItem } from "@vendorapp/shared";
import { ApiError, fetchMyReviews } from "@/lib/api";
import styles from "./page.module.css";

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("en-ZA", {
    dateStyle: "medium",
  });
}

function ReviewCard({
  review,
  label,
}: {
  review: ReviewItem;
  label: string;
}) {
  const initials = review.reviewer.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <article className={styles.reviewCard}>
      <div className={styles.reviewHeader}>
        <div className={styles.avatar}>{initials}</div>
        <div>
          <h3>{review.reviewer.name}</h3>
          <p>
            {label} • {formatDate(review.eventDate)}
          </p>
        </div>
        <div className={styles.rating}>{review.rating} / 5</div>
      </div>
      <p>{review.comment}</p>
      <div className={styles.reviewActions}>
        <Link href={`/bookings/${review.bookingId}`}>View booking</Link>
        <Link href={`/artists/${review.artist.slug}`}>Artist profile</Link>
      </div>
    </article>
  );
}

export default function ReviewsPage() {
  const [data, setData] = useState<MyReviewsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetchMyReviews();
        if (!cancelled) {
          setData(response);
        }
      } catch (err) {
        if (cancelled) {
          return;
        }
        setError(
          err instanceof ApiError
            ? err.message
            : "Unable to load your reviews right now.",
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

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>Ratings & Reviews</h1>
          <p>Track reviews you have received and feedback you have left on completed bookings.</p>
        </div>
      </header>

      {error ? <div className={styles.error}>{error}</div> : null}

      <section className={styles.stats}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>
            {loading ? "..." : data?.averageRating.toFixed(1) ?? "0.0"}
          </div>
          <div className={styles.statLabel}>Average Rating</div>
          <div className={styles.statHint}>
            {loading ? "Loading..." : `From ${data?.totalReviews ?? 0} received reviews`}
          </div>
        </div>
        <div className={styles.breakdown}>
          <div className={styles.summaryRow}>
            <span>Received reviews</span>
            <strong>{loading ? "..." : data?.received.length ?? 0}</strong>
          </div>
          <div className={styles.summaryRow}>
            <span>Reviews left</span>
            <strong>{loading ? "..." : data?.left.length ?? 0}</strong>
          </div>
        </div>
      </section>

      <section className={styles.columns}>
        <div className={styles.listSection}>
          <div className={styles.sectionHeader}>
            <h2>Received</h2>
            <span>{loading ? "..." : data?.received.length ?? 0}</span>
          </div>
          <div className={styles.list}>
            {loading ? (
              <div className={styles.emptyState}>Loading received reviews...</div>
            ) : data && data.received.length > 0 ? (
              data.received.map((review) => (
                <ReviewCard key={review.id} review={review} label={review.bookingTitle} />
              ))
            ) : (
              <div className={styles.emptyState}>No received reviews yet.</div>
            )}
          </div>
        </div>

        <div className={styles.listSection}>
          <div className={styles.sectionHeader}>
            <h2>Left by you</h2>
            <span>{loading ? "..." : data?.left.length ?? 0}</span>
          </div>
          <div className={styles.list}>
            {loading ? (
              <div className={styles.emptyState}>Loading submitted reviews...</div>
            ) : data && data.left.length > 0 ? (
              data.left.map((review) => (
                <ReviewCard key={review.id} review={review} label={review.bookingTitle} />
              ))
            ) : (
              <div className={styles.emptyState}>You have not left any reviews yet.</div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
