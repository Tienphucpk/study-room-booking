export const colors = {
  // Brand Accents - Electric Violet & Neon Mint / Cyan
  primary: '#7C3AED',
  primaryDark: '#6D28D9',
  primaryLight: '#8B5CF6',
  primarySoft: 'rgba(124, 58, 237, 0.18)',
  primaryGlow: 'rgba(124, 58, 237, 0.45)',

  accent: '#06B6D4',
  accentSoft: 'rgba(6, 182, 212, 0.18)',

  success: '#10B981',
  successSoft: 'rgba(16, 185, 129, 0.18)',

  danger: '#F43F5E',
  dangerSoft: 'rgba(244, 63, 94, 0.18)',

  warning: '#F59E0B',
  warningSoft: 'rgba(245, 158, 11, 0.18)',

  // Deep Obsidian Dark Mode Surfaces
  background: '#090D16',
  backgroundSecondary: '#0F172A',
  surface: '#131B2E',
  surfaceSubtle: '#1A243B',
  surfaceHighlight: '#23304E',

  // Text Hierarchy
  textPrimary: '#F8FAFC',
  textSecondary: '#CBD5E1',
  textMuted: '#64748B',

  // Borders & Dividers
  border: '#1E293B',
  borderSubtle: '#26334D',
  borderActive: '#7C3AED',

  // Neutral Utilities
  neutral: '#64748B',
  neutralSoft: '#1A243B',
  disabled: '#334155',
  white: '#FFFFFF',
  overlay: 'rgba(3, 7, 18, 0.78)',
  shadow: '#000000',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const typography = {
  titleLarge: { fontSize: 28, fontWeight: '800' as const, letterSpacing: -0.6 },
  heading: { fontSize: 20, fontWeight: '700' as const, letterSpacing: -0.3 },
  subheading: { fontSize: 16, fontWeight: '600' as const },
  body: { fontSize: 14, fontWeight: '400' as const },
  caption: { fontSize: 12, fontWeight: '500' as const },
} as const;

export const radius = {
  xs: 6,
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
} as const;
