import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { User, Chat, Contact, NotificationItem, UserSettings } from '../types';
import { Theme, lightTheme, darkTheme } from '../theme';
import {
  INITIAL_CHATS,
  INITIAL_CONTACTS,
  INITIAL_SETTINGS,
} from '../data/mockData';
import {
  isFirebaseConfigured,
  subscribeToAuth,
  loginWithEmail,
  registerWithEmail,
  logoutFirebase,
  getAuthErrorMessage,
  subscribeToUsers,
  subscribeToUser,
  setupUserPresence,
  subscribeToAllConversations,
  subscribeToNotifications,
  markNotificationAsRead as fbMarkNotificationAsRead,
  markAllNotificationsAsRead as fbMarkAllNotificationsAsRead,
  markConversationAsRead,
  createGroupConversation,
  updateUserProfile,
} from '../services';

interface AuthResult {
  success: boolean;
  error?: string;
}

interface AppContextType {
  isLoggedIn: boolean;
  isFirebaseActive: boolean;
  currentUser: User;
  chats: Chat[];
  contacts: Contact[];
  notifications: NotificationItem[];
  settings: UserSettings;
  theme: Theme;
  unreadChatsCount: number;
  unreadNotificationsCount: number;
  login: (email: string, pass: string) => Promise<AuthResult>;
  register: (name: string, email: string, pass: string) => Promise<AuthResult>;
  logout: () => Promise<void>;
  markChatAsRead: (convId: string) => void;
  markNotificationAsRead: (notificationId: string) => void;
  markAllNotificationsAsRead: () => void;
  createGroup: (name: string, memberIds: string[]) => Promise<string>;
  updateProfile: (updates: { name?: string; avatar?: string; bio?: string }) => Promise<void>;
  updateSetting: <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => void;
  getChatByUserId: (userId: string) => Chat | undefined;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const DEFAULT_USER: User = {
  id: '',
  name: 'Khách',
  email: '',
  phone: '',
  avatar: '',
  bio: '',
  isOnline: false,
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<User>(DEFAULT_USER);
  const [chats, setChats] = useState<Chat[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [settings, setSettings] = useState<UserSettings>(INITIAL_SETTINGS);

  const isFirebaseActive = useMemo(() => isFirebaseConfigured(), []);

  // Lắng nghe trạng thái Firebase Auth và đồng bộ Realtime Database nếu đã cấu hình
  useEffect(() => {
    if (!isFirebaseConfigured()) {
      return;
    }

    let unsubPresence: (() => void) | null = null;
    let unsubProfile: (() => void) | null = null;
    let unsubUsers: (() => void) | null = null;
    let unsubConversations: (() => void) | null = null;
    let unsubNotifications: (() => void) | null = null;

    const unsubAuth = subscribeToAuth((fbUser) => {
      if (unsubPresence) { unsubPresence(); unsubPresence = null; }
      if (unsubProfile) { unsubProfile(); unsubProfile = null; }
      if (unsubUsers) { unsubUsers(); unsubUsers = null; }
      if (unsubConversations) { unsubConversations(); unsubConversations = null; }
      if (unsubNotifications) { unsubNotifications(); unsubNotifications = null; }

      if (fbUser) {
        const uid = fbUser.uid;
        const initialName = fbUser.displayName || fbUser.email?.split('@')[0] || 'Người dùng';

        setCurrentUser({
          id: uid,
          name: initialName,
          email: fbUser.email || '',
          phone: '',
          avatar: `https://api.dicebear.com/7.x/avataaars/png?seed=${encodeURIComponent(initialName)}`,
          bio: 'Xin chào! Tôi đang dùng ConnectChat.',
          isOnline: true,
        });
        setIsLoggedIn(true);

        // 1. Tự động cập nhật trực tuyến và ngắt khi offline
        unsubPresence = setupUserPresence(uid);

        // 2. Lắng nghe cập nhật thông tin hồ sơ của chính mình
        unsubProfile = subscribeToUser(uid, (profile) => {
          if (profile) {
            setCurrentUser((prev) => ({
              ...prev,
              ...profile,
              id: uid,
            }));
          }
        });

        // 3. Lắng nghe danh sách liên hệ (danh bạ) loại trừ chính mình
        unsubUsers = subscribeToUsers(uid, (userList) => {
          setContacts(userList);
        });

        // 4. Lắng nghe danh sách tất cả các cuộc trò chuyện (cả 1-1 và Nhóm)
        unsubConversations = subscribeToAllConversations(uid, (convList) => {
          setChats(convList);
        });

        // 5. Lắng nghe thông báo thật theo thời gian thực từ notifications/{uid}
        unsubNotifications = subscribeToNotifications(uid, (notifList) => {
          setNotifications(notifList);
        });
      } else {
        setIsLoggedIn(false);
        setCurrentUser(DEFAULT_USER);
        setChats([]);
        setContacts([]);
        setNotifications([]);
      }
    });

    return () => {
      unsubAuth();
      if (unsubPresence) unsubPresence();
      if (unsubProfile) unsubProfile();
      if (unsubUsers) unsubUsers();
      if (unsubConversations) unsubConversations();
      if (unsubNotifications) unsubNotifications();
    };
  }, []);

  const unreadChatsCount = useMemo(() => {
    return chats.reduce((acc, chat) => acc + (chat.unreadCount > 0 ? 1 : 0), 0);
  }, [chats]);

  const unreadNotificationsCount = useMemo(() => {
    return notifications.filter((n) => !n.read && !n.isRead).length;
  }, [notifications]);

  /**
   * Đăng nhập: Hỗ trợ cả Firebase Realtime thật và Chế độ Demo
   */
  const login = async (email: string, pass: string): Promise<AuthResult> => {
    if (!isFirebaseConfigured()) {
      const isUser1 = email.toLowerCase().includes('user1');
      const isUser2 = email.toLowerCase().includes('user2');
      const id = isUser1 ? 'u_user1' : isUser2 ? 'u_user2' : `demo_${Date.now()}`;
      const name = isUser1
        ? 'Nguyễn Văn A'
        : isUser2
        ? 'Trần Thị B'
        : email.split('@')[0] || 'Người dùng';

      setCurrentUser({
        id,
        name,
        email: email.trim(),
        phone: '0912 345 678',
        avatar: `https://api.dicebear.com/7.x/avataaars/png?seed=${encodeURIComponent(name)}`,
        bio: 'Tài khoản trải nghiệm ConnectChat',
        isOnline: true,
      });

      const demoContacts = INITIAL_CONTACTS.filter((c) => c.id !== id);
      setContacts(demoContacts);
      setChats(INITIAL_CHATS);
      setIsLoggedIn(true);
      return { success: true };
    }

    try {
      await loginWithEmail(email, pass);
      return { success: true };
    } catch (error: any) {
      console.warn('Lỗi đăng nhập Firebase:', error);
      const code = error?.code || '';
      return {
        success: false,
        error: getAuthErrorMessage(code),
      };
    }
  };

  /**
   * Đăng ký tài khoản
   */
  const register = async (name: string, email: string, pass: string): Promise<AuthResult> => {
    if (!isFirebaseConfigured()) {
      const id = `u_${Date.now()}`;
      const userName = name.trim() || 'Người dùng mới';

      setCurrentUser({
        id,
        name: userName,
        email: email.trim(),
        phone: '',
        avatar: `https://api.dicebear.com/7.x/avataaars/png?seed=${encodeURIComponent(userName)}`,
        bio: 'Người dùng mới của ConnectChat',
        isOnline: true,
      });

      setContacts(INITIAL_CONTACTS);
      setChats([]);
      setIsLoggedIn(true);
      return { success: true };
    }

    try {
      await registerWithEmail(name, email, pass);
      return { success: true };
    } catch (error: any) {
      console.warn('Lỗi đăng ký Firebase:', error);
      const code = error?.code || '';
      return {
        success: false,
        error: getAuthErrorMessage(code),
      };
    }
  };

  /**
   * Đăng xuất
   */
  const logout = async (): Promise<void> => {
    if (isFirebaseConfigured()) {
      try {
        await logoutFirebase(currentUser.id);
      } catch (error) {
        console.warn('Lỗi đăng xuất Firebase:', error);
      }
    }
    setIsLoggedIn(false);
    setCurrentUser(DEFAULT_USER);
  };

  /**
   * Đánh dấu cuộc trò chuyện đã đọc
   */
  const markChatAsRead = (convId: string) => {
    if (!currentUser.id || !convId) return;

    if (isFirebaseConfigured()) {
      markConversationAsRead(convId, currentUser.id);
    } else {
      setChats((prev) =>
        prev.map((c) => (c.id === convId ? { ...c, unreadCount: 0 } : c))
      );
    }
  };

  const getChatByUserId = (userId: string) => {
    return chats.find((c) => c.user.id === userId || c.id === userId);
  };

  /**
   * Đánh dấu một thông báo đã đọc
   */
  const markNotificationAsRead = (notificationId: string) => {
    if (!notificationId) return;
    if (isFirebaseConfigured() && currentUser.id) {
      fbMarkNotificationAsRead(currentUser.id, notificationId);
    } else {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true, isRead: true } : n))
      );
    }
  };

  /**
   * Đánh dấu tất cả thông báo đã đọc
   */
  const markAllNotificationsAsRead = () => {
    if (isFirebaseConfigured() && currentUser.id) {
      fbMarkAllNotificationsAsRead(currentUser.id);
    } else {
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read: true, isRead: true }))
      );
    }
  };

  /**
   * Tạo nhóm trò chuyện
   */
  const createGroup = async (name: string, memberIds: string[]): Promise<string> => {
    if (!currentUser.id) throw new Error('Chưa đăng nhập');
    return createGroupConversation({
      name,
      creatorId: currentUser.id,
      creatorName: currentUser.name,
      creatorAvatar: currentUser.avatar,
      memberIds,
    });
  };

  /**
   * Cập nhật hồ sơ cá nhân
   */
  const updateProfile = async (updates: { name?: string; avatar?: string; bio?: string }) => {
    if (!currentUser.id) return;
    await updateUserProfile(currentUser.id, updates);
    setCurrentUser((prev) => ({ ...prev, ...updates }));
  };

  const updateSetting = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const theme = useMemo(() => {
    return settings.darkMode ? darkTheme : lightTheme;
  }, [settings.darkMode]);

  return (
    <AppContext.Provider
      value={{
        isLoggedIn,
        isFirebaseActive,
        currentUser,
        chats,
        contacts,
        notifications,
        settings,
        theme,
        unreadChatsCount,
        unreadNotificationsCount,
        login,
        register,
        logout,
        markChatAsRead,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        createGroup,
        updateProfile,
        updateSetting,
        getChatByUserId,
      }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
