"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/utils/cn";
import { Button } from "./Button";

type ModalSize = "sm" | "md" | "lg";

export type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: ModalSize;
  children: React.ReactNode;
};

const sizeClasses: Record<ModalSize, string> = {
  sm: "max-w-sm",
  md: "max-w-2xl",
  lg: "max-w-4xl",
};

export const Modal = ({
  isOpen,
  onClose,
  title,
  size = "md",
  children,
}: ModalProps) => {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!mounted) return;
    if (!isOpen) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    document.body.classList.add("overflow-hidden");
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.classList.remove("overflow-hidden");
    };
  }, [isOpen, onClose, mounted]);

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-40 flex items-center justify-center px-4 py-6">
      <div
        className="absolute inset-0 bg-black/50"
        role="presentation"
        onClick={onClose}
      />
      <div
        className={cn(
          "relative z-10 w-full rounded-modal bg-white shadow-2xl",
          "animate-scale-in",
          sizeClasses[size],
        )}
        role="dialog"
        aria-modal="true"
        aria-label={title ?? "Dialog"}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          {title ? (
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          ) : (
            <span />
          )}
          <Button
            variant="outline"
            size="sm"
            className="h-9 w-9 rounded-full px-0"
            aria-label="Close dialog"
            onClick={onClose}
          >
            ✕
          </Button>
        </div>
        <div className="px-6 py-6">{children}</div>
      </div>
    </div>,
    document.body,
  );
};
