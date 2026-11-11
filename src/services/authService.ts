import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth } from './firebase';
import { saveUserProfile, setUserOnlineStatus } from './userService';
import { User } from '../types';

/**
 * Chuyển mã lỗi Firebase thành thông báo tiếng Việt thân thiện
 */
export const getAuthErrorMessage = (errorCode: string): string => {
  switch (errorCode) {
    case 'auth/invalid-credential':
      return 'Tài khoản hoặc mật khẩu không chính xác. Nếu chưa có tài khoản, vui lòng nhấn "Đăng ký ngay" bên dưới!';
    case 'auth/wrong-password':
      return 'Mật khẩu không chính xác. Vui lòng kiểm tra lại!';
    case 'auth/user-not-found':
      return 'Tài khoản chưa được đăng ký trên Firebase. Vui lòng nhấn "Đăng ký ngay" bên dưới để tạo tài khoản!';
    case 'auth/invalid-email':
      return 'Định dạng email không hợp lệ (ví dụ: example@gmail.com).';
    case 'auth/email-already-in-use':
      return 'Email này đã được sử dụng bởi một tài khoản khác.';
    case 'auth/weak-password':
      return 'Mật khẩu quá yếu. Mật khẩu phải có ít nhất 6 ký tự.';
    case 'auth/too-many-requests':
      return 'Đã thử quá nhiều lần thất bại. Vui lòng thử lại sau ít phút.';
    case 'auth/network-request-failed':
      return 'Không thể kết nối đến máy chủ Firebase. Vui lòng kiểm tra kết nối mạng của thiết bị!';
    case 'auth/api-key-not-valid':
    case 'auth/invalid-api-key':
      return 'API Key Firebase chưa hợp lệ. Vui lòng mở src/services/firebaseConfig.ts và cập nhật thông tin Firebase của bạn!';
    case 'auth/operation-not-allowed':
      return 'Chưa bật Email/Password trong Firebase Console -> Authentication -> Sign-in method.';
    default:
      return errorCode
        ? `Lỗi Firebase (${errorCode}). Vui lòng kiểm tra lại cấu hình Firebase!`
        : 'Đã xảy ra lỗi. Vui lòng kiểm tra lại thông tin và thử lại.';
  }
};

/**
 * Đăng ký tài khoản mới bằng Email và Mật khẩu
 */
export const registerWithEmail = async (
  name: string,
  email: string,
  pass: string
): Promise<User> => {
  const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), pass);
  const fbUser = userCredential.user;

  // Cập nhật tên hiển thị trong Firebase Auth
  if (name.trim()) {
    await updateProfile(fbUser, { displayName: name.trim() });
  }

  const avatarUrl = `https://api.dicebear.com/7.x/avataaars/png?seed=${encodeURIComponent(
    name.trim() || fbUser.uid
  )}`;

  const newUser: User = {
    id: fbUser.uid,
    name: name.trim() || fbUser.email?.split('@')[0] || 'Người dùng',
    email: fbUser.email || email.trim(),
    phone: '',
    avatar: avatarUrl,
    bio: 'Xin chào! Tôi đang dùng ConnectChat.',
    isOnline: true,
  };

  // Lưu thông tin người dùng vào Realtime Database
  await saveUserProfile(newUser);

  return newUser;
};

/**
 * Đăng nhập bằng Email và Mật khẩu
 */
export const loginWithEmail = async (email: string, pass: string): Promise<User> => {
  const userCredential = await signInWithEmailAndPassword(auth, email.trim(), pass);
  const fbUser = userCredential.user;

  // Cập nhật trạng thái trực tuyến
  await setUserOnlineStatus(fbUser.uid, true);

  const displayName = fbUser.displayName || fbUser.email?.split('@')[0] || 'Người dùng';
  const avatarUrl = `https://api.dicebear.com/7.x/avataaars/png?seed=${encodeURIComponent(
    displayName
  )}`;

  const user: User = {
    id: fbUser.uid,
    name: displayName,
    email: fbUser.email || email.trim(),
    phone: '',
    avatar: avatarUrl,
    bio: 'Xin chào! Tôi đang dùng ConnectChat.',
    isOnline: true,
  };

  return user;
};

/**
 * Đăng xuất khỏi Firebase
 */
export const logoutFirebase = async (userId?: string): Promise<void> => {
  if (userId) {
    try {
      await setUserOnlineStatus(userId, false);
    } catch (e) {
      console.warn('Không thể cập nhật offline khi đăng xuất:', e);
    }
  }
  await signOut(auth);
};

/**
 * Lắng nghe trạng thái đăng nhập Firebase Auth
 */
export const subscribeToAuth = (
  callback: (user: FirebaseUser | null) => void
): (() => void) => {
  return onAuthStateChanged(auth, callback);
};

