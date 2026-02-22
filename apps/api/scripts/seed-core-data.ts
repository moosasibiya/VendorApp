import { BookingStatus, PrismaClient } from '@prisma/client';
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

const artistsSeed = Array.from({ length: 12 }).map((_, i) => ({
  name: `Artist ${i + 1}`,
  role: i % 2 === 0 ? 'Photographer' : 'Videographer',
  location: ['Cape Town', 'Johannesburg', 'Pretoria', 'Durban', 'All'][i % 5],
  rating: (4.7 + (i % 3) * 0.1).toFixed(1),
  slug: `artist-${i + 1}`,
}));

const bookingsSeed = [
  {
    id: 'bk-1',
    artistName: 'Ayanda Khumalo',
    artistInitials: 'AK',
    status: BookingStatus.Pending,
    title: 'Wedding shoot',
    location: 'Cape Town',
    date: '12 Aug 2025',
    amount: 'R12,000',
    applications: 3,
  },
  {
    id: 'bk-2',
    artistName: 'Nandi Mokoena',
    artistInitials: 'NM',
    status: BookingStatus.Confirmed,
    title: 'Brand campaign',
    location: 'Johannesburg',
    date: '18 Aug 2025',
    amount: 'R18,500',
    applications: 5,
  },
  {
    id: 'bk-3',
    artistName: 'Themba Dlamini',
    artistInitials: 'TD',
    status: BookingStatus.Completed,
    title: 'Corporate portraits',
    location: 'Pretoria',
    date: '01 Aug 2025',
    amount: 'R9,800',
    applications: 2,
  },
];

async function run(): Promise<void> {
  for (const artist of artistsSeed) {
    await prisma.artist.upsert({
      where: { slug: artist.slug },
      update: {
        name: artist.name,
        role: artist.role,
        location: artist.location,
        rating: artist.rating,
      },
      create: artist,
    });
  }

  for (const booking of bookingsSeed) {
    await prisma.booking.upsert({
      where: { id: booking.id },
      update: {
        artistName: booking.artistName,
        artistInitials: booking.artistInitials,
        status: booking.status,
        title: booking.title,
        location: booking.location,
        date: booking.date,
        amount: booking.amount,
        applications: booking.applications,
      },
      create: booking,
    });
  }

  console.log(
    `Seeded core data. Artists upserted: ${artistsSeed.length}, bookings upserted: ${bookingsSeed.length}.`,
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
