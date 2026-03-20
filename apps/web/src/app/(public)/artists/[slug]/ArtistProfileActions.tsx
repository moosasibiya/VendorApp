"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ApiError, createConversation, fetchMe } from "@/lib/api";

type ArtistProfileActionsProps = {
  artistId?: string;
  artistSlug: string;
  bookNowClassName: string;
  messageClassName: string;
  feedbackClassName: string;
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
}: ArtistProfileActionsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isMessaging, setIsMessaging] = useState(false);
  const [autoHandled, setAutoHandled] = useState(false);

  useEffect(() => {
    const shouldAutoOpen = searchParams.get("message") === "1";
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
  }, [artistId, autoHandled, isMessaging, router, searchParams]);

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

  return (
    <>
      <button type="button" className={bookNowClassName} onClick={() => void bookNow()}>
        Book Now
      </button>
      <button
        type="button"
        className={messageClassName}
        onClick={() => void messageArtist()}
        disabled={isMessaging}
      >
        {isMessaging ? "Opening..." : "Message"}
      </button>
      {error ? <p className={feedbackClassName}>{error}</p> : null}
    </>
  );
}
