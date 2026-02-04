"use client";

import * as React from "react";
import { Badge, Button, Checkbox, Select, TextInput } from "@/components/common";

const locationOptions = [
  { label: "Cape Town", value: "cape-town" },
  { label: "Johannesburg", value: "johannesburg" },
  { label: "Pretoria", value: "pretoria" },
  { label: "Durban", value: "durban" },
];

const serviceOptions = [
  "Photography",
  "Videography",
  "Graphic Design",
  "Content Creation",
  "Event Coverage",
];

const specialtyTags = [
  "Weddings",
  "Corporate",
  "Lifestyle",
  "Drone",
  "Product",
  "Portraits",
];

export const SidebarFilters = () => {
  return (
    <aside className="hidden h-fit w-[280px] shrink-0 rounded-card border border-[var(--border)] bg-[var(--panel)] p-6 text-white shadow-sm lg:block lg:sticky lg:top-24">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Filters</h3>
        <button className="text-xs font-semibold text-white/60 hover:text-white">
          Clear all
        </button>
      </div>

      <div className="mt-6 space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-white/60">
            Location
          </p>
          <div className="mt-3 space-y-2">
            {locationOptions.map((option) => (
              <Checkbox key={option.value} label={option.label} />
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-white/60">
            Service Type
          </p>
          <div className="mt-3 space-y-2">
            {serviceOptions.map((service) => (
              <Checkbox key={service} label={service} />
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-white/60">
            Price Range (R)
          </p>
          <div className="mt-3 space-y-3">
            <TextInput
              placeholder="Min"
              className="border-[var(--border)] bg-transparent text-white placeholder:text-white/50"
            />
            <TextInput
              placeholder="Max"
              className="border-[var(--border)] bg-transparent text-white placeholder:text-white/50"
            />
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-white/60">
            Rating
          </p>
          <Select
            options={[
              { label: "4.5+ Stars", value: "4.5" },
              { label: "4.0+ Stars", value: "4.0" },
              { label: "3.5+ Stars", value: "3.5" },
            ]}
            className="border-[var(--border)] bg-transparent text-white"
          />
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-white/60">
            Verification
          </p>
          <div className="mt-3 space-y-2">
            {["Verified", "Professional", "Elite", "Diamond"].map((label) => (
              <Checkbox key={label} label={label} />
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-white/60">
            Specialties
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {specialtyTags.map((tag) => (
              <Badge
                key={tag}
                className="cursor-pointer bg-white/10 text-white hover:bg-white/20"
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 space-y-3">
        <Button className="w-full">Apply Filters</Button>
        <Button variant="outline" className="w-full">
          Save Preferences
        </Button>
      </div>
    </aside>
  );
};
