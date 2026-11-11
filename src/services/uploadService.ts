import { Platform, PermissionsAndroid, Alert } from 'react-native';
import {
  launchCamera,
  launchImageLibrary,
  Asset,
} from 'react-native-image-picker';
import { CLOUDINARY_CONFIG } from './cloudinaryConfig';

/**
 * Xin quyền truy cập Camera trên Android
 */
export const requestCameraPermission = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') {
    return true;
  }

  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.CAMERA,
      {
        title: 'Quyền truy cập Camera',
        message: 'Ứng dụng cần quyền Camera để chụp ảnh gửi trong tin nhắn.',
        buttonNeutral: 'Hỏi lại sau',
        buttonNegative: 'Từ chối',
        buttonPositive: 'Đồng ý',
      }
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch (err) {
    console.warn('Lỗi khi xin quyền camera:', err);
    return false;
  }
};

/**
 * Chụp ảnh từ camera với kích thước thu nhỏ (cạnh dài <= 1024px)
 */
export const takePhoto = async (): Promise<Asset | null> => {
  const hasPermission = await requestCameraPermission();
  if (!hasPermission) {
    Alert.alert(
      'Quyền bị từ chối',
      'Ứng dụng không có quyền truy cập camera. Vui lòng cấp quyền trong cài đặt thiết bị để tiếp tục.'
    );
    return null;
  }

  try {
    const response = await launchCamera({
      mediaType: 'photo',
      maxWidth: 1024,
      maxHeight: 1024,
      quality: 0.8,
      saveToPhotos: false,
    });

    if (response.didCancel) {
      return null;
    }

    if (response.errorMessage) {
      Alert.alert('Lỗi Camera', response.errorMessage);
      return null;
    }

    const asset = response.assets?.[0];
    return asset || null;
  } catch (error: any) {
    console.warn('Lỗi mở camera:', error);
    Alert.alert('Lỗi', 'Không thể khởi động camera. Vui lòng thử lại.');
    return null;
  }
};

/**
 * Chọn ảnh từ thư viện với kích thước thu nhỏ (cạnh dài <= 1024px)
 */
export const pickImageFromLibrary = async (): Promise<Asset | null> => {
  try {
    const response = await launchImageLibrary({
      mediaType: 'photo',
      maxWidth: 1024,
      maxHeight: 1024,
      quality: 0.8,
      selectionLimit: 1,
    });

    if (response.didCancel) {
      return null;
    }

    if (response.errorMessage) {
      Alert.alert('Lỗi chọn ảnh', response.errorMessage);
      return null;
    }

    const asset = response.assets?.[0];
    return asset || null;
  } catch (error: any) {
    console.warn('Lỗi mở thư viện ảnh:', error);
    Alert.alert('Lỗi', 'Không thể mở thư viện ảnh.');
    return null;
  }
};

/**
 * Tải ảnh lên Cloudinary qua Unsigned Upload Preset
 * Nhận đường dẫn file cục bộ (local URI) và trả về URL ảnh trên Cloudinary
 */
export const uploadImageToCloudinary = async (fileUri: string): Promise<string> => {
  if (!fileUri) {
    throw new Error('Đường dẫn ảnh không hợp lệ');
  }

  const { cloudName, uploadPreset } = CLOUDINARY_CONFIG;
  const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

  const formData = new FormData();
  const filename = fileUri.split('/').pop() || `img_${Date.now()}.jpg`;
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : 'image/jpeg';

  formData.append('file', {
    uri: Platform.OS === 'android' ? fileUri : fileUri.replace('file://', ''),
    type,
    name: filename,
  } as any);

  formData.append('upload_preset', uploadPreset);

  const response = await fetch(uploadUrl, {
    method: 'POST',
    body: formData,
    headers: {
      Accept: 'application/json',
    },
  });

  const data = await response.json();

  if (!response.ok || data.error) {
    const errorMsg = data.error?.message || 'Không thể tải ảnh lên Cloudinary';
    console.warn('Cloudinary upload error:', errorMsg);
    throw new Error(errorMsg);
  }

  return data.secure_url || data.url;
};

