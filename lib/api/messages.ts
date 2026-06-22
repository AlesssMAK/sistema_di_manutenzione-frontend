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

// When a message carries image attachments we send multipart/form-data
// (the proxy + multer expect that); otherwise plain JSON. Files go
// under the `img` field — the same name the backend's multer
// `upload.array('img', 5)` reads.
const appendImages = (form: FormData, img?: File[]) => {
  (img ?? []).forEach((file) => form.append('img', file));
};

export const createDirectMessage = async (
  payload: CreateDirectPayload
): Promise<Message> => {
  if (payload.img && payload.img.length > 0) {
    const form = new FormData();
    form.append('recipientId', payload.recipientId);
    if (payload.subject) form.append('subject', payload.subject);
    form.append('body', payload.body);
    appendImages(form, payload.img);
    const { data } = await nextServer.post<Message>('/messages/direct', form);
    return data;
  }
  const { recipientId, subject, body } = payload;
  const { data } = await nextServer.post<Message>('/messages/direct', {
    recipientId,
    subject,
    body,
  });
  return data;
};

export const createBroadcast = async (
  payload: CreateBroadcastPayload
): Promise<Message> => {
  if (payload.img && payload.img.length > 0) {
    const form = new FormData();
    form.append('target', payload.target);
    if (payload.targetRole) form.append('targetRole', payload.targetRole);
    if (payload.subject) form.append('subject', payload.subject);
    form.append('body', payload.body);
    appendImages(form, payload.img);
    const { data } = await nextServer.post<Message>(
      '/messages/broadcast',
      form
    );
    return data;
  }
  const { target, targetRole, subject, body } = payload;
  const { data } = await nextServer.post<Message>('/messages/broadcast', {
    target,
    targetRole,
    subject,
    body,
  });
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
  if (payload.img && payload.img.length > 0) {
    const form = new FormData();
    if (payload.subject) form.append('subject', payload.subject);
    form.append('body', payload.body);
    appendImages(form, payload.img);
    const { data } = await nextServer.post<Message>(
      `/messages/${id}/reply`,
      form
    );
    return data;
  }
  const { subject, body } = payload;
  const { data } = await nextServer.post<Message>(`/messages/${id}/reply`, {
    subject,
    body,
  });
  return data;
};

export const deleteMessage = async (id: string): Promise<void> => {
  await nextServer.delete(`/messages/${id}`);
};
