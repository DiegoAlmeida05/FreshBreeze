const THEME_STORAGE_KEY = 'theme-mode'

type ThemeMode = 'light' | 'dark'

function getUserThemeStorageKey(userId: string): string {
  return `${THEME_STORAGE_KEY}:user:${userId}`
}

function applyThemeClass(theme: ThemeMode): void {
  if (theme === 'dark') {
    document.documentElement.classList.add('dark')
    return
  }

  document.documentElement.classList.remove('dark')
}

export default defineNuxtPlugin(() => {
  const { $supabase } = useNuxtApp()
  const mode = useState<ThemeMode>('theme-mode', () => 'light')
  const storageKey = useState<string>('theme-storage-key', () => THEME_STORAGE_KEY)

  const readTheme = (key: string): ThemeMode | null => {
    const savedMode = localStorage.getItem(key)

    if (savedMode !== 'dark' && savedMode !== 'light') {
      return null
    }

    return savedMode
  }

  const resolveThemeForKey = (key: string): ThemeMode => {
    const ownTheme = readTheme(key)

    if (ownTheme) {
      return ownTheme
    }

    const fallbackTheme = readTheme(THEME_STORAGE_KEY)

    if (fallbackTheme) {
      localStorage.setItem(key, fallbackTheme)
      return fallbackTheme
    }

    return 'light'
  }

  const persistGlobalThemeFromKey = (key: string): void => {
    const resolvedTheme = readTheme(key)

    if (!resolvedTheme) {
      return
    }

    localStorage.setItem(THEME_STORAGE_KEY, resolvedTheme)
  }

  const applyFromStorage = (key: string) => {
    storageKey.value = key
    const resolvedMode = resolveThemeForKey(key)
    mode.value = resolvedMode
    applyThemeClass(resolvedMode)
  }

  applyFromStorage(THEME_STORAGE_KEY)

  void $supabase.auth.getUser().then(({ data }) => {
    const userId = data.user?.id
    if (!userId) {
      return
    }

    applyFromStorage(getUserThemeStorageKey(userId))
  })

  $supabase.auth.onAuthStateChange((_event, session) => {
    const userId = session?.user?.id

    if (!userId) {
      persistGlobalThemeFromKey(storageKey.value)
      applyFromStorage(THEME_STORAGE_KEY)
      return
    }

    applyFromStorage(getUserThemeStorageKey(userId))
  })
})
