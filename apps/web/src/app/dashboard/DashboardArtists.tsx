// src/app/dashboard/DashboardArtists.tsx
"use client";

import React, { useMemo, useState } from "react";
import {
  Search,
  MapPin,
  DollarSign,
  Star,
  CheckCircle,
  Heart,
  SlidersHorizontal,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import styles from "./DashboardArtists.module.css";

type Service = "Photography" | "Videography" | "Web Design";
type Availability = "Available Now" | "Booking Soon" | "Waitlist";
type PriceRange = "R" | "RR" | "RRR" | "RRRR";
type Location =
  | "Johannesburg"
  | "Cape Town"
  | "Durban"
  | "Pretoria"
  | "Gqeberha";

type Category = "all" | "popular" | "verified" | "favourite" | "recent";

type Artist = {
  id: number;
  name: string;
  service: Service;
  location: Location;
  price: PriceRange;
  availability: Availability;
  rating: number;
  verified: boolean;
  category: Exclude<Category, "all">;
};

type FilterKey = "service" | "location" | "priceRange" | "availability";

type FiltersState = Record<FilterKey, Set<string>>;
type FilterOptions = Record<FilterKey, string[]>;

const BASE_ARTISTS: Artist[] = [
  {
    id: 1,
    name: "Sihle Mokoena",
    service: "Photography",
    location: "Johannesburg",
    price: "RRR",
    availability: "Available Now",
    rating: 4.9,
    verified: true,
    category: "popular",
  },
  {
    id: 2,
    name: "Ayesha Khan",
    service: "Videography",
    location: "Cape Town",
    price: "RRRR",
    availability: "Booking Soon",
    rating: 5.0,
    verified: true,
    category: "popular",
  },
  {
    id: 3,
    name: "Thando Ndlovu",
    service: "Web Design",
    location: "Durban",
    price: "RR",
    availability: "Available Now",
    rating: 4.7,
    verified: false,
    category: "recent",
  },
  {
    id: 4,
    name: "Keegan Jacobs",
    service: "Photography",
    location: "Pretoria",
    price: "RRR",
    availability: "Waitlist",
    rating: 4.8,
    verified: true,
    category: "verified",
  },
  {
    id: 5,
    name: "Naledi Molefe",
    service: "Videography",
    location: "Johannesburg",
    price: "RR",
    availability: "Booking Soon",
    rating: 4.6,
    verified: false,
    category: "recent",
  },
  {
    id: 6,
    name: "Jason Pillay",
    service: "Web Design",
    location: "Cape Town",
    price: "RRR",
    availability: "Available Now",
    rating: 4.9,
    verified: true,
    category: "verified",
  },
  {
    id: 7,
    name: "Zinhle Dlamini",
    service: "Photography",
    location: "Gqeberha",
    price: "R",
    availability: "Available Now",
    rating: 4.5,
    verified: false,
    category: "recent",
  },
  {
    id: 8,
    name: "Musa van Wyk",
    service: "Videography",
    location: "Durban",
    price: "RRRR",
    availability: "Waitlist",
    rating: 4.4,
    verified: true,
    category: "popular",
  },
];

type FiltersPanelProps = {
  compact?: boolean; // compact mode for mobile drawer
  filters: FiltersState;
  filterOptions: FilterOptions;
  selectedFiltersCount: number;
  onToggleFilter: (key: FilterKey, value: string) => void;
  onClearFilters: () => void;
  onApply?: () => void; // used for mobile drawer to close
  onCollapse?: () => void; // desktop collapse
};

/**
 * FiltersPanel (pure)
 * - defined outside render to avoid eslint react-hooks/static-components warning
 */
function FiltersPanel({
  compact,
  filters,
  filterOptions,
  selectedFiltersCount,
  onToggleFilter,
  onClearFilters,
  onApply,
  onCollapse,
}: FiltersPanelProps) {
  return (
    <div className={`${styles.card} ${compact ? "p-4" : "p-5"}`}>
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-5 h-5 text-gray-700" />
          <h2 className="font-bold text-lg text-gray-900">Filters</h2>
        </div>

        <div className="flex items-center gap-3">
          {!compact && onCollapse && (
            <button
              onClick={onCollapse}
              className="inline-flex items-center justify-center w-9 h-9 rounded-xl border border-gray-200 bg-white hover:bg-gray-50"
              type="button"
              aria-label="Collapse filters"
              title="Collapse filters"
            >
              <ChevronLeft className="w-4 h-4 text-gray-700" />
            </button>
          )}

          <button
            onClick={onClearFilters}
            className="text-sm font-semibold text-gray-600 hover:text-gray-900"
            type="button"
          >
            Clear all
          </button>
        </div>
      </div>

      {/* Selected count */}
      <div className="text-xs text-gray-600 mb-4">
        Selected:{" "}
        <span className="font-semibold text-gray-900">
          {selectedFiltersCount}
        </span>
      </div>

      {/* Groups */}
      {(Object.entries(filterOptions) as Array<[FilterKey, string[]]>).map(
        ([category, options]) => (
          <div key={category} className="mb-5">
            <h3 className="font-semibold text-sm text-gray-800 mb-2 capitalize">
              {category.replace(/([A-Z])/g, " $1").trim()}
            </h3>

            <div
              className={[
                "space-y-2",
                compact ? "max-h-44 overflow-auto pr-1" : "",
              ].join(" ")}
            >
              {options.map((option) => (
                <label
                  key={option}
                  className="flex items-center gap-2 cursor-pointer select-none"
                >
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    checked={filters[category].has(option)}
                    onChange={() => onToggleFilter(category, option)}
                  />
                  <span className="text-sm text-gray-700">{option}</span>
                </label>
              ))}
            </div>
          </div>
        ),
      )}

      {compact && (
        <button
          className={`w-full mt-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold ${styles.primaryBtn}`}
          type="button"
          onClick={onApply}
        >
          Apply Filters
        </button>
      )}
    </div>
  );
}

type CollapsedRailProps = {
  selectedFiltersCount: number;
  onExpand: () => void;
  onClear: () => void;
};

function CollapsedFiltersRail({
  selectedFiltersCount,
  onExpand,
  onClear,
}: CollapsedRailProps) {
  return (
    <div className={`${styles.card} ${styles.filtersRail} p-3`}>
      <button
        onClick={onExpand}
        className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm hover:bg-blue-700 transition-colors"
        type="button"
        aria-label="Expand filters"
        title="Expand filters"
      >
        <SlidersHorizontal className="w-5 h-5" />
      </button>

      {selectedFiltersCount > 0 && (
        <div className="mt-2 text-center">
          <div className="inline-flex items-center justify-center min-w-6 h-6 px-2 rounded-full bg-blue-600 text-white text-xs font-bold">
            {selectedFiltersCount}
          </div>
          <button
            onClick={onClear}
            type="button"
            className="mt-2 text-xs font-semibold text-gray-600 hover:text-gray-900"
          >
            Clear
          </button>
        </div>
      )}

      <div className="mt-auto">
        <button
          onClick={onExpand}
          className="w-10 h-10 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-center"
          type="button"
          aria-label="Expand filters panel"
          title="Expand"
        >
          <ChevronRight className="w-4 h-4 text-gray-700" />
        </button>
      </div>
    </div>
  );
}

export default function DashboardArtists() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category>("all");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [desktopFiltersCollapsed, setDesktopFiltersCollapsed] = useState(false);
  const [favourites, setFavourites] = useState<Set<number>>(() => new Set([5]));

  const [filters, setFilters] = useState<FiltersState>(() => ({
    service: new Set(),
    location: new Set(),
    priceRange: new Set(),
    availability: new Set(),
  }));

  const filterOptions: FilterOptions = {
    service: ["Photography", "Videography", "Web Design"],
    location: ["Johannesburg", "Cape Town", "Durban", "Pretoria", "Gqeberha"],
    priceRange: ["R", "RR", "RRR", "RRRR"],
    availability: ["Available Now", "Booking Soon", "Waitlist"],
  };

  const adCards = [
    {
      id: 1,
      title: "Premium Listing",
      text: "Get featured at the top",
      color: "bg-gradient-to-br from-purple-500 to-pink-500",
    },
    {
      id: 2,
      title: "Pro Tools Bundle",
      text: "Save 40% this month",
      color: "bg-gradient-to-br from-blue-500 to-cyan-500",
    },
    {
      id: 3,
      title: "Workshop Series",
      text: "Learn from the best",
      color: "bg-gradient-to-br from-orange-500 to-red-500",
    },
  ];

  const toggleFilter = (key: FilterKey, value: string) => {
    setFilters((prev) => {
      const next = { ...prev, [key]: new Set(prev[key]) };
      if (next[key].has(value)) next[key].delete(value);
      else next[key].add(value);
      return next;
    });
  };

  const clearFilters = () => {
    setFilters({
      service: new Set(),
      location: new Set(),
      priceRange: new Set(),
      availability: new Set(),
    });
  };

  const toggleFavourite = (artistId: number) => {
    setFavourites((prev) => {
      const next = new Set(prev);
      if (next.has(artistId)) next.delete(artistId);
      else next.add(artistId);
      return next;
    });
  };

  const selectedFiltersCount =
    filters.service.size +
    filters.location.size +
    filters.priceRange.size +
    filters.availability.size;

  const visibleArtists = useMemo(() => {
    return BASE_ARTISTS.filter((artist) => {
      // Category
      if (selectedCategory !== "all") {
        if (selectedCategory === "favourite") {
          if (!favourites.has(artist.id)) return false;
        } else if (selectedCategory === "verified") {
          if (!artist.verified) return false;
        } else {
          if (artist.category !== selectedCategory) return false;
        }
      }

      // Search
      const q = search.trim().toLowerCase();
      if (q) {
        const text =
          `${artist.name} ${artist.service} ${artist.location}`.toLowerCase();
        if (!text.includes(q)) return false;
      }

      // Checkboxes
      if (filters.service.size && !filters.service.has(artist.service))
        return false;
      if (filters.location.size && !filters.location.has(artist.location))
        return false;
      if (filters.priceRange.size && !filters.priceRange.has(artist.price))
        return false;
      if (
        filters.availability.size &&
        !filters.availability.has(artist.availability)
      )
        return false;

      return true;
    });
  }, [search, selectedCategory, filters, favourites]);

  return (
    <div className={styles.page}>
      {/* Header (scrolls away normally) */}
      <header className={`${styles.header} px-4 sm:px-6 py-6`}>
        <div className="max-w-7xl mx-auto flex flex-col gap-2">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                Artists
              </h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">
                Browse top creatives across South Africa — book the right vibe
                for your project.
              </p>
            </div>

            {/* Desktop quick action */}
            <button
              type="button"
              className="hidden lg:inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors shadow-sm"
              onClick={() => {
                // Placeholder CTA — hook to your flow later
                alert("Coming soon: Promote your profile 🚀");
              }}
            >
              <Star className="w-4 h-4" />
              Promote
            </button>
          </div>
        </div>
      </header>

      {/* Search + chips (scrolls away normally) */}
      <div className={`${styles.searchBar} px-4 sm:px-6 py-5`}>
        <div className="max-w-7xl mx-auto">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search artists by name, style, or expertise..."
              className="w-full pl-12 pr-4 py-3 rounded-2xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base bg-white"
            />
          </div>

          <div className="flex gap-2 mt-3 flex-wrap items-center">
            {/* Mobile filters button */}
            <button
              onClick={() => setMobileFiltersOpen(true)}
              className="lg:hidden px-3 sm:px-4 py-2 rounded-full border border-gray-300 bg-white hover:bg-gray-50 text-xs sm:text-sm flex items-center gap-2"
              type="button"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
              {selectedFiltersCount > 0 && (
                <span className="ml-1 inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-full bg-blue-600 text-white text-[11px] font-bold">
                  {selectedFiltersCount}
                </span>
              )}
            </button>

            {/* Desktop: quick chips (cosmetic for now) */}
            <button
              className="hidden sm:flex px-3 sm:px-4 py-2 rounded-full border border-gray-300 bg-white hover:bg-gray-50 text-xs sm:text-sm items-center gap-2"
              type="button"
            >
              <MapPin className="w-4 h-4" />
              Location
            </button>

            <button
              className="hidden sm:flex px-3 sm:px-4 py-2 rounded-full border border-gray-300 bg-white hover:bg-gray-50 text-xs sm:text-sm items-center gap-2"
              type="button"
            >
              <DollarSign className="w-4 h-4" />
              Price Range (R)
            </button>

            {selectedFiltersCount > 0 && (
              <button
                onClick={clearFilters}
                className="px-3 sm:px-4 py-2 rounded-full bg-gray-900 text-white hover:bg-black text-xs sm:text-sm font-semibold"
                type="button"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Ads */}
      <div className="px-4 sm:px-6 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {adCards.map((ad) => (
              <div
                key={ad.id}
                className={`${ad.color} ${styles.adCard} ${styles.cardHover} rounded-2xl p-4 text-white cursor-pointer`}
              >
                <h3 className="text-base sm:text-lg font-extrabold mb-1">
                  {ad.title}
                </h3>
                <p className="text-white/90 text-sm">{ad.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-10">
        <div className="flex gap-6 items-start">
          {/* Desktop sidebar (collapsible) */}
          <aside
            className={[
              "hidden lg:block flex-shrink-0 transition-all duration-300",
              desktopFiltersCollapsed ? "w-16" : "w-80",
            ].join(" ")}
          >
            {desktopFiltersCollapsed ? (
              <CollapsedFiltersRail
                selectedFiltersCount={selectedFiltersCount}
                onClear={clearFilters}
                onExpand={() => setDesktopFiltersCollapsed(false)}
              />
            ) : (
              <FiltersPanel
                filters={filters}
                filterOptions={filterOptions}
                selectedFiltersCount={selectedFiltersCount}
                onToggleFilter={toggleFilter}
                onClearFilters={clearFilters}
                onCollapse={() => setDesktopFiltersCollapsed(true)}
              />
            )}
          </aside>

          {/* Right content */}
          <main className="flex-1 min-w-0">
            {/* Top row */}
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="text-sm text-gray-700">
                Showing{" "}
                <span className="font-semibold text-gray-900">
                  {visibleArtists.length}
                </span>{" "}
                artists
              </div>

              <div className="hidden lg:flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDesktopFiltersCollapsed((v) => !v)}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-sm font-semibold text-gray-800"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  {desktopFiltersCollapsed ? "Show filters" : "Hide filters"}
                </button>

                <button
                  type="button"
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-sm font-semibold text-gray-800"
                  onClick={() => alert("Coming soon: sort + ranking 🎚️")}
                >
                  <DollarSign className="w-4 h-4" />
                  Sort
                </button>
              </div>
            </div>

            {/* Tabs rail */}
            <div className={`${styles.card} p-2 mb-5 overflow-x-auto`}>
              <div className="flex gap-2">
                {(["Popular", "Verified", "Favourite", "Recent"] as const).map(
                  (cat) => {
                    const active = selectedCategory === cat.toLowerCase();
                    return (
                      <button
                        key={cat}
                        onClick={() =>
                          setSelectedCategory(cat.toLowerCase() as Category)
                        }
                        className={`px-3 sm:px-4 py-2 rounded-xl font-semibold transition-colors whitespace-nowrap text-sm sm:text-base ${
                          active
                            ? `bg-blue-600 text-white ${styles.tabActive}`
                            : "bg-white text-gray-700 hover:bg-gray-100"
                        }`}
                        type="button"
                      >
                        {cat}
                      </button>
                    );
                  },
                )}

                <button
                  onClick={() => setSelectedCategory("all")}
                  className={`px-3 sm:px-4 py-2 rounded-xl font-semibold transition-colors whitespace-nowrap text-sm sm:text-base ${
                    selectedCategory === "all"
                      ? `bg-blue-600 text-white ${styles.tabActive}`
                      : "bg-white text-gray-700 hover:bg-gray-100"
                  }`}
                  type="button"
                >
                  All
                </button>
              </div>
            </div>

            {/* Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {visibleArtists.map((artist) => {
                const isFav = favourites.has(artist.id);

                return (
                  <div
                    key={artist.id}
                    className={`${styles.card} ${styles.cardHover} overflow-hidden cursor-pointer`}
                    onClick={() => alert(`Open profile: ${artist.name}`)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") alert(`Open profile: ${artist.name}`);
                    }}
                  >
                    {/* Top block */}
                    <div
                      className={`${styles.heroBlock} h-44 bg-gradient-to-br from-slate-200 to-slate-300`}
                    >
                      {/* Rating */}
                      <div
                        className={`${styles.pill} absolute top-3 left-3 inline-flex items-center gap-1 bg-white/90 backdrop-blur px-2.5 py-1 rounded-full`}
                      >
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span className="text-sm font-bold text-gray-900">
                          {artist.rating.toFixed(1)}
                        </span>
                      </div>

                      {/* Verified + fav */}
                      <div className="absolute top-3 right-3 flex items-center gap-2">
                        {artist.verified && (
                          <div
                            title="Verified"
                            className="bg-blue-600 text-white p-2 rounded-full shadow-sm"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </div>
                        )}

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavourite(artist.id);
                          }}
                          className="bg-white/90 hover:bg-white p-2 rounded-full shadow-sm"
                          aria-label="Toggle favourite"
                          type="button"
                        >
                          <Heart
                            className={`w-4 h-4 ${
                              isFav
                                ? "text-red-500 fill-red-500"
                                : "text-gray-700"
                            }`}
                          />
                        </button>
                      </div>

                      {/* Avatar */}
                      <div className="absolute -bottom-5 left-5">
                        <div
                          className={`${styles.avatar} w-12 h-12 rounded-full bg-white flex items-center justify-center font-extrabold text-gray-700`}
                        >
                          {artist.name
                            .split(" ")
                            .slice(0, 2)
                            .map((w) => w[0])
                            .join("")}
                        </div>
                      </div>
                    </div>

                    {/* Body */}
                    <div className="pt-7 px-5 pb-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-extrabold text-gray-900 leading-tight">
                            {artist.name}
                          </h3>
                          <div className="text-sm text-gray-600 mt-1">
                            {artist.service}
                          </div>

                          <div className="flex items-center gap-2 text-sm text-gray-700 mt-2">
                            <MapPin className="w-4 h-4 text-gray-500" />
                            {artist.location}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-sm font-extrabold text-gray-900">
                            {artist.price}
                          </div>
                          <div className="text-xs text-gray-600">per session</div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-4 gap-3">
                        <div>
                          <span
                            className={[
                              "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold",
                              artist.availability === "Available Now"
                                ? "bg-emerald-50 text-emerald-700"
                                : artist.availability === "Booking Soon"
                                ? "bg-amber-50 text-amber-700"
                                : "bg-gray-100 text-gray-700",
                            ].join(" ")}
                          >
                            {artist.availability}
                          </span>
                        </div>

                        <button
                          className={`px-4 py-2 rounded-xl bg-gray-900 text-white hover:bg-black font-bold text-sm ${styles.primaryBtn}`}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            alert(`View profile: ${artist.name}`);
                          }}
                        >
                          View Profile
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </main>
        </div>
      </div>

      {/* Mobile filters drawer */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileFiltersOpen(false)}
          />
          <div className="absolute right-0 top-0 h-full w-full max-w-sm p-4">
            <div className={`${styles.card} h-full flex flex-col overflow-hidden`}>
              {/* Drawer header */}
              <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-5 h-5 text-gray-700" />
                  <div className="font-extrabold text-gray-900">Filters</div>
                  {selectedFiltersCount > 0 && (
                    <span className="ml-1 inline-flex items-center justify-center min-w-6 h-6 px-2 rounded-full bg-blue-600 text-white text-xs font-bold">
                      {selectedFiltersCount}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setMobileFiltersOpen(false)}
                  type="button"
                  className="w-10 h-10 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-center"
                  aria-label="Close filters"
                >
                  <X className="w-5 h-5 text-gray-700" />
                </button>
              </div>

              <div className="p-4 overflow-auto">
                <FiltersPanel
                  compact
                  filters={filters}
                  filterOptions={filterOptions}
                  selectedFiltersCount={selectedFiltersCount}
                  onToggleFilter={toggleFilter}
                  onClearFilters={clearFilters}
                  onApply={() => setMobileFiltersOpen(false)}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
