"use client";

import * as React from "react";
import { cn } from "@/utils/cn";

type ToastType = "success" | "error" | "info" | "warning";

export type ToastProps = {
  type?: ToastType;
  message: string;
  onClose?: () => void;
};

const typeClasses: Record<ToastType, string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  error: "border-red-200 bg-red-50 text-red-700",
  info: "border-blue-200 bg-blue-50 text-blue-700",
  warning: "border-orange-200 bg-orange-50 text-orange-700",
};

export const Toast = ({ type = "info", message, onClose }: ToastProps) => (
  <div
    role="status"
    className={cn(
      "flex items-center justify-between gap-4 rounded-card border px-4 py-3 shadow-md",
      "animate-slide-up",
      typeClasses[type],
    )}
  >
    <span className="text-sm font-medium">{message}</span>
    {onClose ? (
      <button
        onClick={onClose}
        className="text-sm font-semibold text-current opacity-70 transition hover:opacity-100"
        aria-label="Dismiss notification"
      >
        ✕
      </button>
    ) : null}
  </div>
);

export const ToastStack = ({
  children,
}: {
  children: React.ReactNode;
}) => (
  <div className="fixed right-5 top-5 z-50 flex w-[320px] flex-col gap-3">
    {children}
  </div>
);
