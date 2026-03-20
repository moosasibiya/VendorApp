"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type {
  Artist,
  DashboardStats,
  NotificationItem,
  UpcomingBookingItem,
} from "@vendorapp/shared";
import {
  ApiError,
  fetchMyArtistProfile,
  fetchMyStats,
  fetchMyUpcomingBookings,
  fetchNotifications,
} from "@/lib/api";
import styles from "./page.module.css";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    maximumFractionDigits: 0,
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

function buildStatCards(stats: DashboardStats): Array<{
  icon: string;
  label: string;
  value: string;
  hint: string;
}> {
  switch (stats.role) {
    case "CLIENT":
      return [
        {
          icon: "event",
          label: "Total bookings",
          value: String(stats.totalBookings),
          hint: "All bookings on your account",
        },
        {
          icon: "schedule",
          label: "Upcoming",
          value: String(stats.upcomingBookings),
          hint: "Future bookings currently scheduled",
        },
        {
          icon: "payments",
          label: "Total spent",
          value: formatCurrency(stats.totalSpent),
          hint: "Paid bookings only",
        },
        {
          icon: "favorite",
          label: "Favourite artists",
          value: String(stats.favouriteArtists),
          hint: "Distinct artists you have booked",
        },
      ];
    case "ARTIST":
      return [
        {
          icon: "event",
          label: "Total bookings",
          value: String(stats.totalBookings),
          hint: "Requests and confirmed work",
        },
        {
          icon: "pending_actions",
          label: "Pending",
          value: String(stats.pendingBookings),
          hint: "Bookings awaiting action",
        },
        {
          icon: "payments",
          label: "Total earned",
          value: formatCurrency(stats.totalEarned),
          hint: "Released payouts only",
        },
        {
          icon: "star",
          label: "Rating",
          value: stats.averageRating.toFixed(1),
          hint: `${stats.totalReviews} reviews and ${stats.profileViews} profile views`,
        },
      ];
    case "AGENCY":
      return [
        {
          icon: "groups",
          label: "Represented artists",
          value: String(stats.totalArtists),
          hint: "Distinct artists on agency bookings",
        },
        {
          icon: "event",
          label: "Active bookings",
          value: String(stats.activeBookings),
          hint: "Pending, confirmed, and in progress",
        },
        {
          icon: "payments",
          label: "Gross revenue",
          value: formatCurrency(stats.totalRevenue),
          hint: "Agency booking value handled",
        },
      ];
    case "SUB_ADMIN":
    case "ADMIN":
    default:
      return [
        {
          icon: "group",
          label: "Users",
          value: String(stats.totalUsers),
          hint: "Total marketplace users",
        },
        {
          icon: "event",
          label: "Bookings",
          value: String(stats.totalBookings),
          hint: "Across the full platform",
        },
        {
          icon: "payments",
          label: "Revenue",
          value: formatCurrency(stats.totalRevenue),
          hint: "Gross booking value",
        },
      ];
  }
}

function buildQuickActions(role: DashboardStats["role"]): Array<{
  href: string;
  icon: string;
  label: string;
}> {
  switch (role) {
    case "CLIENT":
      return [
        { href: "/artists", icon: "travel_explore", label: "Browse artists" },
        { href: "/bookings/new", icon: "post_add", label: "New booking" },
        { href: "/support", icon: "support_agent", label: "Support" },
        { href: "/messages", icon: "forum", label: "Messages" },
      ];
    case "ARTIST":
      return [
        { href: "/payments", icon: "payments", label: "Payouts" },
        { href: "/calendar", icon: "calendar_month", label: "Calendar" },
        { href: "/support", icon: "support_agent", label: "Support" },
        { href: "/messages", icon: "forum", label: "Messages" },
      ];
    case "AGENCY":
      return [
        { href: "/bookings", icon: "event", label: "Bookings" },
        { href: "/payments", icon: "payments", label: "Payments" },
        { href: "/support", icon: "support_agent", label: "Support" },
        { href: "/settings", icon: "settings", label: "Settings" },
      ];
    case "SUB_ADMIN":
    case "ADMIN":
    default:
      return [
        { href: "/admin", icon: "admin_panel_settings", label: "Admin console" },
        { href: "/bookings", icon: "event", label: "Bookings" },
        { href: "/support", icon: "support_agent", label: "Support queue" },
        { href: "/messages", icon: "forum", label: "Messages" },
      ];
  }
}

function StatCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: string;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className={styles.stat}>
      <div className={styles.statIcon}>
        <span className="material-symbols-outlined">{icon}</span>
      </div>
      <div className={styles.statLabel}>{label}</div>
      <div className={styles.statValue}>{value}</div>
      <div className={styles.statHint}>{hint}</div>
    </div>
  );
}

