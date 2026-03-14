"use client";

import { useState } from "react";
import { ApiError, initiateBookingPayment } from "@/lib/api";
import styles from "./PaymentForm.module.css";

type PaymentFormProps = {
  bookingId: string;
  label?: string;
  className?: string;
  disabled?: boolean;
  onError?: (message: string) => void;
};

export function PaymentForm({
  bookingId,
  label = "Pay with Payfast",
  className,
  disabled = false,
  onError,
}: PaymentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className={styles.wrap}>
      <button
        type="button"
        className={className}
        disabled={disabled || isSubmitting}
        onClick={async () => {
          setIsSubmitting(true);
          setError(null);
          try {
            const session = await initiateBookingPayment(bookingId);
            const form = document.createElement("form");
            form.method = session.method;
            form.action = session.gatewayUrl;
            form.style.display = "none";

            Object.entries(session.formFields).forEach(([key, value]) => {
              const input = document.createElement("input");
              input.type = "hidden";
              input.name = key;
              input.value = value;
              form.appendChild(input);
            });

            document.body.appendChild(form);
            form.submit();
            form.remove();
          } catch (err) {
            const message =
              err instanceof ApiError ? err.message : "Unable to start Payfast checkout.";
            setError(message);
            onError?.(message);
          } finally {
            setIsSubmitting(false);
          }
        }}
      >
        {isSubmitting ? "Redirecting..." : label}
      </button>

      {error ? <p className={styles.error}>{error}</p> : null}
    </div>
  );
}
