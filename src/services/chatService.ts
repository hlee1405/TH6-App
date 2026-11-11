import {
  ref,
  push,
  set,
  onValue,
  update,
  get,
  query,
  orderByChild,
  limitToLast,
  onDisconnect,
  increment,
} from 'firebase/database';
import { database } from './firebase';
import { Message, Chat, MessageType } from '../types';
import { notifyMembers } from './notificationService';

/**
 * Tạo Chat ID duy nhất và cố định cho 2 người dùng (ví dụ: uidA_uidB)
 */
export const getDirectChatId = (uid1: string, uid2: string): string => {
  if (!uid1 || !uid2) return 'general_chat';
  return [uid1, uid2].sort().join('_');
};

export const getChatId = getDirectChatId; // tương thích ngược

/**
 * Định dạng giờ hiện tại theo dạng HH:mm
 */
export const formatTime = (timestamp: number): string => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

/**
 * Định dạng thời gian hoạt động cuối "Hoạt động X phút trước"
 */
export const formatLastSeen = (timestamp?: number): string => {
  if (!timestamp) return 'Offline';
  const now = Date.now();
  const diffMinutes = Math.floor((now - timestamp) / (1000 * 60));

  if (diffMinutes < 1) return 'Vừa mới hoạt động';
  if (diffMinutes < 60) return `Hoạt động ${diffMinutes} phút trước`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `Hoạt động ${diffHours} giờ trước`;
  const diffDays = Math.floor(diffHours / 24);
  return `Hoạt động ${diffDays} ngày trước`;
};

/**
 * Đảm bảo node conversations/{convId} tồn tại cho chat 1-1
 */
export const ensureDirectConversation = async (
  uid1: string,
  uid2: string,
  user1Name?: string,
  user2Name?: string
): Promise<string> => {
  const convId = getDirectChatId(uid1, uid2);
  try {
    const convRef = ref(database, `conversations/${convId}`);
    const snap = await get(convRef);

    if (!snap.exists()) {
      await set(convRef, {
        id: convId,
        type: 'direct',
        name: `${user1Name || uid1} - ${user2Name || uid2}`,
        createdAt: Date.now(),
        members: {
          [uid1]: true,
          [uid2]: true,
        },
      });
    }
  } catch (err) {
    console.debug('ensureDirectConversation notice:', err);
  }

  return convId;
};

interface SendMessageBaseParams {
  convId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  receiverName?: string;
  groupName?: string;
  members: Record<string, boolean> | string[];
  replyTo?: {
    id: string;
    senderName: string;
    text?: string;
    type?: MessageType;
  };
}

/**
 * Gửi tin nhắn đa phương thức sử dụng MULTI-PATH UPDATE và increment(1)
 */
