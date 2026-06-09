import nextServer from './api';
import type {
  CreateBroadcastPayload,
  CreateDirectPayload,
  ListAnnouncementsParams,
  ListInboxParams,
  Message,
  MessageListResponse,
  ReplyMessagePayload,
  UnreadCountResponse,
} from '@/types/messageType';

// ---------- create ----------

export const createDirectMessage = async (
  payload: CreateDirectPayload
): Promise<Message> => {
  const { data } = await nextServer.post<Message>('/messages/direct', payload);
  return data;
};

export const createBroadcast = async (
  payload: CreateBroadcastPayload
): Promise<Message> => {
  const { data } = await nextServer.post<Message>(
    '/messages/broadcast',
    payload
  );
  return data;
};

// ---------- list ----------

export const getInbox = async (
  params: ListInboxParams = {}
): Promise<MessageListResponse> => {
  const { box = 'inbox', page = 1, perPage = 20, unreadOnly } = params;
  const { data } = await nextServer.get<MessageListResponse>(
    '/messages/inbox',
    {
      params: {
        box,
        page,
        perPage,
        ...(unreadOnly ? { unreadOnly: true } : {}),
      },
    }
  );
  return data;
};

export const getAnnouncements = async (
  params: ListAnnouncementsParams = {}
): Promise<MessageListResponse> => {
  const { types, page = 1, perPage = 20, unreadOnly } = params;
  const { data } = await nextServer.get<MessageListResponse>(
    '/messages/announcements',
    {
      params: {
        page,
        perPage,
        ...(types && types.length ? { types: types.join(',') } : {}),
        ...(unreadOnly ? { unreadOnly: true } : {}),
      },
    }
  );
  return data;
};

export const getUnreadCount = async (): Promise<UnreadCountResponse> => {
  const { data } = await nextServer.get<UnreadCountResponse>(
    '/messages/unread-count'
  );
  return data;
};

// ---------- mutations on a single message ----------

export const markAsRead = async (id: string): Promise<Message> => {
  const { data } = await nextServer.patch<Message>(`/messages/${id}/read`);
  return data;
};

export const replyToMessage = async (
  id: string,
  payload: ReplyMessagePayload
): Promise<Message> => {
  const { data } = await nextServer.post<Message>(
    `/messages/${id}/reply`,
    payload
  );
  return data;
};

export const deleteMessage = async (id: string): Promise<void> => {
  await nextServer.delete(`/messages/${id}`);
};
