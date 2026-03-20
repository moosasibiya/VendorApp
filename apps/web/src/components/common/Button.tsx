"use client";

import * as React from "react";
import { cn } from "@/utils/cn";

type ButtonVariant = "primary" | "secondary" | "outline" | "danger";
type ButtonSize = "sm" | "md" | "lg" | "xl";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "[background:var(--brand-gradient)] text-white [box-shadow:var(--brand-shadow)] hover:[box-shadow:var(--brand-shadow-strong)]",
  secondary:
    "border border-[var(--border)] bg-[var(--panel2)] text-[var(--text)] hover:bg-[var(--panel3)]",
  outline:
    "border border-[var(--border)] text-[var(--text)] hover:border-[var(--brand-focus-border)] hover:text-[var(--brand-solid)]",
  danger: "bg-[var(--bad)] text-white shadow-md hover:opacity-90 hover:shadow-lg",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-4 py-2 text-sm",
  md: "px-6 py-3 text-base",
  lg: "px-8 py-3.5 text-base",
  xl: "px-10 py-4 text-lg",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      isLoading,
      disabled,
      className,
      children,
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-btn font-semibold transition duration-fast ease-smooth",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-focus-border)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--panel)]",
          "active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60",
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        disabled={isDisabled}
        {...props}
      >
        {isLoading ? (
          <span className="inline-flex items-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/60 border-t-white" />
            <span>Loading...</span>
          </span>
        ) : (
          children
        )}
      </button>
    );
  },
);

Button.displayName = "Button";
