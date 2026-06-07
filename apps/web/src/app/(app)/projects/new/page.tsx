"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAppSession } from "@/components/session/AppSessionContext";
import { ApiError, Artist, createBooking, fetchArtists } from "@/lib/api";
import styles from "./page.module.css";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    maximumFractionDigits: 2,
  }).format(amount);
}

function estimateTotal(hourlyRate: number | undefined, start: string, end: string): number | null {
  if (!hourlyRate || hourlyRate <= 0) {
    return null;
  }

  if (!start) {
    return hourlyRate;
  }

  if (!end) {
    return hourlyRate;
  }

  const startDate = new Date(start);
  const endDate = new Date(end);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return hourlyRate;
  }

  const hours = Math.max((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60), 1);
  return Number((hourlyRate * hours).toFixed(2));
}

export default function NewProjectPage() {
  const { onboardingLocked } = useAppSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedArtistId = searchParams.get("artistId") ?? "";

  const [artists, setArtists] = useState<Artist[]>([]);
  const [selectedArtistId, setSelectedArtistId] = useState(requestedArtistId);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventEndDate, setEventEndDate] = useState("");
  const [notes, setNotes] = useState("");
  const [loadingArtists, setLoadingArtists] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setSelectedArtistId(requestedArtistId);
  }, [requestedArtistId]);

  useEffect(() => {
    let cancelled = false;

    const loadArtists = async () => {
      setLoadingArtists(true);
      setError(null);
      try {
        const response = await fetchArtists({ limit: 50, sortBy: "rating" });
        if (cancelled) {
          return;
        }
        setArtists(response.data);
      } catch (err) {
        if (cancelled) {
          return;
        }
        if (err instanceof ApiError) {
          setError(err.message);
          return;
        }
        setError("Unable to load creatives right now.");
      } finally {
        if (!cancelled) {
          setLoadingArtists(false);
        }
      }
    };

    void loadArtists();

    return () => {
      cancelled = true;
    };
  }, []);

  const selectedArtist = useMemo(
    () => artists.find((artist) => artist.id === selectedArtistId) ?? null,
    [artists, selectedArtistId],
  );

  const estimatedTotal = useMemo(
    () => estimateTotal(selectedArtist?.hourlyRate, eventDate, eventEndDate),
    [selectedArtist?.hourlyRate, eventDate, eventEndDate],
  );

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <div className={styles.header}>
          <div>
            <p className={styles.kicker}>Project request flow</p>
            <h1>Create a project request</h1>
            <p className={styles.subtle}>
              Choose a live creative profile, set the project window, and send a request
              that the creative can confirm.
            </p>
          </div>
          <Link href="/projects" className={styles.ghostLink}>
            Back to projects
          </Link>
        </div>

        {error ? <div className={styles.error}>{error}</div> : null}
        <div className={styles.layout}>
          <form
            className={styles.form}
            onSubmit={async (event) => {
              event.preventDefault();
              setError(null);

              if (!selectedArtistId) {
                setError("Select a creative before sending the request.");
                return;
              }
              if (onboardingLocked) {
                setError("Complete onboarding before sending project requests.");
                return;
              }
              if (!title.trim() || !description.trim() || !location.trim() || !eventDate) {
                setError("Title, description, location, and event date are required.");
                return;
              }

              const parsedStart = new Date(eventDate);
              const parsedEnd = eventEndDate ? new Date(eventEndDate) : null;
              if (Number.isNaN(parsedStart.getTime())) {
                setError("Choose a valid event start date and time.");
                return;
              }
              if (parsedStart.getTime() <= Date.now()) {
                setError("Event date must be in the future.");
                return;
              }
              if (parsedEnd && Number.isNaN(parsedEnd.getTime())) {
                setError("Choose a valid event end date and time.");
                return;
              }
              if (parsedEnd && parsedEnd.getTime() <= parsedStart.getTime()) {
                setError("Event end must be after the event start.");
                return;
              }

              setIsSubmitting(true);
              try {
                const booking = await createBooking({
                  artistId: selectedArtistId,
                  title: title.trim(),
                  description: description.trim(),
                  eventDate: parsedStart.toISOString(),
                  eventEndDate: parsedEnd ? parsedEnd.toISOString() : null,
                  location: location.trim(),
                  notes: notes.trim() ? notes.trim() : null,
                });
                router.push(`/projects/${booking.id}`);
              } catch (err) {
                if (err instanceof ApiError) {
                  setError(err.message);
                  return;
                }
                setError("Unable to create the project right now.");
              } finally {
                setIsSubmitting(false);
              }
            }}
          >
            <label>
              Creative
              <select
                value={selectedArtistId}
                onChange={(event) => setSelectedArtistId(event.target.value)}
                disabled={loadingArtists || isSubmitting || onboardingLocked}
              >
                <option value="">Select a creative</option>
                {artists.map((artist) => (
                  <option
                    key={artist.id ?? artist.slug}
                    value={artist.id ?? ""}
                    disabled={!artist.id || artist.isAvailable === false}
                  >
                    {artist.name} {artist.isAvailable === false ? "(Unavailable)" : ""}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Project title
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Editorial campaign, wedding, launch event..."
                disabled={isSubmitting || onboardingLocked}
              />
            </label>

            <label className={styles.fullRow}>
              Description
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Describe the event, deliverables, and any creative direction."
                disabled={isSubmitting || onboardingLocked}
              />
            </label>

            <label>
              Event starts
              <input
                type="datetime-local"
                value={eventDate}
                onChange={(event) => setEventDate(event.target.value)}
                disabled={isSubmitting || onboardingLocked}
              />
            </label>

            <label>
              Event ends
              <input
                type="datetime-local"
                value={eventEndDate}
                onChange={(event) => setEventEndDate(event.target.value)}
                disabled={isSubmitting || onboardingLocked}
              />
            </label>

            <label>
              Location
              <input
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                placeholder="Johannesburg, Cape Town, virtual..."
                disabled={isSubmitting || onboardingLocked}
              />
            </label>

            <label className={styles.fullRow}>
              Notes
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Optional timing, access, wardrobe, or vendor notes."
                disabled={isSubmitting || onboardingLocked}
              />
            </label>

            <div className={styles.actions}>
              <Link href="/explore" className={styles.ghostLink}>
                Browse creatives
              </Link>
              <button
                type="submit"
                className={styles.primaryBtn}
                disabled={isSubmitting || onboardingLocked}
              >
                {onboardingLocked
                  ? "Finish onboarding to request projects"
                  : isSubmitting
                    ? "Sending request..."
                    : "Send project request"}
              </button>
            </div>
          </form>

          <aside className={styles.sidebar}>
            <div className={styles.summaryCard}>
              <p className={styles.sidebarKicker}>Selected creative</p>
              {loadingArtists ? <p>Loading creatives...</p> : null}
              {!loadingArtists && !selectedArtist ? (
                <p className={styles.subtle}>Choose a creative to see pricing and availability.</p>
              ) : null}
              {selectedArtist ? (
                <>
                  <h2>{selectedArtist.name}</h2>
                  <p>{selectedArtist.role}</p>
                  <p>{selectedArtist.location}</p>
                  <div className={styles.badgeRow}>
                    <span
                      className={
                        selectedArtist.isAvailable === false ? styles.badgeMuted : styles.badge
                      }
                    >
                      {selectedArtist.isAvailable === false ? "Unavailable" : "Available"}
                    </span>
                    {selectedArtist.hourlyRate ? (
                      <span className={styles.badge}>{formatCurrency(selectedArtist.hourlyRate)}/hr</span>
                    ) : null}
                  </div>
                  <p className={styles.subtle}>
                    {selectedArtist.bio?.trim()
                      ? selectedArtist.bio
                      : "This creative profile is ready to accept project requests."}
                  </p>
                </>
              ) : null}
            </div>

            <div className={styles.summaryCard}>
              <p className={styles.sidebarKicker}>Estimated totals</p>
              <div className={styles.totalRow}>
                <span>Estimated project total</span>
                <strong>{estimatedTotal ? formatCurrency(estimatedTotal) : "Waiting for event details"}</strong>
              </div>
              <p className={styles.subtle}>
                Totals are calculated from the creative hourly rate and finalized on the project
                record. Platform fees are applied automatically.
              </p>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
