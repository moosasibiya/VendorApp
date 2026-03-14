"use client";

import { useEffect, useState } from "react";
import {
  ApiError,
  changePassword,
  deleteCurrentUser,
  fetchMe,
  updateCurrentUser,
} from "@/lib/api";
import styles from "./page.module.css";

function clearAuthCookies() {
  document.cookie = "vendrman_auth=; Max-Age=0; path=/";
  document.cookie = "vendrman_csrf=; Max-Age=0; path=/";
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [roleLabel, setRoleLabel] = useState("");
  const [location, setLocation] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [bookingNotifications, setBookingNotifications] = useState(true);
  const [messageNotifications, setMessageNotifications] = useState(true);
  const [marketingNotifications, setMarketingNotifications] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const user = await fetchMe();
        if (cancelled) {
          return;
        }
        setFullName(user.fullName);
        setEmail(user.email);
        setRoleLabel(user.role);
        setLocation(user.location ?? "");
        setAvatarUrl(user.avatarUrl ?? "");
        setEmailNotifications(user.notificationPreferences?.email ?? true);
        setBookingNotifications(user.notificationPreferences?.bookingUpdates ?? true);
        setMessageNotifications(user.notificationPreferences?.newMessages ?? true);
        setMarketingNotifications(user.notificationPreferences?.marketing ?? false);
      } catch (err) {
        if (cancelled) {
          return;
        }
        setError(
          err instanceof ApiError
            ? err.message
            : "Unable to load your settings right now.",
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

  const saveProfile = async () => {
    setProfileSaving(true);
    setError(null);
    setMessage(null);
    try {
      await updateCurrentUser({
        fullName,
        location,
        avatarUrl: avatarUrl || null,
        notificationPreferences: {
          email: emailNotifications,
          bookingUpdates: bookingNotifications,
          newMessages: messageNotifications,
          marketing: marketingNotifications,
        },
      });
      setMessage("Settings saved.");
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Unable to save settings right now.",
      );
    } finally {
      setProfileSaving(false);
    }
  };

  const savePassword = async () => {
    if (!currentPassword.trim() || !newPassword.trim()) {
      setError("Current password and new password are required.");
      return;
    }

    setPasswordSaving(true);
    setError(null);
    setMessage(null);
    try {
      await changePassword({
        currentPassword,
        newPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      setMessage("Password updated.");
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Unable to update your password.",
      );
    } finally {
      setPasswordSaving(false);
    }
  };

  const deleteAccount = async () => {
    if (!window.confirm("Delete this account? This will deactivate your profile.")) {
      return;
    }

    setDeleting(true);
    setError(null);
    setMessage(null);
    try {
      await deleteCurrentUser();
      clearAuthCookies();
      window.location.assign("/login");
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Unable to delete this account right now.",
      );
      setDeleting(false);
    }
  };

  return (
    <main className={styles.page}>
      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <h1>Settings</h1>
          <nav>
            <button className={styles.navBtn}>Profile</button>
            <button className={styles.navBtn}>Notifications</button>
            <button className={styles.navBtn}>Security</button>
            <button className={styles.navBtn}>Danger zone</button>
          </nav>
        </aside>

        <section className={styles.content}>
          {error ? <div className={styles.error}>{error}</div> : null}
          {message ? <div className={styles.notice}>{message}</div> : null}

          <div className={styles.section}>
            <h2>Account & Profile</h2>
            <div className={styles.formGrid}>
              <label>
                Full Name
                <input
                  value={loading ? "" : fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="Your full name"
                />
              </label>
              <label>
                Email
                <input value={loading ? "" : email} disabled />
              </label>
              <label>
                Location
                <input
                  value={loading ? "" : location}
                  onChange={(event) => setLocation(event.target.value)}
                  placeholder="Johannesburg"
                />
              </label>
              <label>
                Role
                <input value={loading ? "" : roleLabel} disabled />
              </label>
              <label className={styles.fullWidth}>
                Avatar URL
                <input
                  value={loading ? "" : avatarUrl}
                  onChange={(event) => setAvatarUrl(event.target.value)}
                  placeholder="Phase 7 adds upload support; URL works for now"
                />
              </label>
            </div>
            <div className={styles.sectionActions}>
              <button
                className={styles.primaryBtn}
                type="button"
                onClick={() => void saveProfile()}
                disabled={profileSaving || loading}
              >
                {profileSaving ? "Saving..." : "Save profile"}
              </button>
            </div>
          </div>

          <div className={styles.section}>
            <h2>Notifications</h2>
            <div className={styles.toggleList}>
              <label className={styles.toggle}>
                <input
                  type="checkbox"
                  checked={emailNotifications}
                  onChange={(event) => setEmailNotifications(event.target.checked)}
                />
                Email notifications
              </label>
              <label className={styles.toggle}>
                <input
                  type="checkbox"
                  checked={bookingNotifications}
                  onChange={(event) => setBookingNotifications(event.target.checked)}
                />
                Booking updates
              </label>
              <label className={styles.toggle}>
                <input
                  type="checkbox"
                  checked={messageNotifications}
                  onChange={(event) => setMessageNotifications(event.target.checked)}
                />
                New messages
              </label>
              <label className={styles.toggle}>
                <input
                  type="checkbox"
                  checked={marketingNotifications}
                  onChange={(event) => setMarketingNotifications(event.target.checked)}
                />
                Marketing email
              </label>
            </div>
          </div>

          <div className={styles.section}>
            <h2>Password</h2>
            <div className={styles.formGrid}>
              <label>
                Current password
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                />
              </label>
              <label>
                New password
                <input
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                />
              </label>
            </div>
            <div className={styles.sectionActions}>
              <button
                className={styles.ghostBtn}
                type="button"
                onClick={() => void savePassword()}
                disabled={passwordSaving || loading}
              >
                {passwordSaving ? "Updating..." : "Change password"}
              </button>
            </div>
          </div>

          <div className={styles.section}>
            <h2>Danger zone</h2>
            <p className={styles.muted}>
              Deleting your account will deactivate it and block future logins until restored.
            </p>
            <div className={styles.sectionActions}>
              <button
                className={styles.dangerBtn}
                type="button"
                onClick={() => void deleteAccount()}
                disabled={deleting || loading}
              >
                {deleting ? "Deleting..." : "Delete account"}
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
