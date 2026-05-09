"use client";

import React, { createContext, useContext, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { getSocket } from '@/lib/socket';
import { toast } from 'sonner';
import { InternalEvent } from '@autoloop/types';

interface ConnectionStatus {
  step: string;
  message: string;
}

const SocketContext = createContext<ReturnType<typeof getSocket> | null>(null);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const socket = getSocket();

  useEffect(() => {
    const onConnect = () => {
      if (session?.user?.id) {
        console.log(`[Socket] Re-subscribing to user:${session.user.id}`);
        socket.emit('subscribe', session.user.id);
      }
    };

    if (session?.user?.id && socket.connected) {
      socket.emit('subscribe', session.user.id);
    }

    const onInstagramEvent = (event: InternalEvent) => {
      console.log('[Socket] Instagram Event received:', event);
      toast.info(`New Instagram ${event.triggerType}: ${event.message?.substring(0, 30)}...`, {
        description: `From user ${event.userId}`,
      });
    };

    const onConnectingStatus = (status: ConnectionStatus) => {
      console.log('[Socket] Instagram Connecting Status:', status);
      if (status.step === 'done') {
        toast.dismiss('ig-connect');
        toast.success(status.message);
      } else {
        toast.loading(status.message, { id: 'ig-connect' });
      }
    };

    socket.on('connect', onConnect);
    socket.on('instagram:event', onInstagramEvent);
    socket.on('instagram:connecting', onConnectingStatus);

    return () => {
      socket.off('connect', onConnect);
      socket.off('instagram:event', onInstagramEvent);
      socket.off('instagram:connecting', onConnectingStatus);
    };
  }, [session?.user?.id, socket]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
