import { PermissionsAndroid, Platform, Linking, Alert } from 'react-native';
import Geolocation from '@react-native-community/geolocation';

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

/**
 * Yêu cầu quyền truy cập vị trí người dùng
 */
export const requestLocationPermission = async (): Promise<boolean> => {
  if (Platform.OS === 'ios') {
    // Với iOS, gọi requestAuthorization
    try {
      Geolocation.requestAuthorization();
      return true;
    } catch (err) {
      console.warn('Lỗi xin quyền iOS:', err);
      return false;
    }
  }

  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: 'Quyền truy cập vị trí',
        message: 'ConnectChat cần quyền vị trí để bạn có thể chia sẻ tọa độ hiện tại với bạn bè.',
        buttonPositive: 'Cho phép',
        buttonNegative: 'Từ chối',
        buttonNeutral: 'Để sau',
      }
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch (err) {
    console.warn('Lỗi khi xin quyền vị trí:', err);
    return false;
  }
};

/**
 * Lấy tọa độ vị trí hiện tại
 */
export const getCurrentLocation = (): Promise<LocationCoordinates> => {
  return new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 10000,
      }
    );
  });
};

/**
 * Mở ứng dụng Google Maps với tọa độ chính xác
 */
export const openLocationInGoogleMaps = async (latitude: number, longitude: number) => {
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
  const geoUrl = `geo:${latitude},${longitude}?q=${latitude},${longitude}`;

  try {
    if (Platform.OS === 'android') {
      try {
        await Linking.openURL(geoUrl);
        return;
      } catch {
        // Nếu không có app xử lý geo intent thì mở link Google Maps
      }
    }
    await Linking.openURL(mapUrl);
  } catch (err) {
    console.warn('Không thể mở bản đồ:', err);
    Alert.alert('Lỗi', 'Không thể mở liên kết bản đồ trên thiết bị.');
  }
};
