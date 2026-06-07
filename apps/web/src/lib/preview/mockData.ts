import type {
  ApiResponse,
  Artist,
  ArtistCategory,
  Booking,
  ConversationMessage,
  ConversationSummary,
  CursorApiResponse,
  DashboardStats,
  MyReviewsOverview,
  NotificationFeed,
  UpcomingBookingItem,
} from "@vendorapp/shared";

const now = new Date();
const plusDays = (days: number) => new Date(now.getTime() + days * 86_400_000).toISOString();
const minusDays = (days: number) => new Date(now.getTime() - days * 86_400_000).toISOString();

export const previewCategories: ArtistCategory[] = [
  { id: "cat-photo", name: "Photography", slug: "photography" },
  { id: "cat-video", name: "Videography", slug: "videography" },
  { id: "cat-content", name: "Content Creation", slug: "content" },
  { id: "cat-design", name: "Design", slug: "design" },
  { id: "cat-events", name: "Event Coverage", slug: "events" },
  { id: "cat-direction", name: "Creative Direction", slug: "direction" },
];

export const previewArtists: Artist[] = [
  {
    id: "creative-ava",
    userId: "user-ava",
    name: "Ava Maseko",
    role: "Editorial Photographer",
    location: "Cape Town",
    rating: "4.9",
    slug: "ava-maseko",
    hourlyRate: 6500,
    isAvailable: true,
    isVerified: true,
    bio: "Cinematic portrait, fashion, and launch campaign work for founders, labels, and production teams.",
    tags: ["Editorial", "Portraits", "Luxury launches"],
    services: ["Photography", "Creative Direction", "Retouching"],
    specialties: ["Fashion editorial", "Founder portraits", "Brand campaigns"],
    pricingSummary: "Half-day projects from R6,500. Full campaign days from R14,000.",
    availabilitySummary: "Available for Cape Town shoots and selected travel windows.",
    portfolioImages: [
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=1200&q=80",
    ],
    averageRating: 4.9,
    totalReviews: 42,
    profileViews: 2380,
    category: previewCategories[0],
    applicationStatus: "LIVE",
    isLive: true,
    normalCommissionRate: 12,
    temporaryFirstBookingCommissionRate: 18,
    tierProgress: {
      currentTier: {
        id: "tier-signature",
        key: "signature",
        name: "Signature",
        description: "Trusted high-value creative",
        sortOrder: 3,
        isActive: true,
        thresholds: {},
        benefits: {},
        createdAt: minusDays(120),
        updatedAt: minusDays(7),
      },
      evaluatedTier: null,
      progressPercent: 78,
      metrics: {
        completedPlatformBookings: 24,
        verifiedPlatformBookings: 22,
        averageRating: 4.9,
        cancellationCount: 1,
        platformRevenue: 186000,
        reliabilityScore: 96,
        disputeCount: 1,
        disputeRate: 0.4,
        profileCompleteness: 94,
        repeatBookings: 8,
      },
      reasons: ["Strong verified review history", "High repeat-client rate"],
    },
  },
  {
    id: "creative-kamo",
    userId: "user-kamo",
    name: "Kamo Media",
    role: "Commercial Videographer",
    location: "Johannesburg",
    rating: "4.8",
    slug: "kamo-media",
    hourlyRate: 8200,
    isAvailable: true,
    isVerified: true,
    bio: "Lean video crew for launch films, content retainers, and social-first product stories.",
    tags: ["Video", "Commercial", "Social content"],
    services: ["Videography", "Editing", "Drone"],
    specialties: ["Product launches", "Corporate film", "Social campaigns"],
    pricingSummary: "Launch films from R18,000. Content days from R8,200.",
    availabilitySummary: "Booking two weeks ahead for Gauteng and Durban travel.",
    portfolioImages: [
      "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=80",
    ],
    averageRating: 4.8,
    totalReviews: 31,
    profileViews: 1904,
    category: previewCategories[1],
  },
  {
    id: "creative-luna",
    userId: "user-luna",
    name: "Luna Studio",
    role: "Content Production Team",
    location: "Durban",
    rating: "4.7",
    slug: "luna-studio",
    hourlyRate: 5400,
    isAvailable: false,
    isVerified: true,
    bio: "A compact team for hospitality, lifestyle, and always-on brand content.",
    tags: ["Lifestyle", "Hospitality", "Retainers"],
    services: ["Photography", "Short-form Video", "Art Direction"],
    specialties: ["Hotels", "Restaurants", "Lifestyle products"],
    pricingSummary: "Monthly retainers from R22,000. Shoot days from R5,400.",
    availabilitySummary: "Next openings in three weeks.",
    portfolioImages: [
      "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1529636798458-92182e662485?auto=format&fit=crop&w=1200&q=80",
    ],
    averageRating: 4.7,
    totalReviews: 27,
    profileViews: 1420,
    category: previewCategories[2],
  },
];

