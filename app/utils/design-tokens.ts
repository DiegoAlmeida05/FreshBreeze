/**
 * Design Tokens System — FreshBreeze RouteOps
 *
 * Centralized color palette, typography and spacing extracted from brand logos.
 * Color extraction:
 *   • brand     → #FF6600 (Orange — "Fresh" text gradient)
 *   • secondary → #0077E6 (Blue — "Breeze" text gradient)
 *   • accent    → #E31837 (Crimson — swirl base)
 *
 * Values are defined for both light and dark modes.
 * Use these constants in composables, utils, and components for consistency.
 */

/* ============================================================
   COLOR TOKENS — Light Mode
   ============================================================ */

export const COLORS_LIGHT = {
  // Global defaults: primary blue + primary-warm orange
  primary: {
    50:  '#EEF6FF',
    100: '#D6EAFF',
    200: '#ADD5FF',
    300: '#7AB8FF',
    400: '#3D95FF',
    500: '#0077E6',
    600: '#005FBF',
    700: '#004499',
    800: '#003073',
    900: '#001B4D',
  },
  'primary-warm': {
    50:  '#FFF7ED',
    100: '#FFEDD5',
    200: '#FED7AA',
    300: '#FDBA74',
    400: '#FB9243',
    500: '#FF6600',
    600: '#E55A00',
    700: '#C24100',
    800: '#9A3400',
    900: '#78280C',
  },

  brand: {
    50:  '#FFF7ED',
    100: '#FFEDD5',
    200: '#FED7AA',
    300: '#FDBA74',
    400: '#FB9243',
    500: '#FF6600', // core brand
    600: '#E55A00',
    700: '#C24100',
    800: '#9A3400',
    900: '#78280C',
  },
  secondary: {
    50:  '#EEF6FF',
    100: '#D6EAFF',
    200: '#ADD5FF',
    300: '#7AB8FF',
    400: '#3D95FF',
    500: '#0077E6', // core secondary
    600: '#005FBF',
    700: '#004499',
    800: '#003073',
    900: '#001B4D',
  },
  accent: {
    50:  '#FFF1F2',
    100: '#FFE0E2',
    200: '#FFC2C8',
    300: '#FF9AA3',
    400: '#FF6070',
    500: '#E31837', // core accent
    600: '#BF102D',
    700: '#960A23',
    800: '#6E081A',
    900: '#480411',
  },

  // Semantic tokens
  surface:       '#FFFFFF',
  'surface-soft':'#F8F9FA',
  border:        '#E2E8F0',
  foreground:    '#0F172A',
  muted:         '#64748B',

  // Status
  success: '#16A34A',
  warning: '#D97706',
  danger:  '#DC2626',
} as const

/* ============================================================
   COLOR TOKENS — Dark Mode
   ============================================================ */

export const COLORS_DARK = {
  // Global defaults: primary blue + primary-warm orange
  primary: {
    50:  '#EEF6FF',
    100: '#D6EAFF',
    200: '#ADD5FF',
    300: '#7AB8FF',
    400: '#64AFFF',
    500: '#3894FF',
    600: '#005FBF',
    700: '#004499',
    800: '#003073',
    900: '#001B4D',
  },
  'primary-warm': {
    50:  '#FFF7ED',
    100: '#FFEDD5',
    200: '#FED7AA',
    300: '#FDBA74',
    400: '#FFA046',
    500: '#FF801E',
    600: '#E55A00',
    700: '#C24100',
    800: '#9A3400',
    900: '#78280C',
  },

  brand: {
    50:  '#FFF7ED',
    100: '#FFEDD5',
    200: '#FED7AA',
    300: '#FDBA74',
    400: '#FFA040', // brighter
    500: '#FF801E', // adjusted for dark bg
    600: '#E55A00',
    700: '#C24100',
    800: '#9A3400',
    900: '#78280C',
  },
  secondary: {
    50:  '#EEF6FF',
    100: '#D6EAFF',
    200: '#ADD5FF',
    300: '#7AB8FF',
    400: '#64AFFF', // brighter
    500: '#3894FF', // adjusted for dark bg
    600: '#005FBF',
    700: '#004499',
    800: '#003073',
    900: '#001B4D',
  },
  accent: {
    50:  '#FFF1F2',
    100: '#FFE0E2',
    200: '#FFC2C8',
    300: '#FF9AA3',
    400: '#FF6070',
    500: '#E31837',
    600: '#BF102D',
    700: '#960A23',
    800: '#6E081A',
    900: '#480411',
  },

  // Semantic tokens — dark mode
  surface:       '#0F172A',
  'surface-soft':'#1E293B',
  border:        '#334155',
  foreground:    '#F1F5F9',
  muted:         '#94A3B8',

  // Status (same for both modes)
  success: '#22C55E',
  warning: '#EAB308',
  danger:  '#EF4444',
} as const

