<template>
  <div class="fixed inset-0 flex min-h-0 w-full min-w-0 overflow-hidden bg-gradient-to-br from-surface-soft via-primary-50/30 to-primary-warm-50/30 dark:bg-black dark:bg-none">
    <!-- Sidebar overlay (mobile) -->
    <div
      v-if="sidebarOpen && !isDesktop"
      class="fixed inset-0 z-20 bg-foreground/40 backdrop-blur-sm lg:hidden"
      @click="sidebarOpen = false"
    />

    <!-- Sidebar -->
    <aside
      v-if="isDesktop || sidebarOpen"
      id="worker-sidebar"
      :class="[
        'fixed inset-y-0 left-0 z-30 flex w-64 flex-col bg-gradient-to-b from-white via-primary-50/55 to-primary-warm-50/45 shadow-[0_18px_40px_rgba(15,23,42,0.08),10px_0_30px_rgba(148,163,184,0.08)] backdrop-blur-sm transition-all duration-300 ease-in-out dark:bg-gradient-to-b dark:from-black dark:via-neutral-950 dark:to-neutral-900 dark:shadow-[0_24px_60px_rgba(0,0,0,0.55),14px_0_36px_rgba(255,255,255,0.03)]',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        isDesktopCollapsed ? 'lg:m-3 lg:mr-0 lg:h-[calc(100vh-1.5rem)] lg:w-[5.5rem] lg:translate-x-0 lg:rounded-[28px]' : 'lg:m-3 lg:mr-0 lg:h-[calc(100vh-1.5rem)] lg:w-72 lg:translate-x-0 lg:rounded-[32px]',
        'lg:static',
      ]"
    >
      <div class="pointer-events-none absolute -left-14 top-16 h-36 w-36 rounded-full bg-primary-400/20 blur-3xl" />
      <div class="pointer-events-none absolute -right-12 bottom-20 h-40 w-40 rounded-full bg-primary-warm-500/20 blur-3xl" />
      <div class="pointer-events-none absolute inset-y-5 right-0 w-10 bg-gradient-to-r from-transparent via-white/50 to-primary-200/35 opacity-80 blur-xl dark:via-white/5 dark:to-white/10" />
      <div class="pointer-events-none absolute inset-y-0 left-0 w-px bg-white/70 dark:bg-white/5" />
      <button
        type="button"
        class="absolute -right-7 top-[5.5rem] -z-10 hidden h-12 w-7 -translate-y-1/2 items-center justify-center rounded-r-full border border-l-0 border-primary-200/70 bg-white/90 pl-1 text-muted shadow-lg shadow-primary-900/10 backdrop-blur transition hover:text-foreground dark:border-white/10 dark:bg-black/85 dark:text-slate-300 dark:hover:text-white lg:flex"
        :aria-pressed="isDesktopCollapsed"
        :aria-label="isDesktopCollapsed ? 'Expand sidebar' : 'Collapse sidebar'"
        @click="sidebarCollapsed = !sidebarCollapsed"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 shrink-0 transition-transform duration-300" :class="isDesktopCollapsed ? 'rotate-180' : ''" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="m15 18-6-6 6-6" />
        </svg>
      </button>

      <!-- Sidebar header -->
      <div class="relative flex shrink-0 items-center justify-center px-2 py-0 min-h-40">
        <div class="pointer-events-none absolute inset-x-6 bottom-0 h-px bg-gradient-to-r from-transparent via-primary-200/70 to-transparent dark:via-white/10" />
        <NuxtLink to="/worker/schedule" class="relative z-10 flex items-center justify-center" aria-label="Go to dashboard">
          <img
            v-if="!isDesktopCollapsed"
            src="/logo/logo_escrito_transparente.png"
            alt="FreshBreeze"
            class="h-40 w-auto max-w-full object-contain"
          />
          <div
            v-else
            class="flex h-24 w-24 items-center justify-center overflow-hidden"
          >
            <img
              src="/logo/fb.png"
              alt="FreshBreeze FB"
              class="h-full w-full scale-125 object-contain"
            />
          </div>
        </NuxtLink>
      </div>

      <!-- Nav -->
      <nav class="relative flex flex-1 flex-col gap-1 overflow-y-auto p-3" :class="isDesktopCollapsed ? 'px-2' : ''">
        <p class="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary-600" :class="isDesktopCollapsed ? 'justify-center px-0' : 'px-3'">
          <span class="h-1.5 w-1.5 rounded-full bg-primary-500" />
          <span v-if="!isDesktopCollapsed">Menu</span>
        </p>

        <slot name="sidebar-nav">
          <NuxtLink
            to="/worker/schedule"
            :title="isDesktopCollapsed ? 'Schedule' : undefined"
            class="flex items-center gap-3 rounded-xl border border-transparent px-3 py-2 text-sm font-medium transition"
            active-class="border-primary-300/60 bg-gradient-to-r from-primary-500/15 to-primary-warm-500/10 text-primary-700 shadow-sm shadow-primary-500/10"
            exact-active-class="border-primary-300/60 bg-gradient-to-r from-primary-500/15 to-primary-warm-500/10 text-primary-700 shadow-sm shadow-primary-500/10"
            :class="[
              isDesktopCollapsed ? 'justify-center px-0' : '',
              route.path === '/worker/schedule' ? '' : 'text-muted hover:border-primary-200/70 hover:bg-primary-500/10 hover:text-foreground',
            ]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span v-if="!isDesktopCollapsed">Schedule</span>
          </NuxtLink>

          <NuxtLink
            to="/worker/timesheet"
            :title="isDesktopCollapsed ? 'Timesheet' : undefined"
            class="flex items-center gap-3 rounded-xl border border-transparent px-3 py-2 text-sm font-medium transition"
            active-class="border-primary-300/60 bg-gradient-to-r from-primary-500/15 to-primary-warm-500/10 text-primary-700 shadow-sm shadow-primary-500/10"
            :class="[
              isDesktopCollapsed ? 'justify-center px-0' : '',
              route.path === '/worker/timesheet' ? '' : 'text-muted hover:border-primary-200/70 hover:bg-primary-500/10 hover:text-foreground',
            ]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 3v18h18" />
              <path d="M7 14l3-3 3 2 4-5" />
            </svg>
            <span v-if="!isDesktopCollapsed">Timesheet</span>
          </NuxtLink>

          <NuxtLink
            to="/worker/invoice"
            :title="isDesktopCollapsed ? 'Invoice' : undefined"
            class="flex items-center gap-3 rounded-xl border border-transparent px-3 py-2 text-sm font-medium transition"
            active-class="border-primary-300/60 bg-gradient-to-r from-primary-500/15 to-primary-warm-500/10 text-primary-700 shadow-sm shadow-primary-500/10"
            :class="[
              isDesktopCollapsed ? 'justify-center px-0' : '',
              route.path === '/worker/invoice' ? '' : 'text-muted hover:border-primary-200/70 hover:bg-primary-500/10 hover:text-foreground',
            ]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M7 8h10" />
              <path d="M7 12h10" />
              <path d="M7 16h7" />
            </svg>
            <span v-if="!isDesktopCollapsed">Invoice</span>
          </NuxtLink>
        </slot>
      </nav>

      <div class="relative shrink-0 p-4">
        <div class="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-primary-200/70 to-transparent dark:via-white/10" />
        <NuxtLink
          to="/worker/settings"
          :title="isDesktopCollapsed ? 'Settings' : undefined"
          class="block w-full rounded-2xl border px-3 py-3 transition"
          active-class="border-primary-300/60 bg-gradient-to-r from-primary-500/15 to-primary-warm-500/10 text-primary-700 shadow-sm shadow-primary-500/10 dark:border-white/15 dark:bg-white/5 dark:text-white"
          :class="[
            isDesktopCollapsed ? 'px-2 py-3' : '',
            route.path === '/worker/settings'
              ? 'border-primary-300/60 bg-gradient-to-r from-primary-500/15 to-primary-warm-500/10 text-primary-700 shadow-sm shadow-primary-500/10 dark:border-white/15 dark:bg-white/5 dark:text-white'
              : 'border-primary-200/70 bg-white/60 text-muted hover:border-primary-200/70 hover:bg-primary-500/10 hover:text-foreground dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white',
          ]"
        >
          <div class="flex items-center gap-3" :class="isDesktopCollapsed ? 'justify-center' : ''">
            <img
              v-if="avatarUrl"
              :src="avatarUrl"
              alt="User avatar"
              class="h-11 w-11 rounded-full object-cover ring-1 ring-primary-200 dark:ring-white/10"
            />
            <div
              v-else
              class="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-primary-300 to-primary-500 text-sm font-semibold text-white dark:from-neutral-800 dark:to-neutral-700"
            >
              {{ avatarInitial }}
            </div>

            <div v-if="!isDesktopCollapsed" class="min-w-0 flex-1">
              <p class="truncate text-sm font-semibold text-foreground dark:text-white">{{ fullName || 'Your account' }}</p>
              <p class="truncate text-xs text-muted dark:text-slate-400">{{ profileEmail || 'Open your settings' }}</p>
            </div>
          </div>

          <div class="mt-3 flex items-center border-t border-primary-100/80 pt-3 dark:border-white/10" :class="isDesktopCollapsed ? 'justify-center' : 'justify-between'">
            <span v-if="!isDesktopCollapsed" class="text-xs font-semibold uppercase tracking-[0.18em] text-muted dark:text-slate-400">Settings</span>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.09a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.09a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </div>
        </NuxtLink>
      </div>
    </aside>

    <!-- Main area -->
    <div class="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden lg:mb-3 lg:mr-3 lg:mt-3">
      <!-- Topbar -->
      <header class="shrink-0 px-4 pt-4 sm:px-6 lg:px-6">
        <div class="relative flex h-16 items-center rounded-[30px] border border-white/65 bg-white/72 px-4 shadow-[0_18px_40px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:px-5 lg:px-6 dark:border-white/10 dark:bg-white/[0.03] dark:shadow-[0_24px_60px_rgba(0,0,0,0.38)]">
          <!-- Page title / greeting -->
          <div class="flex min-w-0 flex-1 items-center gap-2 text-left lg:ml-0">
            <div class="min-w-0">
              <p class="text-xs font-medium uppercase tracking-[0.2em] text-muted">Welcome</p>
              <h1 class="truncate text-base font-semibold text-foreground">{{ fullName || greetingName }}! 😎 🚀</h1>
            </div>
          </div>

          <!-- Topbar actions slot -->
          <div class="ml-2 flex shrink-0 items-center gap-2">
            <slot name="topbar-actions" />
          </div>

          <p v-if="appUpdatedLabel" class="pointer-events-none absolute bottom-0.5 right-4 text-[9px] font-medium tracking-tight text-muted/70 sm:right-5 lg:right-6">
            Updated {{ appUpdatedLabel }}
          </p>
        </div>
      </header>

      <!-- Page content -->
      <main
        ref="mainScrollContainer"
        class="relative min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto px-4 pb-40 pt-4 sm:px-6 sm:pb-24 sm:pt-4 lg:px-6 lg:pb-8 lg:pt-4"
      >
        <div class="pointer-events-none absolute -left-16 top-8 h-56 w-56 rounded-full bg-primary-500/10 blur-3xl dark:bg-white/5" />
        <div class="pointer-events-none absolute -right-20 bottom-12 h-64 w-64 rounded-full bg-primary-warm-500/10 blur-3xl dark:bg-white/5" />

        <div class="relative z-10 w-full min-w-0 max-w-full rounded-[30px] border border-white/65 bg-white/72 p-4 shadow-[0_18px_40px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-5 lg:p-6 dark:border-white/10 dark:bg-white/[0.03] dark:shadow-[0_24px_60px_rgba(0,0,0,0.38)]">
          <slot />
        </div>
      </main>

      <!-- Bottom Navigation (mobile only) -->
      <nav
        class="fixed left-0 right-0 z-40 px-4 lg:hidden"
        style="bottom: calc(env(safe-area-inset-bottom, 0px) + 1rem);"
        aria-label="Main navigation"
      >
        <div
          class="mx-auto w-full max-w-md rounded-[26px] border border-white/70 bg-white/85 p-2 shadow-[0_24px_50px_rgba(15,23,42,0.26)] backdrop-blur-xl dark:border-white/10 dark:bg-neutral-950/90"
        >
          <div class="relative grid grid-cols-4 gap-1">
            <div
              class="pointer-events-none absolute inset-y-0 left-0 w-1/4 p-0.5 transition-transform duration-300 ease-out"
              :style="{ transform: `translateX(${activeNavIndex * 100}%)` }"
              aria-hidden="true"
            >
              <div class="h-full rounded-2xl bg-primary-500/15 shadow-[inset_0_0_0_1px_rgba(0,119,230,0.22)] dark:bg-primary-500/20 dark:shadow-[inset_0_0_0_1px_rgba(96,165,250,0.35)]" />
            </div>

            <!-- Schedule -->
            <NuxtLink
              to="/worker/schedule"
              prefetch
              class="relative z-10 flex touch-manipulation flex-col items-center justify-center gap-1 rounded-2xl px-2 py-3 text-center transition-transform duration-75 active:scale-95"
              :class="isNavActive('/worker/schedule') ? 'text-primary-700 dark:text-primary-300' : 'text-muted hover:bg-primary-500/10 hover:text-foreground'"
              aria-label="Schedule"
              @pointerdown="onNavPress('/worker/schedule')"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span class="text-[10px] font-semibold leading-none">Schedule</span>
            </NuxtLink>

            <!-- Timesheet -->
            <NuxtLink
              to="/worker/timesheet"
              prefetch
              class="relative z-10 flex touch-manipulation flex-col items-center justify-center gap-1 rounded-2xl px-2 py-3 text-center transition-transform duration-75 active:scale-95"
              :class="isNavActive('/worker/timesheet') ? 'text-primary-700 dark:text-primary-300' : 'text-muted hover:bg-primary-500/10 hover:text-foreground'"
              aria-label="Timesheet"
              @pointerdown="onNavPress('/worker/timesheet')"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M3 3v18h18" />
                <path d="M7 14l3-3 3 2 4-5" />
              </svg>
              <span class="text-[10px] font-semibold leading-none">Timesheet</span>
            </NuxtLink>

            <!-- Invoice -->
            <NuxtLink
              to="/worker/invoice"
              prefetch
              class="relative z-10 flex touch-manipulation flex-col items-center justify-center gap-1 rounded-2xl px-2 py-3 text-center transition-transform duration-75 active:scale-95"
              :class="isNavActive('/worker/invoice') ? 'text-primary-700 dark:text-primary-300' : 'text-muted hover:bg-primary-500/10 hover:text-foreground'"
              aria-label="Invoice"
              @pointerdown="onNavPress('/worker/invoice')"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M7 8h10" />
                <path d="M7 12h10" />
                <path d="M7 16h7" />
              </svg>
              <span class="text-[10px] font-semibold leading-none">Invoice</span>
            </NuxtLink>

            <!-- Settings -->
            <NuxtLink
              to="/worker/settings"
              prefetch
              class="relative z-10 flex touch-manipulation flex-col items-center justify-center gap-1 rounded-2xl px-2 py-3 text-center transition-transform duration-75 active:scale-95"
              :class="isNavActive('/worker/settings') ? 'text-primary-700 dark:text-primary-300' : 'text-muted hover:bg-primary-500/10 hover:text-foreground'"
              aria-label="Settings"
              @pointerdown="onNavPress('/worker/settings')"
            >
              <div class="relative h-5 w-5 shrink-0">
                <img
                  v-if="avatarUrl"
                  :src="avatarUrl"
                  alt=""
                  class="h-5 w-5 rounded-full object-cover"
                  :class="route.path === '/worker/settings' ? 'ring-2 ring-primary-500' : ''"
                />
                <div
                  v-else
                  class="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-primary-300 to-primary-500 text-[9px] font-bold text-white"
                  :class="route.path === '/worker/settings' ? 'ring-2 ring-primary-500' : ''"
                >
                  {{ avatarInitial }}
                </div>
              </div>
              <span class="text-[10px] font-semibold leading-none">Settings</span>
            </NuxtLink>

          </div>
        </div>
      </nav>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useAuth } from '../composables/useAuth'
