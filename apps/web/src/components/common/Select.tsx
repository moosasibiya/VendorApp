"use client";

import * as React from "react";
import { cn } from "@/utils/cn";

export type SelectOption = {
  label: string;
  value: string;
};

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
};

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helperText, options, className, id, ...props }, ref) => {
    const selectId = id ?? React.useId();

    return (
      <label className="flex w-full flex-col gap-1.5 text-sm font-medium text-current">
        {label ? <span>{label}</span> : null}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={cn(
              "h-11 w-full appearance-none rounded-btn border bg-white px-4 pr-10 text-base text-gray-900 shadow-sm transition duration-fast ease-smooth",
              "focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-200",
              error ? "border-red-500 focus:border-red-500 focus:ring-red-200" : "border-gray-300",
              className,
            )}
            {...props}
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            ▾
          </span>
        </div>
        {error ? (
          <span className="text-xs text-red-500">{error}</span>
        ) : helperText ? (
          <span className="text-xs text-gray-500">{helperText}</span>
        ) : null}
      </label>
    );
  },
);

Select.displayName = "Select";
