import nextServer from './api';
import type {
  Announcement,
  AnnouncementListResponse,
  CreateAnnouncementPayload,
} from '@/types/announcementType';
import type { GrantedUser } from '@/types/userTypes';

// Admin-only — users currently granted the create-announcement right.
export const getAnnouncementAuthors = async (): Promise<GrantedUser[]> => {
  const { data } = await nextServer.get<{ users: GrantedUser[] }>(
    '/announcements/authors'
  );
  return data.users;
};

// Public — no auth required. Anyone can read the board.
export const getPublicAnnouncements = async (
  params: { page?: number; perPage?: number } = {}
): Promise<AnnouncementListResponse> => {
  const { page = 1, perPage = 20 } = params;
  const { data } = await nextServer.get<AnnouncementListResponse>(
    '/public/announcements',
    { params: { page, perPage } }
  );
  return data;
};

export const createAnnouncement = async (
  payload: CreateAnnouncementPayload
): Promise<Announcement> => {
  const { data } = await nextServer.post<Announcement>(
    '/announcements',
    payload
  );
  return data;
};

export const deleteAnnouncement = async (id: string): Promise<void> => {
  await nextServer.delete(`/announcements/${id}`);
};
