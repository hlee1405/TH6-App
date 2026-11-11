import { ref, onValue, update, onDisconnect, serverTimestamp } from 'firebase/database';
import { database } from './firebase';
import { User, Contact } from '../types';

/**
 * Lưu hoặc cập nhật thông tin người dùng vào Realtime Database tại /users/${userId}
 */
export const saveUserProfile = async (user: User): Promise<void> => {
  const userRef = ref(database, `users/${user.id}`);
  const now = Date.now();
  await update(userRef, {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone || '',
    avatar: user.avatar || `https://api.dicebear.com/7.x/avataaars/png?seed=${encodeURIComponent(user.name)}`,
    bio: user.bio || 'Người dùng ConnectChat',
    isOnline: user.isOnline ?? true,
    lastSeen: now,
    lastActive: now,
  });
};

/**
 * Cập nhật hồ sơ cá nhân: tên, avatar, bio (Tính năng nâng cao)
 */
export const updateUserProfile = async (
  userId: string,
  profileUpdates: { name?: string; avatar?: string; bio?: string; phone?: string }
): Promise<void> => {
  if (!userId) return;
  const userRef = ref(database, `users/${userId}`);
  await update(userRef, profileUpdates);
};

/**
 * Cập nhật trạng thái trực tuyến của người dùng
 */
export const setUserOnlineStatus = async (userId: string, isOnline: boolean): Promise<void> => {
  if (!userId) return;
  const userRef = ref(database, `users/${userId}`);
  await update(userRef, {
    isOnline,
    lastSeen: Date.now(),
    lastActive: Date.now(),
  });
};

/**
 * Thiết lập hệ thống Presence tự động của Firebase:
 * Khi mất kết nối hoặc thoát ứng dụng, Firebase tự động chuyển isOnline thành false và cập nhật lastSeen
 */
export const setupUserPresence = (userId: string): (() => void) => {
  if (!userId) return () => {};

  const connectedRef = ref(database, '.info/connected');
  const userRef = ref(database, `users/${userId}`);

  const unsubscribe = onValue(connectedRef, (snapshot) => {
    if (snapshot.val() === true) {
      // Khi mất kết nối (ngắt mạng, tắt app), Firebase server tự động update
      onDisconnect(userRef).update({
        isOnline: false,
        lastSeen: serverTimestamp(),
        lastActive: serverTimestamp(),
      });

      // Khi đang kết nối, cập nhật trực tuyến
      update(userRef, {
        isOnline: true,
        lastSeen: Date.now(),
        lastActive: Date.now(),
      });
    }
  });

  return () => {
    unsubscribe();
  };
};

/**
 * Lắng nghe danh sách tất cả người dùng đã đăng ký (loại trừ bản thân) theo thời gian thực
 */
export const subscribeToUsers = (
  currentUserId: string,
  callback: (contacts: Contact[]) => void
): (() => void) => {
  const usersRef = ref(database, 'users');

  const unsubscribe = onValue(
    usersRef,
    (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        callback([]);
        return;
      }

      const contactsList: Contact[] = [];
      Object.keys(data).forEach((uid) => {
        if (uid !== currentUserId) {
          const u = data[uid];
          contactsList.push({
            id: uid,
            name: u.name || 'Người dùng',
            phone: u.phone || '',
            email: u.email || '',
            avatar:
              u.avatar ||
              `https://api.dicebear.com/7.x/avataaars/png?seed=${encodeURIComponent(u.name || uid)}`,
            isOnline: Boolean(u.isOnline),
            lastSeen: u.lastSeen || u.lastActive,
            statusText: u.isOnline ? 'Trực tuyến' : 'Ngoại tuyến',
          });
        }
      });

      callback(contactsList);
    },
    (error) => {
      console.warn('Lỗi lắng nghe danh sách người dùng:', error);
    }
  );

  return () => {
    unsubscribe();
  };
};

/**
 * Lắng nghe thông tin một người dùng cụ thể (tên, avatar, trạng thái online, lastSeen)
 */
export const subscribeToUser = (
  userId: string,
  callback: (user: Partial<User> | null) => void
): (() => void) => {
  if (!userId) return () => {};
  const userRef = ref(database, `users/${userId}`);

  const unsubscribe = onValue(userRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      callback({
        id: userId,
        name: data.name,
        email: data.email,
        phone: data.phone,
        avatar: data.avatar,
        bio: data.bio,
        isOnline: Boolean(data.isOnline),
        lastSeen: data.lastSeen || data.lastActive,
      });
    } else {
      callback(null);
    }
  });

  return () => {
    unsubscribe();
  };
};
