"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

/**
 * Types
 */
type ServiceOption = { label: string; icon: string };
type LocationOption = { label: string; icon: string };

type FeaturedArtist = {
  id: string;
  name: string;
  role: string;
  rating: number;
  statLeftIcon: string;
  statLeftValue: string;
  statLeftLabel: string;
  location: string;
  verified?: boolean;
};

/**
 * Options
 */
const SERVICE_OPTIONS: ServiceOption[] = [
  { label: "Photographer", icon: "add_a_photo" },
  { label: "Videographer", icon: "videocam" },
  { label: "Graphic Designer", icon: "palette" },
  { label: "Makeup Artist", icon: "brush" },
];

const LOCATION_OPTIONS: LocationOption[] = [
  { label: "Cape Town", icon: "location_city" },
  { label: "Johannesburg", icon: "location_city" },
  { label: "Pretoria", icon: "location_city" },
  { label: "Durban", icon: "location_city" },
];

const FEATURED_ARTISTS_BASE: FeaturedArtist[] = [
  {
    id: "Moosa",
    name: "Moosa Sibiya",
    role: "Wedding Photographer",
    rating: 4.9,
    statLeftIcon: "photo_camera",
    statLeftValue: "280",
    statLeftLabel: "Events",
    location: "Cape Town",
    verified: true,
  },
  {
    id: "Fhumulani",
    name: "Fhumulani Manavhela",
    role: "Portrait Photographer",
    rating: 4.8,
    statLeftIcon: "photo_camera",
    statLeftValue: "420",
    statLeftLabel: "Sessions",
    location: "Cape Town",
    verified: true,
  },
];

// Build up to 12 cards while there is no backend yet
const FEATURED_ARTISTS: FeaturedArtist[] = Array.from({ length: 12 }).map(
  (_, i) => {
    const base = FEATURED_ARTISTS_BASE[i % FEATURED_ARTISTS_BASE.length];
    return {
      ...base,
      id: `${base.id}-${i + 1}`,
      rating: Math.max(4.5, Math.min(5, base.rating - (i % 4) * 0.05)),
      statLeftValue: String(Number(base.statLeftValue) + i * 7),
      location:
        i % 4 === 0
          ? "Cape Town"
          : i % 4 === 1
            ? "Johannesburg"
            : i % 4 === 2
              ? "Pretoria"
              : "Durban",
      role:
        i % 4 === 0
          ? base.role
          : i % 4 === 1
            ? "Event Videographer"
            : i % 4 === 2
              ? "Graphic Designer"
              : "Makeup Artist",
      verified: i % 3 !== 0,
    };
  },
);

/**
 * Helpers
 */
function normalize(s: string) {
  return s.trim().toLowerCase();
}

function roleMatchesSelectedService(
  role: string,
  selectedServiceLabel: string,
) {
  const r = normalize(role);
  const s = normalize(selectedServiceLabel);
  if (!s) return true;
  return r.includes(s);
}

