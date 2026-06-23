import nextServer from './api';

export const getPushPublicKey = async (): Promise<string | null> => {
  const { data } = await nextServer.get<{ publicKey: string | null }>(
    '/push/public-key'
  );
  return data.publicKey;
};

export const subscribePush = async (
  subscription: PushSubscriptionJSON
): Promise<void> => {
  await nextServer.post('/push/subscribe', subscription);
};

export const unsubscribePush = async (endpoint: string): Promise<void> => {
  await nextServer.post('/push/unsubscribe', { endpoint });
};
