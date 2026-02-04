"use client";

import * as React from "react";
import { Button, TextInput } from "@/components/common";
import { cn } from "@/utils/cn";

type TopSearchPillProps = {
  resultsCount: number;
  className?: string;
};

export const TopSearchPill = ({ resultsCount, className }: TopSearchPillProps) => {
  return (
    <div
      className={cn(
        "sticky top-20 z-20 w-full rounded-btn border border-[var(--border)] bg-[var(--panel)] px-4 py-3 shadow-md",
        "flex flex-col gap-3 md:flex-row md:items-center md:justify-between",
        className,
      )}
    >
      <div className="flex flex-1 items-center gap-3 text-white">
        <span className="text-xl text-white/70">🔎</span>
        <TextInput
          aria-label="Search artists"
          placeholder="Search artists, services, or styles..."
          className="h-10 border-none bg-transparent px-0 text-white placeholder:text-white/60 shadow-none focus:ring-0"
        />
      </div>
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-white/70">
          {resultsCount} results
        </span>
        <Button
          variant="outline"
          size="sm"
          className="whitespace-nowrap border-white/30 text-white hover:border-white/60 hover:text-white"
        >
          Filters
        </Button>
      </div>
    </div>
  );
};
