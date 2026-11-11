import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList, Chat } from '../types';
import { useApp } from '../context/AppContext';
import { Avatar } from '../components/Avatar';
import { SearchBar } from '../components/SearchBar';
import { ChatBubbleIcon, UsersIcon } from '../components/Icons';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const { chats, markChatAsRead, currentUser, theme } = useApp();
  const colors = theme.colors;
  const [searchQuery, setSearchQuery] = useState('');

  // Lọc cuộc trò chuyện theo ô tìm kiếm
  const filteredChats = useMemo(() => {
    if (!searchQuery.trim()) return chats;
    const q = searchQuery.toLowerCase().trim();
    return chats.filter(
      (chat) =>
        chat.user.name.toLowerCase().includes(q) ||
        (chat.lastMessage && chat.lastMessage.toLowerCase().includes(q))
    );
  }, [chats, searchQuery]);

  const handleOpenChat = (chat: Chat) => {
    const convId = chat.convId || chat.id;
    const isGroup = chat.type === 'group' || convId.startsWith('group_') || convId.startsWith('-');
    markChatAsRead(convId);
    navigation.navigate('ChatDetail', {
      convId,
      type: isGroup ? 'group' : 'direct',
      userId: isGroup ? undefined : chat.user.id,
      userName: chat.user.name,
      userAvatar: chat.user.avatar,
      isOnline: chat.user.isOnline,
      lastSeen: chat.user.lastSeen,
      members: chat.members,
    });
  };

  const handleCreateGroup = () => {
    navigation.navigate('CreateGroup');
  };

  const renderChatItem = ({ item }: { item: Chat }) => {
    const hasUnread = (item.unreadCount || 0) > 0;
    const isGroup = item.type === 'group' || item.id.startsWith('group_') || item.id.startsWith('-');

    return (
      <TouchableOpacity
        style={[
          styles.chatItem,
          { borderBottomColor: colors.border },
          hasUnread && { backgroundColor: colors.unreadBg },
        ]}
        activeOpacity={0.7}
        onPress={() => handleOpenChat(item)}>
        {/* Ảnh đại diện */}
        <View style={styles.avatarWrapper}>
          <Avatar
            uri={item.user.avatar}
            name={item.user.name}
            size={52}
            showOnline={!isGroup}
            isOnline={item.user.isOnline}
          />
          {isGroup && (
            <View style={[styles.groupBadge, { backgroundColor: colors.primary }]}>
              <UsersIcon size={11} color="#FFFFFF" />
            </View>
          )}
        </View>

        {/* Thông tin cuộc trò chuyện */}
        <View style={styles.chatInfo}>
          <View style={styles.chatHeader}>
            <View style={styles.nameRow}>
              <Text style={[styles.userName, { color: colors.text }]} numberOfLines={1}>
                {item.user.name}
              </Text>
              {isGroup && (
                <View style={[styles.groupTag, { backgroundColor: colors.primaryLight }]}>
                  <Text style={[styles.groupTagText, { color: colors.primary }]}>Nhóm</Text>
                </View>
              )}
            </View>
            <Text
              style={[
                styles.timeText,
                { color: colors.textMuted },
                hasUnread && { color: colors.primary, fontWeight: '700' },
              ]}>
              {item.lastMessageTime}
            </Text>
          </View>

          <View style={styles.chatFooter}>
            <Text
              style={[
                styles.lastMessage,
                { color: colors.textSecondary },
                hasUnread && { color: colors.text, fontWeight: '700' },
              ]}
              numberOfLines={1}>
              {item.lastMessage || 'Bắt đầu cuộc trò chuyện'}
            </Text>

            {hasUnread && (
              <View style={[styles.unreadBadge, { backgroundColor: colors.badgeBg }]}>
                <Text style={[styles.unreadCount, { color: colors.badgeText }]}>
                  {item.unreadCount > 9 ? '9+' : item.unreadCount}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
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
        <View>
          <Text style={[styles.greeting, { color: colors.textMuted }]}>
            Xin chào, {currentUser.name}
          </Text>
          <Text style={[styles.title, { color: colors.text }]}>Tin nhắn</Text>
        </View>

        <View style={styles.headerRight}>
          {/* Nút Tạo nhóm */}
          <TouchableOpacity
            style={[styles.createGroupBtn, { backgroundColor: colors.primaryLight }]}
            onPress={handleCreateGroup}
            activeOpacity={0.8}>
            <UsersIcon size={18} color={colors.primary} />
            <Text style={[styles.createGroupText, { color: colors.primary }]}>+ Nhóm</Text>
          </TouchableOpacity>

          <Avatar
            uri={currentUser.avatar}
            name={currentUser.name}
            size={40}
            showOnline={true}
            isOnline={true}
          />
        </View>
      </View>

      {/* Ô tìm kiếm cuộc trò chuyện */}
      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Tìm kiếm người dùng hoặc tin nhắn..."
      />

      {/* Danh sách cuộc trò chuyện */}
      <FlatList
        data={filteredChats}
        keyExtractor={(item) => item.id}
        renderItem={renderChatItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View
              style={[
                styles.emptyIconCircle,
                { backgroundColor: colors.inputBg },
              ]}>
              <ChatBubbleIcon size={28} color={colors.textMuted} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              Chưa có cuộc trò chuyện nào
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
              {searchQuery
                ? `Không có kết quả nào khớp với "${searchQuery}"`
                : 'Hãy bắt đầu nhắn tin với bạn bè hoặc tạo nhóm chat mới!'}
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  createGroupBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 10,
  },
  createGroupText: {
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 4,
  },
  greeting: {
    fontSize: 13,
    fontWeight: '500',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginTop: 2,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 14,
    borderBottomWidth: 1,
  },
  avatarWrapper: {
    position: 'relative',
  },
  groupBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  chatInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  userName: {
    fontSize: 15,
    fontWeight: '700',
    maxWidth: '75%',
  },
  groupTag: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
    marginLeft: 6,
  },
  groupTagText: {
    fontSize: 10,
    fontWeight: '700',
  },
  timeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  chatFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 13,
    flex: 1,
    marginRight: 10,
  },
  unreadBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  unreadCount: {
    fontSize: 10,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  emptySubtitle: {
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
});