import { useSupabaseClient } from '../composables/useSupabaseClient'

const emit = defineEmits<{
  signout: []
}>()

const runtimeConfig = useRuntimeConfig()
const route = useRoute()
const MOBILE_NAV_PATHS = ['/worker/schedule', '/worker/timesheet', '/worker/invoice', '/worker/settings'] as const
const shellLayoutMode = useState<'mobile' | 'desktop'>('app-shell-layout-mode', () => 'mobile')
const sidebarCollapsed = useState('worker-sidebar-collapsed', () => false)
const sidebarOpen = ref(false)
const isDesktop = ref(shellLayoutMode.value === 'desktop')
const mainScrollContainer = ref<HTMLElement | null>(null)
const pressedNavPath = ref<string | null>(null)
const greetingName = ref('there')
const fullName = ref('')
const profileEmail = ref('')
const avatarUrl = ref('')
const { getProfile } = useAuth()
const supabase = useSupabaseClient()
let desktopMediaQuery: MediaQueryList | null = null
let rafId = 0
let viewportResetTimeoutId: number | null = null
let restoreDocumentStyles: (() => void) | null = null

const avatarInitial = computed(() => {
  const name = fullName.value || greetingName.value || 'U'
  return name.charAt(0).toUpperCase()
})

const appUpdatedLabel = computed(() => {
  const rawValue = runtimeConfig.public.appUpdatedAt as string | undefined

  if (!rawValue) {
    return ''
  }

  const parsedDate = new Date(rawValue)

  if (Number.isNaN(parsedDate.getTime())) {
    return ''
  }

  return parsedDate.toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
})

