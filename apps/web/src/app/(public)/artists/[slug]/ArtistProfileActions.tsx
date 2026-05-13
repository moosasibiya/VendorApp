"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ApiError, createConversation, fetchMe } from "@/lib/api";

type ArtistProfileActionsProps = {
  artistId?: string;
  artistSlug: string;
  bookNowClassName: string;
  messageClassName: string;
  feedbackClassName: string;
  bookLabel?: string;
  messageLabel?: string;
  busyMessageLabel?: string;
  autoMessageTrigger?: boolean;
};

function buildLoginRedirect(path: string): string {
  return `/login?next=${encodeURIComponent(path)}`;
}

export function ArtistProfileActions({
  artistId,
  artistSlug,
  bookNowClassName,
  messageClassName,
  feedbackClassName,
  bookLabel = "Book Now",
  messageLabel = "Message",
  busyMessageLabel = "Opening...",
  autoMessageTrigger = true,
}: ArtistProfileActionsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isMessaging, setIsMessaging] = useState(false);
  const [autoHandled, setAutoHandled] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        await fetchMe();
        if (!cancelled) {
          setAuthed(true);
        }
      } catch {
        if (!cancelled) {
          setAuthed(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const shouldAutoOpen = authed && autoMessageTrigger && searchParams.get("message") === "1";
    if (!shouldAutoOpen || !artistId || isMessaging || autoHandled) {
      return;
    }

    let cancelled = false;

    const run = async () => {
      setAutoHandled(true);
      setIsMessaging(true);
      try {
        const user = await fetchMe();
        if (!user.onboardingCompleted) {
          if (!cancelled) {
            setIsMessaging(false);
            router.replace("/onboarding");
          }
          return;
        }
        if (cancelled) {
          return;
        }
        const conversation = await createConversation({ participantId: artistId });
        if (!cancelled) {
          router.replace(`/messages?conversationId=${encodeURIComponent(conversation.id)}`);
        }
      } catch {
        if (!cancelled) {
          setIsMessaging(false);
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [artistId, autoHandled, autoMessageTrigger, authed, isMessaging, router, searchParams]);

  const bookNow = async () => {
    if (!artistId) {
      setError("This artist profile is not ready for booking yet.");
      return;
    }

    try {
      const user = await fetchMe();
      if (!user.onboardingCompleted) {
        router.push("/onboarding");
        return;
      }
      router.push(`/bookings/new?artistId=${encodeURIComponent(artistId)}`);
    } catch {
      router.push(
        buildLoginRedirect(`/bookings/new?artistId=${encodeURIComponent(artistId)}`),
      );
    }
  };

  const messageArtist = async () => {
    if (!artistId) {
      setError("This artist profile is not ready for messaging yet.");
      return;
    }

    setError(null);
    setIsMessaging(true);
    try {
      const user = await fetchMe();
      if (!user.onboardingCompleted) {
        router.push("/onboarding");
        setIsMessaging(false);
        return;
      }
    } catch {
      router.push(
        buildLoginRedirect(`/artists/${encodeURIComponent(artistSlug)}?message=1`),
      );
      setIsMessaging(false);
      return;
    }

    try {
      const conversation = await createConversation({ participantId: artistId });
      router.push(`/messages?conversationId=${encodeURIComponent(conversation.id)}`);
    } catch (error) {
      setError(
        error instanceof ApiError
          ? error.message
          : "Unable to open a conversation right now.",
      );
    } finally {
      setIsMessaging(false);
    }
  };

  if (!authed) {
    return (
      <>
        <Link href="/join" className={bookNowClassName}>
          Join as Client
        </Link>
        <Link href="/artists" className={messageClassName}>
          I&apos;m a Creative
        </Link>
      </>
    );
  }


  return (
    <>
      <button type="button" className={bookNowClassName} onClick={() => void bookNow()}>
        {bookLabel}
      </button>
      <button
        type="button"
        className={messageClassName}
        onClick={() => void messageArtist()}
        disabled={isMessaging}
      >
        {isMessaging ? busyMessageLabel : messageLabel}
      </button>
      {error ? <p className={feedbackClassName}>{error}</p> : null}
    </>
  );
}

