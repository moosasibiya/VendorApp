import { z } from 'zod';

const optionalUrl = z.string().url().nullable().optional();

export const OnboardingArtistSchema = z.object({
  displayName: z.string().min(2).max(80),
  role: z.string().min(2).max(80),
  location: z.string().min(2).max(80),
  bio: z.string().min(20).max(600),
  services: z.array(z.string().min(1).max(40)).min(1).max(6),
  specialties: z.array(z.string().min(1).max(40)).min(1).max(8),
  pricingSummary: z.string().min(1).max(120),
  availabilitySummary: z.string().min(1).max(120),
  portfolioLinks: z.array(z.string().url()).min(1).max(6),
});

export type OnboardingArtistInput = z.infer<typeof OnboardingArtistSchema>;

export const OnboardingClientSchema = z.object({
  fullName: z.string().min(2).max(120),
  avatarUrl: optionalUrl,
  location: z.string().min(2).max(80),
  eventTypes: z.array(z.string().min(1).max(40)).min(1).max(8),
  budgetMin: z.number().nonnegative().nullable().optional(),
  budgetMax: z.number().nonnegative().nullable().optional(),
});

export type OnboardingClientInput = z.infer<typeof OnboardingClientSchema>;

export const OnboardingAgencySchema = z.object({
  name: z.string().min(2).max(120),
  slug: z
    .string()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slug must use lowercase letters, numbers, and hyphens'),
  description: z.string().min(10).max(1000),
  logoUrl: optionalUrl,
  website: optionalUrl,
  contactName: z.string().min(2).max(120),
  contactEmail: z.string().email(),
});

export type OnboardingAgencyInput = z.infer<typeof OnboardingAgencySchema>;