const isDesktopCollapsed = computed(() => isDesktop.value && sidebarCollapsed.value)

const activeNavIndex = computed(() => {
  const currentPath = pressedNavPath.value ?? route.path

  const index = MOBILE_NAV_PATHS.findIndex((basePath) => {
    return currentPath === basePath || currentPath.startsWith(`${basePath}/`)
  })

  return index >= 0 ? index : 0
})

const isNavActive = (path: string) => {
  const idx = MOBILE_NAV_PATHS.indexOf(path as typeof MOBILE_NAV_PATHS[number])
  return idx === activeNavIndex.value
}

const onNavPress = (path: string) => {
  pressedNavPath.value = path
}

const syncDesktopState = (event?: MediaQueryList | MediaQueryListEvent) => {
  isDesktop.value = Boolean(event?.matches)
  shellLayoutMode.value = isDesktop.value ? 'desktop' : 'mobile'

  if (isDesktop.value) {
    sidebarOpen.value = false
  }
}

const resetLayoutViewportState = () => {
  if (typeof window === 'undefined') return

  // Mobile PWA/iOS can restore stale horizontal offset after reopening.
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  document.scrollingElement?.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  document.documentElement.scrollLeft = 0
  document.body.scrollLeft = 0

  if (mainScrollContainer.value) {
    mainScrollContainer.value.scrollLeft = 0
  }

  if (desktopMediaQuery) {
    syncDesktopState(desktopMediaQuery)
  }
}

