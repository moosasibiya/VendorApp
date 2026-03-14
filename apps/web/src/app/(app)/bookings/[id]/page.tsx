"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { Booking, User } from "@vendorapp/shared";
import { PaymentForm } from "@/components/PaymentForm";
import {
  ApiError,
  createConversation,
  fetchBooking,
  fetchMe,
  updateBookingStatus,
} from "@/lib/api";
import styles from "./page.module.css";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString("en-ZA", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function humanize(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function BookingDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = typeof params.id === "string" ? params.id : "";

  const [booking, setBooking] = useState<Booking | null>(null);
  const [viewer, setViewer] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!bookingId) {
      return;
    }

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [data, me] = await Promise.all([fetchBooking(bookingId), fetchMe()]);
        if (!cancelled) {
          setBooking(data);
          setViewer(me);
        }
      } catch (err) {
        if (cancelled) {
          return;
        }
        if (err instanceof ApiError) {
          setError(err.message);
          return;
        }
        setError("Unable to load this booking right now.");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [bookingId]);

  const runAction = async (action: "confirm" | "cancel" | "complete" | "dispute") => {
    if (!booking) {
      return;
    }
    setActing(true);
    setError(null);
    try {
      const updated = await updateBookingStatus({ bookingId: booking.id, action });
      setBooking(updated);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Unable to update the booking right now.");
      }
    } finally {
      setActing(false);
    }
  };

  const openConversation = async () => {
    if (!booking) {
      return;
    }

    setError(null);
    try {
      const conversation = await createConversation({ bookingId: booking.id });
      router.push(`/messages?conversationId=${encodeURIComponent(conversation.id)}`);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Unable to open the conversation right now.");
      }
    }
  };

  const paymentState = searchParams.get("payment");
  const canPay =
    !!booking &&
    !!viewer &&
    viewer.id === booking.client.id &&
    booking.status === "CONFIRMED" &&
    (booking.paymentStatus === "UNPAID" || booking.paymentStatus === "FAILED");

  return (
    <main className={styles.page}>
      <div className={styles.topRow}>
        <div>
          <Link href="/bookings" className={styles.backLink}>
            Back to bookings
          </Link>
          <h1>Booking detail</h1>
        </div>
        <div className={styles.topActions}>
          <button type="button" className={styles.ghostBtn} onClick={() => void openConversation()}>
            Open messages
          </button>
        </div>
      </div>

      {loading ? <p className={styles.subtle}>Loading booking...</p> : null}
      {error ? <div className={styles.error}>{error}</div> : null}
      {paymentState === "returned" ? (
        <div className={styles.infoBanner}>
          Returned from Payfast. Payment confirmation is finalized when the ITN webhook reaches
          the API, so refresh if the paid status does not appear immediately.
        </div>
      ) : null}
      {paymentState === "cancelled" ? (
        <div className={styles.infoBanner}>
          Payfast checkout was cancelled before payment completed.
        </div>
      ) : null}

      {booking ? (
        <section className={styles.layout}>
          <div className={styles.mainCard}>
            <div className={styles.statusRow}>
              <div>
                <p className={styles.kicker}>Booking</p>
                <h2>{booking.title}</h2>
              </div>
              <span
                className={`${styles.status} ${
                  styles[`status${booking.status}` as keyof typeof styles] ?? ""
                }`}
              >
                {humanize(booking.status)}
              </span>
            </div>

            <div className={styles.grid}>
              <div>
                <p className={styles.label}>Client</p>
                <strong>{booking.client.name}</strong>
              </div>
              <div>
                <p className={styles.label}>Artist</p>
                <strong>{booking.artist.name}</strong>
              </div>
              {booking.agency ? (
                <div>
                  <p className={styles.label}>Agency</p>
                  <strong>{booking.agency.name}</strong>
                </div>
              ) : null}
              <div>
                <p className={styles.label}>Event date</p>
                <strong>{formatDate(booking.eventDate)}</strong>
              </div>
              {booking.eventEndDate ? (
                <div>
                  <p className={styles.label}>Event end</p>
                  <strong>{formatDate(booking.eventEndDate)}</strong>
                </div>
              ) : null}
              <div>
                <p className={styles.label}>Location</p>
                <strong>{booking.location}</strong>
              </div>
              <div>
                <p className={styles.label}>Payment status</p>
                <strong>{humanize(booking.paymentStatus)}</strong>
              </div>
            </div>

            <div className={styles.section}>
              <p className={styles.label}>Description</p>
              <p>{booking.description}</p>
            </div>

            {canPay ? (
              <div className={styles.section}>
                <p className={styles.label}>Payment</p>
                <p className={styles.subtle}>
                  This booking is confirmed and ready for Payfast checkout.
                </p>
                <PaymentForm
                  bookingId={booking.id}
                  className={styles.primaryBtn}
                  onError={(message) => setError(message)}
                />
              </div>
            ) : null}

            {booking.notes ? (
              <div className={styles.section}>
                <p className={styles.label}>Notes</p>
                <p>{booking.notes}</p>
              </div>
            ) : null}

            {booking.cancelReason ? (
              <div className={styles.section}>
                <p className={styles.label}>Cancellation reason</p>
                <p>{booking.cancelReason}</p>
              </div>
            ) : null}

            <div className={styles.actions}>
              {booking.availableActions?.includes("confirm") ? (
                <button
                  type="button"
                  className={styles.primaryBtn}
                  onClick={() => void runAction("confirm")}
                  disabled={acting}
                >
                  Confirm
                </button>
              ) : null}

              {booking.availableActions?.includes("cancel") ? (
                <button
                  type="button"
                  className={styles.ghostBtn}
                  onClick={() => void runAction("cancel")}
                  disabled={acting}
                >
                  Cancel
                </button>
              ) : null}

              {booking.availableActions?.includes("complete") ? (
                <button
                  type="button"
                  className={styles.primaryBtn}
                  onClick={() => void runAction("complete")}
                  disabled={acting}
                >
                  Complete
                </button>
              ) : null}

              {booking.availableActions?.includes("dispute") ? (
                <button
                  type="button"
                  className={styles.ghostBtn}
                  onClick={() => void runAction("dispute")}
                  disabled={acting}
                >
                  Dispute
                </button>
              ) : null}
            </div>
          </div>

          <aside className={styles.sidebar}>
            <div className={styles.sidebarCard}>
              <p className={styles.kicker}>Payment breakdown</p>
              <div className={styles.totalRow}>
                <span>Total amount</span>
                <strong>{formatCurrency(booking.totalAmount)}</strong>
              </div>
              <div className={styles.totalRow}>
                <span>Platform fee</span>
                <strong>{formatCurrency(booking.platformFee)}</strong>
              </div>
              <div className={styles.totalRow}>
                <span>Artist payout</span>
                <strong>{formatCurrency(booking.artistPayout)}</strong>
              </div>
              {booking.paymentProvider ? (
                <div className={styles.totalRow}>
                  <span>Provider</span>
                  <strong>{humanize(booking.paymentProvider)}</strong>
                </div>
              ) : null}
              {booking.paymentReference ? (
                <div className={styles.totalRow}>
                  <span>Reference</span>
                  <strong>{booking.paymentReference}</strong>
                </div>
              ) : null}
            </div>

            <div className={styles.sidebarCard}>
              <p className={styles.kicker}>Status timeline</p>
              <div className={styles.timeline}>
                {booking.timeline?.map((event) => (
                  <div key={event.id} className={styles.timelineItem}>
                    <div className={styles.timelineDot} />
                    <div>
                      <strong>{humanize(event.toStatus)}</strong>
                      <p className={styles.subtle}>{formatDate(event.createdAt)}</p>
                      {event.actorName ? (
                        <p className={styles.subtle}>
                          {event.actorName} {event.action.replace("_", " ")}
                        </p>
                      ) : (
                        <p className={styles.subtle}>{event.action.replace("_", " ")}</p>
                      )}
                      {event.reason ? <p className={styles.subtle}>{event.reason}</p> : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </section>
      ) : null}
    </main>
  );
}
