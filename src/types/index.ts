export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  bio?: string;
  isOnline?: boolean;
  lastSeen?: number;
}

export type MessageType = 'text' | 'image' | 'location' | 'system';

export interface MessageReactionMap {
  [uid: string]: string; // uid -> emoji (👍 ❤️ 😂 😮 😢)
}

export interface MessageReplyInfo {
  id: string;
  senderName: string;
  text?: string;
  type?: MessageType;
}

export interface Message {
  id: string;
  senderId: string;
  senderName?: string;
  senderAvatar?: string;
  type?: MessageType;
  text?: string;
  imageUrl?: string;
  lat?: number;
  lng?: number;
  location?: {
    latitude: number;
    longitude: number;
  };
  time?: string;
  timestamp?: number;
  createdAt?: number;
  isMe?: boolean;
  recalled?: boolean;
  reactions?: MessageReactionMap;
  replyTo?: MessageReplyInfo;
  // Local state for optimistic uploading
  isUploading?: boolean;
  uploadError?: boolean;
  localUri?: string;
}

export type ConversationType = 'direct' | 'group';

export interface Conversation {
  id: string; // convId
  type: ConversationType;
  name: string;
  avatar?: string;
  members: Record<string, boolean>; // { [uid]: true }
  createdBy?: string;
  createdAt?: number;
  lastMessage?: string;
  lastMessageTime?: string;
  lastSenderId?: string;
  lastSenderName?: string;
  updatedAt?: number;
  unreadCount?: number;
  partnerId?: string; // For direct chats
  partnerUser?: User; // For direct chats
  onlineMembersCount?: number;
}

export interface Chat {
  id: string;
  convId?: string;
  type?: ConversationType;
  name?: string;
  user: {
    id: string;
    name: string;
    avatar: string;
    isOnline: boolean;
    lastSeen?: number;
    lastActive?: string;
  };
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  messages: Message[];
  members?: Record<string, boolean>;
}

export interface Contact {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  avatar?: string;
  isOnline?: boolean;
  lastSeen?: number;
  statusText?: string;
}

export type NotificationType = 'message' | 'group' | 'reaction' | 'system' | 'friend';

export interface NotificationItem {
  id: string;
  type: NotificationType;
  convId?: string;
  fromUid?: string;
  fromName?: string;
  fromAvatar?: string;
  title?: string;
  text?: string;
  content?: string;
  createdAt?: number;
  time?: string;
  read?: boolean;
  isRead?: boolean;
}

export interface UserSettings {
  notifications: boolean;
  showOnlineStatus: boolean;
  darkMode: boolean;
  soundEnabled: boolean;
}

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  MainTabs: undefined;
  CreateGroup: undefined;
  ChatDetail: {
    convId: string;
    type?: ConversationType;
    userName: string; // Title / Partner name / Group name
    userId?: string; // Partner uid if direct
    userAvatar?: string;
    isOnline?: boolean;
    lastSeen?: number;
    members?: Record<string, boolean>;
  };
  GroupSettings?: {
    convId: string;
    groupName: string;
    members: Record<string, boolean>;
  };
};

export type MainTabParamList = {
  Home: undefined;
  Contacts: undefined;
  Notifications: undefined;
  Settings: undefined;
};
