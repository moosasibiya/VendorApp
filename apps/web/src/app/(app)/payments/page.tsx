"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Booking, User } from "@vendorapp/shared";
import { PaymentForm } from "@/components/PaymentForm";
import { ApiError, fetchBookings, fetchMe } from "@/lib/api";
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

export default function PaymentsPage() {
  const [viewer, setViewer] = useState<User | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [me, bookingResponse] = await Promise.all([fetchMe(), fetchBookings({ limit: 100 })]);
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
        setError("Unable to load payments right now.");
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
  }, []);

  const summary = useMemo(() => {
    const paidBookings = bookings.filter((booking) => booking.paymentStatus === "PAID");
    const unpaidBookings = bookings.filter(
      (booking) =>
        booking.status === "CONFIRMED" &&
        (booking.paymentStatus === "UNPAID" || booking.paymentStatus === "FAILED"),
    );

    if (viewer?.role === "ARTIST" || viewer?.role === "AGENCY") {
      return {
        heroTitle: "Earnings",
        heroValue: formatCurrency(
          paidBookings.reduce((total, booking) => total + booking.artistPayout, 0),
        ),
        statOneLabel: "Paid bookings",
        statOneValue: String(paidBookings.length),
        statTwoLabel: "Outstanding payouts",
        statTwoValue: formatCurrency(
          unpaidBookings.reduce((total, booking) => total + booking.artistPayout, 0),
        ),
        statThreeLabel: "Platform fees",
        statThreeValue: formatCurrency(
          paidBookings.reduce((total, booking) => total + booking.platformFee, 0),
        ),
      };
    }

    return {
      heroTitle: "Payments",
      heroValue: formatCurrency(
        paidBookings.reduce((total, booking) => total + booking.totalAmount, 0),
      ),
      statOneLabel: "Confirmed unpaid",
      statOneValue: String(unpaidBookings.length),
      statTwoLabel: "Outstanding total",
      statTwoValue: formatCurrency(
        unpaidBookings.reduce((total, booking) => total + booking.totalAmount, 0),
      ),
      statThreeLabel: "Paid bookings",
      statThreeValue: String(paidBookings.length),
    };
  }, [bookings, viewer?.role]);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.kicker}>Payfast payments</p>
          <h1>{viewer?.role === "ARTIST" ? "Earnings & payouts" : "Wallet & payments"}</h1>
          <p className={styles.subtle}>
            Track live booking payments, outstanding balances, and Payfast checkout actions.
          </p>
        </div>
      </header>

      {loading ? <p className={styles.subtle}>Loading payment data...</p> : null}
      {error ? <div className={styles.error}>{error}</div> : null}

      {!loading && !error ? (
        <>
          <section className={styles.wallet}>
            <div>
              <h2>{summary.heroTitle}</h2>
              <p>{viewer?.role === "ARTIST" ? "Paid artist payouts" : "Total settled value"}</p>
              <div className={styles.balance}>{summary.heroValue}</div>
            </div>
            <div className={styles.walletStats}>
              <div>
                <span>{summary.statOneLabel}</span>
                <strong>{summary.statOneValue}</strong>
              </div>
              <div>
                <span>{summary.statTwoLabel}</span>
                <strong>{summary.statTwoValue}</strong>
              </div>
              <div>
                <span>{summary.statThreeLabel}</span>
                <strong>{summary.statThreeValue}</strong>
              </div>
            </div>
          </section>

          <section className={styles.listCard}>
            <div className={styles.cardHeader}>
              <div>
                <h2>{viewer?.role === "ARTIST" ? "Booking earnings" : "Booking payments"}</h2>
                <p className={styles.subtle}>
                  {viewer?.role === "ARTIST"
                    ? "Paid bookings contribute to your earnings once Payfast settles the booking."
                    : "Confirmed bookings can be paid through Payfast hosted checkout."}
                </p>
              </div>
            </div>

            {bookings.length === 0 ? (
              <div className={styles.emptyState}>
                <h3>No payment activity yet</h3>
                <p className={styles.subtle}>Booking payments will appear here as your marketplace activity grows.</p>
              </div>
            ) : (
              <div className={styles.table}>
                {bookings.map((booking) => {
                  const canPay =
                    viewer?.id === booking.client.id &&
                    booking.status === "CONFIRMED" &&
                    (booking.paymentStatus === "UNPAID" || booking.paymentStatus === "FAILED");

                  return (
                    <article key={booking.id} className={styles.row}>
                      <div className={styles.rowMain}>
                        <div>
                          <h3>{booking.title}</h3>
                          <p className={styles.subtle}>
                            {viewer?.role === "ARTIST" ? booking.client.name : booking.artist.name}
                          </p>
                        </div>
                        <div className={styles.rowMeta}>
                          <span>{formatDate(booking.eventDate)}</span>
                          <span>{formatCurrency(booking.totalAmount)}</span>
                          <span className={styles.statusBadge}>
                            {humanize(booking.paymentStatus)}
                          </span>
                          {booking.paymentProvider ? (
                            <span className={styles.providerBadge}>
                              {humanize(booking.paymentProvider)}
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <div className={styles.rowActions}>
                        {viewer?.role === "ARTIST" || viewer?.role === "AGENCY" ? (
                          <div className={styles.artistStats}>
                            <span>Artist payout</span>
                            <strong>{formatCurrency(booking.artistPayout)}</strong>
                          </div>
                        ) : null}

                        {canPay ? (
                          <PaymentForm bookingId={booking.id} className={styles.primaryBtn} />
                        ) : null}

                        <Link href={`/bookings/${booking.id}`} className={styles.ghostBtn}>
                          View booking
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </>
      ) : null}
    </main>
  );
}
