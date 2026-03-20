"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Booking, User } from "@vendorapp/shared";
import { PaymentForm } from "@/components/PaymentForm";
import { useAppSession } from "@/components/session/AppSessionContext";
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

function payoutTone(status: Booking["payoutStatus"]): "released" | "pending" | "hold" | "neutral" {
  if (status === "RELEASED") {
    return "released";
  }
  if (status === "PENDING") {
    return "pending";
  }
  if (status === "ON_HOLD" || status === "MANUAL_REVIEW") {
    return "hold";
  }
  return "neutral";
}

function verificationTone(
  status: Booking["verificationStatus"],
): "released" | "pending" | "hold" | "neutral" {
  if (status === "VERIFIED" || status === "MANUAL_OVERRIDE") {
    return "released";
  }
  if (status === "PENDING") {
    return "pending";
  }
  if (status === "FAILED") {
    return "hold";
  }
  return "neutral";
}

export default function PaymentsPage() {
  const { onboardingLocked } = useAppSession();
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
        setError(
          err instanceof ApiError ? err.message : "Unable to load payments right now.",
        );
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

  const isArtistWorkspace = viewer?.role === "ARTIST" || viewer?.role === "AGENCY";

  const paymentSummary = useMemo(() => {
    const released = bookings.filter((booking) => booking.payoutStatus === "RELEASED");
    const pending = bookings.filter(
      (booking) => booking.payoutStatus === "PENDING" || booking.payoutStatus === "NOT_READY",
    );
    const holds = bookings.filter(
      (booking) =>
        booking.payoutStatus === "ON_HOLD" ||
        booking.payoutStatus === "MANUAL_REVIEW" ||
        booking.status === "DISPUTED",
    );
    const verified = bookings.filter(
      (booking) =>
        booking.verificationStatus === "VERIFIED" ||
        booking.verificationStatus === "MANUAL_OVERRIDE",
    );
    const unpaid = bookings.filter(
      (booking) =>
        booking.status === "CONFIRMED" &&
        (booking.paymentStatus === "UNPAID" || booking.paymentStatus === "FAILED"),
    );

    return {
      releasedValue: released.reduce((total, booking) => total + booking.artistPayout, 0),
      pendingValue: pending.reduce((total, booking) => total + booking.artistPayout, 0),
      holdValue: holds.reduce((total, booking) => total + booking.artistPayout, 0),
      platformFees: bookings.reduce((total, booking) => total + booking.platformFee, 0),
      onboardingRecovery: bookings.reduce(
        (total, booking) => total + (booking.onboardingExtraCutAmount ?? 0),
        0,
      ),
      verifiedCount: verified.length,
      unpaidCount: unpaid.length,
      unpaidValue: unpaid.reduce((total, booking) => total + booking.totalAmount, 0),
      releasedCount: released.length,
      pendingCount: pending.length,
      holdCount: holds.length,
    };
  }, [bookings]);

  const priorityRows = useMemo(
    () =>
      bookings
        .filter(
          (booking) =>
            booking.payoutStatus === "PENDING" ||
            booking.payoutStatus === "ON_HOLD" ||
            booking.payoutStatus === "MANUAL_REVIEW" ||
            booking.status === "DISPUTED" ||
            (booking.paymentStatus === "PAID" &&
              booking.verificationStatus !== "VERIFIED" &&
              booking.verificationStatus !== "MANUAL_OVERRIDE"),
        )
        .sort((left, right) => {
          const leftTime = new Date(left.updatedAt).getTime();
          const rightTime = new Date(right.updatedAt).getTime();
          return rightTime - leftTime;
        }),
    [bookings],
  );

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.kicker}>Payments and release tracking</p>
          <h1>{isArtistWorkspace ? "Payout dashboard" : "Payments dashboard"}</h1>
          <p className={styles.subtle}>
            {isArtistWorkspace
              ? "Track verification, dispute windows, onboarding recovery, and payout release timing from one place."
              : "Review booking payments, outstanding checkout actions, and job verification progress before work begins."}
          </p>
        </div>
        <Link href="/support" className={styles.ghostBtn}>
          Open support
        </Link>
      </header>

      {loading ? <p className={styles.subtle}>Loading payment data...</p> : null}
      {error ? <div className={styles.error}>{error}</div> : null}

      {!loading && !error ? (
        <>
          <section className={styles.wallet}>
            <div>
              <p className={styles.walletLabel}>
                {isArtistWorkspace ? "Released payouts" : "Settled booking value"}
              </p>
              <div className={styles.balance}>
                {formatCurrency(
                  isArtistWorkspace
                    ? paymentSummary.releasedValue
                    : bookings
                        .filter((booking) => booking.paymentStatus === "PAID")
                        .reduce((total, booking) => total + booking.totalAmount, 0),
                )}
              </div>
              <p className={styles.walletHint}>
                {isArtistWorkspace
                  ? `${paymentSummary.releasedCount} bookings have cleared the release flow.`
                  : "Completed payment records appear here after Payfast confirms the booking."}
              </p>
            </div>
            <div className={styles.walletStats}>
              <div>
                <span>{isArtistWorkspace ? "Pending payouts" : "Unpaid confirmed bookings"}</span>
                <strong>
                  {isArtistWorkspace
                    ? formatCurrency(paymentSummary.pendingValue)
                    : formatCurrency(paymentSummary.unpaidValue)}
                </strong>
              </div>
              <div>
                <span>{isArtistWorkspace ? "On hold / review" : "Paid bookings"}</span>
                <strong>
                  {isArtistWorkspace
                    ? formatCurrency(paymentSummary.holdValue)
                    : String(bookings.filter((booking) => booking.paymentStatus === "PAID").length)}
                </strong>
              </div>
              <div>
                <span>{isArtistWorkspace ? "Platform fees" : "Verification complete"}</span>
                <strong>
                  {isArtistWorkspace
                    ? formatCurrency(paymentSummary.platformFees)
                    : String(paymentSummary.verifiedCount)}
                </strong>
              </div>
              <div>
                <span>
                  {isArtistWorkspace ? "Onboarding recovery applied" : "Need attention"}
                </span>
                <strong>
                  {isArtistWorkspace
                    ? formatCurrency(paymentSummary.onboardingRecovery)
                    : String(
                        priorityRows.filter(
                          (booking) =>
                            booking.paymentStatus === "PAID" &&
                            booking.verificationStatus !== "VERIFIED" &&
                            booking.verificationStatus !== "MANUAL_OVERRIDE",
                        ).length,
                      )}
                </strong>
              </div>
            </div>
          </section>

          {isArtistWorkspace ? (
            <section className={styles.insightGrid}>
              <article className={styles.insightCard}>
                <p className={styles.cardEyebrow}>Release states</p>
                <h2>What is moving now</h2>
                <div className={styles.statRows}>
                  <div className={styles.statRow}>
                    <span>Payout pending</span>
                    <strong>
                      {paymentSummary.pendingCount} bookings /{" "}
                      {formatCurrency(paymentSummary.pendingValue)}
                    </strong>
                  </div>
                  <div className={styles.statRow}>
                    <span>Held or manual review</span>
                    <strong>
                      {paymentSummary.holdCount} bookings / {formatCurrency(paymentSummary.holdValue)}
                    </strong>
                  </div>
                  <div className={styles.statRow}>
                    <span>Code verified jobs</span>
                    <strong>{paymentSummary.verifiedCount}</strong>
                  </div>
                </div>
              </article>

              <article className={styles.insightCard}>
                <p className={styles.cardEyebrow}>Policy note</p>
                <h2>Temporary onboarding recovery</h2>
                <p className={styles.subtle}>
                  There is no upfront onboarding payment in the current rollout. If your
                  account uses the temporary first-booking model, the extra onboarding cut is
                  visible below and only applied once.
                </p>
                <div className={styles.policyCard}>
                  <div className={styles.statRow}>
                    <span>Applied so far</span>
                    <strong>{formatCurrency(paymentSummary.onboardingRecovery)}</strong>
                  </div>
                  <div className={styles.statRow}>
                    <span>Future bookings after deduction</span>
                    <strong>Normal commission resumes automatically</strong>
                  </div>
                </div>
              </article>
            </section>
          ) : null}

          <section className={styles.listCard}>
            <div className={styles.cardHeader}>
              <div>
                <h2>{isArtistWorkspace ? "Priority payout items" : "Checkout and payment actions"}</h2>
                <p className={styles.subtle}>
                  {isArtistWorkspace
                    ? "These bookings are waiting on verification, dispute expiry, or manual intervention before release."
                    : "Confirmed bookings can be paid through hosted checkout. Safety-code and payout status appear once payment clears."}
                </p>
              </div>
            </div>

            {priorityRows.length === 0 ? (
              <div className={styles.emptyState}>
                <h3>{isArtistWorkspace ? "No blocked payouts right now" : "No checkout actions right now"}</h3>
                <p className={styles.subtle}>
                  {isArtistWorkspace
                    ? "Priority payout work will appear here when a booking needs action, review, or dispute handling."
                    : "New confirmed bookings that need payment will appear here."}
                </p>
              </div>
            ) : (
              <div className={styles.table}>
                {priorityRows.map((booking) => {
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
                            {isArtistWorkspace ? booking.client.name : booking.artist.name}
                          </p>
                        </div>
                        <div className={styles.rowMeta}>
                          <span>{formatDate(booking.eventDate)}</span>
                          <span>{formatCurrency(booking.totalAmount)}</span>
                          <span
                            className={styles.pill}
                            data-tone={payoutTone(booking.payoutStatus)}
                          >
                            {humanize(booking.payoutStatus)}
                          </span>
                          <span
                            className={styles.pill}
                            data-tone={verificationTone(booking.verificationStatus)}
                          >
                            {humanize(booking.verificationStatus)}
                          </span>
                        </div>
                        <div className={styles.breakdown}>
                          <div>
                            <span>Artist payout</span>
                            <strong>{formatCurrency(booking.artistPayout)}</strong>
                          </div>
                          <div>
                            <span>Platform fee</span>
                            <strong>{formatCurrency(booking.platformFee)}</strong>
                          </div>
                          <div>
                            <span>Onboarding recovery</span>
                            <strong>
                              {formatCurrency(booking.onboardingExtraCutAmount ?? 0)}
                            </strong>
                          </div>
                          <div>
                            <span>Estimated release</span>
                            <strong>
                              {booking.estimatedPayoutReleaseAt
                                ? formatDate(booking.estimatedPayoutReleaseAt)
                                : "Waiting on next step"}
                            </strong>
                          </div>
                        </div>
                        {booking.payoutHoldReason ? (
                          <div className={styles.noteCard}>{booking.payoutHoldReason}</div>
                        ) : null}
                      </div>

                      <div className={styles.rowActions}>
                        {canPay ? (
                          <PaymentForm
                            bookingId={booking.id}
                            className={styles.primaryBtn}
                            disabled={onboardingLocked}
                          />
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

          <section className={styles.listCard}>
            <div className={styles.cardHeader}>
              <div>
                <h2>{isArtistWorkspace ? "All booking payouts" : "Booking payment history"}</h2>
                <p className={styles.subtle}>
                  {isArtistWorkspace
                    ? "Every booking shows verification, dispute timing, and release visibility."
                    : "Review payment state and continue to booking detail for client approval or support escalation."}
                </p>
              </div>
            </div>

            {bookings.length === 0 ? (
              <div className={styles.emptyState}>
                <h3>No payment activity yet</h3>
                <p className={styles.subtle}>
                  Booking payments and payouts will appear here once your first booking enters the flow.
                </p>
              </div>
            ) : (
              <div className={styles.table}>
                {bookings.map((booking) => (
                  <article key={booking.id} className={styles.row}>
                    <div className={styles.rowMain}>
                      <div>
                        <h3>{booking.title}</h3>
                        <p className={styles.subtle}>
                          {isArtistWorkspace ? booking.client.name : booking.artist.name}
                        </p>
                      </div>
                      <div className={styles.rowMeta}>
                        <span>{formatDate(booking.eventDate)}</span>
                        <span>{formatCurrency(booking.totalAmount)}</span>
                        <span className={styles.pill} data-tone={payoutTone(booking.payoutStatus)}>
                          {humanize(booking.payoutStatus)}
                        </span>
                        <span
                          className={styles.pill}
                          data-tone={verificationTone(booking.verificationStatus)}
                        >
                          {humanize(booking.verificationStatus)}
                        </span>
                        <span className={styles.pill} data-tone="neutral">
                          {humanize(booking.paymentStatus)}
                        </span>
                      </div>
                      <div className={styles.breakdown}>
                        <div>
                          <span>Artist payout</span>
                          <strong>{formatCurrency(booking.artistPayout)}</strong>
                        </div>
                        <div>
                          <span>Dispute window</span>
                          <strong>
                            {booking.disputeWindowEndsAt
                              ? formatDate(booking.disputeWindowEndsAt)
                              : "Not open"}
                          </strong>
                        </div>
                        <div>
                          <span>Reference</span>
                          <strong>{booking.paymentReference ?? "Pending"}</strong>
                        </div>
                        <div>
                          <span>Provider</span>
                          <strong>{booking.paymentProvider ? humanize(booking.paymentProvider) : "Pending"}</strong>
                        </div>
                      </div>
                    </div>
                    <div className={styles.rowActions}>
                      <Link href={`/bookings/${booking.id}`} className={styles.ghostBtn}>
                        View booking
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      ) : null}
    </main>
  );
}
