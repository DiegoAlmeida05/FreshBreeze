<template>
  <NuxtLayout name="worker-layout" @signout="onSignOut">
    <ScheduleBoard mode="worker" />
  </NuxtLayout>
</template>

<script setup lang="ts">
import { nextTick, onMounted } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import { useAuth } from '../../composables/useAuth'
import ScheduleBoard from '../../components/features/schedule/ScheduleBoard.vue'

interface PersistedWorkerSchedulePageState {
  scrollY: number
}

const { signOut } = useAuth()

const persistedWorkerSchedulePageState = useState<PersistedWorkerSchedulePageState>('worker-schedule-page-state', () => ({
  scrollY: 0,
}))

onMounted(async () => {
  if (import.meta.client) {
    await nextTick()
    requestAnimationFrame(() => {
      window.scrollTo({
        top: persistedWorkerSchedulePageState.value.scrollY,
        behavior: 'auto',
      })
    })
  }
})

onBeforeRouteLeave(() => {
  if (!import.meta.client) {
    return
  }

  persistedWorkerSchedulePageState.value.scrollY = window.scrollY
})

async function onSignOut(): Promise<void> {
  await signOut()
  await navigateTo('/login')
}
</script>
