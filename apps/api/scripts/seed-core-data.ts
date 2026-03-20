import {
  AccountType,
  ArtistApplicationStatus,
  BookingStatus,
  BookingVerificationStatus,
  OnboardingFeeModel,
  PaymentProvider,
  PaymentStatus,
  PayoutStatus,
  PrismaClient,
  UserRole,
} from '@prisma/client';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

function loadLocalEnvFile(): void {
  const envPath = join(process.cwd(), '.env');
  if (!existsSync(envPath)) return;

  const raw = readFileSync(envPath, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const separator = trimmed.indexOf('=');
    if (separator <= 0) continue;

    const key = trimmed.slice(0, separator).trim();
    if (!key || process.env[key] !== undefined) continue;

    let value = trimmed.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}

loadLocalEnvFile();

const prisma = new PrismaClient();

type UserSeed = {
  fullName: string;
  username: string;
  email: string;
  role: UserRole;
  accountType: AccountType;
  avatarUrl: string;
  location?: string;
  clientEventTypes?: string[];
  clientBudgetMin?: string;
  clientBudgetMax?: string;
  onboardingCompletedAt?: string;
};

type ArtistSeed = {
  slug: string;
  userEmail: string;
  categorySlug: string;
  displayName: string;
  legacyRole: string;
  location: string;
  bio: string;
  hourlyRate: string;
  isAvailable: boolean;
  averageRating: number;
  totalReviews: number;
  profileViews: number;
  isVerified: boolean;
  portfolioImages: string[];
  tags: string[];
  services: string[];
  specialties: string[];
  pricingSummary: string;
  availabilitySummary: string;
  applicationSubmittedAt: string;
};

type BookingSeed = {
  id: string;
  clientEmail: string;
  artistSlug: string;
  agencySlug?: string;
  title: string;
  description: string;
  eventDate: string;
  eventEndDate?: string;
  location: string;
  status: BookingStatus;
  totalAmount: string;
  platformFee: string;
  artistPayout: string;
  paymentProvider?: PaymentProvider;
  paymentStatus: PaymentStatus;
  paymentReference?: string;
  paymentGatewayReference?: string;
  stripePaymentIntentId?: string;
  paymentInitiatedAt?: string;
  paymentPaidAt?: string;
  paymentFailedAt?: string;
  notes?: string;
  artistName: string;
  artistInitials: string;
  legacyDate: string;
  legacyAmount: string;
  applications: number;
  verificationStatus?: BookingVerificationStatus;
  verificationCodeSentAt?: string;
  verificationCodeExpiresAt?: string;
  jobStartedAt?: string;
  jobCompletedAt?: string;
  clientApprovedAt?: string;
  disputeOpenedAt?: string;
  disputeWindowEndsAt?: string;
  payoutStatus?: PayoutStatus;
  payoutPendingAt?: string;
  estimatedPayoutReleaseAt?: string;
  payoutReleasedAt?: string;
  payoutHoldReason?: string;
  payoutDelayDaysSnapshot?: number;
  normalCommissionRate?: string;
  appliedCommissionRate?: string;
  onboardingExtraCutAmount?: string;
};

const seedPasswordSalt = 'seeded-password-salt';
const seedPasswordHash = 'seeded-password-hash';

const categoriesSeed = [
  {
    slug: 'photography',
    name: 'Photography',
    iconUrl: 'https://cdn.vendorapp.local/categories/photography.svg',
  },
  {
    slug: 'videography',
    name: 'Videography',
    iconUrl: 'https://cdn.vendorapp.local/categories/videography.svg',
  },
  {
    slug: 'live-entertainment',
    name: 'Live Entertainment',
    iconUrl: 'https://cdn.vendorapp.local/categories/live-entertainment.svg',
  },
];

const userSeeds: UserSeed[] = [
  {
    fullName: 'Kuhle Ndlovu',
    username: 'kuhle',
    email: 'kuhle@vendorapp.dev',
    role: UserRole.ARTIST,
    accountType: AccountType.CREATIVE,
    avatarUrl: 'https://cdn.vendorapp.local/avatars/kuhle.webp',
    location: 'Johannesburg',
    onboardingCompletedAt: '2026-01-10T09:00:00.000Z',
  },
  {
    fullName: 'Ayanda Khumalo',
    username: 'ayanda',
    email: 'ayanda@vendorapp.dev',
    role: UserRole.ARTIST,
    accountType: AccountType.CREATIVE,
    avatarUrl: 'https://cdn.vendorapp.local/avatars/ayanda.webp',
    location: 'Cape Town',
    onboardingCompletedAt: '2026-01-11T09:00:00.000Z',
  },
  {
    fullName: 'Nandi Mokoena',
    username: 'nandi',
    email: 'nandi@vendorapp.dev',
    role: UserRole.ARTIST,
    accountType: AccountType.CREATIVE,
    avatarUrl: 'https://cdn.vendorapp.local/avatars/nandi.webp',
    location: 'Durban',
    onboardingCompletedAt: '2026-01-12T09:00:00.000Z',
  },
  {
    fullName: 'Themba Dlamini',
    username: 'themba',
    email: 'themba@vendorapp.dev',
    role: UserRole.ARTIST,
    accountType: AccountType.CREATIVE,
    avatarUrl: 'https://cdn.vendorapp.local/avatars/themba.webp',
    location: 'Pretoria',
    onboardingCompletedAt: '2026-01-13T09:00:00.000Z',
  },
  {
    fullName: 'Lindiwe Rossouw',
    username: 'lindiwe',
    email: 'lindiwe@vendorapp.dev',
    role: UserRole.ARTIST,
    accountType: AccountType.CREATIVE,
    avatarUrl: 'https://cdn.vendorapp.local/avatars/lindiwe.webp',
    location: 'Cape Town',
    onboardingCompletedAt: '2026-01-14T09:00:00.000Z',
  },
  {
    fullName: 'Frame House Collective',
    username: 'framehouse',
    email: 'agency@vendorapp.dev',
    role: UserRole.AGENCY,
    accountType: AccountType.AGENCY,
    avatarUrl: 'https://cdn.vendorapp.local/avatars/frame-house.webp',
    location: 'Cape Town',
    onboardingCompletedAt: '2026-01-15T09:00:00.000Z',
  },
  {
    fullName: 'Sarah Daniels',
    username: 'sarahdaniels',
    email: 'sarah@vendorapp.dev',
    role: UserRole.CLIENT,
    accountType: AccountType.CLIENT,
    avatarUrl: 'https://cdn.vendorapp.local/avatars/sarah.webp',
    location: 'Johannesburg',
    clientEventTypes: ['Wedding', 'Private Celebration'],
    clientBudgetMin: '5000.00',
    clientBudgetMax: '25000.00',
    onboardingCompletedAt: '2026-01-16T09:00:00.000Z',
  },
  {
    fullName: 'Musa Jacobs',
    username: 'musajacobs',
    email: 'musa@vendorapp.dev',
    role: UserRole.CLIENT,
    accountType: AccountType.CLIENT,
    avatarUrl: 'https://cdn.vendorapp.local/avatars/musa.webp',
    location: 'Cape Town',
    clientEventTypes: ['Brand Campaign', 'Product Launch'],
    clientBudgetMin: '7500.00',
    clientBudgetMax: '40000.00',
    onboardingCompletedAt: '2026-01-17T09:00:00.000Z',
  },
  {
    fullName: 'Moosa Admin',
    username: 'moosaadmin',
    email: 'admin@vendorapp.dev',
    role: UserRole.ADMIN,
    accountType: AccountType.CLIENT,
    avatarUrl: 'https://cdn.vendorapp.local/avatars/admin.webp',
    location: 'Johannesburg',
    onboardingCompletedAt: '2026-01-18T09:00:00.000Z',
  },
  {
    fullName: 'Platform Ops',
    username: 'platformops',
    email: 'ops@vendorapp.dev',
    role: UserRole.SUB_ADMIN,
    accountType: AccountType.CLIENT,
    avatarUrl: 'https://cdn.vendorapp.local/avatars/ops.webp',
    location: 'Cape Town',
    onboardingCompletedAt: '2026-01-19T09:00:00.000Z',
  },
];

const artistSeeds: ArtistSeed[] = [
  {
    slug: 'kuhle',
    userEmail: 'kuhle@vendorapp.dev',
    categorySlug: 'photography',
    displayName: 'Kuhle Ndlovu',
    legacyRole: 'Photographer',
    location: 'Johannesburg',
    bio: 'Editorial and wedding photographer with a clean, cinematic style.',
    hourlyRate: '1500.00',
    isAvailable: true,
    averageRating: 4.9,
    totalReviews: 28,
    profileViews: 184,
    isVerified: true,
    portfolioImages: [
      'https://cdn.vendorapp.local/portfolio/kuhle-1.webp',
      'https://cdn.vendorapp.local/portfolio/kuhle-2.webp',
    ],
    tags: ['weddings', 'editorial', 'portraits'],
    services: ['Full-day wedding coverage', 'Editorial portraits'],
    specialties: ['Natural light', 'Luxury weddings', 'Art direction'],
    pricingSummary: 'From R1,500 per hour, full-day packages available.',
    availabilitySummary: 'Available for weekend weddings and destination shoots.',
    applicationSubmittedAt: '2026-01-10T09:00:00.000Z',
  },
  {
    slug: 'ayanda-khumalo',
    userEmail: 'ayanda@vendorapp.dev',
    categorySlug: 'videography',
    displayName: 'Ayanda Khumalo',
    legacyRole: 'Videographer',
    location: 'Cape Town',
    bio: 'Brand and event filmmaker focused on polished story-led campaigns.',
    hourlyRate: '1850.00',
    isAvailable: true,
    averageRating: 4.8,
    totalReviews: 19,
    profileViews: 141,
    isVerified: true,
    portfolioImages: [
      'https://cdn.vendorapp.local/portfolio/ayanda-1.webp',
      'https://cdn.vendorapp.local/portfolio/ayanda-2.webp',
    ],
    tags: ['brand', 'events', 'campaigns'],
    services: ['Campaign films', 'Event recaps'],
    specialties: ['Product launches', 'Lifestyle campaigns', 'Drone footage'],
    pricingSummary: 'Campaign shoots from R1,850 per hour.',
    availabilitySummary: 'Booking 2 to 4 weeks in advance for commercial work.',
    applicationSubmittedAt: '2026-01-11T09:00:00.000Z',
  },
  {
    slug: 'nandi-mokoena',
    userEmail: 'nandi@vendorapp.dev',
    categorySlug: 'live-entertainment',
    displayName: 'Nandi Mokoena',
    legacyRole: 'Singer',
    location: 'Durban',
    bio: 'Live vocalist and MC for premium celebrations and brand activations.',
    hourlyRate: '2200.00',
    isAvailable: true,
    averageRating: 4.7,
    totalReviews: 15,
    profileViews: 96,
    isVerified: true,
    portfolioImages: [
      'https://cdn.vendorapp.local/portfolio/nandi-1.webp',
      'https://cdn.vendorapp.local/portfolio/nandi-2.webp',
    ],
    tags: ['live music', 'mc', 'events'],
    services: ['Live performance', 'MC services'],
    specialties: ['Corporate galas', 'Luxury weddings', 'Cocktail sets'],
    pricingSummary: 'Performance bookings from R2,200 per hour.',
    availabilitySummary: 'Evening and weekend bookings available.',
    applicationSubmittedAt: '2026-01-12T09:00:00.000Z',
  },
  {
    slug: 'themba-dlamini',
    userEmail: 'themba@vendorapp.dev',
    categorySlug: 'photography',
    displayName: 'Themba Dlamini',
    legacyRole: 'Photographer',
    location: 'Pretoria',
    bio: 'Commercial and portrait photographer with fast turnaround for teams.',
    hourlyRate: '1350.00',
    isAvailable: false,
    averageRating: 4.6,
    totalReviews: 11,
    profileViews: 73,
    isVerified: false,
    portfolioImages: [
      'https://cdn.vendorapp.local/portfolio/themba-1.webp',
      'https://cdn.vendorapp.local/portfolio/themba-2.webp',
    ],
    tags: ['corporate', 'headshots', 'portraits'],
    services: ['Corporate headshots', 'Portrait sessions'],
    specialties: ['Studio portraits', 'Executive headshots'],
    pricingSummary: 'Portrait sessions from R1,350 per hour.',
    availabilitySummary: 'Currently booking from next month onward.',
    applicationSubmittedAt: '2026-01-13T09:00:00.000Z',
  },
  {
    slug: 'lindiwe-rossouw',
    userEmail: 'lindiwe@vendorapp.dev',
    categorySlug: 'videography',
    displayName: 'Lindiwe Rossouw',
    legacyRole: 'Videographer',
    location: 'Cape Town',
    bio: 'Documentary-style wedding filmmaker with a modern editorial finish.',
    hourlyRate: '2100.00',
    isAvailable: true,
    averageRating: 4.9,
    totalReviews: 24,
    profileViews: 165,
    isVerified: true,
    portfolioImages: [
      'https://cdn.vendorapp.local/portfolio/lindiwe-1.webp',
      'https://cdn.vendorapp.local/portfolio/lindiwe-2.webp',
    ],
    tags: ['weddings', 'documentary', 'films'],
    services: ['Wedding films', 'Highlight reels'],
    specialties: ['Destination weddings', 'Story edits', 'Audio design'],
    pricingSummary: 'Wedding films from R2,100 per hour.',
    availabilitySummary: 'Open for destination work and multi-day bookings.',
    applicationSubmittedAt: '2026-01-14T09:00:00.000Z',
  },
];

const agencySeed = {
  ownerEmail: 'agency@vendorapp.dev',
  slug: 'frame-house-collective',
  name: 'Frame House Collective',
  description: 'Boutique talent representation for premium photographers and filmmakers.',
  logoUrl: 'https://cdn.vendorapp.local/logos/frame-house.webp',
  website: 'https://framehouse.example.com',
  contactName: 'Frame House Team',
  contactEmail: 'agency@vendorapp.dev',
  isVerified: true,
};

const platformSettingsSeed: Array<{
  key: string;
  value: number | string;
  description: string;
}> = [
  {
    key: 'maxPrelaunchPoolSize',
    value: 100,
    description:
      'Maximum number of artist applications auto-routed into the prelaunch pool.',
  },
  {
    key: 'liveArtistSlotLimit',
    value: 20,
    description:
      'Maximum number of artist profiles allowed to be live in the current rollout wave.',
  },
  {
    key: 'onboardingFeeModel',
    value: OnboardingFeeModel.FIRST_BOOKING_DEDUCTION,
    description: 'Switch between upfront onboarding fees and first-booking deduction.',
  },
  {
    key: 'normalCommissionRate',
    value: 15,
    description: 'Base platform commission percentage for artists after onboarding recovery.',
  },
  {
    key: 'temporaryFirstBookingCommissionRate',
    value: 25,
    description:
      'Temporary commission percentage used to recover onboarding cost on the first completed booking.',
  },
  {
    key: 'disputeWindowDays',
    value: 3,
    description:
      'Default number of days clients can open a standard dispute after completion approval.',
  },
  {
    key: 'bookingStartCodeLength',
    value: 6,
    description: 'Number of digits in the client safety verification code.',
  },
  {
    key: 'startCodeActivationHours',
    value: 24,
    description:
      'Hours before the booking start when the booking moves into the awaiting-start-code stage.',
  },
  {
    key: 'clientApprovalGraceHours',
    value: 24,
    description:
      'Hours after artist completion before the booking auto-moves into the completed state.',
  },
];

const tierDefinitionSeed = [
  {
    id: 'tier_definition_1',
    key: 'tier_1',
    name: 'Tier 1',
    description:
      'Initial launch tier. Placeholder thresholds should be tuned by admins before wider rollout.',
    sortOrder: 1,
    thresholds: {
      completedPlatformBookings: 0,
      minProfileCompleteness: 40,
    },
    benefits: {
      visibilityBoost: 1,
      recommendedBoost: 1,
      payoutDelayDays: 7,
      badgeLabel: 'Tier 1',
      trustIndicator: 'Emerging',
      accessToSpecialOpportunities: false,
    },
  },
  {
    id: 'tier_definition_2',
    key: 'tier_2',
    name: 'Tier 2',
    description:
      'Placeholder mid-tier for dependable artists. Thresholds are configurable in admin.',
    sortOrder: 2,
    thresholds: {
      completedPlatformBookings: 10,
      platformRevenue: 25000,
      averageRating: 4.4,
      minProfileCompleteness: 70,
      minReliabilityScore: 90,
      maxDisputeRate: 15,
    },
    benefits: {
      visibilityBoost: 1.08,
      recommendedBoost: 1.1,
      payoutDelayDays: 5,
      badgeLabel: 'Tier 2',
      trustIndicator: 'Established',
      accessToSpecialOpportunities: false,
    },
  },
  {
    id: 'tier_definition_3',
    key: 'tier_3',
    name: 'Tier 3',
    description: 'Placeholder high-performance tier. Tune before launch waves expand.',
    sortOrder: 3,
    thresholds: {
      completedPlatformBookings: 25,
      platformRevenue: 75000,
      averageRating: 4.6,
      minProfileCompleteness: 85,
      minReliabilityScore: 94,
      maxDisputeRate: 10,
      minRepeatBookings: 3,
    },
    benefits: {
      visibilityBoost: 1.16,
      recommendedBoost: 1.2,
      payoutDelayDays: 3,
      badgeLabel: 'Tier 3',
      trustIndicator: 'Trusted',
      accessToSpecialOpportunities: true,
    },
  },
  {
    id: 'tier_definition_4',
    key: 'tier_4',
    name: 'Tier 4',
    description: 'Placeholder top tier for launch-era routing and payout rewards.',
    sortOrder: 4,
    thresholds: {
      completedPlatformBookings: 60,
      platformRevenue: 180000,
      averageRating: 4.8,
      minProfileCompleteness: 95,
      minReliabilityScore: 97,
      maxDisputeRate: 6,
      minRepeatBookings: 8,
      maxResponseTimeMinutes: 240,
    },
    benefits: {
      visibilityBoost: 1.28,
      recommendedBoost: 1.35,
      payoutDelayDays: 2,
      badgeLabel: 'Tier 4',
      trustIndicator: 'Priority',
      accessToSpecialOpportunities: true,
    },
  },
];

const bookingSeeds: BookingSeed[] = [
  {
    id: 'booking-kuhle-wedding',
    clientEmail: 'sarah@vendorapp.dev',
    artistSlug: 'kuhle',
    title: 'Luxury Wedding Content Capture',
    description: 'Full-day wedding coverage with ceremony, portraits, and reception highlights.',
    eventDate: '2026-09-12T09:00:00.000Z',
    eventEndDate: '2026-09-12T18:00:00.000Z',
    location: 'Stellenbosch, South Africa',
    status: BookingStatus.PENDING,
    totalAmount: '15000.00',
    platformFee: '1500.00',
    artistPayout: '13500.00',
    paymentProvider: PaymentProvider.PAYFAST,
    paymentStatus: PaymentStatus.UNPAID,
    paymentReference: 'booking-kuhle-wedding',
    notes: 'Client requested a calm documentary style with family portraits.',
    artistName: 'Kuhle Ndlovu',
    artistInitials: 'KN',
    legacyDate: '12 Sep 2026',
    legacyAmount: 'R15,000',
    applications: 1,
  },
  {
    id: 'booking-ayanda-brand-campaign',
    clientEmail: 'musa@vendorapp.dev',
    artistSlug: 'ayanda-khumalo',
    agencySlug: 'frame-house-collective',
    title: 'Brand Launch Campaign Video',
    description: 'Half-day product launch coverage with a 60-second hero edit and social cutdowns.',
    eventDate: '2026-05-22T10:00:00.000Z',
    eventEndDate: '2026-05-22T16:00:00.000Z',
    location: 'Johannesburg, South Africa',
    status: BookingStatus.BOOKED,
    totalAmount: '18500.00',
    platformFee: '1850.00',
    artistPayout: '16650.00',
    paymentProvider: PaymentProvider.PAYFAST,
    paymentStatus: PaymentStatus.PAID,
    paymentReference: 'booking-ayanda-brand-campaign',
    paymentGatewayReference: 'pf_test_vendorapp_phase5',
    stripePaymentIntentId: 'pi_test_vendorapp_phase2',
    paymentInitiatedAt: '2026-05-01T09:00:00.000Z',
    paymentPaidAt: '2026-05-01T09:10:00.000Z',
    notes: 'Final delivery includes a master edit and three cutdowns.',
    artistName: 'Ayanda Khumalo',
    artistInitials: 'AK',
    legacyDate: '22 May 2026',
    legacyAmount: 'R18,500',
    applications: 2,
    verificationStatus: BookingVerificationStatus.PENDING,
    verificationCodeSentAt: '2026-05-21T10:00:00.000Z',
    verificationCodeExpiresAt: '2026-05-22T10:00:00.000Z',
    disputeWindowEndsAt: '2026-05-25T16:00:00.000Z',
    payoutStatus: PayoutStatus.NOT_READY,
    normalCommissionRate: '15.00',
    appliedCommissionRate: '15.00',
    onboardingExtraCutAmount: '0.00',
  },
  {
    id: 'booking-lindiwe-wedding-film',
    clientEmail: 'sarah@vendorapp.dev',
    artistSlug: 'lindiwe-rossouw',
    title: 'Wedding Highlight Film',
    description: 'Documentary-style wedding film with teaser delivery and final highlight edit.',
    eventDate: '2026-02-14T09:00:00.000Z',
    eventEndDate: '2026-02-14T18:00:00.000Z',
    location: 'Franschhoek, South Africa',
    status: BookingStatus.PAYOUT_RELEASED,
    totalAmount: '21000.00',
    platformFee: '3150.00',
    artistPayout: '17850.00',
    paymentProvider: PaymentProvider.PAYFAST,
    paymentStatus: PaymentStatus.PAID,
    paymentReference: 'booking-lindiwe-wedding-film',
    paymentGatewayReference: 'pf_test_vendorapp_released',
    paymentInitiatedAt: '2026-02-01T08:00:00.000Z',
    paymentPaidAt: '2026-02-01T08:07:00.000Z',
    notes: 'Client approved completion after final film delivery.',
    artistName: 'Lindiwe Rossouw',
    artistInitials: 'LR',
    legacyDate: '14 Feb 2026',
    legacyAmount: 'R21,000',
    applications: 1,
    verificationStatus: BookingVerificationStatus.VERIFIED,
    verificationCodeSentAt: '2026-02-14T07:00:00.000Z',
    verificationCodeExpiresAt: '2026-02-14T09:00:00.000Z',
    jobStartedAt: '2026-02-14T09:05:00.000Z',
    jobCompletedAt: '2026-02-14T18:10:00.000Z',
    clientApprovedAt: '2026-02-15T09:00:00.000Z',
    disputeWindowEndsAt: '2026-02-18T09:00:00.000Z',
    payoutStatus: PayoutStatus.RELEASED,
    payoutPendingAt: '2026-02-18T09:00:00.000Z',
    estimatedPayoutReleaseAt: '2026-02-20T09:00:00.000Z',
    payoutReleasedAt: '2026-02-20T09:00:00.000Z',
    payoutDelayDaysSnapshot: 2,
    normalCommissionRate: '15.00',
    appliedCommissionRate: '15.00',
    onboardingExtraCutAmount: '0.00',
  },
];

async function upsertUser(user: UserSeed) {
  const emailNormalized = user.email.toLowerCase();
  const usernameNormalized = user.username.toLowerCase();

  return prisma.user.upsert({
    where: { emailNormalized },
    update: {
      fullName: user.fullName,
      name: user.fullName,
      username: user.username,
      usernameNormalized,
      email: user.email,
      role: user.role,
      accountType: user.accountType,
      avatarUrl: user.avatarUrl,
      location: user.location ?? null,
      clientEventTypes: user.clientEventTypes ?? [],
      clientBudgetMin: user.clientBudgetMin ?? null,
      clientBudgetMax: user.clientBudgetMax ?? null,
      notificationPreferences: { email: true },
      onboardingCompletedAt: user.onboardingCompletedAt ? new Date(user.onboardingCompletedAt) : null,
      isEmailVerified: true,
      isActive: true,
      passwordSalt: seedPasswordSalt,
      passwordHash: seedPasswordHash,
    },
    create: {
      id: `user_${usernameNormalized}`,
      fullName: user.fullName,
      name: user.fullName,
      username: user.username,
      usernameNormalized,
      email: user.email,
      emailNormalized,
      role: user.role,
      accountType: user.accountType,
      avatarUrl: user.avatarUrl,
      location: user.location ?? null,
      clientEventTypes: user.clientEventTypes ?? [],
      clientBudgetMin: user.clientBudgetMin ?? null,
      clientBudgetMax: user.clientBudgetMax ?? null,
      notificationPreferences: { email: true },
      onboardingCompletedAt: user.onboardingCompletedAt ? new Date(user.onboardingCompletedAt) : null,
      isEmailVerified: true,
      isActive: true,
      passwordSalt: seedPasswordSalt,
      passwordHash: seedPasswordHash,
    },
  });
}

async function run(): Promise<void> {
  const categories = new Map<string, { id: string; slug: string }>();
  for (const category of categoriesSeed) {
    const upserted = await prisma.category.upsert({
      where: { slug: category.slug },
      update: {
        name: category.name,
        iconUrl: category.iconUrl,
      },
      create: category,
      select: {
        id: true,
        slug: true,
      },
    });
    categories.set(upserted.slug, upserted);
  }

  const users = new Map<string, { id: string; email: string }>();
  for (const user of userSeeds) {
    const upserted = await upsertUser(user);
    users.set(upserted.email.toLowerCase(), {
      id: upserted.id,
      email: upserted.email,
    });
  }

  const artists = new Map<string, { id: string; slug: string; displayName: string }>();
  for (const [artistIndex, artist] of artistSeeds.entries()) {
    const owner = users.get(artist.userEmail.toLowerCase());
    const category = categories.get(artist.categorySlug);
    if (!owner || !category) {
      throw new Error(`Missing dependency for artist seed ${artist.slug}`);
    }

    const applicationSequence = artistIndex + 1;

    const upserted = await prisma.artist.upsert({
      where: { slug: artist.slug },
      update: {
        userId: owner.id,
        displayName: artist.displayName,
        name: artist.displayName,
        bio: artist.bio,
        categoryId: category.id,
        role: artist.legacyRole,
        location: artist.location,
        hourlyRate: artist.hourlyRate,
        isAvailable: artist.isAvailable,
        portfolioImages: artist.portfolioImages,
        portfolioLinks: artist.portfolioImages,
        tags: artist.tags,
        services: artist.services,
        specialties: artist.specialties,
        pricingSummary: artist.pricingSummary,
        availabilitySummary: artist.availabilitySummary,
        averageRating: artist.averageRating,
        totalReviews: artist.totalReviews,
        profileViews: artist.profileViews,
        rating: artist.averageRating.toFixed(1),
        isVerified: artist.isVerified,
        onboardingCompleted: true,
        applicationStatus: ArtistApplicationStatus.LIVE,
        applicationSequence,
        applicationSubmittedAt: new Date(artist.applicationSubmittedAt),
        applicationReviewedAt: new Date(artist.applicationSubmittedAt),
        approvedAt: new Date(artist.applicationSubmittedAt),
        isLive: true,
        wentLiveAt: new Date(artist.applicationSubmittedAt),
        onboardingFeeModel: OnboardingFeeModel.FIRST_BOOKING_DEDUCTION,
        firstBookingOnboardingDeductionApplied: false,
        normalCommissionRate: '15.00',
        temporaryFirstBookingCommissionRate: '25.00',
      },
      create: {
        userId: owner.id,
        slug: artist.slug,
        displayName: artist.displayName,
        name: artist.displayName,
        bio: artist.bio,
        categoryId: category.id,
        role: artist.legacyRole,
        location: artist.location,
        hourlyRate: artist.hourlyRate,
        isAvailable: artist.isAvailable,
        portfolioImages: artist.portfolioImages,
        portfolioLinks: artist.portfolioImages,
        tags: artist.tags,
        services: artist.services,
        specialties: artist.specialties,
        pricingSummary: artist.pricingSummary,
        availabilitySummary: artist.availabilitySummary,
        averageRating: artist.averageRating,
        totalReviews: artist.totalReviews,
        profileViews: artist.profileViews,
        rating: artist.averageRating.toFixed(1),
        isVerified: artist.isVerified,
        onboardingCompleted: true,
        applicationStatus: ArtistApplicationStatus.LIVE,
        applicationSequence,
        applicationSubmittedAt: new Date(artist.applicationSubmittedAt),
        applicationReviewedAt: new Date(artist.applicationSubmittedAt),
        approvedAt: new Date(artist.applicationSubmittedAt),
        isLive: true,
        wentLiveAt: new Date(artist.applicationSubmittedAt),
        onboardingFeeModel: OnboardingFeeModel.FIRST_BOOKING_DEDUCTION,
        firstBookingOnboardingDeductionApplied: false,
        normalCommissionRate: '15.00',
        temporaryFirstBookingCommissionRate: '25.00',
      },
      select: {
        id: true,
        slug: true,
        displayName: true,
      },
    });

    artists.set(upserted.slug, upserted);
  }

  for (const setting of platformSettingsSeed) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: {
        value: setting.value,
        description: setting.description,
      },
      create: {
        key: setting.key,
        value: setting.value,
        description: setting.description,
      },
    });
  }

  await prisma.sequenceCounter.upsert({
    where: { key: 'artistApplications' },
    update: {
      value: artistSeeds.length,
    },
    create: {
      key: 'artistApplications',
      value: artistSeeds.length,
    },
  });

  await prisma.sequenceCounter.upsert({
    where: { key: 'supportTickets' },
    update: {
      value: 0,
    },
    create: {
      key: 'supportTickets',
      value: 0,
    },
  });

  for (const tier of tierDefinitionSeed) {
    await prisma.artistTierDefinition.upsert({
      where: { key: tier.key },
      update: {
        name: tier.name,
        description: tier.description,
        sortOrder: tier.sortOrder,
        isActive: true,
        thresholds: tier.thresholds,
        benefits: tier.benefits,
      },
      create: {
        id: tier.id,
        key: tier.key,
        name: tier.name,
        description: tier.description,
        sortOrder: tier.sortOrder,
        isActive: true,
        thresholds: tier.thresholds,
        benefits: tier.benefits,
      },
    });
  }

  const agencyOwner = users.get(agencySeed.ownerEmail.toLowerCase());
  if (!agencyOwner) {
    throw new Error('Missing agency owner for seed data');
  }

  const agency = await prisma.agency.upsert({
    where: { slug: agencySeed.slug },
    update: {
      ownerId: agencyOwner.id,
      name: agencySeed.name,
      description: agencySeed.description,
      logoUrl: agencySeed.logoUrl,
      website: agencySeed.website,
      contactName: agencySeed.contactName,
      contactEmail: agencySeed.contactEmail,
      isVerified: agencySeed.isVerified,
    },
    create: {
      ownerId: agencyOwner.id,
      slug: agencySeed.slug,
      name: agencySeed.name,
      description: agencySeed.description,
      logoUrl: agencySeed.logoUrl,
      website: agencySeed.website,
      contactName: agencySeed.contactName,
      contactEmail: agencySeed.contactEmail,
      isVerified: agencySeed.isVerified,
    },
    select: {
      id: true,
      slug: true,
    },
  });

  for (const booking of bookingSeeds) {
    const client = users.get(booking.clientEmail.toLowerCase());
    const artist = artists.get(booking.artistSlug);
    if (!client || !artist) {
      throw new Error(`Missing dependency for booking seed ${booking.id}`);
    }

    const agencyId = booking.agencySlug ? agency.id : null;

    await prisma.booking.upsert({
      where: { id: booking.id },
      update: {
        clientId: client.id,
        artistId: artist.id,
        agencyId,
        title: booking.title,
        description: booking.description,
        eventDate: new Date(booking.eventDate),
        eventEndDate: booking.eventEndDate ? new Date(booking.eventEndDate) : null,
        location: booking.location,
        status: booking.status,
        totalAmount: booking.totalAmount,
        platformFee: booking.platformFee,
        artistPayout: booking.artistPayout,
        paymentProvider: booking.paymentProvider ?? null,
        paymentStatus: booking.paymentStatus,
        paymentReference: booking.paymentReference ?? null,
        paymentGatewayReference: booking.paymentGatewayReference ?? null,
        stripePaymentIntentId: booking.stripePaymentIntentId ?? null,
        paymentInitiatedAt: booking.paymentInitiatedAt ? new Date(booking.paymentInitiatedAt) : null,
        paymentPaidAt: booking.paymentPaidAt ? new Date(booking.paymentPaidAt) : null,
        paymentFailedAt: booking.paymentFailedAt ? new Date(booking.paymentFailedAt) : null,
        notes: booking.notes ?? null,
        cancelledAt: null,
        cancelReason: null,
        verificationStatus: booking.verificationStatus ?? BookingVerificationStatus.NOT_REQUIRED,
        verificationCodeSentAt: booking.verificationCodeSentAt
          ? new Date(booking.verificationCodeSentAt)
          : null,
        verificationCodeExpiresAt: booking.verificationCodeExpiresAt
          ? new Date(booking.verificationCodeExpiresAt)
          : null,
        verificationEnteredAt: booking.jobStartedAt ? new Date(booking.jobStartedAt) : null,
        jobStartedAt: booking.jobStartedAt ? new Date(booking.jobStartedAt) : null,
        jobCompletedAt: booking.jobCompletedAt ? new Date(booking.jobCompletedAt) : null,
        clientApprovedAt: booking.clientApprovedAt ? new Date(booking.clientApprovedAt) : null,
        disputeOpenedAt: booking.disputeOpenedAt ? new Date(booking.disputeOpenedAt) : null,
        disputeWindowEndsAt: booking.disputeWindowEndsAt
          ? new Date(booking.disputeWindowEndsAt)
          : null,
        disputeWindowDays: 3,
        payoutStatus: booking.payoutStatus ?? PayoutStatus.NOT_READY,
        payoutPendingAt: booking.payoutPendingAt ? new Date(booking.payoutPendingAt) : null,
        estimatedPayoutReleaseAt: booking.estimatedPayoutReleaseAt
          ? new Date(booking.estimatedPayoutReleaseAt)
          : null,
        payoutReleasedAt: booking.payoutReleasedAt ? new Date(booking.payoutReleasedAt) : null,
        payoutHoldReason: booking.payoutHoldReason ?? null,
        payoutDelayDaysSnapshot: booking.payoutDelayDaysSnapshot ?? 0,
        normalCommissionRate: booking.normalCommissionRate ?? '15.00',
        appliedCommissionRate: booking.appliedCommissionRate ?? '15.00',
        onboardingExtraCutAmount: booking.onboardingExtraCutAmount ?? '0.00',
        artistName: booking.artistName,
        artistInitials: booking.artistInitials,
        date: booking.legacyDate,
        amount: booking.legacyAmount,
        applications: booking.applications,
      },
      create: {
        id: booking.id,
        clientId: client.id,
        artistId: artist.id,
        agencyId,
        title: booking.title,
        description: booking.description,
        eventDate: new Date(booking.eventDate),
        eventEndDate: booking.eventEndDate ? new Date(booking.eventEndDate) : null,
        location: booking.location,
        status: booking.status,
        totalAmount: booking.totalAmount,
        platformFee: booking.platformFee,
        artistPayout: booking.artistPayout,
        paymentProvider: booking.paymentProvider ?? null,
        paymentStatus: booking.paymentStatus,
        paymentReference: booking.paymentReference ?? null,
        paymentGatewayReference: booking.paymentGatewayReference ?? null,
        stripePaymentIntentId: booking.stripePaymentIntentId ?? null,
        paymentInitiatedAt: booking.paymentInitiatedAt ? new Date(booking.paymentInitiatedAt) : null,
        paymentPaidAt: booking.paymentPaidAt ? new Date(booking.paymentPaidAt) : null,
        paymentFailedAt: booking.paymentFailedAt ? new Date(booking.paymentFailedAt) : null,
        notes: booking.notes ?? null,
        cancelledAt: null,
        cancelReason: null,
        verificationStatus: booking.verificationStatus ?? BookingVerificationStatus.NOT_REQUIRED,
        verificationCodeSentAt: booking.verificationCodeSentAt
          ? new Date(booking.verificationCodeSentAt)
          : null,
        verificationCodeExpiresAt: booking.verificationCodeExpiresAt
          ? new Date(booking.verificationCodeExpiresAt)
          : null,
        verificationEnteredAt: booking.jobStartedAt ? new Date(booking.jobStartedAt) : null,
        jobStartedAt: booking.jobStartedAt ? new Date(booking.jobStartedAt) : null,
        jobCompletedAt: booking.jobCompletedAt ? new Date(booking.jobCompletedAt) : null,
        clientApprovedAt: booking.clientApprovedAt ? new Date(booking.clientApprovedAt) : null,
        disputeOpenedAt: booking.disputeOpenedAt ? new Date(booking.disputeOpenedAt) : null,
        disputeWindowEndsAt: booking.disputeWindowEndsAt
          ? new Date(booking.disputeWindowEndsAt)
          : null,
        disputeWindowDays: 3,
        payoutStatus: booking.payoutStatus ?? PayoutStatus.NOT_READY,
        payoutPendingAt: booking.payoutPendingAt ? new Date(booking.payoutPendingAt) : null,
        estimatedPayoutReleaseAt: booking.estimatedPayoutReleaseAt
          ? new Date(booking.estimatedPayoutReleaseAt)
          : null,
        payoutReleasedAt: booking.payoutReleasedAt ? new Date(booking.payoutReleasedAt) : null,
        payoutHoldReason: booking.payoutHoldReason ?? null,
        payoutDelayDaysSnapshot: booking.payoutDelayDaysSnapshot ?? 0,
        normalCommissionRate: booking.normalCommissionRate ?? '15.00',
        appliedCommissionRate: booking.appliedCommissionRate ?? '15.00',
        onboardingExtraCutAmount: booking.onboardingExtraCutAmount ?? '0.00',
        artistName: booking.artistName,
        artistInitials: booking.artistInitials,
        date: booking.legacyDate,
        amount: booking.legacyAmount,
        applications: booking.applications,
      },
    });
  }

  console.log(
    `Seeded core data. Categories: ${categories.size}, users: ${users.size}, artists: ${artists.size}, agency: ${agency.slug}, bookings: ${bookingSeeds.length}.`,
  );
}

void run()
  .catch((error: unknown) => {
    console.error('Failed to seed core data:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
