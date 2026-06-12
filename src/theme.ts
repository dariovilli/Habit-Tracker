import { Platform } from 'react-native';

export const COLORS = {
  primary: '#7a4add',       // 600
  primaryLight: '#eeebfc',  // 100
  primaryDark: '#592ea9',   // 800
  primaryMid: '#6b38c9',    // 700

  background: '#f5f4fe',    // 50
  surface: '#ffffff',

  text: '#2d175e',          // 950
  textSecondary: '#6b38c9', // 700
  textMuted: '#a895f0',     // 400

  border: '#dedafa',        // 200

  success: '#7a4add',       // 600
  danger: '#c5bbf7',        // 300
  successMuted: '#6b38c9',  // 700 — monthly grid "done"
  dangerMuted: '#c5bbf7',   // 300 — monthly grid "missed"
};

export const FONTS = {
  serif: Platform.select({
    ios: 'Georgia',
    android: 'serif',
    default: 'Georgia, serif',
  }) as string,
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const RADIUS = {
  sm: 4,
  md: 6,
  lg: 8,
  xl: 12,
  full: 999,
};
