import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { NotificationItem, RootStackParamList } from '../types';
import { useApp } from '../context/AppContext';
import { Avatar } from '../components/Avatar';
import {
  ChatBubbleIcon,
  UsersIcon,
  BellIcon,
  CheckIcon,
} from '../components/Icons';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const NotificationsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const {
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    unreadNotificationsCount,
    theme,
  } = useApp();
  const colors = theme.colors;

  const handleNotificationPress = (item: NotificationItem) => {
    // 1. Đánh dấu đã đọc
    markNotificationAsRead(item.id);

    // 2. Mở đúng cuộc trò chuyện
    if (item.convId) {
      navigation.navigate('ChatDetail', {
        convId: item.convId,
        userName: item.fromName || item.title || 'Cuộc trò chuyện',
        userId: item.fromUid,
        userAvatar: item.fromAvatar,
      });
    }
  };

  const renderIconForType = (type: NotificationItem['type'], isRead: boolean) => {
    const iconColor = !isRead ? colors.primary : colors.textMuted;

    switch (type) {
      case 'group':
        return <UsersIcon size={20} color={iconColor} />;
      case 'reaction':
        return <Text style={{ fontSize: 16 }}>❤️</Text>;
      case 'message':
        return <ChatBubbleIcon size={20} color={iconColor} />;
      case 'system':
      default:
        return <BellIcon size={20} color={iconColor} />;
    }
  };

  const renderNotificationItem = ({ item }: { item: NotificationItem }) => {
    const isUnread = !item.read && !item.isRead;

    return (
      <TouchableOpacity
        style={[
          styles.notificationItem,
          isUnread
            ? [
                styles.itemUnread,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.primaryBorder,
                  borderLeftColor: colors.primary,
                },
              ]
            : [
                styles.itemRead,
                {
                  backgroundColor: theme.isDark ? colors.card : '#F8FAFC',
                  borderColor: colors.border,
                },
              ],
        ]}
        activeOpacity={0.7}
        onPress={() => handleNotificationPress(item)}>
        {/* Biểu tượng phân loại hoặc avatar người gửi */}
        {item.fromAvatar ? (
          <Avatar uri={item.fromAvatar} name={item.fromName || 'U'} size={42} />
        ) : (
          <View
            style={[
              styles.iconWrapper,
              isUnread
                ? { backgroundColor: colors.primaryLight }
                : { backgroundColor: colors.inputBg },
            ]}>
            {renderIconForType(item.type, !isUnread)}
          </View>
        )}

        {/* Nội dung thông báo */}
        <View style={styles.contentWrapper}>
          <View style={styles.titleRow}>
            <Text
              style={[
                styles.itemTitle,
                isUnread
                  ? [styles.textUnreadBold, { color: colors.text }]
                  : [styles.textReadNormal, { color: colors.textSecondary }],
              ]}
              numberOfLines={1}>
              {item.title || item.fromName || 'Thông báo'}
            </Text>
            {isUnread && (
              <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
            )}
          </View>

          <Text
            style={[
              styles.itemContent,
              isUnread
                ? { color: colors.text, fontWeight: '500' }
                : { color: colors.textMuted },
            ]}
            numberOfLines={2}>
            {item.text || item.content}
          </Text>

          <View style={styles.footerRow}>
            <Text style={[styles.timeText, { color: colors.textMuted }]}>
              {item.time || 'Vừa xong'}
            </Text>

            {isUnread && (
              <TouchableOpacity
                style={[styles.markReadBtn, { backgroundColor: colors.primaryLight }]}
                onPress={() => markNotificationAsRead(item.id)}>
                <Text style={[styles.markReadText, { color: colors.primary }]}>
                  Đã đọc
                </Text>
              </TouchableOpacity>
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
          <Text style={[styles.title, { color: colors.text }]}>Thông báo</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            {unreadNotificationsCount > 0
              ? `Bạn có ${unreadNotificationsCount} thông báo chưa đọc`
              : 'Tất cả thông báo đã được đọc'}
          </Text>
        </View>

        {unreadNotificationsCount > 0 && (
          <TouchableOpacity
            style={[styles.markAllButton, { backgroundColor: colors.primaryLight }]}
            activeOpacity={0.8}
            onPress={markAllNotificationsAsRead}>
            <CheckIcon size={14} color={colors.primary} />
            <Text style={[styles.markAllText, { color: colors.primary }]}>
              Đọc tất cả
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Danh sách thông báo */}
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderNotificationItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconCircle, { backgroundColor: colors.inputBg }]}>
              <BellIcon size={28} color={colors.textMuted} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              Chưa có thông báo nào
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
              Các thông báo về tin nhắn mới, nhóm chat hoặc cảm xúc sẽ xuất hiện tại đây.
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
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },
  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  markAllText: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
  },
  itemUnread: {
    borderLeftWidth: 4,
  },
  itemRead: {},
  iconWrapper: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentWrapper: {
    flex: 1,
    marginLeft: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  itemTitle: {
    fontSize: 14,
    flex: 1,
  },
  textUnreadBold: {
    fontWeight: '700',
  },
  textReadNormal: {
    fontWeight: '600',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 6,
  },
  itemContent: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 6,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeText: {
    fontSize: 11,
  },
  markReadBtn: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  markReadText: {
    fontSize: 11,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
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
