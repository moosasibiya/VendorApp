import type {
  SupportCategoryValue,
  SupportThreadStatusValue,
} from '../enums';

export interface CreateSupportThreadInput {
  category: SupportCategoryValue;
  subject: string;
  initialMessage?: string;
  bookingId?: string | null;
}

export interface UpdateSupportThreadInput {
  status?: SupportThreadStatusValue;
  assignedAdminUserId?: string | null;
  internalNote?: string | null;
}

export interface SupportFaqItem {
  category: SupportCategoryValue;
  title: string;
  summary: string;
  steps: string[];
  shouldEscalateByDefault?: boolean;
}
