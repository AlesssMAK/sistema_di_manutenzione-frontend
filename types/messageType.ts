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

  /** Set only for direct messages. Populated ({fullName, role}) on the
   *  inbox `box=all` and thread endpoints; a raw id otherwise. */
  recipientId?: MessageAuthor | string | null;

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

/** Whole conversation (root + replies), oldest-first. */
export interface MessageThreadResponse {
  items: Message[];
}

/** One direct conversation = one thread/topic (root + its replies). */
export interface Conversation {
  /** Thread root id — the conversation key; a new message starts a new one. */
  threadId: string;
  /** Topic title (the root message's subject). */
  subject: string;
  counterpart: {
    _id: string;
    fullName: string;
    role: UserRoles;
  };
  /** Unread messages received in this thread. */
  unread: number;
  /** Latest message in the thread (drives the card preview). */
  last: {
    _id: string;
    subject: string;
    body: string;
    createdAt: string;
    /** Raw author id — lets the card tell outgoing from incoming. */
    authorId: string;
  };
}

export interface ConversationListResponse {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
  items: Conversation[];
}

export interface ListConversationsParams {
  page?: number;
  perPage?: number;
}

export interface UnreadCountResponse {
  direct: number;
  roleAnnouncements: number;
  allAnnouncements: number;
}
