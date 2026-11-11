import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../types';
import { useApp } from '../context/AppContext';
import { BrandLogo, UserIcon, LockIcon, EyeIcon } from '../components/Icons';
import { isFirebaseConfigured } from '../services';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

export const LoginScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const { login, theme } = useApp();
  const colors = theme.colors;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    // Kiểm tra dữ liệu nhập không được để trống
    if (!email.trim() && !password.trim()) {
      setErrorMessage('Vui lòng nhập đầy đủ email và mật khẩu!');
      return;
    }
    if (!email.trim()) {
      setErrorMessage('Email không được để trống!');
      return;
    }
    if (!password.trim()) {
      setErrorMessage('Mật khẩu không được để trống!');
      return;
    }

    setErrorMessage('');
    setIsLoading(true);

    const result = await login(email.trim(), password);
    setIsLoading(false);

    if (result.success) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs' }],
      });
    } else {
      setErrorMessage(result.error || 'Đăng nhập không thành công. Vui lòng kiểm tra lại!');
    }
  };



  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.keyboardContainer, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.statusBarStyle} />
      <ScrollView
        contentContainerStyle={[
          styles.scrollContainer,
          {
            paddingTop: Math.max(insets.top, 20) + 10,
            paddingBottom: Math.max(insets.bottom, 20) + 10,
          },
        ]}
        keyboardShouldPersistTaps="handled">
        {/* Brand Section */}
        <View style={styles.brandContainer}>
          <BrandLogo size={68} />
          <Text style={[styles.appName, { color: colors.text }]}>ConnectChat</Text>
          <Text style={[styles.appSlogan, { color: colors.textMuted }]}>
            Nền tảng nhắn tin và kết nối trực tuyến Realtime
          </Text>
        </View>

        {/* Card Form */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              borderColor: colors.cardBorder,
            },
          ]}>
          <Text style={[styles.formTitle, { color: colors.text }]}>Đăng nhập</Text>

          {/* Banner thông báo trạng thái cấu hình Firebase */}
          {!isFirebaseConfigured() ? (
            <View style={styles.demoNoticeBox}>
              <Text style={styles.demoNoticeTitle}>⚙️ Chế độ Xem trước (Demo Mode)</Text>
              <Text style={styles.demoNoticeDesc}>
                Nhấn tài khoản mẫu bên dưới để đăng nhập ngay. Để kết nối Firebase Realtime thật giữa 2 thiết bị, hãy dán apiKey vào{' '}
                <Text style={styles.demoNoticeHighlight}>src/services/firebaseConfig.ts</Text>.
              </Text>
            </View>
          ) : null}

          {/* Error Banner */}
          {errorMessage ? (
            <View style={styles.errorBox}>
              <View style={styles.errorDot} />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {/* Email Input */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Email</Text>
            <View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: colors.inputBg,
                  borderColor: colors.inputBorder,
                },
              ]}>
              <View style={styles.fieldIconContainer}>
                <UserIcon size={18} color={colors.textMuted} />
              </View>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="example@gmail.com"
                placeholderTextColor={colors.textMuted}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (errorMessage) setErrorMessage('');
                }}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Mật khẩu</Text>
            <View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: colors.inputBg,
                  borderColor: colors.inputBorder,
                },
              ]}>
              <View style={styles.fieldIconContainer}>
                <LockIcon size={18} color={colors.textMuted} />
              </View>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Mật khẩu của bạn"
                placeholderTextColor={colors.textMuted}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (errorMessage) setErrorMessage('');
                }}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <EyeIcon size={18} color={colors.textMuted} slashed={!showPassword} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Login Button */}
          <TouchableOpacity
            style={[
              styles.loginButton,
              { backgroundColor: colors.primary },
              isLoading && { opacity: 0.7 },
            ]}
            activeOpacity={0.85}
            onPress={handleLogin}
            disabled={isLoading}>
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.loginButtonText}>Đăng nhập</Text>
            )}
          </TouchableOpacity>

          {/* Switch to Register */}
          <View style={styles.switchAuthContainer}>
            <Text style={[styles.switchAuthText, { color: colors.textMuted }]}>
              Chưa có tài khoản?{' '}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={[styles.switchAuthLink, { color: colors.primary }]}>
                Đăng ký ngay
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 26,
  },
  appName: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginTop: 16,
  },
  appSlogan: {
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
  },
  card: {
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  errorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    marginRight: 8,
  },
  errorText: {
    fontSize: 13,
    color: '#DC2626',
    fontWeight: '500',
    flex: 1,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  fieldIconContainer: {
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
  },
  eyeBtn: {
    padding: 4,
  },
  loginButton: {
    borderRadius: 12,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  switchAuthContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
  },
  switchAuthText: {
    fontSize: 13,
  },
  switchAuthLink: {
    fontSize: 13,
    fontWeight: '700',
  },
  demoNoticeBox: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  demoNoticeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E40AF',
    marginBottom: 4,
  },
  demoNoticeDesc: {
    fontSize: 12,
    color: '#3B82F6',
    lineHeight: 17,
  },
  demoNoticeHighlight: {
    fontWeight: '700',
    color: '#1D4ED8',
  },
});