/* ============================================================
   TYPOGRAPHY TOKENS
   ============================================================ */

export const TYPOGRAPHY = {
  fonts: {
    sans:    '"Inter", ui-sans-serif, system-ui, sans-serif',
    heading: '"Poppins", ui-sans-serif, system-ui, sans-serif',
  },

  sizes: {
    xs:  '0.75rem',     // 12px
    sm:  '0.875rem',    // 14px
    base:'1rem',        // 16px
    lg:  '1.125rem',    // 18px
    xl:  '1.25rem',     // 20px
    '2xl':'1.5rem',     // 24px
    '3xl':'1.875rem',   // 30px
    '4xl':'2.25rem',    // 36px
    '5xl':'3rem',       // 48px
  },

  weights: {
    light:   300,
    normal:  400,
    medium:  500,
    semibold:600,
    bold:    700,
    extrabold:800,
  },

  lineHeights: {
    tight:  1.2,
    normal: 1.5,
    relaxed:1.75,
    loose:  2,
  },
} as const

/* ============================================================
   SPACING TOKENS
   ============================================================ */

export const SPACING = {
  0:     '0',
  1:     '0.25rem',   // 4px
  2:     '0.5rem',    // 8px
  3:     '0.75rem',   // 12px
  4:     '1rem',      // 16px
  5:     '1.25rem',   // 20px
  6:     '1.5rem',    // 24px
  7:     '1.75rem',   // 28px
  8:     '2rem',      // 32px
  9:     '2.25rem',   // 36px
  10:    '2.5rem',    // 40px
  12:    '3rem',      // 48px
  14:    '3.5rem',    // 56px
  16:    '4rem',      // 64px
  20:    '5rem',      // 80px
  24:    '6rem',      // 96px
  32:    '8rem',      // 128px
} as const

/* ============================================================
   BORDER RADIUS TOKENS
   ============================================================ */

export const RADIUS = {
  xs:   '0.125rem',   // 2px
  sm:   '0.25rem',    // 4px
  md:   '0.375rem',   // 6px
  lg:   '0.5rem',     // 8px
  xl:   '0.75rem',    // 12px
  '2xl':'1rem',       // 16px
  '3xl':'1.5rem',     // 24px
  full: '9999px',
} as const

/* ============================================================
   SHADOW TOKENS
   ============================================================ */

export const SHADOWS = {
  none: 'none',
  soft: '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
  card: '0 4px 6px -1px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
  elevated: '0 10px 15px -3px rgb(0 0 0 / 0.10), 0 4px 6px -4px rgb(0 0 0 / 0.07)',
} as const

/* ============================================================
   BREAKPOINTS
   ============================================================ */

export const BREAKPOINTS = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const

/* ============================================================
   TRANSITIONS & ANIMATIONS
   ============================================================ */

export const TRANSITIONS = {
  fast:    '150ms ease-in-out',
  base:    '200ms ease-in-out',
  slow:    '300ms ease-in-out',
} as const

/* ============================================================
   HELPER FUNCTIONS
   ============================================================ */

/**
 * Get color token by mode (light or dark).
 * Usage: getColorToken('brand', '500', 'light')
 */
export function getColorToken(
  category: 'primary' | 'primary-warm' | 'brand' | 'secondary' | 'accent' | 'success' | 'warning' | 'danger' | 'surface' | 'surface-soft' | 'border' | 'foreground' | 'muted',
  shade?: string | number,
  mode: 'light' | 'dark' = 'light'
): string {
  const colorMap = mode === 'light' ? COLORS_LIGHT : COLORS_DARK

  if (shade !== undefined) {
    return (colorMap[category as keyof typeof colorMap] as Record<string, string>)[String(shade)] || '#000000'
  }

  return (colorMap[category as keyof typeof colorMap] as string) || '#000000'
}

/**
 * Generate a CSS color variable name for Tailwind usage.
 * Usage: getCssVarName('brand', '500') → 'var(--color-brand-500)'
 */
export function getCssVarName(category: string, shade?: string | number): string {
  if (shade !== undefined) {
    return `var(--color-${category}-${shade})`
  }
  return `var(--color-${category})`
}

/**
 * Get current theme colors based on context (dark mode detection).
 * Usage in composables: const colors = useThemeColors()
 */
export function useThemeColors(isDark: boolean = false) {
  return isDark ? COLORS_DARK : COLORS_LIGHT
}

export default {
  COLORS_LIGHT,
  COLORS_DARK,
  TYPOGRAPHY,
  SPACING,
  RADIUS,
  SHADOWS,
  BREAKPOINTS,
  TRANSITIONS,
}
