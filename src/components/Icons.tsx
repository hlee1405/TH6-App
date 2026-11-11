import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';

interface IconProps {
  size?: number;
  color?: string;
  focused?: boolean;
  style?: ViewStyle;
}

// 1. Sleek Chat Bubble Icon
export const ChatBubbleIcon: React.FC<IconProps> = ({ size = 22, color = '#64748B', focused = false, style }) => {
  const finalColor = focused ? '#2563EB' : color;
  const s = size / 24;

  return (
    <View style={[styles.center, { width: size, height: size }, style]}>
      <View
        style={{
          width: 20 * s,
          height: 16 * s,
          borderRadius: 6 * s,
          borderWidth: 2 * s,
          borderColor: finalColor,
          backgroundColor: focused ? `${finalColor}15` : 'transparent',
          position: 'relative',
        }}>
        {/* Tail */}
        <View
          style={{
            position: 'absolute',
            bottom: -4 * s,
            left: 3 * s,
            width: 5 * s,
            height: 5 * s,
            backgroundColor: focused ? '#FFFFFF' : '#FFFFFF',
            borderRightWidth: 2 * s,
            borderBottomWidth: 2 * s,
            borderColor: finalColor,
            transform: [{ rotate: '45deg' }],
          }}
        />
        {/* Dots inside */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
            gap: 2 * s,
          }}>
          <View style={{ width: 2.5 * s, height: 2.5 * s, borderRadius: 1.5 * s, backgroundColor: finalColor }} />
          <View style={{ width: 2.5 * s, height: 2.5 * s, borderRadius: 1.5 * s, backgroundColor: finalColor }} />
          <View style={{ width: 2.5 * s, height: 2.5 * s, borderRadius: 1.5 * s, backgroundColor: finalColor }} />
        </View>
      </View>
    </View>
  );
};

// 2. Sleek Contacts / Users Icon
export const UsersIcon: React.FC<IconProps> = ({ size = 22, color = '#64748B', focused = false, style }) => {
  const finalColor = focused ? '#2563EB' : color;
  const s = size / 24;

  return (
    <View style={[styles.center, { width: size, height: size }, style]}>
      {/* Head */}
      <View
        style={{
          width: 8 * s,
          height: 8 * s,
          borderRadius: 4 * s,
          borderWidth: 2 * s,
          borderColor: finalColor,
          backgroundColor: focused ? `${finalColor}30` : 'transparent',
          marginBottom: 2 * s,
        }}
      />
      {/* Shoulders / Body */}
      <View
        style={{
          width: 17 * s,
          height: 8 * s,
          borderTopLeftRadius: 8 * s,
          borderTopRightRadius: 8 * s,
          borderWidth: 2 * s,
          borderBottomWidth: 0,
          borderColor: finalColor,
          backgroundColor: focused ? `${finalColor}15` : 'transparent',
        }}
      />
    </View>
  );
};

// 3. Sleek Bell / Notification Icon
export const BellIcon: React.FC<IconProps> = ({ size = 22, color = '#64748B', focused = false, style }) => {
  const finalColor = focused ? '#2563EB' : color;
  const s = size / 24;

  return (
    <View style={[styles.center, { width: size, height: size }, style]}>
      {/* Top tiny knob */}
      <View
        style={{
          width: 3 * s,
          height: 2 * s,
          borderRadius: 1 * s,
          backgroundColor: finalColor,
        }}
      />
      {/* Dome */}
      <View
        style={{
          width: 15 * s,
          height: 12 * s,
          borderTopLeftRadius: 8 * s,
          borderTopRightRadius: 8 * s,
          borderWidth: 2 * s,
          borderBottomWidth: 0,
          borderColor: finalColor,
          backgroundColor: focused ? `${finalColor}15` : 'transparent',
        }}
      />
      {/* Bottom rim */}
      <View
        style={{
          width: 19 * s,
          height: 2 * s,
          borderRadius: 1 * s,
          backgroundColor: finalColor,
        }}
      />
      {/* Clapper dot */}
      <View
        style={{
          width: 4 * s,
          height: 3 * s,
          borderBottomLeftRadius: 2 * s,
          borderBottomRightRadius: 2 * s,
          backgroundColor: finalColor,
          marginTop: 1 * s,
        }}
      />
    </View>
  );
};

