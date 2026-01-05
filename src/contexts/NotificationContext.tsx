import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useUser } from './UserContext';
import { db } from '../database';

export interface Notification {
  id: string;
  type: 'achievement' | 'quiz' | 'reminder' | 'streak' | 'level' | 'update';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  icon?: string;
  metadata?: {
    achievementId?: string;
    streakCount?: number;
    level?: number;
    points?: number;
    score?: number;
    progress?: number;
    maxProgress?: number;
  };
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotification: (id: string) => void;
  clearAllNotifications: () => void;
  resetNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const userContext = useUser();
  const { currentUser } = userContext || { currentUser: null };
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Load user-specific notifications from database
  useEffect(() => {
    const loadNotifications = async () => {
      if (currentUser) {
        try {
          const dbNotifications = await db.getNotificationsByUser(currentUser.id);
          const mappedNotifications: Notification[] = dbNotifications.map(notif => ({
            id: notif.id,
            type: notif.type,
            title: notif.title,
            message: notif.message,
            timestamp: new Date(notif.timestamp).getTime(),
            read: notif.read,
            icon: notif.icon,
            metadata: notif.metadata,
          }));
          setNotifications(mappedNotifications);
        } catch (error) {
          console.error('Error loading notifications from database:', error);
          setNotifications([]);
        }
      } else {
        setNotifications([]);
      }
    };

    loadNotifications();
  }, [currentUser]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const addNotification = useCallback(async (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    if (!currentUser) return;

    try {
      const newNotif = await db.createNotification({
        user_id: currentUser.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        icon: notification.icon,
        read: false,
        metadata: notification.metadata || {},
        synced: false,
      });

      const mappedNotif: Notification = {
        id: newNotif.id,
        type: newNotif.type,
        title: newNotif.title,
        message: newNotif.message,
        timestamp: new Date(newNotif.timestamp).getTime(),
        read: newNotif.read,
        icon: newNotif.icon,
        metadata: newNotif.metadata,
      };

      setNotifications(prev => [mappedNotif, ...prev]);
    } catch (error) {
      console.error('Error adding notification:', error);
    }
  }, [currentUser]);

  const markAsRead = useCallback(async (id: string) => {
    if (!currentUser) return;

    try {
      await db.updateNotification(id, { read: true });
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, [currentUser]);

  const markAllAsRead = useCallback(async () => {
    if (!currentUser) return;

    try {
      const updatePromises = notifications
        .filter(n => !n.read)
        .map(n => db.updateNotification(n.id, { read: true }));
      
      await Promise.all(updatePromises);
      setNotifications(prev =>
        prev.map(n => ({ ...n, read: true }))
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, [currentUser, notifications]);

  const clearNotification = useCallback(async (id: string) => {
    if (!currentUser) return;

    try {
      await db.deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      console.error('Error clearing notification:', error);
    }
  }, [currentUser]);

  const clearAllNotifications = useCallback(async () => {
    if (!currentUser) return;

    try {
      const deletePromises = notifications.map(n => db.deleteNotification(n.id));
      await Promise.all(deletePromises);
      setNotifications([]);
    } catch (error) {
      console.error('Error clearing all notifications:', error);
    }
  }, [currentUser, notifications]);

  // Reset all notifications
  const resetNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearNotification,
        clearAllNotifications,
        resetNotifications
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
}