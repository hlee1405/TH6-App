import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Alert,
  ActivityIndicator,
  Modal,
  Image,
  Dimensions,
  Pressable,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList, Message, MessageReplyInfo } from '../types';
import { useApp } from '../context/AppContext';
import { Avatar } from '../components/Avatar';
import {
  ChevronLeftIcon,
  SendIcon,
  LocationPinIcon,
  CameraIcon,
  ChatBubbleIcon,
  CloseIcon,
} from '../components/Icons';
import {
  getDirectChatId,
  ensureDirectConversation,
  isFirebaseConfigured,
  subscribeToMessagesPaged,
  subscribeToUser,
  subscribeToTyping,
  subscribeToReadStatus,
  subscribeToUsers,
  subscribeToGroupMembers,
  setTypingStatus,
  sendTextMessage,
  sendImageMessage,
  sendLocationMessage,
  recallMessage,
  toggleReaction,
  markConversationAsRead,
  formatLastSeen,
  formatTime,
  takePhoto,
  pickImageFromLibrary,
  uploadImageToCloudinary,
  requestLocationPermission,
  getCurrentLocation,
  openLocationInGoogleMaps,
} from '../services';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '😢'];

type ChatDetailRouteProp = RouteProp<RootStackParamList, 'ChatDetail'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const ChatDetailScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ChatDetailRouteProp>();
  const insets = useSafeAreaInsets();

  const {
    convId: routeConvId,
    type: routeType,
    userName,
    userId: routePartnerId,
    userAvatar,
    isOnline: initialOnline,
    lastSeen: initialLastSeen,
    members: routeMembers,
  } = route.params;

  const { currentUser, theme } = useApp();
  const colors = theme.colors;

  const isGroup =
    routeType === 'group' ||
    (routeConvId ? routeConvId.startsWith('group_') : false) ||
    (routeConvId ? routeConvId.startsWith('-') : false);

  // Xác định convId chuẩn
  const convId = useMemo(() => {
    if (isGroup) {
      return routeConvId || 'general_chat';
    }
    // Chat 1-1: Luôn chuẩn hóa ID duy nhất từ cặp UID của 2 người
    if (routePartnerId && currentUser.id) {
      return getDirectChatId(currentUser.id, routePartnerId);
    }
    if (routeConvId && routeConvId.includes('_')) {
      return routeConvId;
    }
    return 'general_chat';
  }, [isGroup, routeConvId, routePartnerId, currentUser.id]);

  const partnerId = useMemo(() => {
    if (isGroup) return undefined;
    if (routePartnerId) return routePartnerId;
    if (convId.includes('_')) {
      return convId.split('_').find((p) => p !== currentUser.id);
    }
    return undefined;
  }, [isGroup, routePartnerId, convId, currentUser.id]);

  // Danh sách thành viên nhóm thời gian thực
  const [groupMembers, setGroupMembers] = useState<Record<string, boolean>>(
    routeMembers || {}
  );

  useEffect(() => {
    if (isGroup && convId) {
      const unsub = subscribeToGroupMembers(convId, (members) => {
        setGroupMembers(members);
      });
      return () => unsub();
    }
  }, [isGroup, convId]);

  // Danh sách thành viên (cho group hoặc 1-1)
  const effectiveMembers = useMemo(() => {
    if (isGroup) {
      if (Object.keys(groupMembers).length > 0) return groupMembers;
      if (routeMembers) return routeMembers;
      return { [currentUser.id]: true };
    }
    const map: Record<string, boolean> = { [currentUser.id]: true };
    if (partnerId) map[partnerId] = true;
    return map;
  }, [isGroup, groupMembers, routeMembers, currentUser.id, partnerId]);

  // Trạng thái tin nhắn và phân trang
  const [messages, setMessages] = useState<Message[]>([]);
  const [limitCount, setLimitCount] = useState<number>(20);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [hasMoreMessages, setHasMoreMessages] = useState<boolean>(true);

  // Trạng thái nhập liệu
  const [inputText, setInputText] = useState('');
  const [replyingMessage, setReplyingMessage] = useState<Message | null>(null);

  // Trạng thái đối phương trong 1-1
  const [partnerStatus, setPartnerStatus] = useState({
    name: userName,
    avatar: userAvatar,
    isOnline: initialOnline ?? false,
    lastSeen: initialLastSeen,
  });

  // Trạng thái đang gõ
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const typingTimeoutRef = useRef<any>(null);

  // Trạng thái đã xem
  const [readMap, setReadMap] = useState<Record<string, number>>({});

  const [onlineMembersCount, setOnlineMembersCount] = useState<number>(1);

  // Tìm kiếm tin nhắn
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // UI Modals
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [actionMenuVisible, setActionMenuVisible] = useState<boolean>(false);
  const [imagePickerModalVisible, setImagePickerModalVisible] = useState<boolean>(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  // Vị trí
  const [isLocating, setIsLocating] = useState<boolean>(false);

  const flatListRef = useRef<FlatList>(null);

  // Đảm bảo hội thoại 1-1 đã có node conversations/{convId}
  useEffect(() => {
    if (!isGroup && routePartnerId && currentUser.id && isFirebaseConfigured()) {
      ensureDirectConversation(currentUser.id, routePartnerId, currentUser.name, userName);
    }
  }, [isGroup, routePartnerId, currentUser.id, currentUser.name, userName]);

  // 1. Đánh dấu đã đọc ngay khi vào màn hình và lắng nghe readStatus
  useEffect(() => {
    if (!convId || !currentUser.id) return;

    markConversationAsRead(convId, currentUser.id);

    const unsubRead = subscribeToReadStatus(convId, (reads) => {
      setReadMap(reads);
    });

    return () => {
      unsubRead();
      // Tắt trạng thái đang gõ khi rời màn hình
      setTypingStatus(convId, currentUser.id, false);
    };
  }, [convId, currentUser.id]);

  // 2. Lắng nghe tin nhắn theo trang (limitCount)
  useEffect(() => {
    if (!convId || !currentUser.id) return;

    const unsubMessages = subscribeToMessagesPaged(
      convId,
      currentUser.id,
      limitCount,
      (incomingMessages) => {
        setMessages(incomingMessages);
        setIsLoadingMore(false);
        if (incomingMessages.length < limitCount) {
          setHasMoreMessages(false);
        } else {
          setHasMoreMessages(true);
        }
      }
    );

    return () => {
      unsubMessages();
    };
  }, [convId, currentUser.id, limitCount]);

  // 3. Lắng nghe trạng thái đang gõ
  useEffect(() => {
    if (!convId || !currentUser.id) return;

    const unsubTyping = subscribeToTyping(convId, currentUser.id, (users) => {
      setTypingUsers(users);
    });

    return () => {
      unsubTyping();
    };
  }, [convId, currentUser.id]);

  // 4. Lắng nghe thông tin đối phương (1-1) hoặc số thành viên online (nhóm)
  useEffect(() => {
    if (!isGroup && routePartnerId) {
      const unsubPartner = subscribeToUser(routePartnerId, (partnerData) => {
        if (partnerData) {
          setPartnerStatus({
            name: partnerData.name || userName,
            avatar: partnerData.avatar || userAvatar,
            isOnline: partnerData.isOnline ?? false,
            lastSeen: partnerData.lastSeen,
          });
        }
      });
      return () => unsubPartner();
    } else if (isGroup) {
      // Lắng nghe tất cả users để đếm số thành viên nhóm đang online
      const unsubAllUsers = subscribeToUsers(currentUser.id, (allContacts) => {
        const contactMap = new Map(allContacts.map((c) => [c.id, c.isOnline]));
        let onlineCount = 1; // Bản thân đang online
        Object.keys(effectiveMembers).forEach((uid) => {
          if (uid !== currentUser.id && contactMap.get(uid)) {
            onlineCount++;
          }
        });
        setOnlineMembersCount(onlineCount);
      });
      return () => unsubAllUsers();
    }
  }, [isGroup, routePartnerId, userName, userAvatar, currentUser.id, effectiveMembers]);

  // Quản lý việc người dùng gõ phím -> cập nhật trạng thái đang soạn tin (tự tắt sau 3 giây)
  const handleInputChange = (text: string) => {
    setInputText(text);

    if (!isFirebaseConfigured() || !convId || !currentUser.id) return;

    if (text.trim().length > 0) {
      setTypingStatus(convId, currentUser.id, true);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        setTypingStatus(convId, currentUser.id, false);
      }, 3000);
    } else {
      setTypingStatus(convId, currentUser.id, false);
    }
  };

  // Cuộn đến tin nhắn mới nhất
  const scrollToBottom = () => {
    setTimeout(() => {
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    }, 80);
  };

  // Tải thêm 20 tin cũ hơn khi kéo lên đầu danh sách
  const handleLoadMore = () => {
    if (isLoadingMore || !hasMoreMessages) return;
    setIsLoadingMore(true);
    setLimitCount((prev) => prev + 20);
  };

  // Gửi tin nhắn văn bản
  const handleSendText = async () => {
    const textToSend = inputText.trim();
    if (!textToSend) return;

    // Tắt trạng thái đang gõ ngay khi gửi tin
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    setTypingStatus(convId, currentUser.id, false);
    setInputText('');

    const replyInfo: MessageReplyInfo | undefined = replyingMessage
      ? {
          id: replyingMessage.id,
          senderName: replyingMessage.senderName || 'Người dùng',
          text: replyingMessage.text || (replyingMessage.type === 'image' ? '📷 Hình ảnh' : '📍 Vị trí'),
          type: replyingMessage.type,
        }
      : undefined;

    setReplyingMessage(null);

    try {
      await sendTextMessage({
        convId,
        senderId: currentUser.id,
        senderName: currentUser.name,
        senderAvatar: currentUser.avatar,
        text: textToSend,
        members: effectiveMembers,
        replyTo: replyInfo,
        groupName: isGroup ? userName : undefined,
        receiverName: isGroup ? undefined : (partnerStatus.name || userName),
      });

      scrollToBottom();
    } catch (error) {
      console.warn('Lỗi gửi tin nhắn:', error);
      Alert.alert('Lỗi', 'Không thể gửi tin nhắn.');
    }
  };

  // Xử lý gửi ảnh (Chụp hoặc chọn từ thư viện)
  const handlePickImage = async (mode: 'camera' | 'library') => {
    setImagePickerModalVisible(false);

    let asset = null;
    if (mode === 'camera') {
      asset = await takePhoto();
    } else {
      asset = await pickImageFromLibrary();
    }

    if (!asset || !asset.uri) return;

    const localUri = asset.uri;
    const tempId = `temp_${Date.now()}`;

    // Tạo tin nhắn tạm có vòng xoay loading
    const tempMsg: Message = {
      id: tempId,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar,
      type: 'image',
      imageUrl: localUri,
      localUri,
      createdAt: Date.now(),
      timestamp: Date.now(),
      time: formatTime(Date.now()),
      isMe: true,
      isUploading: true,
      uploadError: false,
    };

    setMessages((prev) => [...prev, tempMsg]);
    scrollToBottom();

    // Tải lên Cloudinary
    await uploadAndSendImage(tempId, localUri);
  };

  const uploadAndSendImage = async (tempId: string, fileUri: string) => {
    try {
      const uploadedUrl = await uploadImageToCloudinary(fileUri);

      // Xóa tin tạm và ghi vào Firebase
      setMessages((prev) => prev.filter((m) => m.id !== tempId));

      await sendImageMessage({
        convId,
        senderId: currentUser.id,
        senderName: currentUser.name,
        senderAvatar: currentUser.avatar,
        imageUrl: uploadedUrl,
        members: effectiveMembers,
        groupName: isGroup ? userName : undefined,
        receiverName: isGroup ? undefined : (partnerStatus.name || userName),
      });

      scrollToBottom();
    } catch (error: any) {
      console.warn('Lỗi tải ảnh:', error);
      // Đánh dấu tin tạm bị lỗi để hiện nút "Thử lại"
      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempId ? { ...m, isUploading: false, uploadError: true } : m
        )
      );
      Alert.alert('Tải ảnh thất bại', 'Không thể tải ảnh lên. Vui lòng bấm "Thử lại".');
    }
  };

  // Gửi vị trí hiện tại
  const handleSendLocation = async () => {
    setIsLocating(true);
    try {
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        Alert.alert(
          'Quyền bị từ chối',
          'Ứng dụng cần quyền vị trí để gửi tọa độ bản đồ.'
        );
        setIsLocating(false);
        return;
      }

      const coords = await getCurrentLocation();
      await sendLocationMessage({
        convId,
        senderId: currentUser.id,
        senderName: currentUser.name,
        senderAvatar: currentUser.avatar,
        lat: coords.latitude,
        lng: coords.longitude,
        members: effectiveMembers,
        groupName: isGroup ? userName : undefined,
        receiverName: isGroup ? undefined : (partnerStatus.name || userName),
      });

      setIsLocating(false);
      scrollToBottom();
    } catch (error) {
      setIsLocating(false);
      console.warn('Lỗi lấy vị trí:', error);
      Alert.alert('Lỗi', 'Không thể lấy tọa độ hiện tại.');
    }
  };

  // Mở menu tương tác khi nhấn giữ tin nhắn
  const handleLongPressMessage = (msg: Message) => {
    if (msg.recalled || msg.isUploading) return;
    setSelectedMessage(msg);
    setActionMenuVisible(true);
  };

  // Thu hồi tin nhắn
  const handleRecall = async () => {
    if (!selectedMessage) return;
    setActionMenuVisible(false);

    // Kiểm tra xem có phải tin cuối cùng của cuộc trò chuyện không
    const lastMsg = messages[messages.length - 1];
    const isLast = lastMsg?.id === selectedMessage.id;

    try {
      await recallMessage(
        convId,
        selectedMessage.id,
        currentUser.id,
        effectiveMembers,
        isLast
      );
    } catch (error) {
      console.warn('Lỗi thu hồi tin nhắn:', error);
      Alert.alert('Lỗi', 'Không thể thu hồi tin nhắn.');
    }
  };

  // Thả cảm xúc
  const handleReaction = async (emoji: string) => {
    if (!selectedMessage) return;
    setActionMenuVisible(false);

    try {
      await toggleReaction(
        convId,
        selectedMessage.id,
        currentUser.id,
        currentUser.name,
        emoji,
        selectedMessage.senderId,
        selectedMessage.reactions
      );
    } catch (error) {
      console.warn('Lỗi thả cảm xúc:', error);
    }
  };

  // Sao chép tin nhắn
  const handleCopyText = () => {
    if (!selectedMessage) return;
    setActionMenuVisible(false);
    const content = selectedMessage.text || selectedMessage.imageUrl || '';
    Alert.alert('Đã sao chép', `Nội dung đã được sao chép:\n"${content}"`);
  };

  // Bắt đầu trả lời tin nhắn
  const handleStartReply = () => {
    if (!selectedMessage) return;
    setActionMenuVisible(false);
    setReplyingMessage(selectedMessage);
  };

  // Tính toán trạng thái xem cho tin nhắn cuối cùng của mình
  const renderReadReceipt = (item: Message, index: number, isLastSentByMe: boolean) => {
    if (!item.isMe || !isLastSentByMe || item.recalled || item.isUploading) return null;

    if (!isGroup && partnerId) {
      const partnerReadTime = readMap[partnerId] || 0;
      const isSeen = partnerReadTime >= (item.createdAt || item.timestamp || 0);

      if (isSeen) {
        return (
          <Text style={[styles.receiptText, { color: colors.primary }]}>
            Đã xem {formatTime(partnerReadTime)}
          </Text>
        );
      }
      return (
        <Text style={[styles.receiptText, { color: colors.textMuted }]}>
          Đã gửi
        </Text>
      );
    }

    if (isGroup) {
      // Đếm số người đã xem trong nhóm (ngoài bản thân)
      const msgTime = item.createdAt || item.timestamp || 0;
      let seenCount = 0;
      Object.keys(readMap).forEach((uid) => {
        if (uid !== currentUser.id && readMap[uid] >= msgTime) {
          seenCount++;
        }
      });

      if (seenCount > 0) {
        return (
          <Text style={[styles.receiptText, { color: colors.primary }]}>
            Đã xem bởi {seenCount} người
          </Text>
        );
      }
      return (
        <Text style={[styles.receiptText, { color: colors.textMuted }]}>
          Đã gửi
        </Text>
      );
    }

    return null;
  };

  // Tìm tin nhắn cuối cùng do bản thân gửi
  const lastMessageSentByMeId = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].isMe && !messages[i].isUploading) {
        return messages[i].id;
      }
    }
    return null;
  }, [messages]);

  // Lọc tin nhắn nếu đang tìm kiếm
  const displayMessages = useMemo(() => {
    if (!isSearching || !searchQuery.trim()) return messages;
    const q = searchQuery.toLowerCase().trim();
    return messages.filter((m) => m.text && m.text.toLowerCase().includes(q));
  }, [messages, isSearching, searchQuery]);

  // FlatList sử dụng inverted={true} để tin mới nhất nằm ở đáy màn hình
  const reversedMessages = useMemo(() => {
    return [...displayMessages].reverse();
  }, [displayMessages]);

  // Tiêu đề phụ: Đang soạn tin / Số thành viên online / Hoạt động X phút trước
  const renderHeaderSubtitle = () => {
    if (typingUsers.length > 0) {
      return (
        <Text style={[styles.headerSubtitle, { color: colors.primary, fontWeight: '700' }]}>
          đang soạn tin…
        </Text>
      );
    }

    if (isGroup) {
      return (
        <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
          {onlineMembersCount} thành viên đang online
        </Text>
      );
    }

    if (partnerStatus.isOnline) {
      return (
        <Text style={[styles.headerSubtitle, { color: '#10B981', fontWeight: '600' }]}>
          🟢 Trực tuyến
        </Text>
      );
    }

    return (
      <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
        {formatLastSeen(partnerStatus.lastSeen)}
      </Text>
    );
  };

  // Render bong bóng tin nhắn
  const renderMessageItem = ({ item }: { item: Message }) => {
    const isMe = item.isMe;
    const isLastByMe = item.id === lastMessageSentByMeId;

    // Tin nhắn hệ thống (ví dụ: tạo nhóm, đổi tên nhóm, rời nhóm)
    if (item.type === 'system') {
      return (
        <View style={styles.systemMessageContainer}>
          <Text style={[styles.systemMessageText, { color: colors.textMuted, backgroundColor: colors.inputBg }]}>
            {item.text}
          </Text>
        </View>
      );
    }

    // Đếm cảm xúc gộp theo từng emoji
    const reactionCounts: Record<string, number> = {};
    if (item.reactions) {
      Object.values(item.reactions).forEach((emoji) => {
        if (emoji) {
          reactionCounts[emoji] = (reactionCounts[emoji] || 0) + 1;
        }
      });
    }
    const hasReactions = Object.keys(reactionCounts).length > 0;

    return (
      <View style={[styles.messageRow, isMe ? styles.rowMe : styles.rowOther]}>
        {/* Avatar người khác trong chat nhóm */}
        {!isMe && isGroup && (
          <View style={styles.senderAvatarContainer}>
            <Avatar uri={item.senderAvatar} name={item.senderName || 'U'} size={30} />
          </View>
        )}

        <View style={[styles.messageBubbleWrapper, isMe ? { alignItems: 'flex-end' } : { alignItems: 'flex-start' }]}>
          {/* Tên người gửi trong nhóm chat */}
          {!isMe && isGroup && (
            <Text style={[styles.senderNameHeader, { color: colors.textSecondary }]}>
              {item.senderName || 'Thành viên'}
            </Text>
          )}

          {/* Phần trích dẫn / trả lời tin nhắn */}
          {item.replyTo && (
            <View
              style={[
                styles.replyQuoteBox,
                {
                  backgroundColor: isMe ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.06)',
                  borderLeftColor: isMe ? '#FFFFFF' : colors.primary,
                },
              ]}>
              <Text
                style={[styles.replyQuoteSender, { color: isMe ? '#FFFFFF' : colors.primary }]}
                numberOfLines={1}>
                {item.replyTo.senderName}
              </Text>
              <Text
                style={[styles.replyQuoteContent, { color: isMe ? 'rgba(255,255,255,0.85)' : colors.textSecondary }]}
                numberOfLines={1}>
                {item.replyTo.text || 'Tin nhắn'}
              </Text>
            </View>
          )}

          {/* Bong bóng tin nhắn */}
          <TouchableOpacity
            activeOpacity={0.85}
            onLongPress={() => handleLongPressMessage(item)}
            style={[
              styles.bubble,
              isMe
                ? [styles.bubbleMe, { backgroundColor: item.recalled ? colors.inputBg : colors.primary }]
                : [styles.bubbleOther, { backgroundColor: item.recalled ? colors.inputBg : colors.card, borderColor: colors.border }],
              item.recalled && styles.bubbleRecalled,
            ]}>
            {/* Tin đã thu hồi */}
            {item.recalled ? (
              <Text style={[styles.recalledText, { color: colors.textMuted }]}>
                🚫 Tin nhắn đã được thu hồi
              </Text>
            ) : item.type === 'image' ? (
              /* Tin ảnh */
              <View style={styles.imageContainer}>
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => setPreviewImageUrl(item.imageUrl || item.localUri || null)}>
                  <Image
                    source={{ uri: item.imageUrl || item.localUri }}
                    style={styles.messageImage}
                    resizeMode="cover"
                  />
                </TouchableOpacity>

                {/* Vòng xoay tải lên */}
                {item.isUploading && (
                  <View style={styles.uploadingOverlay}>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text style={styles.uploadingText}>Đang tải lên…</Text>
                  </View>
                )}

                {/* Nút Thử lại khi tải ảnh lỗi */}
                {item.uploadError && (
                  <TouchableOpacity
                    style={styles.retryOverlay}
                    onPress={() => uploadAndSendImage(item.id, item.localUri || '')}>
                    <Text style={styles.retryText}>⚠️ Lỗi tải ảnh. Thử lại</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : item.type === 'location' ? (
              /* Tin vị trí */
              <TouchableOpacity
                style={styles.locationContainer}
                activeOpacity={0.8}
                onPress={() => {
                  const lat = item.lat || item.location?.latitude;
                  const lng = item.lng || item.location?.longitude;
                  if (lat && lng) openLocationInGoogleMaps(lat, lng);
                }}>
                <View style={styles.locationHeaderRow}>
                  <LocationPinIcon size={20} color={isMe ? '#FFFFFF' : colors.primary} />
                  <Text style={[styles.locationTitle, { color: isMe ? '#FFFFFF' : colors.text }]}>
                    Vị trí hiện tại
                  </Text>
                </View>
                <Text style={[styles.locationCoords, { color: isMe ? 'rgba(255,255,255,0.85)' : colors.textSecondary }]}>
                  {item.lat?.toFixed(5) || item.location?.latitude.toFixed(5)},{' '}
                  {item.lng?.toFixed(5) || item.location?.longitude.toFixed(5)}
                </Text>
                <Text style={[styles.locationPrompt, { color: isMe ? '#FEF08A' : colors.primary }]}>
                  Nhấn để mở Google Maps ↗
                </Text>
              </TouchableOpacity>
            ) : (
              /* Tin nhắn chữ */
              <Text
                style={[
                  styles.messageText,
                  { color: isMe ? '#FFFFFF' : colors.text },
                ]}>
                {item.text}
              </Text>
            )}

            {/* Giờ tin nhắn */}
            <Text
              style={[
                styles.messageTime,
                { color: isMe ? 'rgba(255,255,255,0.7)' : colors.textMuted },
              ]}>
              {item.time || formatTime(item.createdAt || item.timestamp || 0)}
            </Text>
          </TouchableOpacity>

          {/* Dải cảm xúc hiển thị dưới bong bóng */}
          {hasReactions && !item.recalled && (
            <View
              style={[
                styles.reactionBar,
                isMe ? styles.reactionBarMe : styles.reactionBarOther,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}>
              {Object.keys(reactionCounts).map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  style={styles.reactionTag}
                  activeOpacity={0.7}
                  onPress={() =>
                    toggleReaction(
                      convId,
                      item.id,
                      currentUser.id,
                      currentUser.name,
                      emoji,
                      item.senderId,
                      item.reactions
                    )
                  }>
                  <Text style={styles.reactionEmoji}>{emoji}</Text>
                  {reactionCounts[emoji] > 1 && (
                    <Text style={[styles.reactionCountText, { color: colors.textSecondary }]}>
                      {reactionCounts[emoji]}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Trạng thái "Đã gửi" hoặc "Đã xem lúc HH:mm" cho tin cuối của mình */}
          {renderReadReceipt(item, 0, isLastByMe)}
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle={colors.statusBarStyle} />

      {/* Screen Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: Math.max(insets.top, 16) + 4,
            backgroundColor: colors.headerBg,
            borderBottomColor: colors.border,
          },
        ]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <ChevronLeftIcon size={24} color={colors.text} />
        </TouchableOpacity>

        {/* Tiêu đề & Trạng thái */}
        <View style={styles.headerTitleBox}>
          <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
            {userName}
          </Text>
          {renderHeaderSubtitle()}
        </View>

        {/* Nút tìm kiếm */}
        <TouchableOpacity
          style={styles.headerActionBtn}
          onPress={() => {
            setIsSearching(!isSearching);
            if (isSearching) setSearchQuery('');
          }}>
          <Text style={{ fontSize: 18 }}>{isSearching ? '✕' : '🔍'}</Text>
        </TouchableOpacity>
      </View>

      {/* Thanh tìm kiếm nội dung tin nhắn */}
      {isSearching && (
        <View style={[styles.searchBarContainer, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <TextInput
            style={[styles.searchBarInput, { color: colors.text, backgroundColor: colors.inputBg }]}
            placeholder="Tìm trong cuộc trò chuyện..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
        </View>
      )}

      {/* Danh sách tin nhắn phân trang */}
      <FlatList
        ref={flatListRef}
        data={reversedMessages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessageItem}
        inverted={true}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.2}
        contentContainerStyle={styles.messageList}
        ListFooterComponent={
          isLoadingMore ? (
            <View style={styles.loadingMoreBox}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : undefined
        }
        ListEmptyComponent={
          <View style={styles.emptyMessages}>
            <ChatBubbleIcon size={36} color={colors.textMuted} />
            <Text style={[styles.emptyMessagesText, { color: colors.textMuted }]}>
              Chưa có tin nhắn. Hãy gửi tin nhắn đầu tiên!
            </Text>
          </View>
        }
      />

      {/* Khung xem trước tin nhắn đang được trả lời */}
      {replyingMessage && (
        <View style={[styles.replyPreviewBar, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
          <View style={[styles.replyPreviewAccent, { backgroundColor: colors.primary }]} />
          <View style={styles.replyPreviewContent}>
            <Text style={[styles.replyPreviewTitle, { color: colors.primary }]}>
              Đang trả lời {replyingMessage.senderName}
            </Text>
            <Text style={[styles.replyPreviewSnippet, { color: colors.textSecondary }]} numberOfLines={1}>
              {replyingMessage.text || (replyingMessage.type === 'image' ? '📷 Hình ảnh' : '📍 Vị trí')}
            </Text>
          </View>
          <TouchableOpacity onPress={() => setReplyingMessage(null)} style={styles.replyCloseBtn}>
            <CloseIcon size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      )}

      {/* Thanh nhập tin nhắn */}
      <View
        style={[
          styles.inputContainer,
          {
            paddingBottom: Math.max(insets.bottom, 10),
            backgroundColor: colors.card,
            borderTopColor: colors.border,
          },
        ]}>
        {/* Nút 📷 Gửi ảnh */}
        <TouchableOpacity
          style={[styles.mediaBtn, { backgroundColor: colors.inputBg }]}
          activeOpacity={0.7}
          onPress={() => setImagePickerModalVisible(true)}>
          <CameraIcon size={20} color={colors.primary} />
        </TouchableOpacity>

        {/* Nút 📍 Gửi vị trí */}
        <TouchableOpacity
          style={[styles.mediaBtn, { backgroundColor: colors.inputBg }]}
          activeOpacity={0.7}
          disabled={isLocating}
          onPress={handleSendLocation}>
          {isLocating ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <LocationPinIcon size={20} color="#EF4444" />
          )}
        </TouchableOpacity>

        {/* Ô nhập nội dung */}
        <TextInput
          style={[styles.textInput, { backgroundColor: colors.inputBg, color: colors.text }]}
          placeholder="Nhập tin nhắn..."
          placeholderTextColor={colors.textMuted}
          value={inputText}
          onChangeText={handleInputChange}
          multiline
          maxLength={1000}
        />

        {/* Nút Gửi */}
        <TouchableOpacity
          style={[
            styles.sendBtn,
            { backgroundColor: inputText.trim() ? colors.primary : colors.inputBg },
          ]}
          disabled={!inputText.trim()}
          onPress={handleSendText}>
          <SendIcon size={18} color={inputText.trim() ? '#FFFFFF' : colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Modal Menu khi nhấn giữ tin nhắn (Sao chép, Thu hồi, Thả cảm xúc) */}
      <Modal
        visible={actionMenuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setActionMenuVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setActionMenuVisible(false)}>
          <View style={[styles.actionMenuBox, { backgroundColor: colors.card }]}>
            {/* Dải 5 Cảm xúc: 👍 ❤️ 😂 😮 😢 */}
            <View style={styles.emojiRow}>
              {REACTION_EMOJIS.map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  style={styles.emojiButton}
                  onPress={() => handleReaction(emoji)}>
                  <Text style={styles.emojiText}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />

            {/* Trả lời */}
            <TouchableOpacity style={styles.menuItem} onPress={handleStartReply}>
              <Text style={[styles.menuItemText, { color: colors.text }]}>↩️ Trả lời</Text>
            </TouchableOpacity>

            {/* Sao chép */}
            <TouchableOpacity style={styles.menuItem} onPress={handleCopyText}>
              <Text style={[styles.menuItemText, { color: colors.text }]}>📋 Sao chép nội dung</Text>
            </TouchableOpacity>

            {/* Thu hồi (chỉ với tin của mình) */}
            {selectedMessage?.isMe && !selectedMessage.recalled && (
              <TouchableOpacity style={styles.menuItem} onPress={handleRecall}>
                <Text style={[styles.menuItemText, { color: '#EF4444', fontWeight: '700' }]}>
                  🗑️ Thu hồi tin nhắn
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </Pressable>
      </Modal>

      {/* Modal Lựa chọn nguồn ảnh: Chụp ảnh hoặc Chọn từ thư viện */}
      <Modal
        visible={imagePickerModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setImagePickerModalVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setImagePickerModalVisible(false)}>
          <View style={[styles.imagePickerSheet, { backgroundColor: colors.card, paddingBottom: insets.bottom + 16 }]}>
            <Text style={[styles.sheetTitle, { color: colors.text }]}>Gửi hình ảnh</Text>
            <TouchableOpacity
              style={[styles.sheetOption, { borderBottomColor: colors.border }]}
              onPress={() => handlePickImage('camera')}>
              <Text style={{ fontSize: 20, marginRight: 12 }}>📸</Text>
              <Text style={[styles.sheetOptionText, { color: colors.text }]}>Chụp ảnh mới</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sheetOption, { borderBottomColor: colors.border }]}
              onPress={() => handlePickImage('library')}>
              <Text style={{ fontSize: 20, marginRight: 12 }}>🖼️</Text>
              <Text style={[styles.sheetOptionText, { color: colors.text }]}>Chọn từ thư viện ảnh</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.sheetCancelBtn}
              onPress={() => setImagePickerModalVisible(false)}>
              <Text style={[styles.sheetCancelText, { color: colors.textMuted }]}>Hủy</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* Modal Xem ảnh toàn màn hình */}
      <Modal
        visible={Boolean(previewImageUrl)}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setPreviewImageUrl(null)}>
        <View style={styles.fullScreenImageContainer}>
          <TouchableOpacity
            style={[styles.closePreviewBtn, { top: insets.top + 10 }]}
            onPress={() => setPreviewImageUrl(null)}>
            <CloseIcon size={24} color="#FFFFFF" />
          </TouchableOpacity>
          {previewImageUrl && (
            <Image
              source={{ uri: previewImageUrl }}
              style={styles.fullScreenImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleBox: {
    flex: 1,
    marginLeft: 6,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  headerActionBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBarContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  searchBarInput: {
    height: 36,
    borderRadius: 18,
    paddingHorizontal: 16,
    fontSize: 14,
  },
  messageList: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  loadingMoreBox: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  emptyMessages: {
    paddingVertical: 120,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ scaleY: -1 }], // Vì FlatList bị inverted
  },
  emptyMessagesText: {
    fontSize: 14,
    marginTop: 8,
  },
  messageRow: {
    flexDirection: 'row',
    marginVertical: 4,
  },
  rowMe: {
    justifyContent: 'flex-end',
  },
  rowOther: {
    justifyContent: 'flex-start',
  },
  senderAvatarContainer: {
    marginRight: 6,
    alignSelf: 'flex-end',
    marginBottom: 4,
  },
  messageBubbleWrapper: {
    maxWidth: '78%',
  },
  senderNameHeader: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
    marginLeft: 4,
  },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 9,
    position: 'relative',
  },
  bubbleMe: {
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    borderBottomLeftRadius: 4,
    borderWidth: 1,
  },
  bubbleRecalled: {
    borderStyle: 'dashed',
    borderWidth: 1,
  },
  recalledText: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  messageTime: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  receiptText: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
    marginRight: 4,
  },
  imageContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  messageImage: {
    width: 220,
    height: 220,
    borderRadius: 12,
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadingText: {
    color: '#FFFFFF',
    fontSize: 12,
    marginTop: 6,
    fontWeight: '600',
  },
  retryOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(239, 68, 68, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  locationContainer: {
    paddingVertical: 2,
  },
  locationHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 6,
  },
  locationCoords: {
    fontSize: 12,
    marginTop: 4,
  },
  locationPrompt: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 6,
  },
  reactionBar: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: -10,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 4,
    paddingVertical: 1,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  reactionBarMe: {
    right: 4,
  },
  reactionBarOther: {
    left: 4,
  },
  reactionTag: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 3,
  },
  reactionEmoji: {
    fontSize: 13,
  },
  reactionCountText: {
    fontSize: 10,
    fontWeight: '700',
    marginLeft: 2,
  },
  replyQuoteBox: {
    borderLeftWidth: 3,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 4,
    maxWidth: '100%',
  },
  replyQuoteSender: {
    fontSize: 11,
    fontWeight: '700',
  },
  replyQuoteContent: {
    fontSize: 11,
  },
  systemMessageContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  systemMessageText: {
    fontSize: 12,
    fontWeight: '500',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  replyPreviewBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
  },
  replyPreviewAccent: {
    width: 4,
    height: 32,
    borderRadius: 2,
  },
  replyPreviewContent: {
    flex: 1,
    marginLeft: 10,
  },
  replyPreviewTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  replyPreviewSnippet: {
    fontSize: 12,
    marginTop: 2,
  },
  replyCloseBtn: {
    padding: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  mediaBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  textInput: {
    flex: 1,
    minHeight: 38,
    maxHeight: 100,
    borderRadius: 19,
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 8,
    fontSize: 15,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  actionMenuBox: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    paddingBottom: 32,
  },
  emojiRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
  },
  emojiButton: {
    padding: 8,
  },
  emojiText: {
    fontSize: 28,
  },
  menuDivider: {
    height: 1,
    marginVertical: 10,
  },
  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '600',
  },
  imagePickerSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  sheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  sheetOptionText: {
    fontSize: 16,
    fontWeight: '600',
  },
  sheetCancelBtn: {
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  sheetCancelText: {
    fontSize: 16,
    fontWeight: '600',
  },
  fullScreenImageContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closePreviewBtn: {
    position: 'absolute',
    right: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
});
