// Real Madrid Royal Theme 👑


export const colors = {
  // Backgrounds - Deep navy/midnight
  background: '#0a0e1f',
  backgroundAlt: '#0f1428',
  backgroundDeep: '#050810',

  // Royal accents
  gold: '#d4af37',
  goldLight: '#f0d77c',
  goldDark: '#9a7b1f',
  navy: '#1e3a5f',
  navyLight: '#2a4a73',
  royalBlue: '#0066b2',

  // Primary accent (Gold)
  accent: '#d4af37',
  accentAlt: '#f0d77c',
  accentGlow: 'rgba(212, 175, 55, 0.4)',

  // Glass effects - gold tinted
  card: 'rgba(212, 175, 55, 0.06)',
  cardStrong: 'rgba(212, 175, 55, 0.12)',
  cardHover: 'rgba(212, 175, 55, 0.15)',
  border: 'rgba(212, 175, 55, 0.18)',
  borderGlow: 'rgba(212, 175, 55, 0.35)',

  // Text
  text: '#ffffff',
  textSecondary: '#e8e8e8',
  muted: '#8ba3c7',

  // Status colors
  success: '#4ade80',
  warning: '#fbbf24',
  danger: '#ef4444',

  // Recording state - royal red
  recording: '#dc2626',
  recordingGlow: 'rgba(220, 38, 38, 0.4)',
};

export const gradients = {
  // Royal gradient backgrounds
  screen: ['#050810', '#0a0e1f', '#0f1428'],
  screenRoyal: ['#050810', '#0a1428', '#1e3a5f'],

  // Gold gradients
  accent: ['#d4af37', '#f0d77c'],
  gold: ['#9a7b1f', '#d4af37', '#f0d77c'],
  goldShine: ['#d4af37', '#f0d77c', '#d4af37'],

  // Royal navy gradients
  navy: ['#0f1428', '#1e3a5f'],
  royal: ['#1e3a5f', '#0066b2'],

  // Aurora royal - gold and navy blend
  aurora: ['#0a0e1f', '#1e3a5f', '#0a0e1f'],
  auroraGold: ['rgba(212, 175, 55, 0.1)', 'rgba(30, 58, 95, 0.3)', 'rgba(212, 175, 55, 0.1)'],
} as const;

export const glass = {
  backgroundColor: 'rgba(212, 175, 55, 0.05)',
  backgroundColorStrong: 'rgba(212, 175, 55, 0.10)',
  borderColor: 'rgba(212, 175, 55, 0.18)',
  borderColorActive: 'rgba(212, 175, 55, 0.35)',
  shadowColor: '#d4af37',
  blurIntensity: 60,
};

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 22,
  xl: 28,
  xxl: 40,
};

export const radius = {
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32,
  full: 999,
};

// Animation timing
export const animations = {
  fast: 150,
  normal: 300,
  slow: 500,
  enter: 400,
  spring: {
    damping: 15,
    stiffness: 150,
    mass: 1,
  },
  springBouncy: {
    damping: 12,
    stiffness: 180,
    mass: 0.8,
  },
};

// Shadows with royal gold glow
export const shadows = {
  sm: {
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  md: {
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 5,
  },
  lg: {
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 8,
  },
  glow: {
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
};
