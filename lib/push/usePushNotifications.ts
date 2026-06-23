'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  getPushPublicKey,
  subscribePush,
  unsubscribePush,
} from '@/lib/api/push';

// VAPID public key arrives as URL-safe base64; PushManager.subscribe
// needs it as a Uint8Array.
const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  const raw = atob(base64);
  // Back the array with an explicit ArrayBuffer so the type is
  // Uint8Array<ArrayBuffer> (assignable to BufferSource) rather than
  // the wider ArrayBufferLike TS now infers.
  const buffer = new ArrayBuffer(raw.length);
  const arr = new Uint8Array(buffer);
  for (let i = 0; i < raw.length; i += 1) arr[i] = raw.charCodeAt(i);
  return arr;
};

export type PushState =
  | 'unsupported'
  | 'default'
  | 'granted'
  | 'denied';

export const usePushNotifications = () => {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<PushState>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const ok =
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window;

    if (!ok) {
      setSupported(false);
      setPermission('unsupported');
      return;
    }

    setSupported(true);
    setPermission(Notification.permission as PushState);

    // Reflect any existing subscription for this browser.
    navigator.serviceWorker.getRegistration().then(async (reg) => {
      if (!reg) return;
      const sub = await reg.pushManager.getSubscription();
      setIsSubscribed(Boolean(sub));
    });
  }, []);

  /** Returns true when subscribed successfully. */
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!supported || busy) return false;
    setBusy(true);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm as PushState);
      if (perm !== 'granted') return false;

      const publicKey = await getPushPublicKey();
      if (!publicKey) return false; // push not configured on backend

      const reg = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        // Cast: the lib types want a strict ArrayBuffer-backed view;
        // our helper produces exactly that at runtime.
        applicationServerKey: urlBase64ToUint8Array(
          publicKey
        ) as BufferSource,
      });

      await subscribePush(sub.toJSON() as PushSubscriptionJSON);
      setIsSubscribed(true);
      return true;
    } catch {
      return false;
    } finally {
      setBusy(false);
    }
  }, [supported, busy]);

  const unsubscribe = useCallback(async (): Promise<void> => {
    if (busy) return;
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await unsubscribePush(sub.endpoint);
        await sub.unsubscribe();
      }
      setIsSubscribed(false);
    } finally {
      setBusy(false);
    }
  }, [busy]);

  return { supported, permission, isSubscribed, busy, subscribe, unsubscribe };
};
