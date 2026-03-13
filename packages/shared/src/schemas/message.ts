import { z } from 'zod';
import { MessageType } from '../enums';

export const SendMessageSchema = z.object({
  content: z.string().min(1).max(5000),
  type: z.nativeEnum(MessageType).default(MessageType.TEXT),
  fileUrl: z.string().url().nullable().optional(),
});

export type SendMessageInput = z.infer<typeof SendMessageSchema>;