const handlePageShow = () => {
  if (rafId) {
    cancelAnimationFrame(rafId)
  }

  rafId = window.requestAnimationFrame(() => {
    resetLayoutViewportState()
  })
}

const handleVisibilityChange = () => {
  if (document.visibilityState === 'visible') {
    handlePageShow()
  }
}

const lockDocumentHorizontalScroll = () => {
  const html = document.documentElement
  const body = document.body

  const prevHtmlOverflowX = html.style.overflowX
  const prevHtmlWidth = html.style.width
  const prevHtmlMaxWidth = html.style.maxWidth
  const prevBodyOverflowX = body.style.overflowX
  const prevBodyWidth = body.style.width
  const prevBodyMaxWidth = body.style.maxWidth

  html.style.overflowX = 'hidden'
  html.style.width = '100%'
  html.style.maxWidth = '100%'
  body.style.overflowX = 'hidden'
  body.style.width = '100%'
  body.style.maxWidth = '100%'

  return () => {
    html.style.overflowX = prevHtmlOverflowX
    html.style.width = prevHtmlWidth
    html.style.maxWidth = prevHtmlMaxWidth
    body.style.overflowX = prevBodyOverflowX
    body.style.width = prevBodyWidth
    body.style.maxWidth = prevBodyMaxWidth
  }
}

