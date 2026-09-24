import { useEffect, useCallback, useState } from 'react';
import toast from 'react-hot-toast';
import { notificationService } from '../services';

const REFRESH_MS = 30000;

export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await notificationService.getAll();
      setNotifications(res.notifications);
      setUnread(res.unread);
    } catch {
      /* silent background poll */
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, REFRESH_MS);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const showToast = (type, title, message) => {
    const text = message ? `${title} — ${message}` : title;
    if (type === 'success') toast.success(text);
    else if (type === 'error') toast.error(text);
    else toast(text);
  };

  const markRead = async (id) => {
    await notificationService.markRead(id);
    setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
    setUnread((u) => Math.max(0, u - 1));
  };

  const markAllRead = async () => {
    await notificationService.markAllRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnread(0);
  };

  const manualFetch = async (withToast = false) => {
    setLoading(true);
    try {
      const res = await notificationService.getAll();
      setNotifications(res.notifications);
      setUnread(res.unread);
      if (withToast) toast.success('Notifications refreshed');
    } catch (err) {
      if (withToast) toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { notifications, unread, loading, markRead, markAllRead, fetchNotifications, manualFetch, showToast };
};