export const sendMessageGeneric = async (
  params: SendMessageBaseParams & {
    type: MessageType;
    text?: string;
    imageUrl?: string;
    lat?: number;
    lng?: number;
    displayLastMessage: string;
  }
): Promise<string> => {
  const {
    convId,
    senderId,
    senderName,
    senderAvatar,
    receiverName,
    groupName,
    members,
    replyTo,
    type,
    text,
    imageUrl,
    lat,
    lng,
    displayLastMessage,
  } = params;

  const timestamp = Date.now();
  const timeStr = formatTime(timestamp);
  const isGroup =
    Boolean(groupName) ||
    convId.startsWith('group_') ||
    convId.startsWith('-') ||
    (!convId.includes('_') && convId !== 'general_chat');

  const messagesRef = ref(database, `messages/${convId}`);
  const newMessageRef = push(messagesRef);
  const messageId = newMessageRef.key || `msg_${timestamp}`;

  const messageData: any = {
    id: messageId,
    senderId,
    senderName,
    senderAvatar: senderAvatar || '',
    type,
    createdAt: timestamp,
    timestamp,
    time: timeStr,
    recalled: false,
  };

  if (text) messageData.text = text;
  if (imageUrl) messageData.imageUrl = imageUrl;
  if (lat !== undefined && lng !== undefined) {
    messageData.lat = lat;
    messageData.lng = lng;
    messageData.location = { latitude: lat, longitude: lng };
  }
  if (replyTo) {
    messageData.replyTo = replyTo;
  }

  // Chuẩn bị danh sách thành viên
  const memberList = Array.isArray(members) ? [...members] : Object.keys(members || {});
  if (!isGroup && convId.includes('_')) {
    const parts = convId.split('_');
    parts.forEach((p) => {
      if (p && !memberList.includes(p)) memberList.push(p);
    });
  }
  if (!memberList.includes(senderId)) {
    memberList.push(senderId);
  }

  // Nếu là nhóm và memberList chưa đủ thành viên, tự động lấy từ node conversations/${convId}/members
  if (isGroup && memberList.length <= 1) {
    try {
      const snap = await get(ref(database, `conversations/${convId}/members`));
      if (snap.exists()) {
        const memData = snap.val() || {};
        Object.keys(memData).forEach((uid) => {
          if (!memberList.includes(uid)) memberList.push(uid);
        });
      }
    } catch (e) {
      console.debug('Lỗi đọc group members:', e);
    }
  }

  // MULTI-PATH UPDATE NGUYÊN TỬ:
  // Cập nhật messages + userChats của từng thành viên (increment(1) cho người nhận)
  const updates: Record<string, any> = {};
  updates[`messages/${convId}/${messageId}`] = messageData;

  const membersMapForGroup: Record<string, boolean> = {};
  memberList.forEach((mId) => {
    membersMapForGroup[mId] = true;
  });

  memberList.forEach((uid) => {
    if (!uid) return;
    const isSender = uid === senderId;
    updates[`userChats/${uid}/${convId}/lastMessage`] = displayLastMessage;
    updates[`userChats/${uid}/${convId}/lastSenderId`] = senderId;
    updates[`userChats/${uid}/${convId}/lastSenderName`] = senderName;
    updates[`userChats/${uid}/${convId}/updatedAt`] = timestamp;
    updates[`userChats/${uid}/${convId}/timestamp`] = timestamp;
    updates[`userChats/${uid}/${convId}/lastMessageTime`] = timeStr;
    updates[`userChats/${uid}/${convId}/type`] = isGroup ? 'group' : 'direct';
    updates[`userChats/${uid}/${convId}/chatId`] = convId;
    updates[`userChats/${uid}/${convId}/convId`] = convId;

    if (!isGroup) {
      // Đối với chat 1-1: Luôn xác định đối phương (người kia)
      const otherUid = memberList.find((m) => m !== uid);
      if (otherUid) {
        updates[`userChats/${uid}/${convId}/partnerId`] = otherUid;
        if (isSender) {
          if (receiverName) updates[`userChats/${uid}/${convId}/name`] = receiverName;
        } else {
          // Người nhận sẽ thấy tên người gửi
          updates[`userChats/${uid}/${convId}/name`] = senderName;
          if (senderAvatar) updates[`userChats/${uid}/${convId}/avatar`] = senderAvatar;
        }
      }
    } else {
      if (groupName) updates[`userChats/${uid}/${convId}/name`] = groupName;
      updates[`userChats/${uid}/${convId}/members`] = membersMapForGroup;
    }

    if (isSender) {
      updates[`userChats/${uid}/${convId}/unread`] = 0;
      updates[`userChats/${uid}/${convId}/unreadCount`] = 0;
    } else {
      updates[`userChats/${uid}/${convId}/unread`] = increment(1);
      updates[`userChats/${uid}/${convId}/unreadCount`] = increment(1);
    }
  });

  await update(ref(database), updates);

  // Gửi thông báo đến những người khác
  const notificationTitle = isGroup ? (groupName || 'Nhóm trò chuyện') : senderName;
  const notificationText = isGroup ? `${senderName}: ${displayLastMessage}` : displayLastMessage;
  notifyMembers(memberList, senderId, {
    type: isGroup ? 'group' : 'message',
    convId,
    fromName: senderName,
    fromAvatar: senderAvatar,
    title: notificationTitle,
    text: notificationText,
  });

  return messageId;
};

/**
 * Gửi tin nhắn văn bản
 */
export const sendTextMessage = async (
  params: SendMessageBaseParams & { text: string }
): Promise<string> => {
  const clean = params.text.trim();
  if (!clean) return '';
  return sendMessageGeneric({
    ...params,
    type: 'text',
    text: clean,
    displayLastMessage: clean,
  });
};

/**
 * Gửi tin nhắn hình ảnh
 */
export const sendImageMessage = async (
  params: SendMessageBaseParams & { imageUrl: string }
): Promise<string> => {
  return sendMessageGeneric({
    ...params,
    type: 'image',
    imageUrl: params.imageUrl,
    displayLastMessage: '📷 Hình ảnh',
  });
};

