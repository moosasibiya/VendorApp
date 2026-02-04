"use client";

import * as React from "react";
import { cn } from "@/utils/cn";

type BaseInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  helperText?: string;
};

export const TextInput = React.forwardRef<HTMLInputElement, BaseInputProps>(
  ({ label, error, helperText, className, id, ...props }, ref) => {
    const inputId = id ?? React.useId();

    return (
      <label className="flex w-full flex-col gap-1.5 text-sm font-medium text-current">
        {label ? <span>{label}</span> : null}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "h-11 w-full rounded-btn border px-4 text-base text-gray-900 shadow-sm transition duration-fast ease-smooth",
            "placeholder:text-gray-400 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-200",
            error ? "border-red-500 focus:border-red-500 focus:ring-red-200" : "border-gray-300",
            className,
          )}
          {...props}
        />
        {error ? (
          <span className="text-xs text-red-500">{error}</span>
        ) : helperText ? (
          <span className="text-xs text-gray-500">{helperText}</span>
        ) : null}
      </label>
    );
  },
);

TextInput.displayName = "TextInput";

type TextAreaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  error?: string;
  helperText?: string;
};

export const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ label, error, helperText, className, id, ...props }, ref) => {
    const textareaId = id ?? React.useId();

    return (
      <label className="flex w-full flex-col gap-1.5 text-sm font-medium text-current">
        {label ? <span>{label}</span> : null}
        <textarea
          ref={ref}
          id={textareaId}
          className={cn(
            "min-h-[120px] w-full resize-y rounded-btn border px-4 py-3 text-base text-gray-900 shadow-sm transition duration-fast ease-smooth",
            "placeholder:text-gray-400 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-200",
            error ? "border-red-500 focus:border-red-500 focus:ring-red-200" : "border-gray-300",
            className,
          )}
          {...props}
        />
        {error ? (
          <span className="text-xs text-red-500">{error}</span>
        ) : helperText ? (
          <span className="text-xs text-gray-500">{helperText}</span>
        ) : null}
      </label>
    );
  },
);

TextArea.displayName = "TextArea";