const handleViewportGeometryChange = () => {
  handlePageShow()

  if (viewportResetTimeoutId) {
    window.clearTimeout(viewportResetTimeoutId)
  }

  viewportResetTimeoutId = window.setTimeout(() => {
    resetLayoutViewportState()
  }, 120)
}

watch(() => route.fullPath, () => {
  pressedNavPath.value = null

  if (!isDesktop.value) {
    sidebarOpen.value = false
  }
})

onMounted(async () => {
  restoreDocumentStyles = lockDocumentHorizontalScroll()

  desktopMediaQuery = window.matchMedia('(min-width: 1024px)')
  syncDesktopState(desktopMediaQuery)
  desktopMediaQuery.addEventListener('change', syncDesktopState)
  window.addEventListener('pageshow', handlePageShow)
  window.addEventListener('resize', handleViewportGeometryChange, { passive: true })
  window.addEventListener('orientationchange', handleViewportGeometryChange)
  document.addEventListener('visibilitychange', handleVisibilityChange)
  handlePageShow()

  try {
    const profile = await getProfile()
    fullName.value = profile.full_name.trim()
    profileEmail.value = profile.email

    const firstName = profile.full_name.trim().split(' ')[0]
    greetingName.value = firstName || 'there'

    const { data: employee } = await supabase
      .from('employees')
      .select('photo_url')
      .eq('profile_id', profile.id)
      .maybeSingle<{ photo_url: string | null }>()

    avatarUrl.value = employee?.photo_url || ''
  } catch {
    greetingName.value = 'there'
  }
})

onBeforeUnmount(() => {
  if (rafId) {
    cancelAnimationFrame(rafId)
  }

  if (viewportResetTimeoutId) {
    window.clearTimeout(viewportResetTimeoutId)
  }

  desktopMediaQuery?.removeEventListener('change', syncDesktopState)
  window.removeEventListener('pageshow', handlePageShow)
  window.removeEventListener('resize', handleViewportGeometryChange)
  window.removeEventListener('orientationchange', handleViewportGeometryChange)
  document.removeEventListener('visibilitychange', handleVisibilityChange)
  restoreDocumentStyles?.()
})
</script>
