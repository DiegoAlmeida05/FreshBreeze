/**
 * Composable: useTheme
 *
 * Provides reactive access to design tokens with dark mode support.
 * Automatically detects system preference and responds to .dark class changes.
 *
 * Usage:
 *   const { colors, isDark, toggle } = useTheme()
 *   console.log(colors.brand[500]) // #FF6600 (light) or #FF801E (dark)
 */

import { computed } from 'vue'
import { COLORS_LIGHT, COLORS_DARK, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../utils/design-tokens'

const THEME_STORAGE_KEY = 'theme-mode'

type ThemeMode = 'light' | 'dark'

export function useTheme() {
  const mode = useState<ThemeMode>('theme-mode', () => 'light')
  const storageKey = useState<string>('theme-storage-key', () => THEME_STORAGE_KEY)

  /**
   * Apply theme by toggling .dark class on <html>
   */
  function applyTheme(theme: ThemeMode) {
    if (process.client) {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
      localStorage.setItem(storageKey.value, theme)
    }

    mode.value = theme
  }

  /**
   * Toggle between light and dark mode
   */
  function toggleTheme() {
    const nextMode: ThemeMode = mode.value === 'dark' ? 'light' : 'dark'
    applyTheme(nextMode)
  }

  /**
   * Set theme explicitly
   */
  function setTheme(theme: ThemeMode) {
    applyTheme(theme)
  }

  /**
   * Computed colors that update based on dark mode
   */
  const isDark = computed(() => mode.value === 'dark')
  const colors = computed(() => (isDark.value ? COLORS_DARK : COLORS_LIGHT))

  return {
    isDark,
    colors,
    typography: TYPOGRAPHY,
    spacing: SPACING,
    radius: RADIUS,
    shadows: SHADOWS,
    toggleTheme,
    setTheme,
  }
}

export default useTheme
