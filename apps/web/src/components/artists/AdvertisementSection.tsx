"use client";

import * as React from "react";
import { Button } from "@/components/common";

const featuredAds = [
  {
    title: "Lebo Mokoena",
    description: "Cinematic wedding films across Gauteng & Western Cape.",
    image: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Studio Kuhle",
    description: "Fashion & editorial photography with a bold, modern edge.",
    image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80",
  },
];

export const AdvertisementSection = () => {
  return (
    <section className="rounded-card border border-[var(--border)] bg-[var(--panel)] p-6 shadow-md text-white">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Featured artists</h3>
        <span className="text-xs font-semibold uppercase text-white/50">
          Sponsored
        </span>
      </div>

      <div className="mt-5 space-y-5">
        {featuredAds.map((ad) => (
          <div
            key={ad.title}
            className="relative overflow-hidden rounded-card border border-white/10 bg-[var(--panel2)] shadow-sm"
          >
            <div
              className="h-40 w-full bg-cover bg-center"
              style={{ backgroundImage: `url(${ad.image})` }}
            />
            <div className="space-y-2 p-4">
              <p className="text-sm font-semibold text-white">{ad.title}</p>
              <p className="text-sm text-white/70">{ad.description}</p>
              <Button size="sm">View profile</Button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
