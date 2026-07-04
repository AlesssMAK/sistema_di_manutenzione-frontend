import nextServer from './api';
import type {
  Announcement,
  AnnouncementCategory,
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
  params: {
    page?: number;
    perPage?: number;
    category?: AnnouncementCategory;
  } = {}
): Promise<AnnouncementListResponse> => {
  const { page = 1, perPage = 20, category } = params;
  const { data } = await nextServer.get<AnnouncementListResponse>(
    '/public/announcements',
    { params: { page, perPage, ...(category ? { category } : {}) } }
  );
  return data;
};

export const createAnnouncement = async (
  payload: CreateAnnouncementPayload
): Promise<Announcement> => {
  // Multipart so photos ride along with the text fields — the backend
  // route runs multer (`upload.array('img')`) before validation.
  const formData = new FormData();
  formData.append('title', payload.title);
  formData.append('body', payload.body);
  formData.append('category', payload.category);
  if (payload.severity) formData.append('severity', payload.severity);
  if (payload.plantId) formData.append('plantId', payload.plantId);
  (payload.img ?? []).forEach(file => formData.append('img', file));

  const { data } = await nextServer.post<Announcement>(
    '/announcements',
    formData
  );
  return data;
};

export const deleteAnnouncement = async (id: string): Promise<void> => {
  await nextServer.delete(`/announcements/${id}`);
};