function applicationTone(
  status?: Artist["applicationStatus"],
): "pending" | "success" | "danger" | "neutral" {
  if (!status) {
    return "neutral";
  }
  if (status === "APPROVED" || status === "LIVE") {
    return "success";
  }
  if (status === "REJECTED") {
    return "danger";
  }
  return "pending";
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [artistProfile, setArtistProfile] = useState<Artist | null>(null);
  const [upcoming, setUpcoming] = useState<UpcomingBookingItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const statsData = await fetchMyStats();
        const [upcomingData, notificationFeed, profile] = await Promise.all([
          fetchMyUpcomingBookings(),
          fetchNotifications({ limit: 5 }),
          statsData.role === "ARTIST" ? fetchMyArtistProfile() : Promise.resolve(null),
        ]);

        if (!cancelled) {
          setStats(statsData);
          setArtistProfile(profile);
          setUpcoming(upcomingData);
          setNotifications(notificationFeed.notifications);
        }
      } catch (err) {
        if (cancelled) {
          return;
        }
        setError(
          err instanceof ApiError
            ? err.message
            : "Unable to load dashboard data right now.",
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

  const statCards = stats ? buildStatCards(stats) : [];
  const quickActions = buildQuickActions(stats?.role ?? "CLIENT");

  const tierMetrics = useMemo(() => {
    const metrics = artistProfile?.tierProgress?.metrics;
    if (!metrics) {
      return [];
    }

    return [
      {
        label: "Verified bookings",
        value: String(metrics.verifiedPlatformBookings),
      },
      {
        label: "Platform revenue",
        value: formatCurrency(metrics.platformRevenue),
      },
      {
        label: "Reliability",
        value: `${Math.round(metrics.reliabilityScore)}%`,
      },
      {
        label: "Profile completeness",
        value: `${metrics.profileCompleteness}%`,
      },
      {
        label: "Repeat bookings",
        value: String(metrics.repeatBookings),
      },
      {
        label: "Dispute rate",
        value: `${metrics.disputeRate.toFixed(1)}%`,
      },
    ];
  }, [artistProfile?.tierProgress?.metrics]);

  return (
    <main className={styles.page}>
      {error ? <div className={styles.error}>{error}</div> : null}

      <section className={styles.stats}>
        {loading
          ? Array.from({ length: 4 }).map((_, index) => (
              <StatCard
                key={index}
                icon="hourglass_top"
                label="Loading"
                value="..."
                hint="Fetching live stats"
              />
            ))
          : statCards.map((item, index) => (
              <StatCard
                key={index}
                icon={item.icon}
                label={item.label}
                value={item.value}
                hint={item.hint}
              />
            ))}
      </section>

      {artistProfile ? (
        <section className={styles.featureGrid}>
          <article className={styles.featureCard}>
            <div className={styles.featureHeader}>
              <div>
                <div className={styles.panelTitle}>Artist rollout status</div>
                <div className={styles.panelSub}>
                  Your application, live status, and onboarding recovery model.
                </div>
              </div>
              <span
                className={styles.statusPill}
                data-tone={applicationTone(artistProfile.applicationStatus)}
              >
                {artistProfile.applicationStatus
                  ? humanize(artistProfile.applicationStatus)
                  : "Draft"}
              </span>
            </div>

            <div className={styles.messageCard}>
              <strong>
                {artistProfile.isLive ? "Your profile is live." : "Your profile is in rollout."}
              </strong>
              <p>{artistProfile.applicationMessage ?? "Application status will appear here."}</p>
            </div>

            <div className={styles.metricGrid}>
              <div className={styles.metricCard}>
                <span>Application sequence</span>
                <strong>{artistProfile.applicationSequence ?? "Pending"}</strong>
              </div>
              <div className={styles.metricCard}>
                <span>Submitted</span>
                <strong>
                  {artistProfile.applicationSubmittedAt
                    ? formatDate(artistProfile.applicationSubmittedAt)
                    : "Not yet"}
                </strong>
              </div>
              <div className={styles.metricCard}>
                <span>Approval</span>
                <strong>
                  {artistProfile.approvedAt ? formatDate(artistProfile.approvedAt) : "Awaiting review"}
                </strong>
              </div>
              <div className={styles.metricCard}>
                <span>Live status</span>
                <strong>{artistProfile.isLive ? "Live" : "Not live yet"}</strong>
              </div>
              <div className={styles.metricCard}>
                <span>Commission</span>
                <strong>{artistProfile.normalCommissionRate ?? 0}% standard</strong>
              </div>
              <div className={styles.metricCard}>
                <span>First booking onboarding model</span>
                <strong>
                  {artistProfile.firstBookingOnboardingDeductionApplied
                    ? "Recovered"
                    : `${artistProfile.temporaryFirstBookingCommissionRate ?? 0}% on first completed booking`}
                </strong>
              </div>
            </div>

            {artistProfile.applicationReviewNotes ? (
              <div className={styles.notePanel}>
                <strong>Admin note</strong>
                <p>{artistProfile.applicationReviewNotes}</p>
              </div>
            ) : null}
          </article>

          <article className={styles.featureCard}>
            <div className={styles.featureHeader}>
              <div>
                <div className={styles.panelTitle}>Tier progress</div>
                <div className={styles.panelSub}>
                  Verified platform work drives progression. Off-platform work does not count.
                </div>
              </div>
              <Link href="/payments" className={styles.ghostBtn}>
                View payouts
              </Link>
            </div>

            <div className={styles.tierHero}>
              <div>
                <span className={styles.tierLabel}>Current tier</span>
                <strong>
                  {artistProfile.tierProgress?.currentTier?.name ??
                    artistProfile.tier?.name ??
                    "Pending evaluation"}
                </strong>
              </div>
              <div>
                <span className={styles.tierLabel}>Progress</span>
                <strong>{Math.round(artistProfile.tierProgress?.progressPercent ?? 0)}%</strong>
              </div>
            </div>

            <div className={styles.metricGrid}>
              {tierMetrics.length > 0 ? (
                tierMetrics.map((metric) => (
                  <div key={metric.label} className={styles.metricCard}>
                    <span>{metric.label}</span>
                    <strong>{metric.value}</strong>
                  </div>
                ))
              ) : (
                <div className={styles.emptyState}>
                  Tier metrics will populate after your verified platform bookings and rating history grow.
                </div>
              )}
            </div>

            {artistProfile.tierProgress?.reasons?.length ? (
              <div className={styles.reasonList}>
                {artistProfile.tierProgress.reasons.map((reason) => (
                  <div key={reason} className={styles.reasonItem}>
                    {reason}
                  </div>
                ))}
              </div>
            ) : null}
          </article>
        </section>
      ) : null}

      <section className={styles.grid}>
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <div className={styles.panelTitle}>Upcoming bookings</div>
              <div className={styles.panelSub}>Your next five scheduled bookings</div>
            </div>
            <Link className={styles.ghostBtn} href="/bookings">
              View all
              <span className="material-symbols-outlined">chevron_right</span>
            </Link>
          </div>

          <div className={styles.list}>
            {loading ? (
              <div className={styles.emptyState}>Loading upcoming bookings...</div>
            ) : upcoming.length > 0 ? (
              upcoming.map((booking) => (
                <Link
                  key={booking.id}
                  href={`/bookings/${booking.id}`}
                  className={styles.listItem}
                >
                  <span className="material-symbols-outlined">event</span>
                  <div className={styles.listMain}>
                    <div className={styles.listTitle}>{booking.title}</div>
                    <div className={styles.listSub}>
                      {booking.counterpartName} · {formatDate(booking.eventDate)}
                    </div>
                  </div>
                  <div className={styles.pill}>{humanize(booking.status)}</div>
                </Link>
              ))
            ) : (
              <div className={styles.emptyState}>No upcoming bookings yet.</div>
            )}
          </div>
        </div>

        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <div className={styles.panelTitle}>Quick actions</div>
              <div className={styles.panelSub}>Shortcuts for the next step</div>
            </div>
          </div>

          <div className={styles.actions}>
            {quickActions.map((action) => (
              <Link key={action.href + action.label} className={styles.actionBtn} href={action.href}>
                <span className="material-symbols-outlined">{action.icon}</span>
                {action.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <div className={styles.panelTitle}>Recent notifications</div>
            <div className={styles.panelSub}>Latest booking, message, support, and payment events</div>
          </div>
          <Link className={styles.ghostBtn} href="/messages">
            Messages
          </Link>
        </div>

        <div className={styles.list}>
          {loading ? (
            <div className={styles.emptyState}>Loading notifications...</div>
          ) : notifications.length > 0 ? (
            notifications.map((notification) => (
              <div key={notification.id} className={styles.listItem}>
                <span className="material-symbols-outlined">notifications</span>
                <div className={styles.listMain}>
                  <div className={styles.listTitle}>{notification.title}</div>
                  <div className={styles.listSub}>{notification.body}</div>
                </div>
                <div className={styles.pill}>
                  {new Date(notification.createdAt).toLocaleDateString("en-ZA")}
                </div>
              </div>
            ))
          ) : (
            <div className={styles.emptyState}>No notifications yet.</div>
          )}
        </div>
      </section>
    </main>
  );
}
