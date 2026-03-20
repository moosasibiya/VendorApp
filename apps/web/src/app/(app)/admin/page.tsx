"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type {
  AdminArtistApplicationItem,
  AdminDashboardData,
  ArtistApplicationStatusValue,
  ArtistTierAdminRow,
  ArtistTierDefinition,
  PlatformSettings,
  SupportThreadStatusValue,
} from "@vendorapp/shared";
import { useAppSession } from "@/components/session/AppSessionContext";
import {
  ApiError,
  fetchAdminDashboard,
  updateArtistApplication,
  updateArtistTier,
  updatePlatformSettings,
  updateSupportThread,
  updateTierDefinition,
} from "@/lib/api";
import styles from "./page.module.css";

function humanize(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDate(value?: string | null): string {
  if (!value) {
    return "Not set";
  }
  return new Date(value).toLocaleString("en-ZA", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

type SettingsDraft = Record<keyof PlatformSettings, string>;
type ApplicationDrafts = Record<string, string>;
type SupportDrafts = Record<string, { status: SupportThreadStatusValue; note: string }>;
type TierDrafts = Record<string, { tierId: string; reason: string }>;
type TierDefinitionDrafts = Record<
  string,
  {
    name: string;
    description: string;
    sortOrder: string;
    isActive: boolean;
    thresholds: string;
    benefits: string;
  }
>;

const applicationFilters: Array<ArtistApplicationStatusValue | "ALL"> = [
  "ALL",
  "SUBMITTED",
  "PRELAUNCH_POOL",
  "WAITLISTED",
  "UNDER_REVIEW",
  "APPROVED",
  "REJECTED",
  "LIVE",
];

const supportStatuses: SupportThreadStatusValue[] = [
  "OPEN",
  "AWAITING_USER",
  "ESCALATED",
  "RESOLVED",
];

function toSettingsDraft(settings: PlatformSettings): SettingsDraft {
  return {
    maxPrelaunchPoolSize: String(settings.maxPrelaunchPoolSize),
    liveArtistSlotLimit: String(settings.liveArtistSlotLimit),
    onboardingFeeModel: settings.onboardingFeeModel,
    normalCommissionRate: String(settings.normalCommissionRate),
    temporaryFirstBookingCommissionRate: String(
      settings.temporaryFirstBookingCommissionRate,
    ),
    disputeWindowDays: String(settings.disputeWindowDays),
    bookingStartCodeLength: String(settings.bookingStartCodeLength),
    startCodeActivationHours: String(settings.startCodeActivationHours),
    clientApprovalGraceHours: String(settings.clientApprovalGraceHours),
  };
}

function buildSupportDrafts(data: AdminDashboardData): SupportDrafts {
  return Object.fromEntries(
    data.supportThreads.map((thread) => [
      thread.conversationId,
      {
        status: thread.status ?? "OPEN",
        note: "",
      },
    ]),
  );
}

function buildTierDrafts(data: AdminDashboardData): TierDrafts {
  return Object.fromEntries(
    data.tierRows.map((row) => [
      row.artistId,
      {
        tierId: row.manualTier?.id ?? "",
        reason: "",
      },
    ]),
  );
}

function buildTierDefinitionDrafts(data: AdminDashboardData): TierDefinitionDrafts {
  return Object.fromEntries(
    data.tierDefinitions.map((tier) => [
      tier.id,
      {
        name: tier.name,
        description: tier.description ?? "",
        sortOrder: String(tier.sortOrder),
        isActive: tier.isActive,
        thresholds: JSON.stringify(tier.thresholds ?? {}, null, 2),
        benefits: JSON.stringify(tier.benefits ?? {}, null, 2),
      },
    ]),
  );
}

function applicationTone(
  status: ArtistApplicationStatusValue,
): "pending" | "success" | "danger" | "neutral" {
  if (status === "APPROVED" || status === "LIVE") {
    return "success";
  }
  if (status === "REJECTED") {
    return "danger";
  }
  if (
    status === "UNDER_REVIEW" ||
    status === "PRELAUNCH_POOL" ||
    status === "WAITLISTED"
  ) {
    return "pending";
  }
  return "neutral";
}

export default function AdminPage() {
  const { user } = useAppSession();
  const [dashboard, setDashboard] = useState<AdminDashboardData | null>(null);
  const [settingsDraft, setSettingsDraft] = useState<SettingsDraft | null>(null);
  const [applicationNotes, setApplicationNotes] = useState<ApplicationDrafts>({});
  const [supportDraftMap, setSupportDraftMap] = useState<SupportDrafts>({});
  const [tierDraftMap, setTierDraftMap] = useState<TierDrafts>({});
  const [tierDefinitionDraftMap, setTierDefinitionDraftMap] =
    useState<TierDefinitionDrafts>({});
  const [statusFilter, setStatusFilter] =
    useState<ArtistApplicationStatusValue | "ALL">("ALL");
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAdminDashboard();
      setDashboard(data);
      setSettingsDraft(toSettingsDraft(data.settings));
      setApplicationNotes({});
      setSupportDraftMap(buildSupportDrafts(data));
      setTierDraftMap(buildTierDrafts(data));
      setTierDefinitionDraftMap(buildTierDefinitionDrafts(data));
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Unable to load the admin dashboard right now.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDashboard();
  }, []);

  const filteredApplications = useMemo(() => {
    const items = dashboard?.artistApplications.items ?? [];
    if (statusFilter === "ALL") {
      return items;
    }
    return items.filter((item) => item.applicationStatus === statusFilter);
  }, [dashboard?.artistApplications.items, statusFilter]);

  const summaryCards = useMemo(() => {
    if (!dashboard) {
      return [];
    }

    return [
      {
        label: "Prelaunch pool",
        value: String(dashboard.artistApplications.prelaunchPoolCount),
        hint: `${dashboard.settings.maxPrelaunchPoolSize} configured max`,
      },
      {
        label: "Waitlist",
        value: String(dashboard.artistApplications.waitlistCount),
        hint: "Applications queued for later rollout windows",
      },
      {
        label: "Live slots",
        value: `${dashboard.artistApplications.liveSlotsUsed}/${dashboard.artistApplications.liveSlotLimit}`,
        hint: "Approved artists currently allowed to go live",
      },
      {
        label: "Support queue",
        value: String(
          dashboard.supportThreads.filter((thread) => thread.status !== "RESOLVED")
            .length,
        ),
        hint: "Open, awaiting user, or escalated threads",
      },
      {
        label: "Manual review bookings",
        value: String(dashboard.manualReviewBookings.length),
        hint: "Disputes or payout exceptions waiting on staff",
      },
    ];
  }, [dashboard]);

  const saveSettings = async () => {
    if (!settingsDraft) {
      return;
    }

    setBusyKey("settings");
    setError(null);
    try {
      const updated = await updatePlatformSettings({
        maxPrelaunchPoolSize: Number(settingsDraft.maxPrelaunchPoolSize),
        liveArtistSlotLimit: Number(settingsDraft.liveArtistSlotLimit),
        onboardingFeeModel:
          settingsDraft.onboardingFeeModel as PlatformSettings["onboardingFeeModel"],
        normalCommissionRate: Number(settingsDraft.normalCommissionRate),
        temporaryFirstBookingCommissionRate: Number(
          settingsDraft.temporaryFirstBookingCommissionRate,
        ),
        disputeWindowDays: Number(settingsDraft.disputeWindowDays),
        bookingStartCodeLength: Number(settingsDraft.bookingStartCodeLength),
        startCodeActivationHours: Number(settingsDraft.startCodeActivationHours),
        clientApprovalGraceHours: Number(settingsDraft.clientApprovalGraceHours),
      });
      if (dashboard) {
        setDashboard({ ...dashboard, settings: updated });
      }
      setSettingsDraft(toSettingsDraft(updated));
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Unable to update platform settings.",
      );
    } finally {
      setBusyKey(null);
    }
  };

  const runArtistAction = async (
    artist: AdminArtistApplicationItem,
    action: "under_review" | "approve" | "reject" | "go_live",
  ) => {
    setBusyKey(`artist:${artist.artistId}:${action}`);
    setError(null);
    try {
      const next = await updateArtistApplication({
        artistId: artist.artistId,
        action,
        note: applicationNotes[artist.artistId]?.trim() || undefined,
      });
      setDashboard(next);
      setSettingsDraft(toSettingsDraft(next.settings));
      setSupportDraftMap(buildSupportDrafts(next));
      setTierDraftMap(buildTierDrafts(next));
      setTierDefinitionDraftMap(buildTierDefinitionDrafts(next));
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Unable to update the artist application.",
      );
    } finally {
      setBusyKey(null);
    }
  };

  const runSupportUpdate = async (conversationId: string, assignToMe = false) => {
    const draft = supportDraftMap[conversationId];
    if (!draft) {
      return;
    }

    setBusyKey(`support:${conversationId}`);
    setError(null);
    try {
      await updateSupportThread({
        conversationId,
        status: draft.status,
        internalNote: draft.note.trim() || undefined,
        assignedAdminUserId: assignToMe ? user.id : undefined,
      });
      await loadDashboard();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Unable to update the support thread.",
      );
    } finally {
      setBusyKey(null);
    }
  };

  const runTierOverride = async (row: ArtistTierAdminRow) => {
    const draft = tierDraftMap[row.artistId];
    if (!draft) {
      return;
    }

    setBusyKey(`tier:${row.artistId}`);
    setError(null);
    try {
      const next = await updateArtistTier({
        artistId: row.artistId,
        tierId: draft.tierId || null,
        reason: draft.reason.trim() || null,
      });
      setDashboard(next);
      setTierDraftMap(buildTierDrafts(next));
      setTierDefinitionDraftMap(buildTierDefinitionDrafts(next));
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Unable to update the artist tier.",
      );
    } finally {
      setBusyKey(null);
    }
  };

  const runTierDefinitionUpdate = async (tier: ArtistTierDefinition) => {
    const draft = tierDefinitionDraftMap[tier.id];
    if (!draft) {
      return;
    }

    setBusyKey(`tier-definition:${tier.id}`);
    setError(null);
    try {
      const next = await updateTierDefinition({
        tierId: tier.id,
        name: draft.name.trim(),
        description: draft.description.trim() || null,
        sortOrder: Number(draft.sortOrder),
        isActive: draft.isActive,
        thresholds: JSON.parse(draft.thresholds || "{}"),
        benefits: JSON.parse(draft.benefits || "{}"),
      });
      setDashboard(next);
      setTierDefinitionDraftMap(buildTierDefinitionDrafts(next));
      setTierDraftMap(buildTierDrafts(next));
    } catch (err) {
      if (err instanceof SyntaxError) {
        setError(`Tier JSON is invalid for ${tier.name}.`);
      } else {
        setError(
          err instanceof ApiError
            ? err.message
            : "Unable to update the tier definition.",
        );
      }
    } finally {
      setBusyKey(null);
    }
  };

  if (user.role !== "ADMIN" && user.role !== "SUB_ADMIN") {
    return (
      <main className={styles.page}>
        <section className={styles.emptyCard}>
          <h1>Admin access required</h1>
          <p>This route is only available to admin and sub-admin accounts.</p>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <header className={styles.hero}>
        <div>
          <p className={styles.kicker}>Platform operations</p>
          <h1>Admin dashboard</h1>
          <p className={styles.subtle}>
            Manage rollout capacity, artist approvals, support escalation,
            payout exceptions, and the configurable tier engine from one surface.
          </p>
        </div>
        <button
          type="button"
          className={styles.ghostBtn}
          onClick={() => void loadDashboard()}
        >
          Refresh
        </button>
      </header>

      {error ? <div className={styles.error}>{error}</div> : null}

      <section className={styles.summaryGrid}>
        {loading
          ? Array.from({ length: 5 }).map((_, index) => (
              <article key={index} className={styles.summaryCard}>
                <span>Loading</span>
                <strong>...</strong>
                <p>Fetching dashboard data</p>
              </article>
            ))
          : summaryCards.map((card) => (
              <article key={card.label} className={styles.summaryCard}>
                <span>{card.label}</span>
                <strong>{card.value}</strong>
                <p>{card.hint}</p>
              </article>
            ))}
      </section>

      {!loading && dashboard && settingsDraft ? (
        <>
          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <h2>Configurable rollout settings</h2>
                <p className={styles.subtle}>
                  These values drive application routing, live-slot release,
                  payout timing, safety-code behavior, and the temporary
                  onboarding model.
                </p>
              </div>
              <button
                type="button"
                className={styles.primaryBtn}
                onClick={() => void saveSettings()}
                disabled={busyKey === "settings"}
              >
                {busyKey === "settings" ? "Saving..." : "Save settings"}
              </button>
            </div>

            <div className={styles.fieldGrid}>
              {(
                [
                  ["maxPrelaunchPoolSize", "Max prelaunch pool size"],
                  ["liveArtistSlotLimit", "Initial live slots"],
                  ["normalCommissionRate", "Normal commission rate"],
                  [
                    "temporaryFirstBookingCommissionRate",
                    "First-booking adjusted commission rate",
                  ],
                  ["disputeWindowDays", "Dispute window days"],
                  ["bookingStartCodeLength", "Booking start code length"],
                  ["startCodeActivationHours", "Start-code activation hours"],
                  ["clientApprovalGraceHours", "Client approval grace hours"],
                ] as Array<[keyof SettingsDraft, string]>
              ).map(([key, label]) => (
                <label key={key} className={styles.field}>
                  {label}
                  <input
                    value={settingsDraft[key]}
                    onChange={(event) =>
                      setSettingsDraft((current) =>
                        current ? { ...current, [key]: event.target.value } : current,
                      )
                    }
                  />
                </label>
              ))}

              <label className={styles.field}>
                Onboarding fee model
                <select
                  value={settingsDraft.onboardingFeeModel}
                  onChange={(event) =>
                    setSettingsDraft((current) =>
                      current
                        ? {
                            ...current,
                            onboardingFeeModel:
                              event.target.value as SettingsDraft["onboardingFeeModel"],
                          }
                        : current,
                    )
                  }
                >
                  <option value="FIRST_BOOKING_DEDUCTION">First booking deduction</option>
                  <option value="UPFRONT">Upfront fee</option>
                </select>
              </label>
            </div>
          </section>

          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <h2>Artist applications</h2>
                <p className={styles.subtle}>
                  Ordered by application date so the prelaunch pool and waitlist
                  stay transparent.
                </p>
              </div>
              <label className={styles.inlineField}>
                Status filter
                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(
                      event.target.value as ArtistApplicationStatusValue | "ALL",
                    )
                  }
                >
                  {applicationFilters.map((option) => (
                    <option key={option} value={option}>
                      {option === "ALL" ? "All statuses" : humanize(option)}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className={styles.stack}>
              {filteredApplications.map((artist) => (
                <article key={artist.artistId} className={styles.rowCard}>
                  <div className={styles.rowHeader}>
                    <div>
                      <h3>{artist.displayName}</h3>
                      <p className={styles.subtle}>
                        {artist.role} / {artist.location} / sequence{" "}
                        {artist.applicationSequence ?? "Pending"}
                      </p>
                    </div>
                    <div className={styles.rowMeta}>
                      <span
                        className={styles.statusPill}
                        data-tone={applicationTone(artist.applicationStatus)}
                      >
                        {humanize(artist.applicationStatus)}
                      </span>
                      <span className={styles.mutedMeta}>
                        Submitted {formatDate(artist.applicationSubmittedAt)}
                      </span>
                    </div>
                  </div>

                  <div className={styles.metrics}>
                    <div>
                      <span>Reviewed</span>
                      <strong>{formatDate(artist.applicationReviewedAt)}</strong>
                    </div>
                    <div>
                      <span>Approved</span>
                      <strong>{formatDate(artist.approvedAt)}</strong>
                    </div>
                    <div>
                      <span>Live</span>
                      <strong>
                        {artist.isLive ? `Yes / ${formatDate(artist.wentLiveAt)}` : "No"}
                      </strong>
                    </div>
                    <div>
                      <span>Commission</span>
                      <strong>
                        {artist.normalCommissionRate}% normal /{" "}
                        {artist.temporaryFirstBookingCommissionRate}% first booking
                      </strong>
                    </div>
                  </div>

                  <label className={styles.field}>
                    Admin note
                    <textarea
                      rows={3}
                      value={
                        applicationNotes[artist.artistId] ??
                        artist.applicationReviewNotes ??
                        ""
                      }
                      onChange={(event) =>
                        setApplicationNotes((current) => ({
                          ...current,
                          [artist.artistId]: event.target.value,
                        }))
                      }
                    />
                  </label>

                  <div className={styles.actions}>
                    <button
                      type="button"
                      className={styles.ghostBtn}
                      onClick={() => void runArtistAction(artist, "under_review")}
                      disabled={busyKey === `artist:${artist.artistId}:under_review`}
                    >
                      Under review
                    </button>
                    <button
                      type="button"
                      className={styles.ghostBtn}
                      onClick={() => void runArtistAction(artist, "approve")}
                      disabled={busyKey === `artist:${artist.artistId}:approve`}
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      className={styles.ghostBtn}
                      onClick={() => void runArtistAction(artist, "reject")}
                      disabled={busyKey === `artist:${artist.artistId}:reject`}
                    >
                      Reject
                    </button>
                    <button
                      type="button"
                      className={styles.primaryBtn}
                      onClick={() => void runArtistAction(artist, "go_live")}
                      disabled={
                        busyKey === `artist:${artist.artistId}:go_live` || artist.isLive
                      }
                    >
                      {artist.isLive ? "Already live" : "Allow go live"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
          <section className={styles.twoColumn}>
            <div className={styles.panel}>
              <div className={styles.panelHeader}>
                <div>
                  <h2>Support queue</h2>
                  <p className={styles.subtle}>
                    Support threads stay inside messaging but remain labeled here
                    for triage.
                  </p>
                </div>
              </div>

              <div className={styles.stack}>
                {dashboard.supportThreads.map((thread) => {
                  const supportDraft = supportDraftMap[thread.conversationId] ?? {
                    status: thread.status ?? "OPEN",
                    note: "",
                  };

                  return (
                    <article key={thread.conversationId} className={styles.rowCard}>
                      <div className={styles.rowHeader}>
                        <div>
                          <h3>{thread.subject ?? thread.ticketNumber ?? "Support thread"}</h3>
                          <p className={styles.subtle}>
                            {thread.requesterName} / {humanize(thread.category ?? "OTHER")}
                          </p>
                        </div>
                        <span className={styles.statusPill} data-tone="pending">
                          {humanize(thread.status ?? "OPEN")}
                        </span>
                      </div>

                      <div className={styles.metrics}>
                        <div>
                          <span>Ticket</span>
                          <strong>{thread.ticketNumber ?? "Pending"}</strong>
                        </div>
                        <div>
                          <span>Assigned</span>
                          <strong>{thread.assignedAdminName ?? "Unassigned"}</strong>
                        </div>
                        <div>
                          <span>Created</span>
                          <strong>{formatDate(thread.createdAt)}</strong>
                        </div>
                        <div>
                          <span>Last message</span>
                          <strong>{formatDate(thread.lastMessageAt)}</strong>
                        </div>
                      </div>

                      <div className={styles.fieldGridCompact}>
                        <label className={styles.field}>
                          Status
                          <select
                            value={supportDraft.status}
                            onChange={(event) =>
                              setSupportDraftMap((current) => ({
                                ...current,
                                [thread.conversationId]: {
                                  ...supportDraft,
                                  status: event.target.value as SupportThreadStatusValue,
                                },
                              }))
                            }
                          >
                            {supportStatuses.map((status) => (
                              <option key={status} value={status}>
                                {humanize(status)}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className={styles.field}>
                          Internal note
                          <input
                            value={supportDraft.note}
                            onChange={(event) =>
                              setSupportDraftMap((current) => ({
                                ...current,
                                [thread.conversationId]: {
                                  ...supportDraft,
                                  note: event.target.value,
                                },
                              }))
                            }
                            placeholder="Add support context for the team"
                          />
                        </label>
                      </div>

                      <div className={styles.actions}>
                        <button
                          type="button"
                          className={styles.ghostBtn}
                          onClick={() => void runSupportUpdate(thread.conversationId, true)}
                          disabled={busyKey === `support:${thread.conversationId}`}
                        >
                          Assign to me
                        </button>
                        <button
                          type="button"
                          className={styles.ghostBtn}
                          onClick={() => void runSupportUpdate(thread.conversationId)}
                          disabled={busyKey === `support:${thread.conversationId}`}
                        >
                          {busyKey === `support:${thread.conversationId}`
                            ? "Saving..."
                            : "Update thread"}
                        </button>
                        <Link
                          className={styles.primaryBtn}
                          href={`/messages?conversationId=${encodeURIComponent(
                            thread.conversationId,
                          )}`}
                        >
                          Open in messages
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>

            <div className={styles.panel}>
              <div className={styles.panelHeader}>
                <div>
                  <h2>Manual review bookings</h2>
                  <p className={styles.subtle}>
                    Payout holds, disputes, and missing verification events that
                    require staff review.
                  </p>
                </div>
              </div>

              <div className={styles.stack}>
                {dashboard.manualReviewBookings.map((booking) => (
                  <article key={booking.bookingId} className={styles.rowCard}>
                    <div className={styles.rowHeader}>
                      <div>
                        <h3>{booking.title}</h3>
                        <p className={styles.subtle}>
                          {booking.artistName} / {booking.clientName}
                        </p>
                      </div>
                      <Link href={`/bookings/${booking.bookingId}`} className={styles.ghostBtn}>
                        Review booking
                      </Link>
                    </div>
                    <div className={styles.metrics}>
                      <div>
                        <span>Status</span>
                        <strong>{humanize(booking.status)}</strong>
                      </div>
                      <div>
                        <span>Verification</span>
                        <strong>{humanize(booking.verificationStatus)}</strong>
                      </div>
                      <div>
                        <span>Payout</span>
                        <strong>{humanize(booking.payoutStatus)}</strong>
                      </div>
                      <div>
                        <span>Estimated release</span>
                        <strong>{formatDate(booking.estimatedPayoutReleaseAt)}</strong>
                      </div>
                    </div>
                    {booking.payoutHoldReason ? (
                      <div className={styles.notePanel}>{booking.payoutHoldReason}</div>
                    ) : null}
                  </article>
                ))}
              </div>
            </div>
          </section>
          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <h2>Tier definitions</h2>
                <p className={styles.subtle}>
                  Adjust placeholder thresholds and benefits without hardcoding
                  reward logic in the client.
                </p>
              </div>
            </div>

            <div className={styles.stack}>
              {dashboard.tierDefinitions.map((tier) => {
                const draft = tierDefinitionDraftMap[tier.id];
                if (!draft) {
                  return null;
                }

                return (
                  <article key={tier.id} className={styles.rowCard}>
                    <div className={styles.fieldGrid}>
                      <label className={styles.field}>
                        Name
                        <input
                          value={draft.name}
                          onChange={(event) =>
                            setTierDefinitionDraftMap((current) => ({
                              ...current,
                              [tier.id]: { ...draft, name: event.target.value },
                            }))
                          }
                        />
                      </label>
                      <label className={styles.field}>
                        Sort order
                        <input
                          value={draft.sortOrder}
                          onChange={(event) =>
                            setTierDefinitionDraftMap((current) => ({
                              ...current,
                              [tier.id]: { ...draft, sortOrder: event.target.value },
                            }))
                          }
                        />
                      </label>
                      <label className={styles.field}>
                        Description
                        <input
                          value={draft.description}
                          onChange={(event) =>
                            setTierDefinitionDraftMap((current) => ({
                              ...current,
                              [tier.id]: { ...draft, description: event.target.value },
                            }))
                          }
                        />
                      </label>
                      <label className={styles.checkboxField}>
                        <input
                          type="checkbox"
                          checked={draft.isActive}
                          onChange={(event) =>
                            setTierDefinitionDraftMap((current) => ({
                              ...current,
                              [tier.id]: { ...draft, isActive: event.target.checked },
                            }))
                          }
                        />
                        Active tier
                      </label>
                      <label className={`${styles.field} ${styles.fieldFull}`}>
                        Thresholds JSON
                        <textarea
                          rows={8}
                          value={draft.thresholds}
                          onChange={(event) =>
                            setTierDefinitionDraftMap((current) => ({
                              ...current,
                              [tier.id]: {
                                ...draft,
                                thresholds: event.target.value,
                              },
                            }))
                          }
                        />
                      </label>
                      <label className={`${styles.field} ${styles.fieldFull}`}>
                        Benefits JSON
                        <textarea
                          rows={8}
                          value={draft.benefits}
                          onChange={(event) =>
                            setTierDefinitionDraftMap((current) => ({
                              ...current,
                              [tier.id]: { ...draft, benefits: event.target.value },
                            }))
                          }
                        />
                      </label>
                    </div>

                    <div className={styles.actions}>
                      <button
                        type="button"
                        className={styles.primaryBtn}
                        onClick={() => void runTierDefinitionUpdate(tier)}
                        disabled={busyKey === `tier-definition:${tier.id}`}
                      >
                        {busyKey === `tier-definition:${tier.id}`
                          ? "Saving..."
                          : "Save tier"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <h2>Artist tier overrides</h2>
                <p className={styles.subtle}>
                  Manual overrides stay auditable and separate from evaluated
                  progression.
                </p>
              </div>
            </div>

            <div className={styles.stack}>
              {dashboard.tierRows.map((row) => {
                const draft = tierDraftMap[row.artistId] ?? {
                  tierId: "",
                  reason: "",
                };

                return (
                  <article key={row.artistId} className={styles.rowCard}>
                    <div className={styles.rowHeader}>
                      <div>
                        <h3>{row.artistName}</h3>
                        <p className={styles.subtle}>
                          {row.artistSlug} / {humanize(row.applicationStatus)}
                        </p>
                      </div>
                      <div className={styles.rowMeta}>
                        <span className={styles.mutedMeta}>
                          Current {row.currentTier?.name ?? "Unassigned"}
                        </span>
                        <span className={styles.mutedMeta}>
                          Evaluated {row.evaluatedTier?.name ?? "Pending"}
                        </span>
                      </div>
                    </div>

                    <div className={styles.metrics}>
                      <div>
                        <span>Progress</span>
                        <strong>{Math.round(row.progress.progressPercent)}%</strong>
                      </div>
                      <div>
                        <span>Verified bookings</span>
                        <strong>{row.progress.metrics.verifiedPlatformBookings}</strong>
                      </div>
                      <div>
                        <span>Revenue</span>
                        <strong>{row.progress.metrics.platformRevenue.toFixed(0)}</strong>
                      </div>
                      <div>
                        <span>Reliability</span>
                        <strong>{Math.round(row.progress.metrics.reliabilityScore)}%</strong>
                      </div>
                    </div>

                    <div className={styles.fieldGridCompact}>
                      <label className={styles.field}>
                        Manual tier
                        <select
                          value={draft.tierId}
                          onChange={(event) =>
                            setTierDraftMap((current) => ({
                              ...current,
                              [row.artistId]: { ...draft, tierId: event.target.value },
                            }))
                          }
                        >
                          <option value="">Auto evaluate</option>
                          {dashboard.tierDefinitions.map((tier) => (
                            <option key={tier.id} value={tier.id}>
                              {tier.name}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className={styles.field}>
                        Override reason
                        <input
                          value={draft.reason}
                          onChange={(event) =>
                            setTierDraftMap((current) => ({
                              ...current,
                              [row.artistId]: { ...draft, reason: event.target.value },
                            }))
                          }
                          placeholder="Explain why this override is needed"
                        />
                      </label>
                    </div>

                    <div className={styles.actions}>
                      <button
                        type="button"
                        className={styles.primaryBtn}
                        onClick={() => void runTierOverride(row)}
                        disabled={busyKey === `tier:${row.artistId}`}
                      >
                        {busyKey === `tier:${row.artistId}` ? "Saving..." : "Save override"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        </>
      ) : null}
    </main>
  );
}
