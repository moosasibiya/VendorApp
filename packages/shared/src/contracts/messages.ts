import type {
  BookingStatusValue,
  MessageTypeValue,
  NotificationTypeValue,
  UserRoleValue,
} from '../enums';

export interface ConversationParticipant {
  userId: string;
  name: string;
  avatarUrl?: string | null;
  role: UserRoleValue;
}

export interface ConversationBookingSummary {
  id: string;
  title: string;
  location: string;
  eventDate: string;
  status: BookingStatusValue;
  totalAmount: number;
  artistSlug: string;
}

export interface ConversationMessage {
  id: string;
  conversationId: string;
  senderId: string;
  type: MessageTypeValue;
  content: string;
  fileUrl?: string | null;
  isRead: boolean;
  createdAt: string;
  sender: ConversationParticipant;
}

export interface ConversationSummary {
  id: string;
  bookingId?: string | null;
  participantIds: string[];
  participants: ConversationParticipant[];
  lastMessageAt: string;
  unreadCount: number;
  lastMessage?: ConversationMessage | null;
  booking?: ConversationBookingSummary | null;
}

export interface CreateConversationInput {
  bookingId: string;
}

export interface NotificationItem {
  id: string;
  type: NotificationTypeValue;
  title: string;
  body: string;
  isRead: boolean;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

export interface NotificationFeed {
  notifications: NotificationItem[];
  unreadCount: number;
  nextCursor?: string | null;
  hasMore: boolean;
}
