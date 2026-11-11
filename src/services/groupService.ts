import { ref, push, update, onValue } from 'firebase/database';
import { database } from './firebase';
import { pushNotification } from './notificationService';

/**
 * Lắng nghe danh sách thành viên của một nhóm theo thời gian thực
 */
export const subscribeToGroupMembers = (
  convId: string,
  callback: (members: Record<string, boolean>) => void
): (() => void) => {
  if (!convId) {
    callback({});
    return () => {};
  }
  const membersRef = ref(database, `conversations/${convId}/members`);
  const unsub = onValue(
    membersRef,
    (snap) => {
      if (snap.exists()) {
        callback(snap.val() || {});
      }
    },
    (err) => console.debug('Lỗi subscribeToGroupMembers:', err)
  );
  return unsub;
};

export interface CreateGroupParams {
  name: string;
  creatorId: string;
  creatorName: string;
  creatorAvatar?: string;
  memberIds: string[]; // List of member UIDs (excluding creator)
}

/**
 * Tạo một nhóm trò chuyện mới
 * Yêu cầu: tối thiểu 2 thành viên ngoài bản thân (tổng >= 3 người)
 */
export const createGroupConversation = async ({
  name,
  creatorId,
  creatorName,
  creatorAvatar,
  memberIds,
}: CreateGroupParams): Promise<string> => {
  const cleanName = name.trim();
  if (!cleanName) {
    throw new Error('Vui lòng nhập tên nhóm');
  }

  // Loại trừ creatorId nếu vô tình nằm trong memberIds
  const distinctOtherMembers = Array.from(new Set(memberIds.filter((id) => id !== creatorId)));
  if (distinctOtherMembers.length < 2) {
    throw new Error('Nhóm cần tối thiểu 2 thành viên ngoài bạn (tổng tối thiểu 3 người)');
  }

  const allMembers = [creatorId, ...distinctOtherMembers];
  const membersMap: Record<string, boolean> = {};
  allMembers.forEach((uid) => {
    membersMap[uid] = true;
  });

  const timestamp = Date.now();
  const pushKey = push(ref(database, 'conversations')).key;
  const convId = `group_${pushKey || timestamp}`;

  const defaultAvatar = `https://api.dicebear.com/7.x/identicon/png?seed=${encodeURIComponent(cleanName)}`;

  // Multi-path update để tạo nhóm nguyên tử
  const updates: Record<string, any> = {};

  // 1. Node cuộc trò chuyện
  updates[`conversations/${convId}`] = {
    id: convId,
    type: 'group',
    name: cleanName,
    avatar: defaultAvatar,
    createdBy: creatorId,
    createdAt: timestamp,
    members: membersMap,
  };

  // 2. Node tin nhắn hệ thống đầu tiên
  const msgRef = push(ref(database, `messages/${convId}`));
  const msgId = msgRef.key || `sys_${timestamp}`;
  const initialText = `${creatorName} đã tạo nhóm "${cleanName}"`;

  updates[`messages/${convId}/${msgId}`] = {
    id: msgId,
    senderId: creatorId,
    senderName: 'Hệ thống',
    type: 'system',
    text: initialText,
    createdAt: timestamp,
    timestamp,
    time: new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    recalled: false,
  };

  // 3. Khởi tạo node userChats cho tất cả thành viên
  allMembers.forEach((uid) => {
    updates[`userChats/${uid}/${convId}`] = {
      chatId: convId,
      convId,
      type: 'group',
      name: cleanName,
      avatar: defaultAvatar,
      lastMessage: initialText,
      lastSenderId: creatorId,
      lastSenderName: creatorName,
      lastMessageTime: new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      updatedAt: timestamp,
      timestamp,
      unread: 0,
      unreadCount: 0,
      members: membersMap,
    };
  });

  await update(ref(database), updates);

  // 4. Gửi thông báo đến tất cả thành viên khác được thêm vào nhóm
  distinctOtherMembers.forEach((uid) => {
    pushNotification(uid, {
      type: 'group',
      convId,
      fromUid: creatorId,
      fromName: creatorName,
      fromAvatar: creatorAvatar,
      title: 'Nhóm mới',
      text: `${creatorName} đã thêm bạn vào nhóm "${cleanName}"`,
    });
  });

  return convId;
};

/**
 * Đổi tên nhóm (Tính năng nâng cao)
 */
