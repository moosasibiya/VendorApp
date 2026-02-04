"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";

const carousels = [
  "Photographers",
  "Videographers",
  "Graphic Designers",
  "Content Creators",
];

function Carousel({ title }: { title: string }) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [index, setIndex] = useState(0);
  const artists = useMemo(
    () =>
      Array.from({ length: 9 }).map((_, i) => ({
        name: `${title} ${i + 1}`,
        bio: "Luxury brand visuals & campaign direction.",
        rating: (4.6 + (i % 3) * 0.1).toFixed(1),
      })),
    [title],
  );

  const scrollBy = (direction: number) => {
    const node = trackRef.current;
    if (!node) return;
    const cardWidth = node.firstElementChild
      ? (node.firstElementChild as HTMLElement).offsetWidth + 16
      : 300;
    node.scrollBy({ left: direction * cardWidth * 3, behavior: "smooth" });
  };

  useEffect(() => {
    const node = trackRef.current;
    if (!node) return;
    const handler = () => {
      const cardWidth = node.firstElementChild
        ? (node.firstElementChild as HTMLElement).offsetWidth + 16
        : 280;
      const nextIndex = Math.round(node.scrollLeft / (cardWidth * 3));
      setIndex(Math.max(0, Math.min(2, nextIndex)));
    };
    node.addEventListener("scroll", handler, { passive: true });
    return () => node.removeEventListener("scroll", handler);
  }, []);

  return (
    <section className={styles.carouselSection}>
      <div className={styles.carouselHeader}>
        <h3>{title}</h3>
        <div className={styles.carouselControls}>
          <button type="button" onClick={() => scrollBy(-1)}>
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <button type="button" onClick={() => scrollBy(1)}>
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
      </div>
      <div className={styles.carousel} ref={trackRef}>
        {artists.map((artist) => (
          <article key={artist.name} className={styles.carouselCard}>
            <div className={styles.cardTop}>
              <div className={styles.cardBadge}>{title}</div>
              <div className={styles.cardRating}>? {artist.rating}</div>
            </div>
            <h4>{artist.name}</h4>
            <p>{artist.bio}</p>
          </article>
        ))}
      </div>
      <div className={styles.dots}>
        {Array.from({ length: 3 }).map((_, i) => (
          <span
            key={i}
            className={i === index ? styles.dotActive : styles.dot}
          />
        ))}
      </div>
    </section>
  );
}

export default function ExplorePage() {
  return (
    <main className={styles.page}>
      <section className={styles.shell}>
        <header className={styles.header}>
          <h1>Explore creatives and services</h1>
          <p>Curated collections and job postings tailored to your needs.</p>
        </header>

        <div className={styles.searchPill}>
          <span className="material-symbols-outlined">search</span>
          <input placeholder="Search by service, location, or artist..." />
          <button type="button">Filters</button>
        </div>

        <section className={styles.featuredAd}>
          <div>
            <p className={styles.kicker}>Featured</p>
            <h2>Studio Kuhle ? Johannesburg</h2>
            <p>
              Bold fashion and editorial storytelling with a boutique team of
              stylists.
            </p>
            <Link href="/artists/kuhle" className={styles.primaryBtn}>
              View profile
            </Link>
          </div>
          <div className={styles.adImage} />
        </section>

        {carousels.map((title) => (
          <Carousel key={title} title={title} />
        ))}

        <section className={styles.jobs}>
          <div className={styles.jobsHeader}>
            <h2>Recent Job Postings</h2>
            <button type="button" className={styles.primaryBtn}>
              Post a Job
            </button>
          </div>
          <div className={styles.jobList}>
            {Array.from({ length: 3 }).map((_, i) => (
              <article key={i} className={styles.jobCard}>
                <div>
                  <h4>Brand shoot ? Cape Town</h4>
                  <p>
                    Lifestyle shoot for a luxury villa brand, 2-day production.
                  </p>
                  <div className={styles.jobMeta}>
                    <span>R12k - R18k</span>
                    <span>Posted 2 days ago</span>
                  </div>
                </div>
                <button type="button">View details</button>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
