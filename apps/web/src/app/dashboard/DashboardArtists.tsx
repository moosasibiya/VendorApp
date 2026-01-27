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
} from "lucide-react";

import styles from "./DashboardArtists.module.css";

type Service = "Photography" | "Videography" | "Web Design";
type Availability = "Available Now" | "Booking Soon" | "Waitlist";
type PriceBand = "R" | "RR" | "RRR" | "RRRR";
type Category = "popular" | "verified" | "favourite" | "recent" | "all";
type FilterKey = "service" | "location" | "priceRange" | "availability";

type Artist = {
  id: number;
  name: string;
  service: Service;
  location: string;
  price: PriceBand;
  rating: number;
  verified: boolean;
  category: Exclude<Category, "all">;
  availability: Availability;
};

const BASE_ARTISTS: Artist[] = [
  {
    id: 1,
    name: "Sihle Mokoena",
    service: "Photography",
    location: "Johannesburg",
    price: "RRR",
    rating: 4.9,
    verified: true,
    category: "popular",
    availability: "Available Now",
  },
  {
    id: 2,
    name: "Ayesha Khan",
    service: "Videography",
    location: "Cape Town",
    price: "RRRR",
    rating: 5.0,
    verified: true,
    category: "verified",
    availability: "Booking Soon",
  },
  {
    id: 3,
    name: "Thando Ndlovu",
    service: "Web Design",
    location: "Durban",
    price: "RR",
    rating: 4.7,
    verified: false,
    category: "popular",
    availability: "Available Now",
  },
  {
    id: 4,
    name: "Keegan Jacobs",
    service: "Photography",
    location: "Pretoria",
    price: "RRR",
    rating: 4.8,
    verified: true,
    category: "verified",
    availability: "Waitlist",
  },
  {
    id: 5,
    name: "Naledi Molefe",
    service: "Videography",
    location: "Johannesburg",
    price: "RR",
    rating: 4.6,
    verified: false,
    category: "favourite",
    availability: "Booking Soon",
  },
  {
    id: 6,
    name: "Jason Pillay",
    service: "Web Design",
    location: "Cape Town",
    price: "RRR",
    rating: 4.9,
    verified: true,
    category: "recent",
    availability: "Available Now",
  },
  {
    id: 7,
    name: "Zinhle Mbatha",
    service: "Videography",
    location: "Durban",
    price: "RRR",
    rating: 4.8,
    verified: true,
    category: "popular",
    availability: "Available Now",
  },
  {
    id: 8,
    name: "Tamia Botha",
    service: "Web Design",
    location: "Gqeberha",
    price: "RRRR",
    rating: 4.9,
    verified: true,
    category: "verified",
    availability: "Booking Soon",
  },
];

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  const a = parts[0]?.[0] ?? "";
  const b = parts[1]?.[0] ?? "";
  return (a + b).toUpperCase();
}

function availabilityPill(a: Availability) {
  if (a === "Available Now")
    return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";
  if (a === "Booking Soon")
    return "bg-amber-50 text-amber-700 ring-1 ring-amber-200";
  return "bg-slate-50 text-slate-700 ring-1 ring-slate-200";
}

type FiltersState = Record<FilterKey, Set<string>>;
type FilterOptions = Record<FilterKey, string[]>;

type FiltersPanelProps = {
  compact?: boolean;
  filters: FiltersState;
  filterOptions: FilterOptions;
  selectedFiltersCount: number;
  onToggleFilter: (key: FilterKey, value: string) => void;
  onClearFilters: () => void;
  onApply?: () => void;
};

/**
 * FiltersPanel (pure)
 * - outside render => no "static-components" ESLint warning
 */
function FiltersPanel({
  compact,
  filters,
  filterOptions,
  selectedFiltersCount,
  onToggleFilter,
  onClearFilters,
  onApply,
}: FiltersPanelProps) {
  return (
    <div className={`${styles.card} p-5`}>
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-5 h-5 text-gray-700" />
          <h2 className="font-bold text-lg text-gray-900">Filters</h2>
        </div>

        <button
          onClick={onClearFilters}
          className="text-sm font-semibold text-gray-600 hover:text-gray-900"
          type="button"
        >
          Clear all
        </button>
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

      <button
        className={`w-full mt-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold ${styles.primaryBtn}`}
        type="button"
        onClick={onApply}
      >
        Apply Filters
      </button>
    </div>
  );
}

