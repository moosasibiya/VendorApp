import { z } from 'zod';
import { BookingStatus } from '../enums';

export const CreateBookingSchema = z.object({
  artistId: z.string().min(1, 'artistId is required'),
  title: z.string().min(2).max(120),
  description: z.string().min(10).max(2000),
  eventDate: z.string().datetime({ offset: true }),
  eventEndDate: z.string().datetime({ offset: true }).nullable().optional(),
  location: z.string().min(2).max(160),
  notes: z.string().max(1000).nullable().optional(),
});

export type CreateBookingInput = z.infer<typeof CreateBookingSchema>;

export const UpdateBookingSchema = CreateBookingSchema.partial().extend({
  status: z.nativeEnum(BookingStatus).optional(),
});

export type UpdateBookingInput = z.infer<typeof UpdateBookingSchema>;
