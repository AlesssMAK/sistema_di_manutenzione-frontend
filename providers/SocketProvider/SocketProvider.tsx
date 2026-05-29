'use client';

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { io, type Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/lib/store/authStore';

type SocketContextValue = {
  socket: Socket | null;
  isConnected: boolean;
  subscribeToFault: (faultId: string) => void;
  unsubscribeFromFault: (faultId: string) => void;
};

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  isConnected: false,
  subscribeToFault: () => {},
  unsubscribeFromFault: () => {},
});

export const useSocket = () => useContext(SocketContext);

type SocketProviderProps = {
  children: ReactNode;
};

const SocketProvider = ({ children }: SocketProviderProps) => {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const user = useAuthStore(state => state.user);
  const queryClient = useQueryClient();

  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
      return;
    }

    let cancelled = false;

    const connect = async () => {
      try {
        const res = await fetch('/api/socket/token', {
          credentials: 'include',
        });
        if (!res.ok) {
          console.warn('[socket] no access token available');
          return;
        }
        const { accessToken } = (await res.json()) as {
          accessToken: string | null;
        };
        if (cancelled || !accessToken) return;

        const url = process.env.NEXT_PUBLIC_BACKEND_API_URL;
        if (!url) {
          console.warn('[socket] NEXT_PUBLIC_BACKEND_API_URL is not set');
          return;
        }

        const socket = io(url, {
          withCredentials: true,
          auth: { accessToken },
          transports: ['websocket', 'polling'],
        });

        socket.on('connect', () => {
          setIsConnected(true);
        });

        socket.on('disconnect', () => {
          setIsConnected(false);
        });

        socket.on('connect_error', err => {
          console.warn('[socket] connect_error:', err.message);
        });

        // --- Fault events ---
        socket.on('fault:created', () => {
          queryClient.invalidateQueries({ queryKey: ['faults'] });
          toast('Nuova segnalazione ricevuta', { icon: '🔔' });
        });

        socket.on('fault:updated', (fault: { _id?: string } | null) => {
          queryClient.invalidateQueries({ queryKey: ['faults'] });
          if (fault?._id) {
            queryClient.invalidateQueries({
              queryKey: ['fault', fault._id],
            });
          }
        });

        socket.on(
          'fault:statusChanged',
          (payload: { faultId?: string; from?: string; to?: string }) => {
            queryClient.invalidateQueries({ queryKey: ['faults'] });
            if (payload?.faultId) {
              queryClient.invalidateQueries({
                queryKey: ['fault', payload.faultId],
              });
            }
            if (payload?.to === 'Overdue') {
              toast.error(
                `Segnalazione ${payload.faultId ?? ''} è scaduta`.trim()
              );
            }
          }
        );

        // --- Comment events ---
        socket.on(
          'comment:created',
          (comment: { faultId?: string } | null) => {
            if (comment?.faultId) {
              queryClient.invalidateQueries({
                queryKey: ['fault', comment.faultId, 'comments'],
              });
            }
          }
        );

        // --- Messaging events (direct + broadcast) ---
        socket.on('message:new', () => {
          queryClient.invalidateQueries({ queryKey: ['messages'] });
          queryClient.invalidateQueries({
            queryKey: ['messages', 'unread-count'],
          });
        });

        socketRef.current = socket;
      } catch (err) {
        console.warn('[socket] failed to bootstrap:', err);
      }
    };

    connect();

    return () => {
      cancelled = true;
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
    };
  }, [isAuthenticated, user?._id, queryClient]);

  const subscribeToFault = (faultId: string) => {
    socketRef.current?.emit('fault:subscribe', faultId);
  };

  const unsubscribeFromFault = (faultId: string) => {
    socketRef.current?.emit('fault:unsubscribe', faultId);
  };

  return (
    <SocketContext.Provider
      value={{
        socket: socketRef.current,
        isConnected,
        subscribeToFault,
        unsubscribeFromFault,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export default SocketProvider;
