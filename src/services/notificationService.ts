import { ref, push, set, update, onValue, get } from 'firebase/database';
import { database } from './firebase';
import { NotificationItem, NotificationType } from '../types';

/**
 * Ghi một thông báo vào notifications/{uid}/{id}
 */
export const pushNotification = async (
  toUid: string,
  data: {
    type: NotificationType;
    convId?: string;
    fromUid: string;
    fromName: string;
    fromAvatar?: string;
    title: string;
    text: string;
  }
): Promise<void> => {
  if (!toUid || toUid === data.fromUid) return;

  try {
    const notifsRef = ref(database, `notifications/${toUid}`);
    const newNotifRef = push(notifsRef);
    const notifId = newNotifRef.key || `notif_${Date.now()}`;

    const payload = {
      id: notifId,
      type: data.type,
      convId: data.convId || '',
      fromUid: data.fromUid,
      fromName: data.fromName || 'Người dùng',
      fromAvatar: data.fromAvatar || '',
      title: data.title,
      text: data.text,
      createdAt: Date.now(),
      read: false,
    };

    await set(newNotifRef, payload);
  } catch (error) {
    console.warn('Lỗi ghi thông báo:', error);
  }
};

/**
 * Gửi thông báo đến danh sách thành viên (loại trừ người gửi)
 */
export const notifyMembers = async (
  members: Record<string, boolean> | string[],
  senderId: string,
  data: {
    type: NotificationType;
    convId: string;
    fromName: string;
    fromAvatar?: string;
    title: string;
    text: string;
  }
): Promise<void> => {
  const memberList = Array.isArray(members) ? members : Object.keys(members || {});
  for (const memberId of memberList) {
    if (memberId && memberId !== senderId) {
      await pushNotification(memberId, {
        ...data,
        fromUid: senderId,
      });
    }
  }
};

/**
 * Lắng nghe danh sách thông báo theo thời gian thực cho một người dùng
 */
export const subscribeToNotifications = (
  uid: string,
  callback: (notifications: NotificationItem[]) => void
): (() => void) => {
  if (!uid) {
    callback([]);
    return () => {};
  }

  const notifsRef = ref(database, `notifications/${uid}`);

  const unsubscribe = onValue(
    notifsRef,
    (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        callback([]);
        return;
      }

      const list: NotificationItem[] = [];
      Object.keys(data).forEach((key) => {
        const item = data[key];
        const createdAt = item.createdAt || 0;
        const date = new Date(createdAt);
        const timeStr = `${date.getHours().toString().padStart(2, '0')}:${date
          .getMinutes()
          .toString()
          .padStart(2, '0')}`;

        list.push({
          id: item.id || key,
          type: item.type || 'message',
          convId: item.convId || '',
          fromUid: item.fromUid || '',
          fromName: item.fromName || 'Người dùng',
          fromAvatar: item.fromAvatar || '',
          title: item.title || 'Thông báo mới',
          text: item.text || item.content || '',
          content: item.text || item.content || '',
          createdAt,
          time: timeStr,
          read: Boolean(item.read),
          isRead: Boolean(item.read),
        });
      });

      // Sắp xếp giảm dần theo thời gian (mới nhất lên đầu)
      list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

      callback(list);
    },
    (error) => {
      console.warn('Lỗi lắng nghe thông báo:', error);
    }
  );

  return unsubscribe;
};

/**
 * Đánh dấu một thông báo là đã đọc
 */
export const markNotificationAsRead = async (
  uid: string,
  notifId: string
): Promise<void> => {
  if (!uid || !notifId) return;
  try {
    const notifRef = ref(database, `notifications/${uid}/${notifId}`);
    await update(notifRef, { read: true });
  } catch (error) {
    console.warn('Lỗi đánh dấu đã đọc thông báo:', error);
  }
};

/**
 * Đánh dấu tất cả thông báo là đã đọc
 */
export const markAllNotificationsAsRead = async (uid: string): Promise<void> => {
  if (!uid) return;
  try {
    const notifsRef = ref(database, `notifications/${uid}`);
    const snapshot = await get(notifsRef);
    if (!snapshot.exists()) return;

    const data = snapshot.val();
    const updates: Record<string, any> = {};
    Object.keys(data).forEach((key) => {
      if (!data[key].read) {
        updates[`${key}/read`] = true;
      }
    });

    if (Object.keys(updates).length > 0) {
      await update(notifsRef, updates);
    }
  } catch (error) {
    console.warn('Lỗi đánh dấu tất cả đã đọc thông báo:', error);
  }
};
