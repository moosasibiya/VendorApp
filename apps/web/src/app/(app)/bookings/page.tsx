"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Booking, User } from "@vendorapp/shared";
import {
  ApiError,
  fetchBookings,
  fetchMe,
  updateBookingStatus,
} from "@/lib/api";
import styles from "./page.module.css";

const tabs: Array<{ label: string; value?: Booking["status"] }> = [
  { label: "All" },
  { label: "Pending", value: "PENDING" },
  { label: "Confirmed", value: "CONFIRMED" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Cancelled", value: "CANCELLED" },
];

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

function humanizeStatus(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getCounterpart(booking: Booking, viewer: User | null): { name: string; label: string } {
  if (!viewer) {
    return { name: booking.artist.name, label: "Artist" };
  }

  switch (viewer.role) {
    case "CLIENT":
      return { name: booking.artist.name, label: "Artist" };
    case "ARTIST":
      return { name: booking.client.name, label: "Client" };
    case "AGENCY":
      return { name: booking.client.name, label: "Client" };
    case "ADMIN":
    default:
      return {
        name: `${booking.client.name} -> ${booking.artist.name}`,
        label: "Parties",
      };
  }
}

export default function BookingsPage() {
  const [viewer, setViewer] = useState<User | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activeStatus, setActiveStatus] = useState<Booking["status"] | undefined>();
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [me, bookingResponse] = await Promise.all([
          fetchMe(),
          fetchBookings({
            ...(activeStatus ? { status: activeStatus } : {}),
            limit: 50,
          }),
        ]);
        if (cancelled) {
          return;
        }
        setViewer(me);
        setBookings(bookingResponse.data);
      } catch (err) {
        if (cancelled) {
          return;
        }
        if (err instanceof ApiError) {
          setError(err.message);
          return;
        }
        setError("Unable to load bookings right now.");
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
  }, [activeStatus]);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.kicker}>Live booking lifecycle</p>
          <h1>My bookings</h1>
          <p className={styles.subtle}>
            Bookings are scoped to your account and update as artists confirm,
            events progress, and work is completed.
          </p>
        </div>
        <Link className={styles.primaryBtn} href="/bookings/new">
          New booking
        </Link>
      </header>

      <div className={styles.tabs}>
        {tabs.map((tab) => {
          const isActive = activeStatus === tab.value || (!activeStatus && !tab.value);
          return (
            <button
              key={tab.label}
              className={isActive ? styles.tabActive : styles.tabBtn}
              type="button"
              onClick={() => setActiveStatus(tab.value)}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {loading ? <p className={styles.subtle}>Loading bookings...</p> : null}
      {error ? <div className={styles.error}>{error}</div> : null}

      {!loading && !error && bookings.length === 0 ? (
        <section className={styles.emptyState}>
          <h2>No bookings yet</h2>
          <p className={styles.subtle}>
            Your booking requests and confirmed events will appear here.
          </p>
          <Link className={styles.primaryBtn} href="/bookings/new">
            Create a booking
          </Link>
        </section>
      ) : null}

      <div className={styles.list}>
        {bookings.map((booking) => {
          const counterpart = getCounterpart(booking, viewer);
          const initials = counterpart.name
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part.charAt(0).toUpperCase())
            .join("");

          return (
            <article key={booking.id} className={styles.card}>
              <div className={styles.avatar}>{initials || "BK"}</div>
              <div className={styles.cardBody}>
                <div className={styles.cardHeader}>
                  <div>
                    <p className={styles.overline}>{counterpart.label}</p>
                    <h2>{counterpart.name}</h2>
                  </div>
                  <span
                    className={`${styles.status} ${
                      styles[`status${booking.status}` as keyof typeof styles] ?? ""
                    }`}
                  >
                    {humanizeStatus(booking.status)}
                  </span>
                </div>

                <p className={styles.title}>{booking.title}</p>
                <div className={styles.metaGrid}>
                  <span>{formatDate(booking.eventDate)}</span>
                  <span>{booking.location}</span>
                  <span>{formatCurrency(booking.totalAmount)}</span>
                  <span>Payment: {humanizeStatus(booking.paymentStatus)}</span>
                </div>
              </div>

              <div className={styles.cardActions}>
                {booking.availableActions?.includes("confirm") ? (
                  <button
                    type="button"
                    onClick={async () => {
                      setActingId(booking.id);
                      setError(null);
                      try {
                        await updateBookingStatus({ bookingId: booking.id, action: "confirm" });
                        const refreshed = await fetchBookings({
                          ...(activeStatus ? { status: activeStatus } : {}),
                          limit: 50,
                        });
                        setBookings(refreshed.data);
                      } catch (err) {
                        if (err instanceof ApiError) {
                          setError(err.message);
                        } else {
                          setError("Unable to confirm the booking right now.");
                        }
                      } finally {
                        setActingId(null);
                      }
                    }}
                    disabled={actingId === booking.id}
                    className={styles.actionPrimary}
                  >
                    Confirm
                  </button>
                ) : null}

                {booking.availableActions?.includes("cancel") ? (
                  <button
                    type="button"
                    onClick={async () => {
                      setActingId(booking.id);
                      setError(null);
                      try {
                        await updateBookingStatus({ bookingId: booking.id, action: "cancel" });
                        const refreshed = await fetchBookings({
                          ...(activeStatus ? { status: activeStatus } : {}),
                          limit: 50,
                        });
                        setBookings(refreshed.data);
                      } catch (err) {
                        if (err instanceof ApiError) {
                          setError(err.message);
                        } else {
                          setError("Unable to cancel the booking right now.");
                        }
                      } finally {
                        setActingId(null);
                      }
                    }}
                    disabled={actingId === booking.id}
                    className={styles.actionGhost}
                  >
                    Cancel
                  </button>
                ) : null}

                {booking.availableActions?.includes("complete") ? (
                  <button
                    type="button"
                    onClick={async () => {
                      setActingId(booking.id);
                      setError(null);
                      try {
                        await updateBookingStatus({ bookingId: booking.id, action: "complete" });
                        const refreshed = await fetchBookings({
                          ...(activeStatus ? { status: activeStatus } : {}),
                          limit: 50,
                        });
                        setBookings(refreshed.data);
                      } catch (err) {
                        if (err instanceof ApiError) {
                          setError(err.message);
                        } else {
                          setError("Unable to complete the booking right now.");
                        }
                      } finally {
                        setActingId(null);
                      }
                    }}
                    disabled={actingId === booking.id}
                    className={styles.actionPrimary}
                  >
                    Complete
                  </button>
                ) : null}

                <Link href={`/bookings/${booking.id}`} className={styles.actionGhost}>
                  View
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </main>
  );
}
