import { create } from 'zustand';
import { ExternalToast, toast } from "sonner";

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  timestamp: Date;
  read: boolean;
  autoClose?: boolean;
  duration?: number;
  link?: string;
  actionLabel?: string;
}

interface NotificationStore {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  removeNotification: (id: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  notifications: [],
  unreadCount: 0,
  
  addNotification: (notification) => {
    const newNotification: Notification = {
      ...notification,
      id: `notification-${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
      read: false,
      autoClose: notification.autoClose ?? true,
      duration: notification.duration ?? 5000,
    };

    set((state) => ({
      notifications: [newNotification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }));

    // Trigger Sonner toast
    // Map internal types to Sonner equivalent if needed
    const { type, title, message, link, actionLabel } = notification;
    const toastOptions: ExternalToast = { description: message };

    // Add action if link is provided
    if (link) {
      toastOptions.action = {
        label: actionLabel || "View",
        onClick: () => window.location.href = link
      };
    }

    if (type === 'success') toast.success(title, toastOptions);
    else if (type === 'error') toast.error(title, toastOptions);
    else if (type === 'warning') toast.warning(title, toastOptions);
    else if (type === 'info') toast.info(title, toastOptions);
    else toast(title, toastOptions);
  },

  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),

  markAsRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    })),

  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    })),

  clearAll: () =>
    set({
      notifications: [],
      unreadCount: 0,
    }),
}));
