"use client";

import { useEffect, useState } from "react";
import styles from "./page.module.css";
import Link from "next/link";
import type { Booking } from "@vendorapp/shared";
import { ApiError, fetchBookings } from "@/lib/api";

const tabs = ["All", "Pending", "Confirmed", "Completed", "Cancelled"];

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchBookings();
        if (!cancelled) {
          setBookings(data);
        }
      } catch (err) {
        if (!cancelled) {
          if (err instanceof ApiError) {
            setError(err.message);
          } else {
            setError("Unable to load bookings right now.");
          }
        }
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

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>My Bookings</h1>
          <p>Track your upcoming and completed bookings.</p>
        </div>
        <Link className={styles.primaryBtn} href="/bookings/new">
          New Booking
        </Link>
      </header>

      <div className={styles.tabs}>
        {tabs.map((tab, index) => (
          <button
            key={tab}
            className={index === 0 ? styles.tabActive : styles.tabBtn}
          >
            {tab}
          </button>
        ))}
      </div>

      {loading ? <p>Loading bookings...</p> : null}
      {error ? <p>{error}</p> : null}

      <div className={styles.list}>
        {bookings.map((booking) => (
          <article key={booking.id} className={styles.card}>
            <div className={styles.avatar}>{booking.artistInitials}</div>
            <div className={styles.cardBody}>
              <div className={styles.cardHeader}>
                <h3>{booking.artistName}</h3>
                <span className={styles.status}>{booking.status}</span>
              </div>
              <p>{`${booking.title} ? ${booking.location} ? ${booking.date}`}</p>
              <div className={styles.meta}>
                <span>{booking.amount}</span>
                <span>{booking.applications} applications</span>
              </div>
            </div>
            <div className={styles.cardActions}>
              <button>Message</button>
              <button>View Details</button>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
