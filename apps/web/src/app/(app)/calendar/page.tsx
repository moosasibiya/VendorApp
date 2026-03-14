"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Booking } from "@vendorapp/shared";
import { ApiError, fetchBookings } from "@/lib/api";
import styles from "./page.module.css";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getCalendarStart(month: Date): Date {
  const start = new Date(month.getFullYear(), month.getMonth(), 1);
  start.setDate(start.getDate() - start.getDay());
  return start;
}

function getCalendarEnd(month: Date): Date {
  const end = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  end.setDate(end.getDate() + (6 - end.getDay()));
  end.setHours(23, 59, 59, 999);
  return end;
}

function getDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function humanize(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const calendarStart = useMemo(() => getCalendarStart(currentMonth), [currentMonth]);
  const calendarEnd = useMemo(() => getCalendarEnd(currentMonth), [currentMonth]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetchBookings({
          startDate: calendarStart.toISOString(),
          endDate: calendarEnd.toISOString(),
          limit: 50,
        });
        if (!cancelled) {
          setBookings(
            response.data.filter(
              (booking) =>
                booking.status === "CONFIRMED" || booking.status === "IN_PROGRESS",
            ),
          );
        }
      } catch (err) {
        if (cancelled) {
          return;
        }
        setError(
          err instanceof ApiError
            ? err.message
            : "Unable to load calendar bookings right now.",
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
  }, [calendarEnd, calendarStart]);

  const bookingsByDate = useMemo(() => {
    const map = new Map<string, Booking[]>();
    for (const booking of bookings) {
      const key = getDateKey(new Date(booking.eventDate));
      const current = map.get(key) ?? [];
      current.push(booking);
      map.set(key, current);
    }
    return map;
  }, [bookings]);

  const cells = useMemo(() => {
    return Array.from({ length: 42 }).map((_, index) => {
      const date = new Date(calendarStart);
      date.setDate(calendarStart.getDate() + index);
      return date;
    });
  }, [calendarStart]);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>Calendar</h1>
          <p>Confirmed and in-progress bookings across your current month view.</p>
        </div>
        <div className={styles.controls}>
          <button
            type="button"
            onClick={() =>
              setCurrentMonth(
                new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1),
              )
            }
          >
            Previous
          </button>
          <strong className={styles.monthLabel}>
            {currentMonth.toLocaleDateString("en-ZA", {
              month: "long",
              year: "numeric",
            })}
          </strong>
          <button
            type="button"
            onClick={() =>
              setCurrentMonth(
                new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1),
              )
            }
          >
            Next
          </button>
        </div>
      </header>

      {error ? <div className={styles.error}>{error}</div> : null}

      <div className={styles.dayLabels}>
        {DAY_LABELS.map((label) => (
          <div key={label}>{label}</div>
        ))}
      </div>

      <section className={styles.calendar}>
        {cells.map((date) => {
          const key = getDateKey(date);
          const dayBookings = bookingsByDate.get(key) ?? [];
          const isOutsideMonth = date.getMonth() !== currentMonth.getMonth();
          const isToday = key === getDateKey(new Date());

          return (
            <div
              key={key}
              className={`${styles.cell} ${isOutsideMonth ? styles.cellMuted : ""} ${
                isToday ? styles.cellToday : ""
              }`}
            >
              <div className={styles.cellHeader}>
                <span>{date.getDate()}</span>
                {dayBookings.length > 0 ? (
                  <small>{dayBookings.length} booking{dayBookings.length > 1 ? "s" : ""}</small>
                ) : null}
              </div>

              <div className={styles.events}>
                {loading ? (
                  isToday ? <div className={styles.loadingTag}>Loading...</div> : null
                ) : dayBookings.length > 0 ? (
                  <>
                    {dayBookings.slice(0, 2).map((booking) => (
                      <Link
                        key={booking.id}
                        href={`/bookings/${booking.id}`}
                        className={styles.event}
                      >
                        <strong>{booking.title}</strong>
                        <span>{humanize(booking.status)}</span>
                      </Link>
                    ))}
                    {dayBookings.length > 2 ? (
                      <div className={styles.moreEvents}>+{dayBookings.length - 2} more</div>
                    ) : null}
                  </>
                ) : (
                  <div className={styles.emptyCell}>No events</div>
                )}
              </div>
            </div>
          );
        })}
      </section>
    </main>
  );
}