export const previewBookings: Booking[] = [
  {
    id: "project-noir-launch",
    title: "Noir fragrance launch campaign",
    description: "Campaign stills, short-form cutdowns, and launch-night content capture.",
    eventDate: plusDays(6),
    eventEndDate: plusDays(7),
    location: "Cape Town",
    notes: "Mood is cinematic, tactile, and late-night editorial.",
    status: "CONFIRMED",
    paymentStatus: "PAID",
    totalAmount: 28500,
    platformFee: 3420,
    artistPayout: 25080,
    clientId: "preview-client",
    artistId: "creative-ava",
    client: { id: "preview-client", name: "Naledi Khumalo" },
    artist: {
      id: "creative-ava",
      name: "Ava Maseko",
      slug: "ava-maseko",
      userId: "user-ava",
      hourlyRate: 6500,
      location: "Cape Town",
      isAvailable: true,
    },
    verificationStatus: "PENDING",
    payoutStatus: "NOT_READY",
    availableActions: ["complete", "dispute"],
    timeline: [],
    auditEvents: [],
    createdAt: minusDays(8),
    updatedAt: minusDays(1),
  },
  {
    id: "project-gallery-reel",
    title: "Gallery opening reel package",
    description: "Event coverage, one hero reel, and twelve social-ready clips.",
    eventDate: plusDays(12),
    eventEndDate: plusDays(12),
    location: "Johannesburg",
    notes: "Focus on guest flow, artworks, and sponsor details.",
    status: "PENDING",
    paymentStatus: "UNPAID",
    totalAmount: 16400,
    platformFee: 1968,
    artistPayout: 14432,
    clientId: "preview-client",
    artistId: "creative-kamo",
    client: { id: "preview-client", name: "Naledi Khumalo" },
    artist: {
      id: "creative-kamo",
      name: "Kamo Media",
      slug: "kamo-media",
      userId: "user-kamo",
      hourlyRate: 8200,
      location: "Johannesburg",
      isAvailable: true,
    },
    verificationStatus: "NOT_REQUIRED",
    payoutStatus: "NOT_READY",
    availableActions: ["confirm", "cancel"],
    timeline: [],
    auditEvents: [],
    createdAt: minusDays(2),
    updatedAt: minusDays(1),
  },
];

export function previewApiEnvelope<T>(data: T): ApiResponse<T> {
  return { data };
}

export function previewCursorEnvelope<T>(data: T): CursorApiResponse<T> {
  const limit = Array.isArray(data) ? data.length : 1;
  return { data, meta: { limit, nextCursor: null, hasMore: false } };
}

export function getPreviewStats(role: string): DashboardStats {
  if (role === "ARTIST") {
    return {
      role: "ARTIST",
      totalBookings: 24,
      pendingBookings: 3,
      totalEarned: 186000,
      averageRating: 4.9,
      totalReviews: 42,
      profileViews: 2380,
    };
  }
  if (role === "ADMIN" || role === "SUB_ADMIN") {
    return { role: "ADMIN", totalUsers: 428, totalBookings: 96, totalRevenue: 1240000 };
  }
  return {
    role: "CLIENT",
    totalBookings: 8,
    upcomingBookings: 2,
    totalSpent: 146000,
    favouriteArtists: 5,
  };
}

