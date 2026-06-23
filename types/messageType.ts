import type { UserRoles } from './userTypes';

export type MessageType = 'direct' | 'broadcast_all' | 'broadcast_role';

/** Author populated from `populate({path:'authorId', select:'fullName role avatar'})`. */
export interface MessageAuthor {
  _id: string;
  fullName: string;
  role: UserRoles;
  avatar?: string;
}

/** Message document as returned by the API (after populate). */
export interface Message {
  _id: string;
  type: MessageType;

  /** Populated reference; falls back to id if populate fails server-side. */
  authorId: MessageAuthor | string;
  authorName: string;
  authorRole: UserRoles;

  /** Set only for direct messages. */
  recipientId?: string | null;

  /** Set only for broadcast_role. */
  targetRole?: UserRoles | null;

  subject: string;
  body: string;

  /** Cloudinary secure_urls for image attachments (max 5). */
  img?: string[];

  /** User IDs that have marked this message as read. */
  readBy: string[];

  /** Set when this is a reply created via POST /messages/:id/reply. */
  replyToId?: string | null;

  /** Set only on broadcasts (TTL-managed). */
  expireAt?: string | null;

  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Request payloads
// ---------------------------------------------------------------------------

export interface CreateDirectPayload {
  recipientId: string;
  subject?: string;
  body: string;
  /** Image attachments; sent as multipart when present. */
  img?: File[];
}

export type BroadcastTarget = 'all' | 'role';

export interface CreateBroadcastPayload {
  target: BroadcastTarget;
  /** Required when target === 'role'. */
  targetRole?: UserRoles;
  subject?: string;
  body: string;
  /** Image attachments; sent as multipart when present. */
  img?: File[];
}

export interface ReplyMessagePayload {
  subject?: string;
  body: string;
  /** Image attachments; sent as multipart when present. */
  img?: File[];
}

// ---------------------------------------------------------------------------
// List / inbox query params
// ---------------------------------------------------------------------------

export type InboxBox = 'inbox' | 'sent' | 'all';

export interface ListInboxParams {
  box?: InboxBox;
  page?: number;
  perPage?: number;
  unreadOnly?: boolean;
}

export type AnnouncementType = 'broadcast_all' | 'broadcast_role';

export interface ListAnnouncementsParams {
  /** CSV filter — backend defaults to both when omitted. */
  types?: AnnouncementType[];
  page?: number;
  perPage?: number;
  unreadOnly?: boolean;
}

// ---------------------------------------------------------------------------
// Response shapes
// ---------------------------------------------------------------------------

export interface MessageListResponse {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
  items: Message[];
}

export interface UnreadCountResponse {
  direct: number;
  roleAnnouncements: number;
  allAnnouncements: number;
}
