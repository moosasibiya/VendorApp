"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";

const locations = ["Cape Town", "Johannesburg", "Pretoria", "Durban", "All"];
const services = ["Photography", "Videography", "Design", "Content", "Events"];

const artists = Array.from({ length: 12 }).map((_, i) => ({
  name: `Artist ${i + 1}`,
  role: i % 2 === 0 ? "Photographer" : "Videographer",
  location: locations[i % locations.length],
  rating: (4.7 + (i % 3) * 0.1).toFixed(1),
  slug: `artist-${i + 1}`,
}));

function Row({ title }: { title: string }) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const node = trackRef.current;
    if (!node) return;
    const handler = () => {
      const cardWidth = node.firstElementChild
        ? (node.firstElementChild as HTMLElement).offsetWidth + 16
        : 280;
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
    <section className={styles.rowSection}>
      <div className={styles.rowHeader}>
        <h3>{title}</h3>
        <div className={styles.rowControls}>
          <button onClick={() => scrollBy(-1)} type="button">
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <button onClick={() => scrollBy(1)} type="button">
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
      </div>
      <div className={styles.rowTrack} ref={trackRef}>
        {artists.slice(0, 12).map((artist) => (
          <article key={`${title}-${artist.slug}`} className={styles.rowCard}>
            <div className={styles.rowBadge}>{artist.role}</div>
            <h4>{artist.name}</h4>
            <p>{artist.location}</p>
            <div className={styles.rowMeta}>? {artist.rating}</div>
          </article>
        ))}
      </div>
      <div className={styles.dots}>
        {Array.from({ length: 4 }).map((_, i) => (
          <span
            key={i}
            className={i === index ? styles.dotActive : styles.dot}
          />
        ))}
      </div>
    </section>
  );
}

export default function ArtistsPage() {
  const categories = useMemo(
    () => ["Popular", "Verified", "Favourites", "New Talent"],
    [],
  );

  return (
    <main className={styles.page}>
      <section className={styles.shell}>
        <header className={styles.header}>
          <div>
            <p className={styles.kicker}>Browse creatives</p>
            <h1 className={styles.title}>
              Discover artists ready to bring your vision to life.
            </h1>
            <p className={styles.subtitle}>
              Filter by location, service, and budget to find photographers,
              videographers, and creative teams across South Africa.
            </p>
          </div>
        </header>

        <div className={styles.searchPill}>
          <div className={styles.searchLeft}>
            <span className="material-symbols-outlined">search</span>
            <input placeholder="Search artists, services, or styles..." />
          </div>
          <div className={styles.searchRight}>
            <select>
              {locations.map((loc) => (
                <option key={loc}>{loc}</option>
              ))}
            </select>
            <select>
              {services.map((service) => (
                <option key={service}>{service}</option>
              ))}
            </select>
            <button type="button">Filters</button>
          </div>
        </div>

        <div className={styles.layout}>
          <aside className={styles.filters}>
            <div className={styles.filterHeader}>
              <h3>Filters</h3>
              <button type="button">Clear all</button>
            </div>

            <div className={styles.filterBlock}>
              <p>Service</p>
              {services.map((service) => (
                <label key={service}>
                  <input type="checkbox" /> {service}
                </label>
              ))}
            </div>

            <div className={styles.filterBlock}>
              <p>Location</p>
              {locations.map((loc) => (
                <label key={loc}>
                  <input type="checkbox" /> {loc}
                </label>
              ))}
            </div>

            <div className={styles.filterBlock}>
              <p>Price Range</p>
              <div className={styles.priceInputs}>
                <input placeholder="Min" />
                <input placeholder="Max" />
              </div>
            </div>
          </aside>

          <div className={styles.content}>
            <section className={styles.adSection}>
              <div>
                <p className={styles.adKicker}>Sponsored</p>
                <h2>Studio Kuhle</h2>
                <p>Fashion and editorial creatives available in Johannesburg.</p>
                <Link href="/artists/kuhle" className={styles.primaryBtn}>
                  View profile
                </Link>
              </div>
              <div className={styles.adImage} />
            </section>

            <div className={styles.grid}>
              {artists.slice(0, 9).map((artist) => (
                <article key={artist.slug} className={styles.card}>
                  <div className={styles.cardTop}>
                    <div className={styles.cardBadge}>{artist.role}</div>
                    <div className={styles.cardRating}>? {artist.rating}</div>
                  </div>
                  <div className={styles.cardBody}>
                    <h3>{artist.name}</h3>
                    <p>{artist.location}</p>
                    <div className={styles.cardMeta}>
                      <span>From R2,500</span>
                      <span>Next availability: 2 days</span>
                    </div>
                  </div>
                  <Link className={styles.cardBtn} href={`/artists/${artist.slug}`}>
                    View Profile
                    <span className="material-symbols-outlined">chevron_right</span>
                  </Link>
                </article>
              ))}
            </div>

            {categories.map((category) => (
              <Row key={category} title={category} />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
