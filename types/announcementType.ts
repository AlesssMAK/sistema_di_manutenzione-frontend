export type AnnouncementCategory = 'announcement' | 'handover';

export type AnnouncementSeverity =
  | 'normal'
  | 'communication'
  | 'note'
  | 'important'
  | 'attention';

export interface Announcement {
  _id: string;
  title: string;
  body: string;
  category: AnnouncementCategory;
  /** Visual emphasis level; 'normal' = plain card. */
  severity: AnnouncementSeverity;
  /** Optional machine reference — only set on `handover` entries. */
  plantId?: string;
  plantName?: string;
  /** Cloudinary URLs of attached photos. */
  img?: string[];
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
  category: AnnouncementCategory;
  /** Optional; only honored by the backend for `handover`. */
  plantId?: string;
  /** Optional; defaults to 'normal' on the backend. */
  severity?: AnnouncementSeverity;
  /** Photo files to upload (multipart). */
  img?: File[];
}
