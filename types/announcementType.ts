export interface Announcement {
  _id: string;
  title: string;
  body: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  updatedAt: string;
}

export interface AnnouncementListResponse {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
  items: Announcement[];
}

export interface CreateAnnouncementPayload {
  title: string;
  body: string;
}