/**
 * Gửi tin nhắn vị trí
 */
export const sendLocationMessage = async (
  params: SendMessageBaseParams & { lat: number; lng: number }
): Promise<string> => {
  return sendMessageGeneric({
    ...params,
    type: 'location',
    lat: params.lat,
    lng: params.lng,
    displayLastMessage: '📍 Vị trí',
  });
};

/**
 * Thu hồi tin nhắn: đánh dấu recalled: true, không xóa node
 * Nếu là tin cuối của cuộc trò chuyện thì cập nhật lại lastMessage
 */
export const recallMessage = async (
  convId: string,
  messageId: string,
  senderId: string,
  members: Record<string, boolean> | string[],
  isLastMessage: boolean = false
): Promise<void> => {
  const updates: Record<string, any> = {};
  updates[`messages/${convId}/${messageId}/recalled`] = true;
  updates[`messages/${convId}/${messageId}/text`] = 'Tin nhắn đã được thu hồi';

  if (isLastMessage) {
    const memberList = Array.isArray(members) ? members : Object.keys(members || {});
    memberList.forEach((uid) => {
      updates[`userChats/${uid}/${convId}/lastMessage`] = 'Tin nhắn đã được thu hồi';
    });
  }

  await update(ref(database), updates);
};

/**
 * Thả cảm xúc vào tin nhắn (👍 ❤️ 😂 😮 😢)
 * Toggle nếu đã thả cảm xúc đó trước đó
 */
export const toggleReaction = async (
  convId: string,
  messageId: string,
  userId: string,
  userName: string,
  emoji: string,
  messageSenderId: string,
  currentReactions?: Record<string, string>
): Promise<void> => {
  const alreadyReactedWithSame = currentReactions?.[userId] === emoji;
  const newEmoji = alreadyReactedWithSame ? null : emoji;

  const reactionRef = ref(database, `messages/${convId}/${messageId}/reactions/${userId}`);
  await set(reactionRef, newEmoji);

  // Nếu người khác thả cảm xúc vào tin nhắn của mình thì tạo thông báo
  if (newEmoji && messageSenderId && messageSenderId !== userId) {
    notifyMembers([messageSenderId], userId, {
      type: 'reaction',
      convId,
      fromName: userName,
      title: 'Cảm xúc mới',
      text: `${userName} đã thả cảm xúc ${emoji} vào tin nhắn của bạn`,
    });
  }
};

/**
 * Đặt trạng thái đang soạn tin (typing) với onDisconnect tự hủy
 */
export const setTypingStatus = async (
  convId: string,
  userId: string,
  isTyping: boolean
): Promise<void> => {
  if (!convId || !userId) return;
  const typingRef = ref(database, `typing/${convId}/${userId}`);

  if (isTyping) {
    await set(typingRef, true);
    // Khi app bị ngắt kết nối đột ngột, Firebase tự xóa node typing
    onDisconnect(typingRef).remove();
  } else {
    await set(typingRef, null);
  }
};

/**
 * Lắng nghe trạng thái đang gõ trong cuộc trò chuyện
 */
export const subscribeToTyping = (
  convId: string,
  currentUserId: string,
  callback: (typingUserIds: string[]) => void
): (() => void) => {
  if (!convId) {
    callback([]);
    return () => {};
  }

  const typingRef = ref(database, `typing/${convId}`);

  const unsubscribe = onValue(
    typingRef,
    (snapshot) => {
      const data = snapshot.val() || {};
      const typingUsers = Object.keys(data).filter(
        (uid) => uid !== currentUserId && data[uid] === true
      );
      callback(typingUsers);
    },
    (err) => console.debug('Lỗi lắng nghe typing:', err)
  );

  return unsubscribe;
};

/**
 * Đánh dấu cuộc trò chuyện đã đọc và cập nhật readStatus/{convId}/{uid}
 */
export const markConversationAsRead = async (
  convId: string,
  userId: string
): Promise<void> => {
  if (!convId || !userId) return;
  try {
    const timestamp = Date.now();
    const updates: Record<string, any> = {};
    updates[`readStatus/${convId}/${userId}`] = timestamp;
    updates[`userChats/${userId}/${convId}/unread`] = 0;
    updates[`userChats/${userId}/${convId}/unreadCount`] = 0;

    await update(ref(database), updates);
  } catch (error) {
    console.debug('Lỗi đánh dấu đã đọc:', error);
  }
};

