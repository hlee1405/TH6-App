export interface Theme {
  isDark: boolean;
  colors: {
    background: string;
    card: string;
    cardBorder: string;
    text: string;
    textSecondary: string;
    textMuted: string;
    primary: string;
    primaryLight: string;
    primaryBorder: string;
    inputBg: string;
    inputBorder: string;
    border: string;
    divider: string;
    unreadBg: string;
    headerBg: string;
    tabBarBg: string;
    tabBarBorder: string;
    badgeBg: string;
    badgeText: string;
    dangerBg: string;
    dangerBorder: string;
    dangerText: string;
    statusBarStyle: 'dark-content' | 'light-content';
  };
}

export const lightTheme: Theme = {
  isDark: false,
  colors: {
    background: '#F8FAFC',
    card: '#FFFFFF',
    cardBorder: '#E2E8F0',
    text: '#0F172A',
    textSecondary: '#475569',
    textMuted: '#94A3B8',
    primary: '#2563EB', // Xanh dương tươi sáng hiện đại
    primaryLight: '#EFF6FF', // Nền xanh nhạt thanh lịch
    primaryBorder: '#BFDBFE', // Viền xanh pastel
    inputBg: '#F1F5F9',
    inputBorder: '#E2E8F0',
    border: '#E2E8F0',
    divider: '#F1F5F9',
    unreadBg: '#F0F7FF',
    headerBg: '#FFFFFF',
    tabBarBg: '#FFFFFF',
    tabBarBorder: '#E2E8F0',
    badgeBg: '#2563EB',
    badgeText: '#FFFFFF',
    dangerBg: '#FEF2F2',
    dangerBorder: '#FEE2E2',
    dangerText: '#EF4444',
    statusBarStyle: 'dark-content',
  },
};

export const darkTheme: Theme = {
  isDark: true,
  colors: {
    background: '#0B1120',
    card: '#1E293B',
    cardBorder: '#334155',
    text: '#F8FAFC',
    textSecondary: '#CBD5E1',
    textMuted: '#94A3B8',
    primary: '#3B82F6', // Xanh dương nổi bật trên nền tối
    primaryLight: '#1E3A8A', // Xanh navy đậm
    primaryBorder: '#2563EB',
    inputBg: '#131D31',
    inputBorder: '#334155',
    border: '#334155',
    divider: '#1E293B',
    unreadBg: '#0F244A',
    headerBg: '#0B1120',
    tabBarBg: '#0F172A',
    tabBarBorder: '#1E293B',
    badgeBg: '#3B82F6',
    badgeText: '#FFFFFF',
    dangerBg: '#450A0A',
    dangerBorder: '#7F1D1D',
    dangerText: '#FCA5A5',
    statusBarStyle: 'light-content',
  },
};
