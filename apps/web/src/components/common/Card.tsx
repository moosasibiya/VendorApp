"use client";

import * as React from "react";
import { cn } from "@/utils/cn";

type CardProps = React.HTMLAttributes<HTMLDivElement>;

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-card border border-gray-200 bg-white shadow-md",
        className,
      )}
      {...props}
    />
  ),
);

Card.displayName = "Card";

type CardSectionProps = React.HTMLAttributes<HTMLDivElement>;

export const CardHeader = React.forwardRef<HTMLDivElement, CardSectionProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("border-b border-gray-200 px-6 py-4", className)}
      {...props}
    />
  ),
);

CardHeader.displayName = "CardHeader";

export const CardBody = React.forwardRef<HTMLDivElement, CardSectionProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("px-6 py-5", className)} {...props} />
  ),
);

CardBody.displayName = "CardBody";

export const CardFooter = React.forwardRef<HTMLDivElement, CardSectionProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("border-t border-gray-200 px-6 py-4", className)}
      {...props}
    />
  ),
);

CardFooter.displayName = "CardFooter";