/**
 * Lắng nghe thời điểm đọc cuối cùng của các thành viên trong cuộc trò chuyện
 */
export const subscribeToReadStatus = (
  convId: string,
  callback: (readMap: Record<string, number>) => void
): (() => void) => {
  if (!convId) {
    callback({});
    return () => {};
  }

  const readRef = ref(database, `readStatus/${convId}`);
  const unsubscribe = onValue(
    readRef,
    (snap) => {
      callback(snap.val() || {});
    },
    (err) => console.debug('Lỗi lắng nghe readStatus:', err)
  );

  return unsubscribe;
};

/**
 * Lắng nghe tin nhắn theo trang (Pagination)
 * Mặc định tải limitCount tin (ví dụ 20 tin). Kéo lên thì tăng limitCount lên 40, 60,...
 */
export const subscribeToMessagesPaged = (
  convId: string,
  currentUserId: string,
  limitCount: number,
  callback: (messages: Message[]) => void
): (() => void) => {
  if (!convId) {
    callback([]);
    return () => {};
  }

  const messagesRef = ref(database, `messages/${convId}`);
  const messagesQuery = query(
    messagesRef,
    orderByChild('createdAt'),
    limitToLast(limitCount)
  );

  const unsubscribe = onValue(
    messagesQuery,
    (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        callback([]);
        return;
      }

      const list: Message[] = [];
      Object.keys(data).forEach((key) => {
        const item = data[key];
        const createdAt = item.createdAt || item.timestamp || 0;
        list.push({
          id: item.id || key,
          senderId: item.senderId,
          senderName: item.senderName,
          senderAvatar: item.senderAvatar,
          type: item.type || 'text',
          text: item.text,
          imageUrl: item.imageUrl,
          lat: item.lat,
          lng: item.lng,
          location: item.location || (item.lat ? { latitude: item.lat, longitude: item.lng } : undefined),
          time: item.time || formatTime(createdAt),
          timestamp: createdAt,
          createdAt,
          isMe: item.senderId === currentUserId,
          recalled: Boolean(item.recalled),
          reactions: item.reactions || undefined,
          replyTo: item.replyTo || undefined,
        });
      });

      // Sắp xếp tăng dần theo thời gian (cũ ở trên, mới ở dưới)
      list.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
      callback(list);
    },
    (error) => {
      console.debug('Lỗi lắng nghe tin nhắn:', error);
    }
  );

  return unsubscribe;
};

/**
 * Lắng nghe danh sách tất cả cuộc trò chuyện của người dùng (gồm cả 1-1 và nhóm)
 * Lọc bỏ hoàn toàn các mục tự chat với chính mình
 */