export default function DashboardArtists() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category>("all");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
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
      {/* Header */}
      <header className={`${styles.header} px-4 sm:px-6 py-5`}>
        <div className="max-w-7xl mx-auto">
          <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900">
            Artists
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Browse top creatives across South Africa — book the right vibe for
            your project.
          </p>
        </div>
      </header>

      {/* Search */}
      <div
        className={`${styles.searchBar} sticky top-0 z-40 px-4 sm:px-6 py-4 shadow-sm`}
      >
        <div className="max-w-7xl mx-auto">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search artists by name, style, or expertise..."
              className="w-full pl-12 pr-4 py-3 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base bg-white"
            />
          </div>

          <div className="flex gap-2 mt-3 flex-wrap items-center">
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
          </div>
        </div>
      </div>

      {/* Ads */}
      <div className="px-4 sm:px-6 py-5">
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex gap-6 items-start">
          {/* Desktop sidebar */}
          <aside className="w-72 flex-shrink-0 hidden lg:block sticky top-28">
            <FiltersPanel
              filters={filters}
              filterOptions={filterOptions}
              selectedFiltersCount={selectedFiltersCount}
              onToggleFilter={toggleFilter}
              onClearFilters={clearFilters}
              onApply={() => {}}
            />
          </aside>

          {/* Right content */}
          <main className="flex-1 min-w-0">
            {/* Tabs */}
            <div className="flex gap-2 mb-5 border-b border-gray-200 pb-2 overflow-x-auto">
              {(["Popular", "Verified", "Favourite", "Recent"] as const).map(
                (cat) => {
                  const active = selectedCategory === cat.toLowerCase();
                  return (
                    <button
                      key={cat}
                      onClick={() =>
                        setSelectedCategory(cat.toLowerCase() as Category)
                      }
                      className={`px-3 sm:px-4 py-2 rounded-t-xl font-semibold transition-colors whitespace-nowrap text-sm sm:text-base ${
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
                className={`px-3 sm:px-4 py-2 rounded-t-xl font-semibold transition-colors whitespace-nowrap text-sm sm:text-base ${
                  selectedCategory === "all"
                    ? `bg-blue-600 text-white ${styles.tabActive}`
                    : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
                type="button"
              >
                All
              </button>
            </div>

            {/* Results */}
            <div className="text-sm text-gray-700 mb-4">
              Showing{" "}
              <span className="font-semibold text-gray-900">
                {visibleArtists.length}
              </span>{" "}
              artists
            </div>

            {/* Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {visibleArtists.map((artist) => {
                const isFav = favourites.has(artist.id);

                return (
                  <div
                    key={artist.id}
                    className={`${styles.card} ${styles.cardHover} overflow-hidden cursor-pointer`}
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
                      <div className="absolute -bottom-5 left-4">
                        <div
                          className={`${styles.avatar} w-12 h-12 rounded-full bg-white/90 backdrop-blur flex items-center justify-center font-extrabold text-gray-900`}
                        >
                          {initials(artist.name)}
                        </div>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-4 pt-7">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="font-extrabold text-base sm:text-lg text-gray-900 truncate">
                            {artist.name}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {artist.service}
                          </p>
                        </div>

                        <div className="text-sm font-extrabold text-gray-900">
                          {artist.price}
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-sm text-gray-600 min-w-0">
                          <MapPin className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{artist.location}</span>
                        </div>

                        <span
                          className={`text-xs font-bold px-2.5 py-1 rounded-full ${availabilityPill(
                            artist.availability,
                          )}`}
                        >
                          {artist.availability}
                        </span>
                      </div>

                      <button
                        className={`w-full mt-4 px-4 py-2.5 rounded-xl font-semibold transition-colors bg-gray-900 text-white hover:bg-gray-800 ${styles.primaryBtn}`}
                        type="button"
                      >
                        View Profile
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {visibleArtists.length === 0 && (
              <div
                className={`${styles.card} p-8 text-center text-gray-700 mt-6`}
              >
                No artists match your filters. Try clearing filters or changing
                the search.
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            className="absolute inset-0 bg-black/30"
            onClick={() => setMobileFiltersOpen(false)}
            aria-label="Close filters"
            type="button"
          />

          <div className="absolute right-0 top-0 h-full w-[92vw] max-w-md bg-white shadow-2xl p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="font-extrabold text-lg text-gray-900">
                Filters
              </div>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50"
                type="button"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

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
      )}
    </div>
  );
}
