"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { Booking, User } from "@vendorapp/shared";
import { PaymentForm } from "@/components/PaymentForm";
import { useAppSession } from "@/components/session/AppSessionContext";
import {
  applyAdminBookingOverride,
  ApiError,
  createConversation,
  createReview,
  fetchBooking,
  fetchMe,
  updateBookingStatus,
  verifyBookingStartCode,
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
  const { onboardingLocked } = useAppSession();
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = typeof params.id === "string" ? params.id : "";

  const [booking, setBooking] = useState<Booking | null>(null);
  const [viewer, setViewer] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState("5");
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [startCode, setStartCode] = useState("");
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [overrideBusy, setOverrideBusy] = useState(false);

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

  const runAction = async (
    action: "confirm" | "cancel" | "complete" | "approve_completion" | "dispute",
  ) => {
    if (!booking) {
      return;
    }
    if (onboardingLocked) {
      setError("Complete onboarding before updating booking status.");
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
    if (onboardingLocked) {
      setError("Complete onboarding before opening booking messages.");
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
  const isAdmin = viewer?.role === "ADMIN" || viewer?.role === "SUB_ADMIN";
  const canVerifyStartCode =
    !!booking &&
    !!viewer &&
    (viewer.role === "ADMIN" ||
      viewer.role === "SUB_ADMIN" ||
      viewer.id === booking.artist.userId ||
      viewer.id === booking.agency?.ownerId) &&
    (booking.status === "BOOKED" || booking.status === "AWAITING_START_CODE") &&
    booking.paymentStatus === "PAID";
  const canPay =
    !!booking &&
    !!viewer &&
    viewer.id === booking.client.id &&
    booking.status === "CONFIRMED" &&
    (booking.paymentStatus === "UNPAID" || booking.paymentStatus === "FAILED");

  const submitStartCode = async () => {
    if (!booking || !startCode.trim()) {
      setError("Enter the safety code first.");
      return;
    }

    setVerifyingCode(true);
    setError(null);
    try {
      const updated = await verifyBookingStartCode({
        bookingId: booking.id,
        code: startCode.trim(),
      });
      setBooking(updated);
      setStartCode("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to verify the safety code.");
    } finally {
      setVerifyingCode(false);
    }
  };

  const runAdminOverride = async (
    action: "verify_without_code" | "hold_payout" | "release_payout" | "resolve_dispute",
  ) => {
    if (!booking) {
      return;
    }

    setOverrideBusy(true);
    setError(null);
    try {
      const updated = await applyAdminBookingOverride({
        bookingId: booking.id,
        action,
      });
      setBooking(updated);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Unable to apply the admin override right now.",
      );
    } finally {
      setOverrideBusy(false);
    }
  };

  const submitReview = async () => {
    if (!booking) {
      return;
    }
    if (onboardingLocked) {
      setError("Complete onboarding before submitting reviews.");
      return;
    }

    const trimmedComment = reviewComment.trim();
    if (!trimmedComment) {
      setError("Please add a short review comment.");
      return;
    }

    setReviewSubmitting(true);
    setError(null);
    try {
      const review = await createReview({
        bookingId: booking.id,
        rating: Number(reviewRating),
        comment: trimmedComment,
        isPublic: true,
      });
      setBooking({
        ...booking,
        review: {
          id: review.id,
          rating: review.rating,
          comment: review.comment,
          isPublic: review.isPublic,
          createdAt: review.createdAt,
        },
        canReview: false,
      });
      setReviewComment("");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Unable to submit your review right now.");
      }
    } finally {
      setReviewSubmitting(false);
    }
  };

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
          <button
            type="button"
            className={styles.ghostBtn}
            onClick={() => void openConversation()}
            disabled={onboardingLocked}
          >
            {onboardingLocked ? "Finish onboarding to message" : "Open messages"}
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
                  disabled={onboardingLocked}
                  onError={(message) => setError(message)}
                />
              </div>
            ) : null}

            {canVerifyStartCode ? (
              <div className={styles.section}>
                <p className={styles.label}>Safety code</p>
                <p className={styles.subtle}>
                  The artist must enter the client safety code before the job
                  can officially begin.
                </p>
                <div className={styles.inlineForm}>
                  <input
                    className={styles.inlineInput}
                    value={startCode}
                    onChange={(event) => setStartCode(event.target.value)}
                    placeholder="Enter safety code"
                  />
                  <button
                    type="button"
                    className={styles.primaryBtn}
                    onClick={() => void submitStartCode()}
                    disabled={verifyingCode || !startCode.trim()}
                  >
                    {verifyingCode ? "Verifying..." : "Start booking"}
                  </button>
                </div>
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

            {booking.canReview ? (
              <div className={styles.section}>
                <p className={styles.label}>Leave a review</p>
                <p className={styles.subtle}>
                  This booking is complete. Share feedback for the artist.
                </p>
                <div className={styles.reviewForm}>
                  <label className={styles.reviewField}>
                    Rating
                    <select
                      value={reviewRating}
                      onChange={(event) => setReviewRating(event.target.value)}
                      disabled={onboardingLocked}
                    >
                      <option value="5">5 stars</option>
                      <option value="4">4 stars</option>
                      <option value="3">3 stars</option>
                      <option value="2">2 stars</option>
                      <option value="1">1 star</option>
                    </select>
                  </label>
                  <label className={styles.reviewField}>
                    Comment
                    <textarea
                      rows={4}
                      placeholder="How did the booking go?"
                      value={reviewComment}
                      onChange={(event) => setReviewComment(event.target.value)}
                      disabled={onboardingLocked}
                    />
                  </label>
                  <button
                    type="button"
                    className={styles.primaryBtn}
                    onClick={() => void submitReview()}
                    disabled={reviewSubmitting || onboardingLocked}
                  >
                    {onboardingLocked
                      ? "Finish onboarding to review"
                      : reviewSubmitting
                        ? "Submitting..."
                        : "Submit review"}
                  </button>
                </div>
              </div>
            ) : null}

            {booking.review ? (
              <div className={styles.section}>
                <p className={styles.label}>Review submitted</p>
                <div className={styles.reviewSummary}>
                  <strong>{booking.review.rating} / 5</strong>
                  <p>{booking.review.comment}</p>
                  <p className={styles.subtle}>Submitted {formatDate(booking.review.createdAt)}</p>
                </div>
              </div>
            ) : null}

            <div className={styles.actions}>
              {booking.availableActions?.includes("confirm") ? (
                <button
                  type="button"
                  className={styles.primaryBtn}
                  onClick={() => void runAction("confirm")}
                  disabled={acting || onboardingLocked}
                >
                  Confirm
                </button>
              ) : null}

              {booking.availableActions?.includes("cancel") ? (
                <button
                  type="button"
                  className={styles.ghostBtn}
                  onClick={() => void runAction("cancel")}
                  disabled={acting || onboardingLocked}
                >
                  Cancel
                </button>
              ) : null}

              {booking.availableActions?.includes("complete") ? (
                <button
                  type="button"
                  className={styles.primaryBtn}
                  onClick={() => void runAction("complete")}
                  disabled={acting || onboardingLocked}
                >
                  Complete
                </button>
              ) : null}

              {booking.availableActions?.includes("approve_completion") ? (
                <button
                  type="button"
                  className={styles.primaryBtn}
                  onClick={() => void runAction("approve_completion")}
                  disabled={acting || onboardingLocked}
                >
                  Approve completion
                </button>
              ) : null}

              {booking.availableActions?.includes("dispute") ? (
                <button
                  type="button"
                  className={styles.ghostBtn}
                  onClick={() => void runAction("dispute")}
                  disabled={acting || onboardingLocked}
                >
                  Dispute
                </button>
              ) : null}

              {isAdmin && booking.status !== "IN_PROGRESS" && canVerifyStartCode ? (
                <button
                  type="button"
                  className={styles.ghostBtn}
                  onClick={() => void runAdminOverride("verify_without_code")}
                  disabled={overrideBusy}
                >
                  Admin verify without code
                </button>
              ) : null}

              {isAdmin && booking.status === "DISPUTED" ? (
                <button
                  type="button"
                  className={styles.ghostBtn}
                  onClick={() => void runAdminOverride("resolve_dispute")}
                  disabled={overrideBusy}
                >
                  Resolve dispute
                </button>
              ) : null}

              {isAdmin && booking.payoutStatus === "PENDING" ? (
                <button
                  type="button"
                  className={styles.ghostBtn}
                  onClick={() => void runAdminOverride("hold_payout")}
                  disabled={overrideBusy}
                >
                  Hold payout
                </button>
              ) : null}

              {isAdmin &&
              (booking.payoutStatus === "MANUAL_REVIEW" || booking.payoutStatus === "ON_HOLD") ? (
                <button
                  type="button"
                  className={styles.ghostBtn}
                  onClick={() => void runAdminOverride("release_payout")}
                  disabled={overrideBusy}
                >
                  Release payout
                </button>
              ) : null}
            </div>
          </div>

          <aside className={styles.sidebar}>
            <div className={styles.sidebarCard}>
              <p className={styles.kicker}>Verification & payout</p>
              <div className={styles.totalRow}>
                <span>Verification</span>
                <strong>{humanize(booking.verificationStatus)}</strong>
              </div>
              {booking.verificationCodeSentAt ? (
                <div className={styles.totalRow}>
                  <span>Code sent</span>
                  <strong>{formatDate(booking.verificationCodeSentAt)}</strong>
                </div>
              ) : null}
              {booking.verificationCodeExpiresAt ? (
                <div className={styles.totalRow}>
                  <span>Code expires</span>
                  <strong>{formatDate(booking.verificationCodeExpiresAt)}</strong>
                </div>
              ) : null}
              {booking.disputeWindowEndsAt ? (
                <div className={styles.totalRow}>
                  <span>Dispute window</span>
                  <strong>{formatDate(booking.disputeWindowEndsAt)}</strong>
                </div>
              ) : null}
              <div className={styles.totalRow}>
                <span>Payout state</span>
                <strong>{humanize(booking.payoutStatus)}</strong>
              </div>
              {booking.estimatedPayoutReleaseAt ? (
                <div className={styles.totalRow}>
                  <span>Estimated release</span>
                  <strong>{formatDate(booking.estimatedPayoutReleaseAt)}</strong>
                </div>
              ) : null}
              {booking.payoutHoldReason ? (
                <div className={styles.noteCard}>{booking.payoutHoldReason}</div>
              ) : null}
              {booking.verificationCode && booking.client.id === viewer?.id ? (
                <div className={styles.noteCard}>
                  Share this safety code with the artist at the start of the job:
                  <strong className={styles.codeValue}>{booking.verificationCode}</strong>
                </div>
              ) : null}
            </div>

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
              {booking.onboardingExtraCutAmount ? (
                <div className={styles.totalRow}>
                  <span>Onboarding recovery</span>
                  <strong>{formatCurrency(booking.onboardingExtraCutAmount)}</strong>
                </div>
              ) : null}
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

            {booking.auditEvents?.length ? (
              <div className={styles.sidebarCard}>
                <p className={styles.kicker}>Audit trail</p>
                <div className={styles.timeline}>
                  {booking.auditEvents.map((event) => (
                    <div key={event.id} className={styles.timelineItem}>
                      <div className={styles.timelineDot} />
                      <div>
                        <strong>{humanize(event.eventType)}</strong>
                        {event.message ? <p>{event.message}</p> : null}
                        <p className={styles.subtle}>{formatDate(event.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </aside>
        </section>
      ) : null}
    </main>
  );
}