// 4. Sleek Settings / Sliders Icon (Apple style)
export const SettingsIcon: React.FC<IconProps> = ({ size = 22, color = '#64748B', focused = false, style }) => {
  const finalColor = focused ? '#2563EB' : color;
  const s = size / 24;

  return (
    <View style={[styles.center, { width: size, height: size, justifyContent: 'center' }, style]}>
      {/* Line 1 */}
      <View style={{ width: 18 * s, height: 2 * s, backgroundColor: finalColor, borderRadius: 1 * s, marginVertical: 2 * s, position: 'relative' }}>
        <View style={{ position: 'absolute', left: 3 * s, top: -2 * s, width: 6 * s, height: 6 * s, borderRadius: 3 * s, backgroundColor: finalColor, borderWidth: 1 * s, borderColor: '#FFFFFF' }} />
      </View>
      {/* Line 2 */}
      <View style={{ width: 18 * s, height: 2 * s, backgroundColor: finalColor, borderRadius: 1 * s, marginVertical: 2 * s, position: 'relative' }}>
        <View style={{ position: 'absolute', right: 3 * s, top: -2 * s, width: 6 * s, height: 6 * s, borderRadius: 3 * s, backgroundColor: finalColor, borderWidth: 1 * s, borderColor: '#FFFFFF' }} />
      </View>
      {/* Line 3 */}
      <View style={{ width: 18 * s, height: 2 * s, backgroundColor: finalColor, borderRadius: 1 * s, marginVertical: 2 * s, position: 'relative' }}>
        <View style={{ position: 'absolute', left: 7 * s, top: -2 * s, width: 6 * s, height: 6 * s, borderRadius: 3 * s, backgroundColor: finalColor, borderWidth: 1 * s, borderColor: '#FFFFFF' }} />
      </View>
    </View>
  );
};

// 5. Sleek Search Icon
export const SearchIcon: React.FC<{ size?: number; color?: string }> = ({ size = 18, color = '#64748B' }) => {
  const s = size / 20;

  return (
    <View style={{ width: size, height: size, position: 'relative' }}>
      {/* Lens circle */}
      <View
        style={{
          width: 12 * s,
          height: 12 * s,
          borderRadius: 6 * s,
          borderWidth: 2 * s,
          borderColor: color,
        }}
      />
      {/* Handle */}
      <View
        style={{
          position: 'absolute',
          bottom: 2 * s,
          right: 2 * s,
          width: 6 * s,
          height: 2 * s,
          backgroundColor: color,
          borderRadius: 1 * s,
          transform: [{ rotate: '45deg' }],
        }}
      />
    </View>
  );
};

// 6. Sleek Close / X Icon
export const CloseIcon: React.FC<{ size?: number; color?: string }> = ({ size = 16, color = '#64748B' }) => {
  const s = size / 16;
  return (
    <View style={[styles.center, { width: size, height: size }]}>
      <View
        style={{
          position: 'absolute',
          width: 12 * s,
          height: 2 * s,
          borderRadius: 1 * s,
          backgroundColor: color,
          transform: [{ rotate: '45deg' }],
        }}
      />
      <View
        style={{
          position: 'absolute',
          width: 12 * s,
          height: 2 * s,
          borderRadius: 1 * s,
          backgroundColor: color,
          transform: [{ rotate: '-45deg' }],
        }}
      />
    </View>
  );
};

// 7. Sleek User Silhouette Icon
export const UserIcon: React.FC<IconProps> = ({ size = 18, color = '#64748B', style }) => {
  const s = size / 20;
  return (
    <View style={[styles.center, { width: size, height: size }, style]}>
      <View
        style={{
          width: 7 * s,
          height: 7 * s,
          borderRadius: 3.5 * s,
          borderWidth: 1.8 * s,
          borderColor: color,
          marginBottom: 1.5 * s,
        }}
      />
      <View
        style={{
          width: 14 * s,
          height: 6 * s,
          borderTopLeftRadius: 6 * s,
          borderTopRightRadius: 6 * s,
          borderWidth: 1.8 * s,
          borderBottomWidth: 0,
          borderColor: color,
        }}
      />
    </View>
  );
};