export const subscribeToAllConversations = (
  currentUserId: string,
  callback: (chats: Chat[]) => void
): (() => void) => {
  if (!currentUserId) {
    callback([]);
    return () => {};
  }

  const userChatsRef = ref(database, `userChats/${currentUserId}`);
  const usersRef = ref(database, 'users');

  let rawUserChats: Record<string, any> = {};
  let usersData: Record<string, any> = {};

  const processAndEmit = () => {
    if (!rawUserChats || Object.keys(rawUserChats).length === 0) {
      callback([]);
      return;
    }

    const mapByConvId = new Map<string, Chat>();

    // Nếu phát hiện node rác tự chat với chính mình (userChats/uid/uid), xóa luôn
    if (rawUserChats[currentUserId]) {
      try {
        const cleanupRef = ref(database, `userChats/${currentUserId}/${currentUserId}`);
        set(cleanupRef, null);
      } catch (_e) {}
    }

    Object.keys(rawUserChats).forEach((chatKey) => {
      // Bỏ qua nếu chatKey trùng chính mình
      if (chatKey === currentUserId) return;

      const item = rawUserChats[chatKey];
      const isGroup =
        item.type === 'group' ||
        chatKey.startsWith('group_') ||
        chatKey.startsWith('-');

      if (isGroup) {
        const groupName = item.name || 'Nhóm chat';
        const groupAvatar =
          item.avatar ||
          `https://api.dicebear.com/7.x/identicon/png?seed=${encodeURIComponent(groupName)}`;

        mapByConvId.set(chatKey, {
          id: chatKey,
          convId: chatKey,
          type: 'group',
          name: groupName,
          user: {
            id: chatKey,
            name: groupName,
            avatar: groupAvatar,
            isOnline: true,
          },
          lastMessage: item.lastMessage || '',
          lastMessageTime: item.lastMessageTime || formatTime(item.updatedAt || item.timestamp),
          unreadCount: item.unread ?? item.unreadCount ?? 0,
          messages: [],
          members: item.members || undefined,
        });
      } else {
        // Direct 1-1 chat
        // Tìm partnerId chính xác (người kia)
        let partnerId = item.partnerId;
        if (!partnerId || partnerId === currentUserId) {
          if (chatKey.includes('_')) {
            const parts = chatKey.split('_');
            partnerId = parts.find((p) => p !== currentUserId);
          } else if (chatKey !== currentUserId && !chatKey.startsWith('-') && !chatKey.startsWith('group_')) {
            // Dữ liệu cũ bài 5: chatKey chính là partnerId!
            partnerId = chatKey;
          }
        }

        // Tuyệt đối không hiển thị cuộc trò chuyện tự chat với chính mình hoặc ID nhóm bị nhầm
        if (!partnerId || partnerId === currentUserId || partnerId.startsWith('-') || partnerId.startsWith('group_')) {
          return;
        }

        // Chuẩn hóa duy nhất 1 conversation ID cho cặp 2 người
        const canonicalConvId = getDirectChatId(currentUserId, partnerId);

        const partner = usersData[partnerId] || {};
        const partnerName =
          partner.name ||
          (item.name !== currentUserId && item.name ? item.name : '') ||
          'Người dùng';

        const partnerAvatar =
          partner.avatar ||
          (item.avatar && !item.avatar.includes(encodeURIComponent(currentUserId)) ? item.avatar : '') ||
          `https://api.dicebear.com/7.x/avataaars/png?seed=${encodeURIComponent(partnerName)}`;

        const chatObj: Chat = {
          id: canonicalConvId,
          convId: canonicalConvId,
          type: 'direct',
          name: partnerName,
          user: {
            id: partnerId,
            name: partnerName,
            avatar: partnerAvatar,
            isOnline: Boolean(partner.isOnline),
            lastSeen: partner.lastSeen,
          },
          lastMessage: item.lastMessage || '',
          lastMessageTime: item.lastMessageTime || formatTime(item.updatedAt || item.timestamp),
          unreadCount: item.unread ?? item.unreadCount ?? 0,
          messages: [],
          members: { [currentUserId]: true, [partnerId]: true },
        };

        // Gộp bản ghi: Nếu đã có canonicalConvId, ưu tiên bản ghi có tin nhắn mới hơn
        if (mapByConvId.has(canonicalConvId)) {
          const existing = mapByConvId.get(canonicalConvId)!;
          const existingTime =
            rawUserChats[existing.id]?.updatedAt ||
            rawUserChats[existing.id]?.timestamp ||
            0;
          const curTime = item.updatedAt || item.timestamp || 0;
          if (curTime > existingTime) {
            mapByConvId.set(canonicalConvId, chatObj);
          }
        } else {
          mapByConvId.set(canonicalConvId, chatObj);
        }
      }
    });

    const list = Array.from(mapByConvId.values());

    // Sắp xếp giảm dần theo thời gian tin nhắn mới nhất
    list.sort((a, b) => {
      const itemA = rawUserChats[a.id] || rawUserChats[a.convId || ''] || {};
      const itemB = rawUserChats[b.id] || rawUserChats[b.convId || ''] || {};
      const timeA = itemA.updatedAt || itemA.timestamp || 0;
      const timeB = itemB.updatedAt || itemB.timestamp || 0;
      return timeB - timeA;
    });

    callback(list);
  };

  const unsubUsers = onValue(
    usersRef,
    (snap) => {
      usersData = snap.val() || {};
      processAndEmit(); // Cập nhật lại danh sách ngay khi tải xong danh sách người dùng!
    },
    (err) => console.debug('Lỗi lắng nghe users:', err)
  );

  const unsubChats = onValue(
    userChatsRef,
    (snapshot) => {
      rawUserChats = snapshot.val() || {};
      processAndEmit();
    },
    (err) => console.debug('Lỗi lắng nghe userChats:', err)
  );

  return () => {
    unsubChats();
    unsubUsers();
  };
};
