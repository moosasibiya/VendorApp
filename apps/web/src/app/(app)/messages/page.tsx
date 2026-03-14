"use client";

import Link from "next/link";
import {
  startTransition,
  useDeferredValue,
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ConversationMessage, ConversationSummary, User } from "@vendorapp/shared";
import {
  ApiError,
  fetchConversationMessages,
  fetchConversations,
  fetchMe,
  markConversationRead,
  sendConversationMessage,
} from "@/lib/api";
import { getRealtimeSocket } from "@/lib/realtime";
import styles from "./page.module.css";

type UiMessage = ConversationMessage & {
  clientState?: "sending" | "failed";
};

function formatClock(value: string): string {
  return new Date(value).toLocaleTimeString("en-ZA", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatRelative(value: string): string {
  const deltaSeconds = Math.round((Date.now() - new Date(value).getTime()) / 1000);
  const abs = Math.abs(deltaSeconds);

  if (abs < 60) return "now";
  if (abs < 3600) return `${Math.round(abs / 60)}m`;
  if (abs < 86400) return `${Math.round(abs / 3600)}h`;
  return `${Math.round(abs / 86400)}d`;
}

function formatMoney(amount: number): string {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function compareMessages(a: UiMessage, b: UiMessage): number {
  const timeDelta =
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  if (timeDelta !== 0) {
    return timeDelta;
  }
  return a.id.localeCompare(b.id);
}

function mergeMessages(existing: UiMessage[], incoming: UiMessage[]): UiMessage[] {
  const byId = new Map(existing.map((message) => [message.id, message]));

  for (const message of incoming) {
    const current = byId.get(message.id);
    byId.set(message.id, { ...current, ...message });
  }

  return Array.from(byId.values()).sort(compareMessages);
}

function getCounterparty(
  conversation: ConversationSummary,
  viewerId: string | null,
): ConversationSummary["participants"][number] | null {
  return (
    conversation.participants.find((participant) => participant.userId !== viewerId) ??
    conversation.participants[0] ??
    null
  );
}

function isNearBottom(element: HTMLDivElement | null): boolean {
  if (!element) {
    return true;
  }

  return element.scrollHeight - element.scrollTop - element.clientHeight < 96;
}

export default function MessagesPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const requestedConversationId = searchParams.get("conversationId");

  const [viewer, setViewer] = useState<User | null>(null);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [composer, setComposer] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearch = useDeferredValue(searchQuery);

  const listRef = useRef<HTMLDivElement | null>(null);
  const topSentinelRef = useRef<HTMLDivElement | null>(null);
  const shouldScrollToBottomRef = useRef(false);
  const preserveScrollRef = useRef(false);
  const previousScrollHeightRef = useRef(0);

  const syncRoute = (conversationId: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (conversationId) {
      params.set("conversationId", conversationId);
    } else {
      params.delete("conversationId");
    }

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  };

  const refreshConversations = useEffectEvent(async () => {
    try {
      const nextConversations = await fetchConversations();
      startTransition(() => {
        setConversations(nextConversations);
      });

      if (nextConversations.length === 0) {
        setActiveConversationId(null);
        return;
      }

      const targetId =
        (requestedConversationId &&
        nextConversations.some((conversation) => conversation.id === requestedConversationId)
          ? requestedConversationId
          : null) ??
        (activeConversationId &&
        nextConversations.some((conversation) => conversation.id === activeConversationId)
          ? activeConversationId
          : null) ??
        nextConversations[0]?.id ??
        null;

      if (targetId !== activeConversationId) {
        setActiveConversationId(targetId);
      }
    } catch {
      // Preserve current conversation rail on transient socket refresh failures.
    }
  });

  const loadMessages = useEffectEvent(
    async (conversationId: string, options?: { cursor?: string | null; prepend?: boolean }) => {
      if (options?.prepend) {
        setLoadingMore(true);
        if (listRef.current) {
          previousScrollHeightRef.current = listRef.current.scrollHeight;
          preserveScrollRef.current = true;
        }
      } else {
        setLoadingThread(true);
      }

      try {
        const response = await fetchConversationMessages({
          conversationId,
          cursor: options?.cursor ?? null,
          limit: 50,
        });
        const page = response.data.map((message) => ({ ...message }));

        setMessages((current) =>
          options?.prepend ? mergeMessages(current, page) : mergeMessages([], page),
        );
        setHasMore(response.meta.hasMore);
        setNextCursor(response.meta.nextCursor ?? null);

        if (!options?.prepend) {
          shouldScrollToBottomRef.current = true;
          void markConversationRead(conversationId);
        }
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError("Unable to load messages right now.");
        }
      } finally {
        setLoadingThread(false);
        setLoadingMore(false);
      }
    },
  );

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const [me, conversationList] = await Promise.all([fetchMe(), fetchConversations()]);
        if (cancelled) {
          return;
        }

        setViewer(me);
        startTransition(() => {
          setConversations(conversationList);
        });

        const initialConversationId =
          (requestedConversationId &&
          conversationList.some((conversation) => conversation.id === requestedConversationId)
            ? requestedConversationId
            : null) ??
          conversationList[0]?.id ??
          null;

        setActiveConversationId(initialConversationId);
        if (initialConversationId && initialConversationId !== requestedConversationId) {
          syncRoute(initialConversationId);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message
              : "Unable to load conversations right now.",
          );
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
  }, [requestedConversationId]);

  useEffect(() => {
    if (!activeConversationId) {
      setMessages([]);
      setNextCursor(null);
      setHasMore(false);
      return;
    }

    setError(null);
    void loadMessages(activeConversationId);
  }, [activeConversationId]);

  useEffect(() => {
    const sentinel = topSentinelRef.current;
    const container = listRef.current;
    if (!sentinel || !container || !activeConversationId) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0]?.isIntersecting &&
          hasMore &&
          nextCursor &&
          !loadingMore &&
          !loadingThread
        ) {
          void loadMessages(activeConversationId, {
            cursor: nextCursor,
            prepend: true,
          });
        }
      },
      {
        root: container,
        threshold: 0.9,
      },
    );

    observer.observe(sentinel);
    return () => {
      observer.disconnect();
    };
  }, [activeConversationId, hasMore, loadingMore, loadingThread, nextCursor]);

  useEffect(() => {
    const container = listRef.current;
    if (!container) {
      return;
    }

    if (preserveScrollRef.current) {
      const heightDelta = container.scrollHeight - previousScrollHeightRef.current;
      container.scrollTop += heightDelta;
      preserveScrollRef.current = false;
      return;
    }

    if (shouldScrollToBottomRef.current) {
      container.scrollTop = container.scrollHeight;
      shouldScrollToBottomRef.current = false;
    }
  }, [messages]);

  const onSocketMessage = useEffectEvent((message: ConversationMessage) => {
    void refreshConversations();

    if (message.conversationId !== activeConversationId) {
      return;
    }

    shouldScrollToBottomRef.current =
      isNearBottom(listRef.current) || message.senderId === viewer?.id;
    setMessages((current) => mergeMessages(current, [{ ...message }]));

    if (message.senderId !== viewer?.id && activeConversationId) {
      void markConversationRead(activeConversationId);
    }
  });

  const onSocketConversationUpdated = useEffectEvent(
    ({ conversationId }: { conversationId: string }) => {
      void refreshConversations();
      if (conversationId === activeConversationId) {
        void markConversationRead(conversationId);
      }
    },
  );

  useEffect(() => {
    const socket = getRealtimeSocket();
    if (!socket.connected) {
      socket.connect();
    }

    socket.on("message:new", onSocketMessage);
    socket.on("conversation:updated", onSocketConversationUpdated);

    return () => {
      socket.off("message:new", onSocketMessage);
      socket.off("conversation:updated", onSocketConversationUpdated);
    };
  }, [onSocketConversationUpdated, onSocketMessage]);

  const filteredConversations = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase();
    if (!query) {
      return conversations;
    }

    return conversations.filter((conversation) => {
      const counterparty = getCounterparty(conversation, viewer?.id ?? null);
      const haystack = [
        counterparty?.name ?? "",
        conversation.booking?.title ?? "",
        conversation.lastMessage?.content ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [conversations, deferredSearch, viewer?.id]);

  const activeConversation = useMemo(
    () =>
      conversations.find((conversation) => conversation.id === activeConversationId) ?? null,
    [activeConversationId, conversations],
  );

  const activeCounterparty = activeConversation
    ? getCounterparty(activeConversation, viewer?.id ?? null)
    : null;

  const selectConversation = (conversationId: string) => {
    setActiveConversationId(conversationId);
    syncRoute(conversationId);
  };

  const handleSend = async () => {
    if (!activeConversationId || !viewer || sending) {
      return;
    }

    const draft = composer.trim();
    if (!draft) {
      return;
    }

    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: UiMessage = {
      id: tempId,
      conversationId: activeConversationId,
      senderId: viewer.id,
      type: "TEXT",
      content: draft,
      fileUrl: null,
      isRead: true,
      createdAt: new Date().toISOString(),
      sender: {
        userId: viewer.id,
        name: viewer.fullName,
        avatarUrl: viewer.avatarUrl ?? null,
        role: viewer.role,
      },
      clientState: "sending",
    };

    shouldScrollToBottomRef.current = true;
    setComposer("");
    setSending(true);
    setMessages((current) => mergeMessages(current, [optimisticMessage]));

    try {
      const sentMessage = await sendConversationMessage({
        conversationId: activeConversationId,
        content: draft,
      });
      setMessages((current) =>
        mergeMessages(
          current.filter((message) => message.id !== tempId),
          [{ ...sentMessage }],
        ),
      );
      void refreshConversations();
    } catch (err) {
      setMessages((current) =>
        current.map((message) =>
          message.id === tempId ? { ...message, clientState: "failed" } : message,
        ),
      );
      setComposer(draft);
      setError(
        err instanceof ApiError
          ? err.message
          : "Unable to send the message right now.",
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <main className={styles.page}>
      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <div className={styles.search}>
            <span className="material-symbols-outlined">search</span>
            <input
              placeholder="Search conversations"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </div>

          <div className={styles.sidebarHeader}>
            <div>
              <h2>Inbox</h2>
              <p>{conversations.length} conversations</p>
            </div>
          </div>

          {loading ? <p className={styles.empty}>Loading conversations...</p> : null}
          {!loading && filteredConversations.length === 0 ? (
            <p className={styles.empty}>No conversations match that search.</p>
          ) : null}

          <div className={styles.conversations}>
            {filteredConversations.map((conversation) => {
              const counterparty = getCounterparty(conversation, viewer?.id ?? null);
              return (
                <button
                  key={conversation.id}
                  type="button"
                  className={styles.conversation}
                  data-active={conversation.id === activeConversationId}
                  onClick={() => selectConversation(conversation.id)}
                >
                  <div className={styles.avatar}>
                    {(counterparty?.name ?? "VC")
                      .split(/\s+/)
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((part) => part.charAt(0).toUpperCase())
                      .join("")}
                  </div>
                  <div className={styles.conversationCopy}>
                    <div className={styles.conversationMeta}>
                      <strong>{counterparty?.name ?? "Conversation"}</strong>
                      <span>{formatRelative(conversation.lastMessageAt)}</span>
                    </div>
                    <p>{conversation.lastMessage?.content ?? "No messages yet"}</p>
                    {conversation.booking ? (
                      <small>{conversation.booking.title}</small>
                    ) : null}
                  </div>
                  {conversation.unreadCount > 0 ? (
                    <span className={styles.unreadBadge}>
                      {conversation.unreadCount}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </aside>

        <section className={styles.thread}>
          {!activeConversation ? (
            <div className={styles.emptyThread}>
              <h2>Select a conversation</h2>
              <p>Booking-linked conversations will appear here once you start messaging.</p>
            </div>
          ) : (
            <>
              <div className={styles.threadHeader}>
                <div>
                  <h2>{activeCounterparty?.name ?? "Conversation"}</h2>
                  <p>
                    {activeConversation.booking
                      ? `Booking: ${activeConversation.booking.title}`
                      : "Direct conversation"}
                  </p>
                </div>
                {activeConversation.booking ? (
                  <Link
                    href={`/bookings/${activeConversation.booking.id}`}
                    className={styles.threadLink}
                  >
                    View booking
                  </Link>
                ) : null}
              </div>

              {error ? <div className={styles.error}>{error}</div> : null}

              <div className={styles.messages} ref={listRef}>
                <div ref={topSentinelRef} className={styles.sentinel}>
                  {loadingMore ? "Loading older messages..." : hasMore ? "" : "Start of conversation"}
                </div>

                {loadingThread ? (
                  <p className={styles.empty}>Loading messages...</p>
                ) : messages.length === 0 ? (
                  <p className={styles.empty}>
                    No messages yet. Send the first one.
                  </p>
                ) : (
                  messages.map((message) => {
                    const outgoing = message.senderId === viewer?.id;
                    return (
                      <div
                        key={message.id}
                        className={outgoing ? styles.msgOutgoing : styles.msgIncoming}
                      >
                        <p>{message.content}</p>
                        <span>
                          {formatClock(message.createdAt)}
                          {message.clientState === "sending" ? " · sending" : ""}
                          {message.clientState === "failed" ? " · failed" : ""}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>

              <div className={styles.compose}>
                <textarea
                  placeholder="Write a message..."
                  value={composer}
                  onChange={(event) => setComposer(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      void handleSend();
                    }
                  }}
                />
                <div className={styles.composeActions}>
                  <button type="button" disabled title="File attachments arrive in Phase 7">
                    <span className="material-symbols-outlined">attach_file</span>
                  </button>
                  <button
                    type="button"
                    className={styles.sendBtn}
                    onClick={() => void handleSend()}
                    disabled={sending || !composer.trim()}
                  >
                    <span className="material-symbols-outlined">send</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </section>

        <aside className={styles.details}>
          <h3>Conversation details</h3>
          {activeConversation?.booking ? (
            <div className={styles.detailCard}>
              <p className={styles.detailLabel}>Event</p>
              <p>{activeConversation.booking.title}</p>
              <p className={styles.detailLabel}>When</p>
              <p>
                {new Date(activeConversation.booking.eventDate).toLocaleString("en-ZA", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </p>
              <p className={styles.detailLabel}>Location</p>
              <p>{activeConversation.booking.location}</p>
              <p className={styles.detailLabel}>Budget</p>
              <p>{formatMoney(activeConversation.booking.totalAmount)}</p>
              <Link
                href={`/bookings/${activeConversation.booking.id}`}
                className={styles.detailLink}
              >
                Open booking
              </Link>
            </div>
          ) : (
            <p className={styles.empty}>Select a conversation to view the booking context.</p>
          )}
        </aside>
      </div>
    </main>
  );
}
