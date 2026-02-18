"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";

const locations = ["Cape Town", "Johannesburg", "Pretoria", "Durban", "All"];
const services = ["Photography", "Videography", "Design", "Content", "Events"];
const STAR_COLORS = [
  "#2563eb",
  "#3b82f6",
  "#1d4ed8",
  "#60a5fa",
  "#93c5fd",
  "#5f6ef0",
];

type Star = {
  color: string;
  pz: number;
  x: number;
  y: number;
  z: number;
};

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
            <button
              type="button"
              className={styles.featureFavBtn}
              aria-label="Add to favourites"
              title="Favourites"
            >
              <span className="material-symbols-outlined">favorite</span>
            </button>
            <div
              className={styles.featurePreview}
              style={{
                backgroundImage:
                  "url(https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80)",
              }}
            />
            <div className={styles.featureBadge}>{artist.role}</div>
            <h3>{artist.name}</h3>
            <p>{artist.location}</p>
            <div className={styles.featureMeta}>{"\u2605"} {artist.rating}</div>
            <button type="button" className={styles.profileBtn}>
              View profile
            </button>
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
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [compact, setCompact] = useState(false);
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState(locations[0]);
  const [service, setService] = useState(services[0]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let centerX = 0;
    let centerY = 0;
    let rafId = 0;
    let stars: Star[] = [];
    const motionReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const depthMax = () => Math.max(width, height);
    const starCount = () =>
      Math.max(90, Math.min(220, Math.round((width * height) / 11000)));

    const resetStar = (star: Star, initial: boolean) => {
      star.x = (Math.random() - 0.5) * width;
      star.y = (Math.random() - 0.5) * height;
      star.z = initial ? Math.random() * depthMax() : depthMax();
      star.pz = star.z;
      star.color = STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)];
    };

    const rebuildStars = () => {
      stars = Array.from({ length: starCount() }, () => {
        const star: Star = {
          color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
          pz: 0,
          x: 0,
          y: 0,
          z: 0,
        };
        resetStar(star, true);
        return star;
      });
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      centerX = width / 2;
      centerY = height / 2;
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      rebuildStars();
    };

    const drawStatic = () => {
      ctx.clearRect(0, 0, width, height);
      for (const star of stars) {
        const sx = (star.x / star.z) * width + centerX;
        const sy = (star.y / star.z) * height + centerY;
        const radius = Math.max(0.4, (1 - star.z / depthMax()) * 1.8);
        const alpha = Math.max(0.1, (1 - star.z / depthMax()) * 0.32);

        if (!Number.isFinite(sx) || !Number.isFinite(sy)) continue;

        ctx.beginPath();
        ctx.arc(sx, sy, radius, 0, Math.PI * 2);
        ctx.fillStyle = star.color;
        ctx.globalAlpha = alpha;
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    const drawAnimated = () => {
      ctx.clearRect(0, 0, width, height);
      const speed = 18;

      for (const star of stars) {
        star.pz = star.z;
        star.z -= speed;
        if (star.z <= 1) resetStar(star, false);

        const sx = (star.x / star.z) * width + centerX;
        const sy = (star.y / star.z) * height + centerY;
        const px = (star.x / star.pz) * width + centerX;
        const py = (star.y / star.pz) * height + centerY;
        const size = Math.max(0.1, (1 - star.z / depthMax()) * 2.4);
        const alpha = Math.max(0.04, (1 - star.z / depthMax()) * 0.48);

        if (
          !Number.isFinite(sx) ||
          !Number.isFinite(sy) ||
          !Number.isFinite(px) ||
          !Number.isFinite(py)
        ) {
          continue;
        }

        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(sx, sy);
        ctx.strokeStyle = star.color;
        ctx.lineWidth = size;
        ctx.globalAlpha = alpha;
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      rafId = window.requestAnimationFrame(drawAnimated);
    };

    const handleResize = () => {
      resize();
      if (motionReduced) drawStatic();
    };

    resize();
    if (motionReduced) {
      drawStatic();
    } else {
      drawAnimated();
    }

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, []);

  useEffect(() => {
    let frame = 0;
    const compactTrigger = 40;

    const updateCompact = () => {
      const shouldCompact = window.scrollY > compactTrigger;
      setCompact((current) =>
        current === shouldCompact ? current : shouldCompact,
      );
    };

    const handleScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        updateCompact();
      });
    };

    updateCompact();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", updateCompact);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", updateCompact);
    };
  }, []);

  return (
    <main className={styles.page}>
      <canvas ref={canvasRef} className={styles.warpCanvas} aria-hidden="true" />
      <section className={styles.hero}>
        <h1 className={styles.title}>
          Find your perfect <span className={styles.grad}>Photographer</span>,
          <span className={styles.grad}> Videographer</span> & more.
        </h1>

        <p className={styles.subtitle}>
          Discover trusted creatives across South Africa with curated profiles,
          real reviews, and fast booking.
        </p>
        <div className={styles.searchSlot} data-compact={compact}>
          <div className={styles.searchWrap} data-compact={compact}>
            {compact ? (
              <div className={styles.compactSummary}>
                <span className="material-symbols-outlined">search</span>
                <div className={styles.compactText}>
                  <strong>{query.trim() || "Search creatives"}</strong>
                  <span>
                    {location} . {service}
                  </span>
                </div>
              </div>
            ) : (
              <>
                <div className={styles.searchItem}>
                  <span className="material-symbols-outlined">search</span>
                  <input
                    placeholder="Search by artist or service"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                  />
                </div>
                <div className={styles.searchItem}>
                  <span className="material-symbols-outlined">location_on</span>
                  <select
                    value={location}
                    onChange={(event) => setLocation(event.target.value)}
                  >
                    {locations.map((loc) => (
                      <option key={loc}>{loc}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.searchItem}>
                  <span className="material-symbols-outlined">category</span>
                  <select
                    value={service}
                    onChange={(event) => setService(event.target.value)}
                  >
                    {services.map((serviceOption) => (
                      <option key={serviceOption}>{serviceOption}</option>
                    ))}
                  </select>
                </div>
              </>
            )}
            <button className={styles.searchBtn} type="button">
              <span className="material-symbols-outlined">search</span>
            </button>
          </div>
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
