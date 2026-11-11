import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  StatusBar,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../types';
import { useApp } from '../context/AppContext';
import { Avatar } from '../components/Avatar';
import {
  BellIcon,
  UsersIcon,
  MoonIcon,
  LogoutIcon,
  CameraIcon,
  CloseIcon,
} from '../components/Icons';
import { pickImageFromLibrary, uploadImageToCloudinary } from '../services';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const { currentUser, settings, updateSetting, logout, updateProfile, theme } = useApp();
  const colors = theme.colors;

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState(currentUser.name);
  const [editBio, setEditBio] = useState(currentUser.bio || '');
  const [editAvatar, setEditAvatar] = useState(currentUser.avatar);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleOpenEdit = () => {
    setEditName(currentUser.name);
    setEditBio(currentUser.bio || '');
    setEditAvatar(currentUser.avatar);
    setEditModalVisible(true);
  };

  const handleChangeAvatar = async () => {
    const asset = await pickImageFromLibrary();
    if (!asset || !asset.uri) return;

    try {
      setIsUpdating(true);
      const url = await uploadImageToCloudinary(asset.uri);
      setEditAvatar(url);
      setIsUpdating(false);
      Alert.alert('Thành công', 'Đã tải ảnh đại diện mới.');
    } catch (_error: any) {
      setIsUpdating(false);
      Alert.alert('Lỗi tải ảnh', _error.message || 'Không thể tải ảnh đại diện.');
    }
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert('Lỗi', 'Tên không được để trống.');
      return;
    }

    setIsUpdating(true);
    try {
      await updateProfile({
        name: editName.trim(),
        avatar: editAvatar,
        bio: editBio.trim(),
      });
      setIsUpdating(false);
      setEditModalVisible(false);
      Alert.alert('Thành công', 'Hồ sơ cá nhân đã được cập nhật.');
    } catch (_error: any) {
      setIsUpdating(false);
      Alert.alert('Lỗi', 'Không thể cập nhật hồ sơ.');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Xác nhận đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất khỏi ứng dụng không?',
      [
        {
          text: 'Huỷ',
          style: 'cancel',
        },
        {
          text: 'Đăng xuất',
          style: 'destructive',
          onPress: async () => {
            await logout();
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.statusBarStyle} />

      {/* Screen Header with safe insets */}
      <View
        style={[
          styles.header,
          {
            paddingTop: Math.max(insets.top, 16) + 4,
            backgroundColor: colors.headerBg,
            borderBottomColor: colors.border,
          },
        ]}>
        <Text style={[styles.title, { color: colors.text }]}>Cài đặt</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 20) + 40 }]}
        showsVerticalScrollIndicator={false}>
        {/* 1. Profile Card */}
        <View
          style={[
            styles.profileCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.cardBorder,
            },
          ]}>
          <Avatar
            uri={currentUser.avatar}
            name={currentUser.name}
            size={72}
            showOnline={true}
            isOnline={settings.showOnlineStatus}
          />
          <View style={styles.profileDetails}>
            <Text style={[styles.profileName, { color: colors.text }]}>{currentUser.name}</Text>
            <Text style={[styles.profileEmail, { color: colors.textMuted }]}>{currentUser.email}</Text>
            {currentUser.phone ? (
              <Text style={[styles.profilePhone, { color: colors.textMuted }]}>{currentUser.phone}</Text>
            ) : null}

            <TouchableOpacity
              style={[styles.editProfileBtn, { backgroundColor: colors.primaryLight }]}
              onPress={handleOpenEdit}>
              <Text style={[styles.editProfileText, { color: colors.primary }]}>
                ✏️ Chỉnh sửa hồ sơ
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bio quote */}
        <View
          style={[
            styles.bioCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.cardBorder,
            },
          ]}>
          <Text style={[styles.bioLabel, { color: colors.textMuted }]}>Tiểu sử</Text>
          <Text style={[styles.bioText, { color: colors.textSecondary }]}>
            {currentUser.bio || 'Chưa cập nhật tiểu sử'}
          </Text>
        </View>

        {/* 2. Settings Group */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
            Tùy chọn hệ thống
          </Text>
        </View>

        <View
          style={[
            styles.settingsGroup,
            {
              backgroundColor: colors.card,
              borderColor: colors.cardBorder,
            },
          ]}>
          {/* Switch 1: Notifications */}
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <View
                style={[
                  styles.settingIconBg,
                  { backgroundColor: theme.isDark ? '#1E3A8A' : '#EFF6FF' },
                ]}>
                <BellIcon size={18} color={colors.primary} />
              </View>
              <View style={styles.settingTexts}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  Thông báo tin nhắn
                </Text>
                <Text style={[styles.settingDesc, { color: colors.textMuted }]}>
                  Nhận thông báo khi có tin nhắn mới
                </Text>
              </View>
            </View>
            <Switch
              value={settings.notifications}
              onValueChange={(val) => updateSetting('notifications', val)}
              trackColor={{ false: theme.isDark ? '#334155' : '#CBD5E1', true: colors.primary }}
              thumbColor={settings.notifications ? '#FFFFFF' : '#F1F5F9'}
            />
          </View>

          <View style={[styles.divider, { backgroundColor: colors.divider }]} />

          {/* Switch 2: Online Status */}
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <View
                style={[
                  styles.settingIconBg,
                  { backgroundColor: theme.isDark ? '#064E3B' : '#ECFDF5' },
                ]}>
                <UsersIcon size={18} color="#10B981" />
              </View>
              <View style={styles.settingTexts}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  Hiển thị trạng thái
                </Text>
                <Text style={[styles.settingDesc, { color: colors.textMuted }]}>
                  Cho phép người khác thấy bạn đang online
                </Text>
              </View>
            </View>
            <Switch
              value={settings.showOnlineStatus}
              onValueChange={(val) => updateSetting('showOnlineStatus', val)}
              trackColor={{ false: theme.isDark ? '#334155' : '#CBD5E1', true: colors.primary }}
              thumbColor={settings.showOnlineStatus ? '#FFFFFF' : '#F1F5F9'}
            />
          </View>

          <View style={[styles.divider, { backgroundColor: colors.divider }]} />

          {/* Switch 3: Dark Mode */}
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <View
                style={[
                  styles.settingIconBg,
                  { backgroundColor: theme.isDark ? '#312E81' : '#EEF2FF' },
                ]}>
                <MoonIcon size={18} color={theme.isDark ? '#A5B4FC' : '#6366F1'} />
              </View>
              <View style={styles.settingTexts}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  Giao diện tối (Dark Mode)
                </Text>
                <Text style={[styles.settingDesc, { color: colors.textMuted }]}>
                  Dùng giao diện nền tối bảo vệ mắt
                </Text>
              </View>
            </View>
            <Switch
              value={settings.darkMode}
              onValueChange={(val) => updateSetting('darkMode', val)}
              trackColor={{ false: theme.isDark ? '#334155' : '#CBD5E1', true: colors.primary }}
              thumbColor={settings.darkMode ? '#FFFFFF' : '#F1F5F9'}
            />
          </View>
        </View>

        {/* 3. Logout Button */}
        <TouchableOpacity
          style={[
            styles.logoutBtn,
            {
              backgroundColor: theme.isDark ? '#450A0A' : '#FEF2F2',
              borderColor: theme.isDark ? '#7F1D1D' : '#FEE2E2',
            },
          ]}
          activeOpacity={0.8}
          onPress={handleLogout}>
          <LogoutIcon size={20} color="#EF4444" />
          <Text style={styles.logoutText}>Đăng xuất tài khoản</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modal Chỉnh sửa hồ sơ cá nhân */}
      <Modal
        visible={editModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalBox, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Chỉnh sửa hồ sơ</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <CloseIcon size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Avatar preview & change */}
            <View style={styles.avatarEditContainer}>
              <Avatar uri={editAvatar} name={editName} size={80} />
              <TouchableOpacity
                style={[styles.changeAvatarBtn, { backgroundColor: colors.primaryLight }]}
                onPress={handleChangeAvatar}
                disabled={isUpdating}>
                <CameraIcon size={16} color={colors.primary} />
                <Text style={[styles.changeAvatarText, { color: colors.primary }]}>Đổi ảnh đại diện</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Họ và tên</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.inputBg, color: colors.text }]}
              value={editName}
              onChangeText={setEditName}
              placeholder="Nhập họ và tên..."
              placeholderTextColor={colors.textMuted}
            />

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Tiểu sử</Text>
            <TextInput
              style={[styles.modalInput, styles.bioInput, { backgroundColor: colors.inputBg, color: colors.text }]}
              value={editBio}
              onChangeText={setEditBio}
              placeholder="Nhập tiểu sử ngắn..."
              placeholderTextColor={colors.textMuted}
              multiline
            />

            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: colors.primary }]}
              disabled={isUpdating}
              onPress={handleSaveProfile}>
              {isUpdating ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.saveBtnText}>Lưu thay đổi</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  profileDetails: {
    marginLeft: 16,
    flex: 1,
  },
  profileName: {
    fontSize: 17,
    fontWeight: '700',
  },
  profileEmail: {
    fontSize: 13,
    marginTop: 2,
  },
  profilePhone: {
    fontSize: 13,
    marginTop: 2,
  },
  editProfileBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  editProfileText: {
    fontSize: 12,
    fontWeight: '700',
  },
  bioCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 12,
  },
  bioLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  bioText: {
    fontSize: 14,
    lineHeight: 20,
  },
  sectionHeader: {
    marginTop: 24,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  settingsGroup: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  settingIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingTexts: {
    marginLeft: 12,
    flex: 1,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  settingDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  divider: {
    height: 1,
    marginHorizontal: 14,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 28,
  },
  logoutText: {
    color: '#EF4444',
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 8,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalBox: {
    width: '100%',
    borderRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  avatarEditContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  changeAvatarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 8,
  },
  changeAvatarText: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  modalInput: {
    height: 44,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    marginBottom: 12,
  },
  bioInput: {
    height: 70,
    paddingTop: 10,
    textAlignVertical: 'top',
  },
  saveBtn: {
    height: 46,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
