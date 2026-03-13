export interface Agency {
  id: string;
  ownerId: string;
  name: string;
  slug: string;
  description: string;
  logoUrl?: string | null;
  website?: string | null;
  contactName?: string | null;
  contactEmail?: string | null;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}
