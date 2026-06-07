"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Booking, SupportCategoryValue } from "@vendorapp/shared";
import {
  ApiError,
  createSupportThread,
  fetchBookings,
} from "@/lib/api";
import styles from "./page.module.css";

const supportOptions: Array<{
  category: SupportCategoryValue;
  title: string;
  summary: string;
  steps: string[];
  shouldEscalateByDefault?: boolean;
}> = [
  {
    category: "BOOKING_HELP",
    title: "Project help",
    summary: "Clarify project status, confirmations, timelines, and next steps.",
    steps: [
      "Open the project detail page and check the current status timeline.",
      "After confirmation, the project moves into the booked state and later awaits the safety code.",
      "Use the project messages thread for work updates tied to that project.",
    ],
  },
  {
    category: "PAYMENT_ISSUE",
    title: "Payment issue",
    summary: "Escalate payment questions for manual support review.",
    steps: [
      "Open the related project and review the status timeline.",
      "Include the project reference and a concise description of the payment question.",
      "Support will route the thread to the owner of the new payment process.",
    ],
  },
  {
    category: "PROFILE_ISSUE",
    title: "Profile issue",
    summary: "Help with creative applications, onboarding, profile visibility, or account setup.",
    steps: [
      "Finish all onboarding fields and save your profile application.",
      "If you are a creative, your dashboard shows whether you are in the prelaunch pool, under review, or waitlisted.",
      "Escalate if profile information is missing, approval status looks wrong, or identity checks need help.",
    ],
  },
  {
    category: "DISPUTE_HELP",
    title: "Dispute help",
    summary: "Escalate project disputes, missed safety-code usage, or delivery issues.",
    steps: [
      "Open the project and review the dispute window and verification timeline.",
      "If the safety code was not used, support may need extra verification before payout can move.",
      "Create a support thread so the team can review the full project and message context.",
    ],
    shouldEscalateByDefault: true,
  },
  {
    category: "REFUND_HELP",
    title: "Refund help",
    summary: "Escalate refund requests or payment reversals for human review.",
    steps: [
      "Gather the project reference and explain why the refund is requested.",
      "Include whether the creative arrived, completed work, or the project was cancelled.",
      "Create a support thread so the team can review payment and dispute history.",
    ],
    shouldEscalateByDefault: true,
  },
  {
    category: "OTHER",
    title: "Other",
    summary: "Use this when your issue does not fit the categories above.",
    steps: [
      "Write a concise summary of the problem.",
      "Add the relevant project reference if one exists.",
      "Support will review and route the thread to the right owner.",
    ],
    shouldEscalateByDefault: true,
  },
];

function formatDate(value: string): string {
  return new Date(value).toLocaleString("en-ZA", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function SupportPage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] =
    useState<SupportCategoryValue>("BOOKING_HELP");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingsLoaded, setBookingsLoaded] = useState(false);
  const [bookingId, setBookingId] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const selectedOption = useMemo(
    () => supportOptions.find((option) => option.category === selectedCategory) ?? supportOptions[0],
    [selectedCategory],
  );

  const loadBookings = async () => {
    if (bookingsLoaded) {
      return;
    }

    try {
      const response = await fetchBookings({ limit: 25 });
      setBookings(response.data);
      setBookingsLoaded(true);
    } catch (err) {
      setBookingsLoaded(true);
      setError(
        err instanceof ApiError ? err.message : "Unable to load related projects right now.",
      );
    }
  };

  const openThread = async () => {
    const resolvedSubject = subject.trim() || `${selectedOption.title} request`;
    const resolvedMessage =
      message.trim() ||
      `${selectedOption.summary}\n\nIssue category: ${selectedOption.title}`;

    setSubmitting(true);
    setError(null);

    try {
      const conversation = await createSupportThread({
        category: selectedCategory,
        subject: resolvedSubject,
        initialMessage: resolvedMessage,
        bookingId: bookingId || null,
      });
      router.push(`/messages?conversationId=${encodeURIComponent(conversation.id)}`);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Unable to create the support thread right now.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div>
          <p className={styles.kicker}>Centralized support</p>
          <h1>Support starts here and stays inside your messages</h1>
          <p className={styles.subtle}>
            Use the guided FAQ flow first. If your issue needs human review, we
            will open a labeled support thread in the messaging area so nothing
            gets lost across email, chat, and project notes.
          </p>
        </div>
      </section>

      <section className={styles.layout}>
        <div className={styles.optionGrid}>
          {supportOptions.map((option) => (
            <button
              key={option.category}
              type="button"
              className={styles.optionCard}
              data-active={option.category === selectedCategory}
              onClick={() => {
                setSelectedCategory(option.category);
                if (!subject.trim()) {
                  setSubject(`${option.title} request`);
                }
              }}
            >
              <strong>{option.title}</strong>
              <p>{option.summary}</p>
              <span>
                {option.shouldEscalateByDefault ? "Human review recommended" : "FAQ first"}
              </span>
            </button>
          ))}
        </div>

        <div className={styles.detailCard}>
          <div className={styles.detailHeader}>
            <div>
              <p className={styles.kicker}>FAQ guidance</p>
              <h2>{selectedOption.title}</h2>
            </div>
            <span
              className={styles.statusPill}
              data-tone={selectedOption.shouldEscalateByDefault ? "escalate" : "guide"}
            >
              {selectedOption.shouldEscalateByDefault ? "Escalate" : "Guided"}
            </span>
          </div>

          <p className={styles.summary}>{selectedOption.summary}</p>
          <ol className={styles.steps}>
            {selectedOption.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>

          <div className={styles.form}>
            <div className={styles.fieldRow}>
              <label className={styles.field}>
                Subject
                <input
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  placeholder={`${selectedOption.title} request`}
                />
              </label>
              <label className={styles.field}>
                Related project
                <select
                  value={bookingId}
                  onFocus={() => void loadBookings()}
                  onChange={(event) => setBookingId(event.target.value)}
                >
                  <option value="">No project selected</option>
                  {bookings.map((booking) => (
                    <option key={booking.id} value={booking.id}>
                      {booking.title} · {formatDate(booking.eventDate)}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className={styles.field}>
              Message
              <textarea
                rows={6}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Describe what happened, what you expected, and what you need help with."
              />
            </label>

            {error ? <div className={styles.error}>{error}</div> : null}

            <div className={styles.actions}>
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={() => {
                  setSubject(`${selectedOption.title} request`);
                  setMessage("");
                  setError(null);
                }}
              >
                Reset draft
              </button>
              <button
                type="button"
                className={styles.primaryBtn}
                onClick={() => void openThread()}
                disabled={submitting}
              >
                {submitting ? "Opening thread..." : "Open support thread"}
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