// 8. Sleek Padlock Icon
export const LockIcon: React.FC<IconProps> = ({ size = 18, color = '#64748B', style }) => {
  const s = size / 20;
  return (
    <View style={[styles.center, { width: size, height: size }, style]}>
      {/* Shackle */}
      <View
        style={{
          width: 8 * s,
          height: 7 * s,
          borderTopLeftRadius: 4 * s,
          borderTopRightRadius: 4 * s,
          borderWidth: 1.8 * s,
          borderBottomWidth: 0,
          borderColor: color,
        }}
      />
      {/* Body */}
      <View
        style={{
          width: 13 * s,
          height: 9 * s,
          borderRadius: 2.5 * s,
          borderWidth: 1.8 * s,
          borderColor: color,
          justifyContent: 'center',
          alignItems: 'center',
        }}>
        <View style={{ width: 2 * s, height: 3 * s, borderRadius: 1 * s, backgroundColor: color }} />
      </View>
    </View>
  );
};

// 9. Sleek Chevron Left (Back)
export const ChevronLeftIcon: React.FC<{ size?: number; color?: string }> = ({ size = 24, color = '#0F172A' }) => {
  const s = size / 24;
  return (
    <View style={[styles.center, { width: size, height: size }]}>
      <View
        style={{
          width: 10 * s,
          height: 10 * s,
          borderLeftWidth: 2.5 * s,
          borderBottomWidth: 2.5 * s,
          borderColor: color,
          transform: [{ rotate: '45deg' }],
          marginLeft: 4 * s,
        }}
      />
    </View>
  );
};

// 10. Sleek Send Arrow Icon
export const SendIcon: React.FC<{ size?: number; color?: string }> = ({ size = 18, color = '#FFFFFF' }) => {
  const s = size / 20;
  return (
    <View style={[styles.center, { width: size, height: size }]}>
      {/* Arrow shaft */}
      <View
        style={{
          width: 12 * s,
          height: 2 * s,
          backgroundColor: color,
          borderRadius: 1 * s,
        }}
      />
      {/* Arrow head */}
      <View
        style={{
          position: 'absolute',
          right: 3 * s,
          width: 7 * s,
          height: 7 * s,
          borderTopWidth: 2 * s,
          borderRightWidth: 2 * s,
          borderColor: color,
          transform: [{ rotate: '45deg' }],
        }}
      />
    </View>
  );
};

// 11. Sleek Checkmark
export const CheckIcon: React.FC<{ size?: number; color?: string }> = ({ size = 14, color = '#2563EB' }) => {
  const s = size / 14;
  return (
    <View style={[styles.center, { width: size, height: size }]}>
      <View
        style={{
          width: 8 * s,
          height: 4 * s,
          borderLeftWidth: 2 * s,
          borderBottomWidth: 2 * s,
          borderColor: color,
          transform: [{ rotate: '-45deg' }],
          marginBottom: 2 * s,
        }}
      />
    </View>
  );
};

// 12. Sleek Eye Icon
export const EyeIcon: React.FC<{ size?: number; color?: string; slashed?: boolean }> = ({
  size = 20,
  color = '#64748B',
  slashed = false,
}) => {
  const s = size / 20;
  return (
    <View style={[styles.center, { width: size, height: size }]}>
      {/* Eye border */}
      <View
        style={{
          width: 16 * s,
          height: 10 * s,
          borderRadius: 6 * s,
          borderWidth: 1.8 * s,
          borderColor: color,
          justifyContent: 'center',
          alignItems: 'center',
        }}>
        {/* Pupil */}
        <View style={{ width: 4 * s, height: 4 * s, borderRadius: 2 * s, backgroundColor: color }} />
      </View>
      {/* Slash if off */}
      {slashed && (
        <View
          style={{
            position: 'absolute',
            width: 18 * s,
            height: 2 * s,
            backgroundColor: color,
            borderRadius: 1 * s,
            transform: [{ rotate: '-45deg' }],
          }}
        />
      )}
    </View>
  );
};

