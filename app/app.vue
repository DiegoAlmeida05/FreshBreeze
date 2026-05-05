<template>
  <div class="min-h-screen w-full max-w-full overflow-x-hidden">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="showBootSplash"
        class="fixed inset-0 z-[120] flex items-center justify-center bg-gradient-to-br from-surface-soft via-primary-50/60 to-primary-warm-50/50 px-6 dark:from-black dark:via-neutral-950 dark:to-neutral-900"
      >
        <div class="flex flex-col items-center text-center">
          <img
            src="/logo/logo_escrito_transparente.png"
            alt="FreshBreeze"
            class="h-16 w-auto sm:h-20"
          >
          <p class="mt-4 text-sm font-semibold tracking-wide text-foreground/90 dark:text-white/90">Loading your workspace...</p>
        </div>
      </div>
    </Transition>

    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { useState } from '#imports'
import { useAuthBootstrap } from './composables/useAuthBootstrap'

const { isAuthBootstrapping } = useAuthBootstrap()
const hasBootstrapFinished = useState<boolean>('app-bootstrap-finished-once', () => false)

watch(
  () => isAuthBootstrapping.value,
  (loading) => {
    if (!loading) {
      hasBootstrapFinished.value = true
    }
  },
  { immediate: true },
)

const showBootSplash = computed(() => isAuthBootstrapping.value && !hasBootstrapFinished.value)
</script>
