import { create } from 'zustand';

export interface PropertyNotification {
  id: string;
  property_id: number;
  title: string;
  neighborhood: string;
  property_type: string;
  transaction_type: string;
  price: number;
  currency: string;
  received_at: string;
  read: boolean;
}

interface AlertState {
  notifications: PropertyNotification[];
  unreadCount: number;
  addNotification: (data: Omit<PropertyNotification, 'id' | 'received_at' | 'read'>) => void;
  markAllRead: () => void;
  clearAll: () => void;
}

export const useAlertStore = create<AlertState>((set) => ({
  notifications: [],
  unreadCount: 0,
  addNotification: (data) => {
    const notification: PropertyNotification = {
      ...data,
      id: `${Date.now()}-${data.property_id}`,
      received_at: new Date().toISOString(),
      read: false,
    };
    set((s) => ({
      notifications: [notification, ...s.notifications].slice(0, 50),
      unreadCount: s.unreadCount + 1,
    }));
  },
  markAllRead: () =>
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    })),
  clearAll: () => set({ notifications: [], unreadCount: 0 }),
}));