// 13. Sleek Exit / Logout Icon
export const LogoutIcon: React.FC<{ size?: number; color?: string }> = ({ size = 20, color = '#EF4444' }) => {
  const s = size / 20;
  return (
    <View style={[styles.center, { width: size, height: size }]}>
      {/* Door frame */}
      <View
        style={{
          position: 'absolute',
          left: 2 * s,
          width: 9 * s,
          height: 14 * s,
          borderWidth: 1.8 * s,
          borderRightWidth: 0,
          borderColor: color,
          borderRadius: 2 * s,
        }}
      />
      {/* Arrow body */}
      <View
        style={{
          position: 'absolute',
          left: 6 * s,
          width: 10 * s,
          height: 1.8 * s,
          backgroundColor: color,
          borderRadius: 1 * s,
        }}
      />
      {/* Arrow tip */}
      <View
        style={{
          position: 'absolute',
          right: 3 * s,
          width: 5 * s,
          height: 5 * s,
          borderTopWidth: 1.8 * s,
          borderRightWidth: 1.8 * s,
          borderColor: color,
          transform: [{ rotate: '45deg' }],
        }}
      />
    </View>
  );
};

// 14. Sleek Volume / Speaker Icon
export const SoundIcon: React.FC<{ size?: number; color?: string }> = ({ size = 20, color = '#64748B' }) => {
  const s = size / 20;
  return (
    <View
      style={{
        width: size,
        height: size,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      {/* Speaker box */}
      <View
        style={{
          width: 4 * s,
          height: 7 * s,
          backgroundColor: color,
          borderTopLeftRadius: 1.5 * s,
          borderBottomLeftRadius: 1.5 * s,
        }}
      />
      {/* Cone triangle */}
      <View
        style={{
          width: 0,
          height: 0,
          borderStyle: 'solid',
          borderTopWidth: 5.5 * s,
          borderBottomWidth: 5.5 * s,
          borderRightWidth: 6 * s,
          borderTopColor: 'transparent',
          borderBottomColor: 'transparent',
          borderRightColor: color,
        }}
      />
      {/* Sound wave 1 */}
      <View
        style={{
          width: 4 * s,
          height: 8 * s,
          borderRightWidth: 1.8 * s,
          borderTopRightRadius: 4 * s,
          borderBottomRightRadius: 4 * s,
          borderColor: color,
          marginLeft: 2.5 * s,
        }}
      />
      {/* Sound wave 2 */}
      <View
        style={{
          width: 5 * s,
          height: 13 * s,
          borderRightWidth: 1.8 * s,
          borderTopRightRadius: 6 * s,
          borderBottomRightRadius: 6 * s,
          borderColor: color,
          marginLeft: 1.5 * s,
        }}
      />
    </View>
  );
};

// 15. Sleek Crescent Moon / Dark Mode Icon
export const MoonIcon: React.FC<{ size?: number; color?: string; bgColor?: string }> = ({
  size = 20,
  color = '#2563EB',
  bgColor = '#EFF6FF',
}) => {
  const s = size / 20;
  return (
    <View style={[styles.center, { width: size, height: size }]}>
      <View
        style={{
          width: 15 * s,
          height: 15 * s,
          borderRadius: 7.5 * s,
          backgroundColor: color,
          overflow: 'hidden',
          position: 'relative',
        }}>
        {/* Cutout disc creating a crisp crescent moon */}
        <View
          style={{
            position: 'absolute',
            top: -2.5 * s,
            right: -2.5 * s,
            width: 13 * s,
            height: 13 * s,
            borderRadius: 6.5 * s,
            backgroundColor: bgColor,
          }}
        />
      </View>
    </View>
  );
};

// 16. Sleek Three Dots (More) Icon
export const MoreVerticalIcon: React.FC<{ size?: number; color?: string }> = ({ size = 20, color = '#64748B' }) => {
  const s = size / 20;
  return (
    <View style={[styles.center, { width: size, height: size, gap: 3 * s }]}>
      <View style={{ width: 3.5 * s, height: 3.5 * s, borderRadius: 2 * s, backgroundColor: color }} />
      <View style={{ width: 3.5 * s, height: 3.5 * s, borderRadius: 2 * s, backgroundColor: color }} />
      <View style={{ width: 3.5 * s, height: 3.5 * s, borderRadius: 2 * s, backgroundColor: color }} />
    </View>
  );
};

// 17. Brand Logo: Intersecting chat shapes (Professional modern tech brand)
export const BrandLogo: React.FC<{ size?: number }> = ({ size = 64 }) => {
  const s = size / 64;

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: 20 * s,
        backgroundColor: '#2563EB',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#2563EB',
        shadowOffset: { width: 0, height: 6 * s },
        shadowOpacity: 0.35,
        shadowRadius: 10 * s,
        elevation: 6,
      }}>
      {/* Front bubble */}
      <View
        style={{
          width: 28 * s,
          height: 22 * s,
          borderRadius: 9 * s,
          backgroundColor: '#FFFFFF',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
        }}>
        {/* Tail */}
        <View
          style={{
            position: 'absolute',
            bottom: -3 * s,
            left: 4 * s,
            width: 7 * s,
            height: 7 * s,
            backgroundColor: '#FFFFFF',
            transform: [{ rotate: '45deg' }],
          }}
        />
        {/* 3 Brand accent lines/dots */}
        <View style={{ flexDirection: 'row', gap: 3 * s }}>
          <View style={{ width: 4 * s, height: 4 * s, borderRadius: 2 * s, backgroundColor: '#2563EB' }} />
          <View style={{ width: 4 * s, height: 4 * s, borderRadius: 2 * s, backgroundColor: '#60A5FA' }} />
          <View style={{ width: 4 * s, height: 4 * s, borderRadius: 2 * s, backgroundColor: '#BFDBFE' }} />
        </View>
      </View>
    </View>
  );
};

