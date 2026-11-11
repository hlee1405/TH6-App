import React from 'react';
import { View, StyleSheet } from 'react-native';

interface AvatarProps {
  uri?: string;
  name?: string;
  size?: number;
  showOnline?: boolean;
  isOnline?: boolean;
}

export const Avatar: React.FC<AvatarProps> = ({
  size = 50,
  showOnline = false,
  isOnline = false,
}) => {
  const badgeSize = Math.max(10, Math.floor(size * 0.26));

  // Tỷ lệ chuẩn xác theo ảnh avatar trắng mặc định
  const headSize = size * 0.44;
  const shoulderWidth = size * 0.86;
  const shoulderHeight = size * 0.52;

  return (
    <View style={[styles.wrapper, { width: size, height: size }]}>
      {/* Khối avatar tròn nền xám trung tính */}
      <View
        style={[
          styles.circleContainer,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
        ]}>
        {/* Đầu: hình tròn trắng tinh */}
        <View
          style={[
            styles.head,
            {
              width: headSize,
              height: headSize,
              borderRadius: headSize / 2,
              top: size * 0.13,
            },
          ]}
        />
        {/* Vai/thân: hình vòm trắng tinh ôm viền đáy */}
        <View
          style={[
            styles.shoulders,
            {
              width: shoulderWidth,
              height: shoulderHeight,
              borderTopLeftRadius: shoulderWidth / 2,
              borderTopRightRadius: shoulderWidth / 2,
              top: size * 0.65,
            },
          ]}
        />
      </View>

      {/* Chấm trạng thái trực tuyến */}
      {showOnline && (
        <View
          style={[
            styles.badge,
            {
              width: badgeSize,
              height: badgeSize,
              borderRadius: badgeSize / 2,
              backgroundColor: isOnline ? '#10B981' : '#9CA3AF',
              right: 0,
              bottom: 0,
            },
          ]}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleContainer: {
    backgroundColor: '#D1D5DB', // Màu xám trung tính chuẩn ảnh mẫu
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  head: {
    backgroundColor: '#FFFFFF',
    position: 'absolute',
  },
  shoulders: {
    backgroundColor: '#FFFFFF',
    position: 'absolute',
  },
  badge: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
});
