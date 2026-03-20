"use client";

import * as React from "react";
import { cn } from "@/utils/cn";

type CheckboxProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
};

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, className, id, ...props }, ref) => {
    const checkboxId = id ?? React.useId();

    return (
      <label className="flex items-center gap-2 text-sm font-medium text-current">
        <input
          ref={ref}
          id={checkboxId}
          type="checkbox"
          className={cn(
            "h-4 w-4 rounded border border-[var(--border)] text-[var(--brand-solid)] transition duration-fast ease-smooth focus:ring-2 focus:ring-[var(--brand-focus-ring)]",
            className,
          )}
          {...props}
        />
        {label ? <span>{label}</span> : null}
      </label>
    );
  },
);

Checkbox.displayName = "Checkbox";