function safeLocalStorageGet(key: string) {
  try {
    return typeof window !== "undefined"
      ? window.localStorage.getItem(key)
      : null;
  } catch {
    return null;
  }
}
function safeLocalStorageSet(key: string, value: string) {
  try {
    if (typeof window !== "undefined") window.localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

const RECENT_KEY = "vendrman_recently_viewed_v1";

/**
 * Carousel utils
 */
function calcPageCount(el: HTMLDivElement | null) {
  if (!el) return 1;
  const pageWidth = el.clientWidth || 1;
  const total = el.scrollWidth || pageWidth;
  return Math.max(1, Math.ceil(total / pageWidth));
}

function calcCurrentPage(el: HTMLDivElement | null) {
  if (!el) return 0;
  const pageWidth = el.clientWidth || 1;
  return Math.round(el.scrollLeft / pageWidth);
}

export default function HomePage() {
  const [loading, setLoading] = useState(true);

  const [menuOpen, setMenuOpen] = useState(false);
  const [authPromptOpen, setAuthPromptOpen] = useState<null | "messages">(null);

  const [query, setQuery] = useState("");
  const [service, setService] = useState<ServiceOption>(SERVICE_OPTIONS[0]);
  const [location, setLocation] = useState<LocationOption | null>(null);

  const [serviceOpen, setServiceOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);

  const [condensedSearch, setCondensedSearch] = useState(false);

  // refs
  const serviceRef = useRef<HTMLDivElement | null>(null);
  const locationRef = useRef<HTMLDivElement | null>(null);

  const serviceMenuRef = useRef<HTMLDivElement | null>(null);
  const locationMenuRef = useRef<HTMLDivElement | null>(null);

  const heroRef = useRef<HTMLDivElement | null>(null);

  // carousel refs
  const popularRef = useRef<HTMLDivElement | null>(null);
  const nearRef = useRef<HTMLDivElement | null>(null);
  const recentRef = useRef<HTMLDivElement | null>(null);

  // carousel paging state
  const [popularPage, setPopularPage] = useState(0);
  const [nearPage, setNearPage] = useState(0);
  const [recentPage, setRecentPage] = useState(0);

  const [popularPageCount, setPopularPageCount] = useState(1);
  const [nearPageCount, setNearPageCount] = useState(1);
  const [recentPageCount, setRecentPageCount] = useState(1);

  /**
   * Recently viewed - initialized safely (no setState in effect)
   */
  const [recentlyViewedIds, setRecentlyViewedIds] = useState<string[]>(() => {
    const raw = safeLocalStorageGet(RECENT_KEY);
    if (!raw) return [];
    try {
      const ids = JSON.parse(raw);
      return Array.isArray(ids) ? ids.slice(0, 12) : [];
    } catch {
      return [];
    }
  });

  function openAndFocus(menu: React.RefObject<HTMLDivElement | null>) {
    requestAnimationFrame(() => {
      const firstOption = menu.current?.querySelector<HTMLDivElement>(
        "[data-option='true']",
      );
      firstOption?.focus();
    });
  }

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 350);
    return () => clearTimeout(t);
  }, []);

  /**
   * Nav scroll styling + condensed pill toggling
   */
  useEffect(() => {
    const nav = document.querySelector(".nav");

    const onScroll = () => {
      if (nav) {
        if (window.scrollY > 10) nav.classList.add("scrolled");
        else nav.classList.remove("scrolled");
      }

      const heroEl = heroRef.current;
      if (!heroEl) return;

      const rect = heroEl.getBoundingClientRect();
      const shouldCondense = rect.bottom < 120;
      setCondensedSearch(shouldCondense);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /**
   * Close dropdowns/menu/modal when clicking outside
   */
  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;

      if (serviceRef.current && !serviceRef.current.contains(t))
        setServiceOpen(false);
      if (locationRef.current && !locationRef.current.contains(t))
        setLocationOpen(false);

      const drawer = document.querySelector(".drawer-panel");
      const menuBtn = document.querySelector(".Menu-btn");
      if (menuOpen) {
        if (drawer && !drawer.contains(t) && menuBtn && !menuBtn.contains(t)) {
          setMenuOpen(false);
        }
      }

      const modal = document.querySelector(".modal-panel");
      if (authPromptOpen && modal && !modal.contains(t)) {
        setAuthPromptOpen(null);
      }
    };

    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [menuOpen, authPromptOpen]);

  /**
   * Escape closes menus/modals
   */
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setServiceOpen(false);
        setLocationOpen(false);
        setMenuOpen(false);
        setAuthPromptOpen(null);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  /**
   * Filtered artists
   */
  const filteredArtists = useMemo(() => {
    const q = normalize(query);
    const selectedService = normalize(service.label);
    const selectedLocation = normalize(location?.label ?? "");

    return FEATURED_ARTISTS.filter((a) => {
      const name = normalize(a.name);
      const role = normalize(a.role);
      const loc = normalize(a.location);

      const matchesQ = !q || name.includes(q) || role.includes(q);
      const matchesService =
        !selectedService || roleMatchesSelectedService(a.role, service.label);
      const matchesLocation =
        !selectedLocation || loc.includes(selectedLocation);

      return matchesQ && matchesService && matchesLocation;
    });
  }, [query, service.label, location?.label]);

  const popularArtists = useMemo(() => {
    return [...filteredArtists]
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 12);
  }, [filteredArtists]);

  const nearYouArtists = useMemo(() => {
    const loc = location?.label ?? "Cape Town";
    const list = filteredArtists.filter((a) => a.location === loc);
    return (list.length ? list : filteredArtists).slice(0, 12);
  }, [filteredArtists, location?.label]);

  const recentArtists = useMemo(() => {
    const set = new Set(recentlyViewedIds);
    const list = FEATURED_ARTISTS.filter((a) => set.has(a.id));
    return list.slice(0, 12);
  }, [recentlyViewedIds]);

  /**
   * Update page counts (no ref access during render)
   */
  useEffect(() => {
    const updateAll = () => {
      const pEl = popularRef.current;
      const nEl = nearRef.current;
      const rEl = recentRef.current;

      const pCount = calcPageCount(pEl);
      const nCount = calcPageCount(nEl);
      const rCount = calcPageCount(rEl);

      setPopularPageCount(pCount);
      setNearPageCount(nCount);
      setRecentPageCount(rCount);

      setPopularPage((prev) => Math.min(prev, pCount - 1));
      setNearPage((prev) => Math.min(prev, nCount - 1));
      setRecentPage((prev) => Math.min(prev, rCount - 1));
    };

    const raf = requestAnimationFrame(updateAll);
    const onResize = () => requestAnimationFrame(updateAll);

    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, [popularArtists.length, nearYouArtists.length, recentArtists.length]);

  function scrollToFeatured() {
    document.getElementById("featured")?.scrollIntoView({ behavior: "smooth" });
    setServiceOpen(false);
    setLocationOpen(false);
  }

  function handleSearchClick(e: React.MouseEvent) {
    e.preventDefault();
    scrollToFeatured();
  }

  function handleCondensedPillClick() {
    heroRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function trackRecentlyViewed(artistId: string) {
    const next = [
      artistId,
      ...recentlyViewedIds.filter((id) => id !== artistId),
    ].slice(0, 12);
    setRecentlyViewedIds(next);
    safeLocalStorageSet(RECENT_KEY, JSON.stringify(next));
  }

  function scrollCarousel(
    ref: React.RefObject<HTMLDivElement | null>,
    dir: -1 | 1,
    setPage: (n: number) => void,
  ) {
    const el = ref.current;
    if (!el) return;

    const pageWidth = el.clientWidth || 1;
    el.scrollTo({ left: el.scrollLeft + dir * pageWidth, behavior: "smooth" });

    window.setTimeout(() => setPage(calcCurrentPage(el)), 180);
  }

  function syncPageFromScroll(
    ref: React.RefObject<HTMLDivElement | null>,
    setPage: (n: number) => void,
  ) {
    setPage(calcCurrentPage(ref.current));
  }

  function openMessages() {
    setAuthPromptOpen("messages");
    setMenuOpen(false);
  }

  return (
    <>
      {/* LOADING OVERLAY */}
      {loading && (
        <div className="loading-overlay" aria-label="Loading">
          <div className="loading-inner">
            <div className="logo loading-logo">
              Vendr<span>Man</span>
            </div>
            <div className="loading-sub">Finding creators near you…</div>
            <div className="loading-dots" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
          </div>
        </div>
      )}

      {/* CONDENSED SEARCH PILL */}
      <div className={`condensed-pill ${condensedSearch ? "show" : ""}`}>
        <button
          className="pill-btn"
          onClick={handleCondensedPillClick}
          type="button"
        >
          <span className="material-symbols-outlined">search</span>
          <span className="pill-text">
            {service.label} · {location?.label ?? "Any"} ·{" "}
            {query ? `“${query}”` : "Search"}
          </span>
        </button>
      </div>

      {/* MENU DRAWER */}
      <div
        className={`drawer ${menuOpen ? "open" : ""}`}
        aria-hidden={!menuOpen}
      >
        <div className="drawer-panel">
          <div className="drawer-header">
            <div className="logo">
              Vendr<span>Man</span>
            </div>
            <button
              className="drawer-close"
              onClick={() => setMenuOpen(false)}
              aria-label="Close menu"
              type="button"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div className="drawer-links">
            <Link
              href="/auth/login"
              className="drawer-link"
              onClick={() => setMenuOpen(false)}
            >
              <span className="material-symbols-outlined">login</span>
              Login
            </Link>

            <Link
              href="/auth/signup"
              className="drawer-link"
              onClick={() => setMenuOpen(false)}
            >
              <span className="material-symbols-outlined">person_add</span>
              Sign up
            </Link>

            <Link
              href="/dashboard"
              className="drawer-link"
              onClick={() => setMenuOpen(false)}
            >
              <span className="material-symbols-outlined">dashboard</span>
              Client dashboard
            </Link>

            <button
              className="drawer-link button-link"
              onClick={openMessages}
              type="button"
            >
              <span className="material-symbols-outlined">chat</span>
              Messages
              <span className="drawer-hint">Requires sign in</span>
            </button>

            <a
              href="#how"
              className="drawer-link"
              onClick={() => setMenuOpen(false)}
            >
              <span className="material-symbols-outlined">info</span>
              How it works
            </a>
          </div>

          <div className="drawer-footer">
            <a href="#" className="drawer-link subtle">
              <span className="material-symbols-outlined">verified</span>
              Become an Artist
            </a>
          </div>
        </div>
      </div>

      {/* AUTH PROMPT MODAL */}
      {authPromptOpen && (
        <div className="modal" role="dialog" aria-modal="true">
          <div className="modal-panel">
            <div className="modal-header">
              <div className="modal-title">Sign in to use Messages</div>
              <button
                className="modal-close"
                onClick={() => setAuthPromptOpen(null)}
                aria-label="Close"
                type="button"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="modal-body">
              Messages are where clients and artists lock in details, pricing,
              and availability.
              <div style={{ marginTop: 10, opacity: 0.85 }}>
                You can browse freely — sign in only when you want to message.
              </div>
            </div>

            <div className="modal-actions">
              <Link
                href="/auth/login"
                className="modal-btn primary"
                onClick={() => setAuthPromptOpen(null)}
              >
                Sign in
              </Link>
              <Link
                href="/auth/signup"
                className="modal-btn"
                onClick={() => setAuthPromptOpen(null)}
              >
                Create account
              </Link>
              <button
                className="modal-btn ghost"
                onClick={() => setAuthPromptOpen(null)}
                type="button"
              >
                Not now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NAV */}
      <div className="nav">
        <div className="nav-cont">
          <div className="logo">
            Vendr<span>Man</span>
          </div>

          <div className="nav-link-mid">
            <a href="#featured" className="nav-link">
              <h3>
                <span className="material-symbols-outlined">person</span>Artists
              </h3>
            </a>
            <a href="#featured" className="nav-link">
              <h3>
                <span className="material-symbols-outlined">explore</span>
                Explore
              </h3>
            </a>
            <a href="#how" className="nav-link">
              <h3>
                <span className="material-symbols-outlined">info</span>How it
                Works
              </h3>
            </a>
          </div>

          <div className="nav-link-end">
            <a href="#" className="art-btn">
              <h3>Become an Artist</h3>
            </a>

            <button
              type="button"
              className="Menu-btn"
              aria-label="menu"
              onClick={() => setMenuOpen((v) => !v)}
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
          </div>
        </div>
      </div>

      {/* HERO */}
      <div className="hero" ref={heroRef}>
        <h1>
          Find Your Perfect <span className="gradient">Creative</span>
        </h1>
        <p>Browse your favourite Photographers, Videographers and more</p>

        <div
          className={`search-bar ${condensedSearch ? "hide-when-condensed" : ""}`}
        >
          <div className="search-segment search-input-segment">
            <input
              type="text"
              placeholder="Search by name or service..."
              className="search-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") scrollToFeatured();
              }}
            />
          </div>

          <div className="divider" />

          {/* SERVICE DROPDOWN */}
          <div
            className="search-segment service-segment"
            ref={serviceRef}
            role="button"
            tabIndex={0}
            aria-haspopup="listbox"
            aria-expanded={serviceOpen}
            onClick={() => {
              setServiceOpen((v) => {
                const next = !v;
                if (next) openAndFocus(serviceMenuRef);
                return next;
              });
              setLocationOpen(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setServiceOpen((v) => {
                  const next = !v;
                  if (next) openAndFocus(serviceMenuRef);
                  return next;
                });
                setLocationOpen(false);
              }
            }}
          >
            <div className="selected">
              <span className="material-symbols-outlined">{service.icon}</span>
              {service.label}
            </div>

            <div
              className="custom-select"
              ref={serviceMenuRef}
              style={{ display: serviceOpen ? "block" : "none" }}
              onClick={(e) => e.stopPropagation()}
              role="listbox"
              aria-label="Select service"
            >
              {SERVICE_OPTIONS.map((opt) => (
                <div
                  key={opt.label}
                  data-option="true"
                  tabIndex={0}
                  role="option"
                  aria-selected={opt.label === service.label}
                  onClick={() => {
                    setService(opt);
                    setServiceOpen(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setService(opt);
                      setServiceOpen(false);
                    }
                  }}
                >
                  <span className="material-symbols-outlined">{opt.icon}</span>
                  {opt.label}
                </div>
              ))}
            </div>
          </div>

          <div className="divider" />

          {/* LOCATION DROPDOWN */}
          <div
            className="search-segment location-segment"
            ref={locationRef}
            role="button"
            tabIndex={0}
            aria-haspopup="listbox"
            aria-expanded={locationOpen}
            onClick={() => {
              setLocationOpen((v) => {
                const next = !v;
                if (next) openAndFocus(locationMenuRef);
                return next;
              });
              setServiceOpen(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setLocationOpen((v) => {
                  const next = !v;
                  if (next) openAndFocus(locationMenuRef);
                  return next;
                });
                setServiceOpen(false);
              }
            }}
          >
            <div className="selected">
              <span className="material-symbols-outlined">
                {location?.icon ?? "location_on"}
              </span>
              {location?.label ?? "Location"}
            </div>

            <div
              className="custom-select"
              ref={locationMenuRef}
              style={{ display: locationOpen ? "block" : "none" }}
              onClick={(e) => e.stopPropagation()}
              role="listbox"
              aria-label="Select location"
            >
              <div
                data-option="true"
                tabIndex={0}
                role="option"
                aria-selected={location === null}
                onClick={() => {
                  setLocation(null);
                  setLocationOpen(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setLocation(null);
                    setLocationOpen(false);
                  }
                }}
              >
                <span className="material-symbols-outlined">location_on</span>
                Any Location
              </div>

              {LOCATION_OPTIONS.map((opt) => (
                <div
                  key={opt.label}
                  data-option="true"
                  tabIndex={0}
                  role="option"
                  aria-selected={opt.label === location?.label}
                  onClick={() => {
                    setLocation(opt);
                    setLocationOpen(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setLocation(opt);
                      setLocationOpen(false);
                    }
                  }}
                >
                  <span className="material-symbols-outlined">{opt.icon}</span>
                  {opt.label}
                </div>
              ))}
            </div>
          </div>

          <a href="#" className="search-btn" onClick={handleSearchClick}>
            <span className="material-symbols-outlined">search</span>
          </a>
        </div>
      </div>

      {/* FEATURED */}
      <div className="featured-section" id="featured">
        <div className="section-header">
          <h2>Featured Artists</h2>
          <p>Discover top-rated professionals in your area</p>
        </div>

        <SectionRow
          title="POPULAR ARTISTS"
          items={popularArtists}
          rowRef={popularRef}
          page={popularPage}
          pageCount={popularPageCount}
          onLeft={() => scrollCarousel(popularRef, -1, setPopularPage)}
          onRight={() => scrollCarousel(popularRef, 1, setPopularPage)}
          onScroll={() => syncPageFromScroll(popularRef, setPopularPage)}
          onCardClick={trackRecentlyViewed}
        />

        <SectionRow
          title="NEAR YOU"
          items={nearYouArtists}
          rowRef={nearRef}
          page={nearPage}
          pageCount={nearPageCount}
          onLeft={() => scrollCarousel(nearRef, -1, setNearPage)}
          onRight={() => scrollCarousel(nearRef, 1, setNearPage)}
          onScroll={() => syncPageFromScroll(nearRef, setNearPage)}
          onCardClick={trackRecentlyViewed}
        />

        <SectionRow
          title="RECENTLY VIEWED"
          items={recentArtists}
          rowRef={recentRef}
          page={recentPage}
          pageCount={recentPageCount}
          onLeft={() => scrollCarousel(recentRef, -1, setRecentPage)}
          onRight={() => scrollCarousel(recentRef, 1, setRecentPage)}
          onScroll={() => syncPageFromScroll(recentRef, setRecentPage)}
          onCardClick={trackRecentlyViewed}
          emptyText="You haven’t viewed any artists yet. Click a profile card to start building this."
        />
      </div>

      {/* HOW IT WORKS */}
      <div className="how-section" id="how">
        <div className="section-header">
          <h2>How it works</h2>
          <p>Simple, fast, and safe.</p>
        </div>

        <div className="how-grid">
          <div className="how-card">
            <span className="material-symbols-outlined">search</span>
            <h3>Search</h3>
            <p>
              Find photographers, videographers, designers and more in your
              city.
            </p>
          </div>

          <div className="how-card">
            <span className="material-symbols-outlined">chat</span>
            <h3>Message</h3>
            <p>
              Message artists to confirm availability, pricing, and what you
              need.
            </p>
          </div>

          <div className="how-card">
            <span className="material-symbols-outlined">event</span>
            <h3>Book</h3>
            <p>
              Lock in the booking details, date, and deliverables with
              confidence.
            </p>
          </div>

          <div className="how-card">
            <span className="material-symbols-outlined">verified</span>
            <h3>Get it done</h3>
            <p>
              Work with trusted talent and receive the final content as
              promised.
            </p>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-top">
          <div className="footer-col">
            <h4>Support</h4>
            <a href="#">Customer support</a>
            <a href="#">Refund policy</a>
            <a href="#">Safety guidelines</a>
          </div>

          <div className="footer-col">
            <h4>For clients</h4>
            <a href="#">My bookings</a>
            <a href="#">Payments</a>
            <a href="#">Profile</a>
          </div>

          <div className="footer-col">
            <h4>For artists</h4>
            <a href="#">Dashboard</a>
            <a href="#">Become an agency</a>
            <button
              className="footer-link-btn"
              onClick={openMessages}
              type="button"
            >
              Messages <span className="footer-hint">(sign in)</span>
            </button>
          </div>
        </div>

        <div className="footer-legal">
          <div className="footer-legal-left">
            © {new Date().getFullYear()} VendrMan. All rights reserved.
          </div>
          <div className="footer-legal-right">
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
            <a href="#">Cookies</a>
          </div>
        </div>
      </footer>
    </>
  );
}