export const updateGroupName = async (
  convId: string,
  newName: string,
  senderId: string,
  senderName: string,
  members: Record<string, boolean>
): Promise<void> => {
  const cleanName = newName.trim();
  if (!cleanName) return;

  const timestamp = Date.now();
  const updates: Record<string, any> = {};

  updates[`conversations/${convId}/name`] = cleanName;

  // Tin nhắn hệ thống
  const msgRef = push(ref(database, `messages/${convId}`));
  const msgId = msgRef.key || `sys_${timestamp}`;
  const text = `${senderName} đã đổi tên nhóm thành "${cleanName}"`;

  updates[`messages/${convId}/${msgId}`] = {
    id: msgId,
    senderId,
    senderName: 'Hệ thống',
    type: 'system',
    text,
    createdAt: timestamp,
    timestamp,
    time: new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    recalled: false,
  };

  // Cập nhật tên trong userChats của các thành viên
  Object.keys(members || {}).forEach((uid) => {
    updates[`userChats/${uid}/${convId}/name`] = cleanName;
    updates[`userChats/${uid}/${convId}/lastMessage`] = text;
    updates[`userChats/${uid}/${convId}/updatedAt`] = timestamp;
  });

  await update(ref(database), updates);
};

/**
 * Rời khỏi nhóm (Tính năng nâng cao)
 */
export const leaveGroup = async (
  convId: string,
  userId: string,
  userName: string,
  members: Record<string, boolean>
): Promise<void> => {
  const timestamp = Date.now();
  const updates: Record<string, any> = {};

  // Xóa user khỏi danh sách members
  updates[`conversations/${convId}/members/${userId}`] = null;
  updates[`userChats/${userId}/${convId}`] = null;

  // Tin nhắn hệ thống thông báo người này đã rời nhóm
  const msgRef = push(ref(database, `messages/${convId}`));
  const msgId = msgRef.key || `sys_${timestamp}`;
  const text = `${userName} đã rời nhóm`;

  updates[`messages/${convId}/${msgId}`] = {
    id: msgId,
    senderId: userId,
    senderName: 'Hệ thống',
    type: 'system',
    text,
    createdAt: timestamp,
    timestamp,
    time: new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    recalled: false,
  };

  // Cập nhật lastMessage cho những thành viên còn lại
  Object.keys(members || {}).forEach((uid) => {
    if (uid !== userId) {
      updates[`userChats/${uid}/${convId}/lastMessage`] = text;
      updates[`userChats/${uid}/${convId}/updatedAt`] = timestamp;
    }
  });

  await update(ref(database), updates);
};

/**
 * Thêm thành viên vào nhóm (Tính năng nâng cao)
 */
export const addMembersToGroup = async (
  convId: string,
  groupName: string,
  newMemberIds: string[],
  adderId: string,
  adderName: string,
  currentMembers: Record<string, boolean>
): Promise<void> => {
  if (!newMemberIds || newMemberIds.length === 0) return;

  const timestamp = Date.now();
  const updates: Record<string, any> = {};

  const updatedMembers = { ...currentMembers };
  newMemberIds.forEach((uid) => {
    updatedMembers[uid] = true;
  });

  newMemberIds.forEach((uid) => {
    updates[`conversations/${convId}/members/${uid}`] = true;
    updates[`userChats/${uid}/${convId}`] = {
      chatId: convId,
      convId,
      type: 'group',
      name: groupName,
      lastMessage: `${adderName} đã thêm thành viên mới`,
      lastSenderId: adderId,
      lastSenderName: adderName,
      lastMessageTime: new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      updatedAt: timestamp,
      timestamp,
      unread: 0,
      unreadCount: 0,
      members: updatedMembers,
    };
  });

  const msgRef = push(ref(database, `messages/${convId}`));
  const msgId = msgRef.key || `sys_${timestamp}`;
  const text = `${adderName} đã thêm thành viên mới vào nhóm`;

  updates[`messages/${convId}/${msgId}`] = {
    id: msgId,
    senderId: adderId,
    senderName: 'Hệ thống',
    type: 'system',
    text,
    createdAt: timestamp,
    timestamp,
    time: new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    recalled: false,
  };

  Object.keys(currentMembers || {}).forEach((uid) => {
    updates[`userChats/${uid}/${convId}/lastMessage`] = text;
    updates[`userChats/${uid}/${convId}/updatedAt`] = timestamp;
  });

  await update(ref(database), updates);

  // Gửi thông báo đến thành viên mới
  newMemberIds.forEach((uid) => {
    pushNotification(uid, {
      type: 'group',
      convId,
      fromUid: adderId,
      fromName: adderName,
      title: 'Được thêm vào nhóm',
      text: `${adderName} đã thêm bạn vào nhóm "${groupName}"`,
    });
  });
};
