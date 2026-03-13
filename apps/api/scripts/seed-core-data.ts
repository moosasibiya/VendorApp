import {
  AccountType,
  BookingStatus,
  PaymentStatus,
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
  isVerified: boolean;
  portfolioImages: string[];
  tags: string[];
  services: string[];
  specialties: string[];
  pricingSummary: string;
  availabilitySummary: string;
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
  paymentStatus: PaymentStatus;
  stripePaymentIntentId?: string;
  notes?: string;
  artistName: string;
  artistInitials: string;
  legacyDate: string;
  legacyAmount: string;
  applications: number;
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
  },
  {
    fullName: 'Ayanda Khumalo',
    username: 'ayanda',
    email: 'ayanda@vendorapp.dev',
    role: UserRole.ARTIST,
    accountType: AccountType.CREATIVE,
    avatarUrl: 'https://cdn.vendorapp.local/avatars/ayanda.webp',
  },
  {
    fullName: 'Nandi Mokoena',
    username: 'nandi',
    email: 'nandi@vendorapp.dev',
    role: UserRole.ARTIST,
    accountType: AccountType.CREATIVE,
    avatarUrl: 'https://cdn.vendorapp.local/avatars/nandi.webp',
  },
  {
    fullName: 'Themba Dlamini',
    username: 'themba',
    email: 'themba@vendorapp.dev',
    role: UserRole.ARTIST,
    accountType: AccountType.CREATIVE,
    avatarUrl: 'https://cdn.vendorapp.local/avatars/themba.webp',
  },
  {
    fullName: 'Lindiwe Rossouw',
    username: 'lindiwe',
    email: 'lindiwe@vendorapp.dev',
    role: UserRole.ARTIST,
    accountType: AccountType.CREATIVE,
    avatarUrl: 'https://cdn.vendorapp.local/avatars/lindiwe.webp',
  },
  {
    fullName: 'Frame House Collective',
    username: 'framehouse',
    email: 'agency@vendorapp.dev',
    role: UserRole.AGENCY,
    accountType: AccountType.AGENCY,
    avatarUrl: 'https://cdn.vendorapp.local/avatars/frame-house.webp',
  },
  {
    fullName: 'Sarah Daniels',
    username: 'sarahdaniels',
    email: 'sarah@vendorapp.dev',
    role: UserRole.CLIENT,
    accountType: AccountType.CLIENT,
    avatarUrl: 'https://cdn.vendorapp.local/avatars/sarah.webp',
  },
  {
    fullName: 'Musa Jacobs',
    username: 'musajacobs',
    email: 'musa@vendorapp.dev',
    role: UserRole.CLIENT,
    accountType: AccountType.CLIENT,
    avatarUrl: 'https://cdn.vendorapp.local/avatars/musa.webp',
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
  },
];

const agencySeed = {
  ownerEmail: 'agency@vendorapp.dev',
  slug: 'frame-house-collective',
  name: 'Frame House Collective',
  description: 'Boutique talent representation for premium photographers and filmmakers.',
  logoUrl: 'https://cdn.vendorapp.local/logos/frame-house.webp',
  website: 'https://framehouse.example.com',
  isVerified: true,
};

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
    paymentStatus: PaymentStatus.UNPAID,
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
    status: BookingStatus.CONFIRMED,
    totalAmount: '18500.00',
    platformFee: '1850.00',
    artistPayout: '16650.00',
    paymentStatus: PaymentStatus.PAID,
    stripePaymentIntentId: 'pi_test_vendorapp_phase2',
    notes: 'Final delivery includes a master edit and three cutdowns.',
    artistName: 'Ayanda Khumalo',
    artistInitials: 'AK',
    legacyDate: '22 May 2026',
    legacyAmount: 'R18,500',
    applications: 2,
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
  for (const artist of artistSeeds) {
    const owner = users.get(artist.userEmail.toLowerCase());
    const category = categories.get(artist.categorySlug);
    if (!owner || !category) {
      throw new Error(`Missing dependency for artist seed ${artist.slug}`);
    }

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
        rating: artist.averageRating.toFixed(1),
        isVerified: artist.isVerified,
        onboardingCompleted: true,
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
        rating: artist.averageRating.toFixed(1),
        isVerified: artist.isVerified,
        onboardingCompleted: true,
      },
      select: {
        id: true,
        slug: true,
        displayName: true,
      },
    });

    artists.set(upserted.slug, upserted);
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
      isVerified: agencySeed.isVerified,
    },
    create: {
      ownerId: agencyOwner.id,
      slug: agencySeed.slug,
      name: agencySeed.name,
      description: agencySeed.description,
      logoUrl: agencySeed.logoUrl,
      website: agencySeed.website,
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
        paymentStatus: booking.paymentStatus,
        stripePaymentIntentId: booking.stripePaymentIntentId ?? null,
        notes: booking.notes ?? null,
        cancelledAt: null,
        cancelReason: null,
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
        paymentStatus: booking.paymentStatus,
        stripePaymentIntentId: booking.stripePaymentIntentId ?? null,
        notes: booking.notes ?? null,
        cancelledAt: null,
        cancelReason: null,
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
