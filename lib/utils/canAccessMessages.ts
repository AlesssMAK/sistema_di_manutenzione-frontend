import type { User } from '@/types/userTypes';

/**
 * Whether a user may use the /messages page (and see the header envelope).
 * Operators only get it once granted the send permission — without it they
 * read their direct messages on the dashboard and announcements on the
 * Bacheca, so the full messages page is redundant. Everyone else always has
 * access.
 */
export const canAccessMessages = (user?: User | null): boolean =>
  !!user &&
  (user.role !== 'operator' || user.permissions?.canSendMessages === true);
