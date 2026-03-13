import { z } from 'zod';

export const CreateReviewSchema = z.object({
  bookingId: z.string().min(1, 'bookingId is required'),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(3).max(2000),
  isPublic: z.boolean().optional().default(true),
});

export type CreateReviewInput = z.infer<typeof CreateReviewSchema>;
