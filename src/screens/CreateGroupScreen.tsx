import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList, Contact } from '../types';
import { useApp } from '../context/AppContext';
import { Avatar } from '../components/Avatar';
import { SearchBar } from '../components/SearchBar';
import { ChevronLeftIcon, CheckIcon, UsersIcon } from '../components/Icons';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const CreateGroupScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const { currentUser, contacts, createGroup, theme } = useApp();
  const colors = theme.colors;

  const [groupName, setGroupName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Lọc danh bạ theo tìm kiếm
  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) return contacts;
    const q = searchQuery.toLowerCase().trim();
    return contacts.filter((c) => c.name.toLowerCase().includes(q));
  }, [contacts, searchQuery]);

  const toggleSelectMember = (contactId: string) => {
    setSelectedIds((prev) =>
      prev.includes(contactId) ? prev.filter((id) => id !== contactId) : [...prev, contactId]
    );
  };

  const canCreate = groupName.trim().length > 0 && selectedIds.length >= 2;

  const handleCreate = async () => {
    if (!groupName.trim()) {
      Alert.alert('Chưa nhập tên nhóm', 'Vui lòng đặt tên cho nhóm trò chuyện.');
      return;
    }

    if (selectedIds.length < 2) {
      Alert.alert(
        'Chưa đủ thành viên',
        'Vui lòng chọn tối thiểu 2 thành viên ngoài bạn để tạo nhóm chat (tổng từ 3 người trở lên).'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const convId = await createGroup(groupName.trim(), selectedIds);
      setIsSubmitting(false);

      const allMembersMap: Record<string, boolean> = { [currentUser.id]: true };
      selectedIds.forEach((id) => {
        allMembersMap[id] = true;
      });

      // Chuyển ngay đến màn hình Chat nhóm vừa tạo
      navigation.replace('ChatDetail', {
        convId,
        type: 'group',
        userName: groupName.trim(),
        members: allMembersMap,
      });
    } catch (error: any) {
      setIsSubmitting(false);
      console.warn('Lỗi tạo nhóm:', error);
      Alert.alert('Không thể tạo nhóm', error.message || 'Đã có lỗi xảy ra khi tạo nhóm.');
    }
  };

  const renderContactItem = ({ item }: { item: Contact }) => {
    const isSelected = selectedIds.includes(item.id);

    return (
      <TouchableOpacity
        style={[
          styles.contactItem,
          { borderBottomColor: colors.border },
          isSelected && { backgroundColor: theme.isDark ? '#1E293B' : '#EFF6FF' },
        ]}
        activeOpacity={0.7}
        onPress={() => toggleSelectMember(item.id)}>
        {/* Checkbox tròn */}
        <View
          style={[
            styles.checkbox,
            { borderColor: colors.border },
            isSelected && { backgroundColor: colors.primary, borderColor: colors.primary },
          ]}>
          {isSelected && <CheckIcon size={14} color="#FFFFFF" />}
        </View>

        <Avatar
          uri={item.avatar}
          name={item.name}
          size={46}
          showOnline={true}
          isOnline={item.isOnline}
        />

        <View style={styles.contactInfo}>
          <Text style={[styles.contactName, { color: colors.text }]} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={[styles.contactStatus, { color: colors.textSecondary }]}>
            {item.isOnline ? '🟢 Trực tuyến' : 'Ngoại tuyến'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.headerBg, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <ChevronLeftIcon size={24} color={colors.text} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: colors.text }]}>Tạo nhóm mới</Text>

        <TouchableOpacity
          style={[
            styles.createBtn,
            { backgroundColor: canCreate ? colors.primary : colors.border },
          ]}
          disabled={!canCreate || isSubmitting}
          onPress={handleCreate}>
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={[styles.createBtnText, { color: canCreate ? '#FFFFFF' : colors.textMuted }]}>
              Tạo
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Tên nhóm */}
      <View style={[styles.inputSection, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={[styles.groupIconBox, { backgroundColor: colors.primaryLight }]}>
          <UsersIcon size={24} color={colors.primary} />
        </View>
        <TextInput
          style={[styles.nameInput, { color: colors.text }]}
          placeholder="Nhập tên nhóm..."
          placeholderTextColor={colors.textMuted}
          value={groupName}
          onChangeText={setGroupName}
          maxLength={50}
        />
      </View>

      {/* Thống kê đã chọn */}
      <View style={[styles.summaryRow, { backgroundColor: colors.background }]}>
        <Text style={[styles.summaryText, { color: colors.textSecondary }]}>
          Đã chọn: <Text style={{ color: colors.primary, fontWeight: '700' }}>{selectedIds.length}</Text> thành viên (Tối thiểu 2)
        </Text>
      </View>

      {/* Ô tìm kiếm liên hệ */}
      <View style={styles.searchContainer}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Tìm người vào nhóm..."
        />
      </View>

      {/* Danh sách bạn bè chọn checkbox */}
      <FlatList
        data={filteredContacts}
        keyExtractor={(item) => item.id}
        renderItem={renderContactItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              {contacts.length === 0
                ? 'Chưa có bạn bè nào trong danh bạ để tạo nhóm.'
                : 'Không tìm thấy người dùng phù hợp.'}
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
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  createBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 18,
    minWidth: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  inputSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  groupIconBox: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  nameInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    paddingVertical: 6,
  },
  summaryRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  summaryText: {
    fontSize: 13,
    fontWeight: '500',
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  listContent: {
    paddingBottom: 24,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contactInfo: {
    marginLeft: 12,
    flex: 1,
  },
  contactName: {
    fontSize: 15,
    fontWeight: '600',
  },
  contactStatus: {
    fontSize: 12,
    marginTop: 2,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
});
