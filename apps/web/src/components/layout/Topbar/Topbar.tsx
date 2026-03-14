"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { NotificationFeed, NotificationItem } from "@vendorapp/shared";
import {
  fetchNotifications,
  logout as logoutRequest,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/api";
import { getRealtimeSocket } from "@/lib/realtime";
import styles from "./Topbar.module.css";

const ROUTE_META: Record<string, { title: string; subtitle: string }> = {
  "/dashboard": {
    title: "Dashboard",
    subtitle: "Overview of your workspace and activity.",
  },
  "/creatives": {
    title: "Creatives",
    subtitle: "Browse, verify, and manage creative profiles.",
  },
  "/bookings": {
    title: "Bookings",
    subtitle: "Track new, active, and completed bookings.",
  },
  "/messages": {
    title: "Messages",
    subtitle: "Conversations, delivery updates, and client notes.",
  },
  "/calendar": {
    title: "Calendar",
    subtitle: "Availability, upcoming shoots, and blocked time.",
  },
  "/reviews": {
    title: "Reviews",
    subtitle: "Ratings, testimonials, and feedback responses.",
  },
  "/payments": {
    title: "Payments",
    subtitle: "Payouts, invoices, and revenue insights.",
  },
  "/settings": {
    title: "Settings",
    subtitle: "Manage your profile and platform preferences.",
  },
  "/onboarding": {
    title: "Onboarding",
    subtitle: "Complete your artist setup and verification.",
  },
};

function formatRelativeTime(value: string): string {
  const deltaSeconds = Math.round((Date.now() - new Date(value).getTime()) / 1000);
  const abs = Math.abs(deltaSeconds);

  if (abs < 60) return "now";
  if (abs < 3600) return `${Math.round(abs / 60)}m`;
  if (abs < 86400) return `${Math.round(abs / 3600)}h`;
  return `${Math.round(abs / 86400)}d`;
}

export default function Topbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [compactSearch, setCompactSearch] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  const [notificationFeed, setNotificationFeed] = useState<NotificationFeed>({
    notifications: [],
    unreadCount: 0,
    hasMore: false,
    nextCursor: null,
  });
  const notificationRef = useRef<HTMLDivElement | null>(null);

  const route =
    Object.keys(ROUTE_META).find(
      (key) => pathname === key || pathname.startsWith(key + "/"),
    ) ?? "/dashboard";

  const { title, subtitle } = ROUTE_META[route];

  useEffect(() => {
    let frame = 0;

    const updateCompact = () => {
      const shouldCompact = window.scrollY > 16;
      setCompactSearch((current) =>
        current === shouldCompact ? current : shouldCompact,
      );
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        updateCompact();
      });
    };

    updateCompact();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadNotifications = async () => {
      setNotificationsLoading(true);
      try {
        const feed = await fetchNotifications({ limit: 8 });
        if (!cancelled) {
          setNotificationFeed(feed);
        }
      } catch {
        if (!cancelled) {
          setNotificationFeed({
            notifications: [],
            unreadCount: 0,
            hasMore: false,
            nextCursor: null,
          });
        }
      } finally {
        if (!cancelled) {
          setNotificationsLoading(false);
        }
      }
    };

    void loadNotifications();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const socket = getRealtimeSocket();
    const onNotification = (notification: NotificationItem) => {
      setNotificationFeed((current) => {
        const alreadyExists = current.notifications.some(
          (item) => item.id === notification.id,
        );

        return {
          notifications: [
            notification,
            ...current.notifications.filter((item) => item.id !== notification.id),
          ].slice(0, 8),
          unreadCount:
            current.unreadCount +
            (!alreadyExists && !notification.isRead ? 1 : 0),
          hasMore: current.hasMore,
          nextCursor: current.nextCursor,
        };
      });
    };

    if (!socket.connected) {
      socket.connect();
    }

    socket.on("notification:new", onNotification);
    return () => {
      socket.off("notification:new", onNotification);
    };
  }, []);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!notificationRef.current?.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, []);

  const toggleTheme = () => {
    const root = document.documentElement;
    const next =
      root.getAttribute("data-theme") === "light" ? "dark" : "light";
    root.setAttribute("data-theme", next);
    localStorage.setItem("vendrman_theme", next);
  };

  const logout = async () => {
    try {
      await logoutRequest();
    } finally {
      window.location.href = "/";
    }
  };

  const openNotification = async (notification: NotificationItem) => {
    if (!notification.isRead) {
      try {
        await markNotificationRead(notification.id);
      } catch {
        // Leave local state unchanged on failure.
      }

      setNotificationFeed((current) => ({
        ...current,
        unreadCount: Math.max(
          0,
          current.unreadCount - (notification.isRead ? 0 : 1),
        ),
        notifications: current.notifications.map((item) =>
          item.id === notification.id ? { ...item, isRead: true } : item,
        ),
      }));
    }

    const conversationId =
      typeof notification.metadata?.conversationId === "string"
        ? notification.metadata.conversationId
        : null;
    const bookingId =
      typeof notification.metadata?.bookingId === "string"
        ? notification.metadata.bookingId
        : null;

    if (conversationId) {
      router.push(`/messages?conversationId=${encodeURIComponent(conversationId)}`);
    } else if (bookingId) {
      router.push(`/bookings/${encodeURIComponent(bookingId)}`);
    }

    setNotificationsOpen(false);
  };

  const markAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotificationFeed((current) => ({
        ...current,
        unreadCount: 0,
        notifications: current.notifications.map((notification) => ({
          ...notification,
          isRead: true,
        })),
      }));
    } catch {
      // Ignore and keep current state.
    }
  };

  return (
    <header className={styles.topbar} data-compact={compactSearch}>
      <div className={styles.left}>
        <div className={styles.title}>{title}</div>
        <div className={styles.subtitle}>{subtitle}</div>
      </div>

      <div className={styles.right}>
        <div className={styles.search}>
          <span className="material-symbols-outlined">search</span>
          <span className={styles.searchSummary}>
            {searchQuery.trim() || "Search"}
          </span>
          <input
            placeholder="Search creatives, bookings..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </div>

        <button className={styles.iconBtn} type="button" onClick={toggleTheme}>
          <span className="material-symbols-outlined">contrast</span>
        </button>

        <div className={styles.notificationWrap} ref={notificationRef}>
          <button
            className={styles.iconBtn}
            type="button"
            title="Notifications"
            onClick={() => setNotificationsOpen((current) => !current)}
          >
            <span className="material-symbols-outlined">notifications</span>
            {notificationFeed.unreadCount > 0 ? (
              <span className={styles.badge}>
                {notificationFeed.unreadCount > 9
                  ? "9+"
                  : String(notificationFeed.unreadCount)}
              </span>
            ) : null}
          </button>

          {notificationsOpen ? (
            <div className={styles.notificationPanel}>
              <div className={styles.notificationHeader}>
                <div>
                  <strong>Notifications</strong>
                  <p>{notificationFeed.unreadCount} unread</p>
                </div>
                <button
                  type="button"
                  className={styles.markAllBtn}
                  onClick={() => void markAllRead()}
                  disabled={notificationFeed.unreadCount === 0}
                >
                  Mark all read
                </button>
              </div>

              {notificationsLoading ? (
                <p className={styles.notificationEmpty}>Loading...</p>
              ) : notificationFeed.notifications.length === 0 ? (
                <p className={styles.notificationEmpty}>
                  No notifications yet.
                </p>
              ) : (
                <div className={styles.notificationList}>
                  {notificationFeed.notifications.map((notification) => (
                    <button
                      key={notification.id}
                      type="button"
                      className={styles.notificationItem}
                      data-read={notification.isRead}
                      onClick={() => void openNotification(notification)}
                    >
                      <div className={styles.notificationCopy}>
                        <strong>{notification.title}</strong>
                        <p>{notification.body}</p>
                      </div>
                      <span>{formatRelativeTime(notification.createdAt)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </div>

        <button
          className={styles.logoutBtn}
          type="button"
          onClick={() => void logout()}
        >
          <span className="material-symbols-outlined">logout</span>
          Logout
        </button>

        <div className={styles.avatar} title="Profile">
          MS
        </div>
      </div>
    </header>
  );
}
