<template>
  <div class="flex h-screen w-full min-w-0 overflow-hidden bg-gradient-to-br from-surface-soft via-primary-50/30 to-primary-warm-50/30 dark:bg-black dark:bg-none">
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
        <div class="flex h-16 items-center rounded-[30px] border border-white/65 bg-white/72 px-4 shadow-[0_18px_40px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:px-5 lg:px-6 dark:border-white/10 dark:bg-white/[0.03] dark:shadow-[0_24px_60px_rgba(0,0,0,0.38)]">
          <!-- Hamburger (mobile) -->
          <button
            id="worker-sidebar-toggle"
            type="button"
            class="inline-flex items-center justify-center rounded-lg p-2 text-muted transition hover:bg-surface-soft hover:text-foreground lg:hidden"
            :aria-expanded="sidebarOpen"
            aria-controls="worker-sidebar"
            @click="sidebarOpen = !sidebarOpen"
          >
            <span class="sr-only">Open menu</span>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="18" x2="20" y2="18" />
            </svg>
          </button>

          <!-- Page title / greeting -->
          <div class="ml-2 flex min-w-0 flex-1 items-center gap-2 text-left lg:ml-0">
            <div class="min-w-0">
              <p class="text-xs font-medium uppercase tracking-[0.2em] text-muted">Welcome</p>
              <h1 class="truncate text-base font-semibold text-foreground">{{ fullName || greetingName }}! 😎 🚀</h1>
            </div>
          </div>

          <!-- Topbar actions slot -->
          <div class="ml-2 flex shrink-0 items-center gap-2">
            <slot name="topbar-actions" />
          </div>
        </div>
      </header>

      <!-- Page content -->
      <main class="relative min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto px-4 pb-4 pt-4 sm:px-6 sm:pb-6 sm:pt-4 lg:px-6 lg:pb-8 lg:pt-4">
        <div class="pointer-events-none absolute -left-16 top-8 h-56 w-56 rounded-full bg-primary-500/10 blur-3xl dark:bg-white/5" />
        <div class="pointer-events-none absolute -right-20 bottom-12 h-64 w-64 rounded-full bg-primary-warm-500/10 blur-3xl dark:bg-white/5" />

        <div class="relative z-10 w-full min-w-0 max-w-full rounded-[30px] border border-white/65 bg-white/72 p-4 shadow-[0_18px_40px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-5 lg:p-6 dark:border-white/10 dark:bg-white/[0.03] dark:shadow-[0_24px_60px_rgba(0,0,0,0.38)]">
          <slot />
        </div>
      </main>
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

const route = useRoute()
const sidebarCollapsed = useState('worker-sidebar-collapsed', () => false)
const sidebarOpen = ref(false)
const isDesktop = ref(false)
const greetingName = ref('there')
const fullName = ref('')
const profileEmail = ref('')
const avatarUrl = ref('')
const { getProfile } = useAuth()
const supabase = useSupabaseClient()
let desktopMediaQuery: MediaQueryList | null = null

const avatarInitial = computed(() => {
  const name = fullName.value || greetingName.value || 'U'
  return name.charAt(0).toUpperCase()
})

const isDesktopCollapsed = computed(() => isDesktop.value && sidebarCollapsed.value)

const syncDesktopState = (event?: MediaQueryList | MediaQueryListEvent) => {
  isDesktop.value = Boolean(event?.matches)

  if (isDesktop.value) {
    sidebarOpen.value = false
  }
}

watch(() => route.fullPath, () => {
  if (!isDesktop.value) {
    sidebarOpen.value = false
  }
})

onMounted(async () => {
  desktopMediaQuery = window.matchMedia('(min-width: 1024px)')
  syncDesktopState(desktopMediaQuery)
  desktopMediaQuery.addEventListener('change', syncDesktopState)

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
  desktopMediaQuery?.removeEventListener('change', syncDesktopState)
})
</script>
