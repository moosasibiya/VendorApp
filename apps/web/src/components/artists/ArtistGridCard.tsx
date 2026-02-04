"use client";

import * as React from "react";
import { Badge, Button } from "@/components/common";

type Artist = {
  name: string;
  role: string;
  rating: number;
  reviews: number;
  location: string;
  price: string;
  image: string;
};

export const ArtistGridCard = ({ artist }: { artist: Artist }) => {
  return (
    <article className="group relative overflow-hidden rounded-card border border-[var(--border)] bg-[var(--panel)] shadow-sm transition duration-normal ease-smooth hover:-translate-y-1 hover:shadow-lg">
      <div className="relative h-48 w-full overflow-hidden">
        <img
          src={artist.image}
          alt={artist.name}
          className="h-full w-full object-cover transition duration-normal ease-smooth group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black/20 opacity-0 transition duration-normal ease-smooth group-hover:opacity-100" />
        <Badge className="absolute left-3 top-3 bg-white/10 text-white">
          {artist.role}
        </Badge>
      </div>
      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-white">
              {artist.name}
            </h3>
            <p className="text-sm text-white/70">{artist.location}</p>
          </div>
          <div className="rounded-pill bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">
            ⭐ {artist.rating} ({artist.reviews})
          </div>
        </div>
        <div className="flex items-center justify-between text-sm text-white/70">
          <span>{artist.price}</span>
          <span>Next availability: 2 days</span>
        </div>
        <Button
          size="sm"
          className="w-full opacity-0 transition duration-fast ease-smooth group-hover:opacity-100"
        >
          View Profile
        </Button>
      </div>
    </article>
  );
};