function SectionRow(props: {
  title: string;
  items: FeaturedArtist[];
  rowRef: React.RefObject<HTMLDivElement | null>;
  page: number;
  pageCount: number;
  onLeft: () => void;
  onRight: () => void;
  onScroll: () => void;
  onCardClick: (artistId: string) => void;
  emptyText?: string;
}) {
  const {
    title,
    items,
    rowRef,
    page,
    pageCount,
    onLeft,
    onRight,
    onScroll,
    onCardClick,
    emptyText,
  } = props;

  const isEmpty = items.length === 0;

  return (
    <div className="row-section">
      <div className="row-header">
        <h3>{title}</h3>
      </div>

      <div className={`row-shell ${isEmpty ? "is-empty" : ""}`}>
        {!isEmpty && (
          <button
            className="row-arrow left"
            onClick={onLeft}
            aria-label="Scroll left"
            type="button"
          >
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
        )}

        <div className="row-scroll" ref={rowRef} onScroll={onScroll}>
          {isEmpty ? (
            <div className="row-empty">
              <div className="row-empty-inner">
                {emptyText ?? "No items yet."}
              </div>
            </div>
          ) : (
            items.map((a) => (
              <button
                key={a.id}
                className="artist-card artist-card-btn"
                onClick={() => onCardClick(a.id)}
                aria-label={`View ${a.name}`}
                type="button"
              >
                <div className="artist-image">
                  {a.verified && (
                    <div className="artist-badge">
                      <span className="material-symbols-outlined">
                        verified
                      </span>
                      Verified
                    </div>
                  )}
                </div>

                <div className="artist-info">
                  <div className="artist-header">
                    <div>
                      <div className="artist-name">{a.name}</div>
                      <div className="artist-role">{a.role}</div>
                    </div>
                    <div className="artist-rating">
                      <span className="material-symbols-outlined">star</span>
                      {a.rating.toFixed(1)}
                    </div>
                  </div>

                  <div className="artist-stats">
                    <div className="stat">
                      <span className="material-symbols-outlined">
                        {a.statLeftIcon}
                      </span>
                      <strong>{a.statLeftValue}</strong> {a.statLeftLabel}
                    </div>
                    <div className="stat">
                      <span className="material-symbols-outlined">
                        location_on
                      </span>
                      {a.location}
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        {!isEmpty && (
          <button
            className="row-arrow right"
            onClick={onRight}
            aria-label="Scroll right"
            type="button"
          >
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        )}
      </div>

      {/* Hide dots when empty (removes grey dot) */}
      {!isEmpty && (
        <div className="row-dots" aria-label="Carousel position">
          {Array.from({ length: Math.max(1, pageCount) }).map((_, i) => (
            <div key={i} className={`dot ${i === page ? "active" : ""}`} />
          ))}
        </div>
      )}
    </div>
  );
}
