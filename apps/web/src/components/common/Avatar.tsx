"use client";

import * as React from "react";
import { cn } from "@/utils/cn";

type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";
type AvatarStatus = "online" | "offline" | "busy";

export type AvatarProps = {
  src?: string;
  alt?: string;
  name?: string;
  size?: AvatarSize;
  status?: AvatarStatus;
  className?: string;
};

const sizeClasses: Record<AvatarSize, string> = {
  xs: "h-8 w-8 text-xs",
  sm: "h-10 w-10 text-sm",
  md: "h-12 w-12 text-base",
  lg: "h-16 w-16 text-lg",
  xl: "h-20 w-20 text-xl",
};

const statusClasses: Record<AvatarStatus, string> = {
  online: "bg-emerald-500",
  offline: "bg-gray-400",
  busy: "bg-orange-500",
};

const getInitials = (name?: string) => {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  const initials = parts.slice(0, 2).map((part) => part[0]?.toUpperCase());
  return initials.join("") || "?";
};

export const Avatar = ({
  src,
  alt,
  name,
  size = "md",
  status,
  className,
}: AvatarProps) => (
  <div className={cn("relative inline-flex items-center justify-center", className)}>
    {src ? (
      <img
        src={src}
        alt={alt ?? name ?? "Avatar"}
        className={cn(
          "rounded-full object-cover ring-2 ring-white",
          sizeClasses[size],
        )}
      />
    ) : (
      <div
        className={cn(
          "flex items-center justify-center rounded-full bg-gray-100 font-semibold text-gray-600 ring-2 ring-white",
          sizeClasses[size],
        )}
      >
        {getInitials(name)}
      </div>
    )}
    {status ? (
      <span
        className={cn(
          "absolute bottom-0 right-0 h-3 w-3 rounded-full ring-2 ring-white",
          statusClasses[status],
        )}
      />
    ) : null}
  </div>
);