// 18. Sleek Location Pin Icon
export const LocationPinIcon: React.FC<IconProps> = ({ size = 20, color = '#EF4444', style }) => {
  const s = size / 20;
  return (
    <View style={[styles.center, { width: size, height: size }, style]}>
      {/* Pin head */}
      <View
        style={{
          width: 14 * s,
          height: 14 * s,
          borderRadius: 7 * s,
          borderWidth: 2 * s,
          borderColor: color,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: `${color}15`,
        }}>
        <View
          style={{
            width: 4 * s,
            height: 4 * s,
            borderRadius: 2 * s,
            backgroundColor: color,
          }}
        />
      </View>
      {/* Pin point */}
      <View
        style={{
          width: 0,
          height: 0,
          borderStyle: 'solid',
          borderLeftWidth: 4 * s,
          borderRightWidth: 4 * s,
          borderTopWidth: 6 * s,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderTopColor: color,
          marginTop: -2 * s,
        }}
      />
    </View>
  );
};

// 19. Sleek Camera Icon
export const CameraIcon: React.FC<IconProps> = ({ size = 20, color = '#2563EB', style }) => {
  const s = size / 20;
  return (
    <View style={[styles.center, { width: size, height: size }, style]}>
      {/* Camera top flash notch */}
      <View
        style={{
          width: 6 * s,
          height: 3 * s,
          borderTopLeftRadius: 2 * s,
          borderTopRightRadius: 2 * s,
          backgroundColor: color,
          marginBottom: -1 * s,
        }}
      />
      {/* Camera body */}
      <View
        style={{
          width: 18 * s,
          height: 13 * s,
          borderRadius: 4 * s,
          borderWidth: 2 * s,
          borderColor: color,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'transparent',
        }}>
        {/* Lens */}
        <View
          style={{
            width: 6 * s,
            height: 6 * s,
            borderRadius: 3 * s,
            borderWidth: 1.5 * s,
            borderColor: color,
          }}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
