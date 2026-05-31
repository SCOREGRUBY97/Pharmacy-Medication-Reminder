// ============================================================
// useNotifications Hook
// File: frontend/src/hooks/useNotifications.js
// Use this in any component to manage notifications
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import {
  initNotifications,
  getNotificationStatus,
  showLocalNotification,
} from '../services/pushNotifications';
import { getNotifications, markNotifRead } from '../services/api';

export const useNotifications = () => {
  const [permission, setPermission]     = useState(getNotificationStatus());
  const [supported, setSupported]       = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount]   = useState(0);
  const [loading, setLoading]           = useState(false);

  // Initialize on mount
  useEffect(() => {
    initNotifications().then((result) => {
      setSupported(result.supported);
      if (result.permission) setPermission(result.permission);
    });
    fetchNotifications();

    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await getNotifications();
      setNotifications(res.data);
      setUnreadCount(res.data.filter((n) => !n.is_read).length);
    } catch (err) {
      // silently fail
    }
  }, []);

  const requestPermission = useCallback(async () => {
    setLoading(true);
    try {
      const result = await initNotifications();
      if (result.subscribe) {
        await result.subscribe();
        setPermission('granted');
      }
    } catch (err) {
      console.error('Permission request failed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const markRead = useCallback(async (id) => {
    try {
      await markNotifRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Mark read failed:', err);
    }
  }, []);

  const markAllRead = useCallback(async () => {
    const unread = notifications.filter((n) => !n.is_read);
    await Promise.all(unread.map((n) => markNotifRead(n.id)));
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  }, [notifications]);

  // Show in-app notification
  const notify = useCallback((title, body, options = {}) => {
    showLocalNotification(title, { body, ...options });
  }, []);

  return {
    permission,
    supported,
    notifications,
    unreadCount,
    loading,
    requestPermission,
    markRead,
    markAllRead,
    notify,
    refresh: fetchNotifications,
  };
};
