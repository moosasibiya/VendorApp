export interface UserNotificationPreferences {
  email: boolean;
  bookingUpdates: boolean;
  newMessages: boolean;
  marketing: boolean;
}

export interface UpdateUserProfileInput {
  fullName?: string;
  location?: string | null;
  avatarUrl?: string | null;
  notificationPreferences?: Partial<UserNotificationPreferences>;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}
