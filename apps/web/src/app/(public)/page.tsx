"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";

const locations = ["Cape Town", "Johannesburg", "Pretoria", "Durban", "All"];
const services = ["Photography", "Videography", "Design", "Content", "Events"];

const buildArtists = () =>
  Array.from({ length: 12 }).map((_, i) => ({
    name: `Artist ${i + 1}`,
    role: i % 2 === 0 ? "Photographer" : "Videographer",
    rating: (4.7 + (i % 3) * 0.1).toFixed(1),
    location: locations[i % locations.length],
  }));

function FeaturedRow({ title }: { title: string }) {
  const items = useMemo(() => buildArtists(), []);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const node = trackRef.current;
    if (!node) return;

    const handler = () => {
      const cardWidth = node.firstElementChild
        ? (node.firstElementChild as HTMLElement).offsetWidth + 16
        : 300;
      const nextIndex = Math.round(node.scrollLeft / (cardWidth * 3));
      setIndex(Math.max(0, Math.min(3, nextIndex)));
    };

    node.addEventListener("scroll", handler, { passive: true });
    return () => node.removeEventListener("scroll", handler);
  }, []);

  const scrollBy = (direction: number) => {
    const node = trackRef.current;
    if (!node) return;
    const cardWidth = node.firstElementChild
      ? (node.firstElementChild as HTMLElement).offsetWidth + 16
      : 300;
    node.scrollBy({ left: direction * cardWidth * 3, behavior: "smooth" });
  };

  return (
    <section className={styles.featureSection}>
      <div className={styles.featureHeader}>
        <h2>{title}</h2>
        <div className={styles.featureControls}>
          <button type="button" onClick={() => scrollBy(-1)}>
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <button type="button" onClick={() => scrollBy(1)}>
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
      </div>
      <div className={styles.featureTrack} ref={trackRef}>
        {items.map((artist) => (
          <article key={artist.name} className={styles.featureCard}>
            <div className={styles.featureBadge}>{artist.role}</div>
            <h3>{artist.name}</h3>
            <p>{artist.location}</p>
            <div className={styles.featureMeta}>? {artist.rating}</div>
            <button type="button">View profile</button>
          </article>
        ))}
      </div>
      <div className={styles.dots}>
        {Array.from({ length: 4 }).map((_, i) => (
          <span
            key={i}
            className={i == index ? styles.dotActive : styles.dot}
          />
        ))}
      </div>
    </section>
  );
}

export default function PublicHomePage() {
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    let lastY = window.scrollY;
    const handleScroll = () => {
      const currentY = window.scrollY;
      const isScrollingDown = currentY > lastY;
      lastY = currentY;

      if (!isScrollingDown) {
        setCompact(false);
        return;
      }

      setCompact(currentY > 140);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.badge}>
          <span className="material-symbols-outlined">auto_awesome</span>
          VendrMan ? Marketplace for creatives
        </div>

        <h1 className={styles.title}>
          Find your perfect <span className={styles.grad}>Photographer</span>,
          <span className={styles.grad}> Videographer</span> & more.
        </h1>

        <p className={styles.subtitle}>
          Discover trusted creatives across South Africa with curated profiles,
          real reviews, and fast booking.
        </p>

        <div className={styles.searchWrap} data-compact={compact}>
          <div className={styles.searchItem}>
            <span className="material-symbols-outlined">search</span>
            <input placeholder="Search by artist or service" />
          </div>
          <div className={styles.searchItem}>
            <span className="material-symbols-outlined">location_on</span>
            <select>
              {locations.map((loc) => (
                <option key={loc}>{loc}</option>
              ))}
            </select>
          </div>
          <div className={styles.searchItem}>
            <span className="material-symbols-outlined">category</span>
            <select>
              {services.map((service) => (
                <option key={service}>{service}</option>
              ))}
            </select>
          </div>
          <button className={styles.searchBtn} type="button">
            <span className="material-symbols-outlined">search</span>
          </button>
        </div>

        <div className={styles.actions} data-compact={compact}>
          <Link className={styles.primary} href="/artists">
            <span className="material-symbols-outlined">person_search</span>
            Browse Artists
          </Link>
          <Link className={styles.secondary} href="/explore">
            <span className="material-symbols-outlined">explore</span>
            Explore
          </Link>
          <Link className={styles.secondary} href="/dashboard">
            <span className="material-symbols-outlined">dashboard</span>
            Client Dashboard
          </Link>
        </div>
      </section>

      <FeaturedRow title="POPULAR ARTISTS" />
      <FeaturedRow title="NEAR YOU" />
      <FeaturedRow title="RECENTLY VIEWED" />

      <section className={styles.howSection} id="how-it-works">
        <div className={styles.howHeader}>
          <h2>How it works</h2>
          <p>Four simple steps to book your creative.</p>
        </div>
        <div className={styles.howGrid}>
          {[
            ["Browse artists", "Explore specialties and portfolios."],
            ["Discover hidden gems", "Filter by location and style."],
            ["Make a booking", "Share your event details."],
            ["Await your creation", "Relax while we deliver."],
          ].map(([title, text], index) => (
            <article key={title} className={styles.howCard}>
              <div className={styles.howBadge}>{index + 1}</div>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
