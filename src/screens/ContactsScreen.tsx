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
import { RootStackParamList, Contact } from '../types';
import { useApp } from '../context/AppContext';
import { Avatar } from '../components/Avatar';
import { SearchBar } from '../components/SearchBar';
import { ChatBubbleIcon, UsersIcon } from '../components/Icons';
import { getDirectChatId } from '../services';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const ContactsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const { contacts, currentUser, theme } = useApp();
  const colors = theme.colors;

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'online'>('all');

  const filteredContacts = useMemo(() => {
    let result = contacts;

    if (filterType === 'online') {
      result = result.filter((c) => c.isOnline);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.phone && c.phone.includes(q)) ||
          (c.email && c.email.toLowerCase().includes(q))
      );
    }

    return result;
  }, [contacts, searchQuery, filterType]);

  const handleOpenContactChat = (contact: Contact) => {
    navigation.navigate('ChatDetail', {
      convId: getDirectChatId(currentUser.id, contact.id),
      type: 'direct',
      userId: contact.id,
      userName: contact.name,
      userAvatar: contact.avatar,
      isOnline: contact.isOnline,
      lastSeen: contact.lastSeen,
    });
  };

  const renderContactItem = ({ item }: { item: Contact }) => {
    return (
      <TouchableOpacity
        style={[styles.contactItem, { borderBottomColor: colors.border }]}
        activeOpacity={0.7}
        onPress={() => handleOpenContactChat(item)}>
        {/* Ảnh đại diện */}
        <Avatar
          uri={item.avatar}
          name={item.name}
          size={48}
          showOnline={true}
          isOnline={item.isOnline}
        />

        {/* Thông tin */}
        <View style={styles.contactInfo}>
          <Text style={[styles.contactName, { color: colors.text }]}>{item.name}</Text>
          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: item.isOnline ? '#10B981' : colors.textMuted },
              ]}
            />
            <Text
              style={[
                styles.statusText,
                { color: colors.textMuted },
                item.isOnline && styles.statusTextOnline,
              ]}>
              {item.isOnline ? 'Trực tuyến' : item.statusText}
            </Text>
          </View>
        </View>

        {/* Nút gửi tin nhắn trực tiếp */}
        <TouchableOpacity
          style={[styles.chatActionBtn, { backgroundColor: colors.primaryLight }]}
          onPress={() => handleOpenContactChat(item)}>
          <ChatBubbleIcon size={18} color={colors.primary} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const onlineCount = useMemo(
    () => contacts.filter((c) => c.isOnline).length,
    [contacts]
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.statusBarStyle} />

      {/* Screen Header with safe area insets */}
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
          <Text style={[styles.title, { color: colors.text }]}>Danh bạ</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            {contacts.length} người liên hệ • {onlineCount} đang hoạt động
          </Text>
        </View>
      </View>

      {/* Ô tìm kiếm danh bạ */}
      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Tìm theo tên hoặc số điện thoại..."
      />

      {/* Filter Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[
            styles.tabBtn,
            { backgroundColor: colors.inputBg },
            filterType === 'all' && {
              backgroundColor: colors.primaryLight,
              borderWidth: 1,
              borderColor: colors.primaryBorder,
            },
          ]}
          onPress={() => setFilterType('all')}>
          <Text
            style={[
              styles.tabText,
              { color: colors.textMuted },
              filterType === 'all' && { color: colors.primary, fontWeight: '700' },
            ]}>
            Tất cả ({contacts.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabBtn,
            { backgroundColor: colors.inputBg },
            filterType === 'online' && {
              backgroundColor: colors.primaryLight,
              borderWidth: 1,
              borderColor: colors.primaryBorder,
            },
          ]}
          onPress={() => setFilterType('online')}>
          <Text
            style={[
              styles.tabText,
              { color: colors.textMuted },
              filterType === 'online' && { color: colors.primary, fontWeight: '700' },
            ]}>
            Trực tuyến ({onlineCount})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Danh sách người dùng */}
      <FlatList
        data={filteredContacts}
        keyExtractor={(item) => item.id}
        renderItem={renderContactItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View
              style={[
                styles.emptyIconCircle,
                { backgroundColor: colors.inputBg },
              ]}>
              <UsersIcon size={28} color={colors.textMuted} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              Không tìm thấy liên hệ
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
              {searchQuery
                ? `Không có người dùng nào khớp với "${searchQuery}"`
                : 'Danh bạ hiện đang trống'}
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
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 8,
    gap: 8,
  },
  tabBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    borderBottomWidth: 1,
  },
  contactInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  contactName: {
    fontSize: 15,
    fontWeight: '700',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
  },
  statusTextOnline: {
    color: '#10B981',
    fontWeight: '600',
  },
  chatActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
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
  },
});