export function getPreviewUpcomingBookings(): UpcomingBookingItem[] {
  return previewBookings.map((booking) => ({
    id: booking.id,
    title: booking.title,
    eventDate: booking.eventDate,
    location: booking.location,
    status: booking.status,
    paymentStatus: booking.paymentStatus,
    totalAmount: booking.totalAmount,
    counterpartName: booking.artist.name,
    counterpartAvatarUrl: null,
    artistSlug: booking.artist.slug,
  }));
}

export function getPreviewNotifications(): NotificationFeed {
  return {
    unreadCount: 2,
    hasMore: false,
    nextCursor: null,
    notifications: [
      {
        id: "note-project-confirmed",
        type: "BOOKING_CONFIRMED",
        title: "Project confirmed",
        body: "Ava Maseko confirmed Noir fragrance launch campaign.",
        isRead: false,
        metadata: { bookingId: "project-noir-launch" },
        createdAt: minusDays(1),
      },
      {
        id: "note-message",
        type: "MESSAGE_RECEIVED",
        title: "New message",
        body: "Kamo Media added availability notes for the gallery reel.",
        isRead: false,
        metadata: { conversationId: "conversation-gallery" },
        createdAt: minusDays(2),
      },
    ],
  };
}

export function getPreviewConversations(): CursorApiResponse<ConversationSummary[]> {
  return previewCursorEnvelope([
    {
      id: "conversation-noir",
      bookingId: "project-noir-launch",
      participantIds: ["preview-client", "user-ava"],
      kind: "BOOKING",
      subject: "Noir fragrance launch campaign",
      participants: [
        { userId: "preview-client", name: "Naledi Khumalo", role: "CLIENT" },
        { userId: "user-ava", name: "Ava Maseko", role: "ARTIST" },
      ],
      booking: {
        id: "project-noir-launch",
        title: "Noir fragrance launch campaign",
        eventDate: plusDays(6),
        location: "Cape Town",
        status: "CONFIRMED",
        totalAmount: 28500,
        artistSlug: "ava-maseko",
      },
      supportCategory: null,
      supportStatus: null,
      supportTicketNumber: null,
      lastMessage: {
        id: "msg-1",
        conversationId: "conversation-noir",
        senderId: "user-ava",
        content: "I added a tighter reference board and can shoot the bottle detail first.",
        type: "TEXT",
        isRead: false,
        createdAt: minusDays(1),
        sender: { userId: "user-ava", name: "Ava Maseko", role: "ARTIST" },
      },
      unreadCount: 1,
      lastMessageAt: minusDays(1),
    },
  ]);
}

export function getPreviewMessages(): CursorApiResponse<ConversationMessage[]> {
  return previewCursorEnvelope([
    {
      id: "msg-1",
      conversationId: "conversation-noir",
      senderId: "user-ava",
      content: "I added a tighter reference board and can shoot the bottle detail first.",
      type: "TEXT",
      isRead: false,
      createdAt: minusDays(1),
      sender: { userId: "user-ava", name: "Ava Maseko", role: "ARTIST" },
    },
    {
      id: "msg-2",
      conversationId: "conversation-noir",
      senderId: "preview-client",
      content: "Perfect. Keep the lighting moody but make the label readable.",
      type: "TEXT",
      isRead: true,
      createdAt: minusDays(1),
      sender: { userId: "preview-client", name: "Naledi Khumalo", role: "CLIENT" },
    },
  ]);
}

export function getPreviewReviews(): MyReviewsOverview {
  return {
    averageRating: 4.9,
    totalReviews: 3,
    received: [
      {
        id: "review-1",
        rating: 5,
        comment: "Sharp planning, premium delivery, and the final gallery felt campaign-ready.",
        isPublic: true,
        bookingId: "project-noir-launch",
        bookingTitle: "Noir fragrance launch campaign",
        eventDate: minusDays(12),
        reviewer: { id: "preview-client", name: "Naledi Khumalo" },
        artist: { id: "creative-ava", name: "Ava Maseko", slug: "ava-maseko" },
        createdAt: minusDays(8),
        updatedAt: minusDays(8),
      },
    ],
    left: [],
  };
}
