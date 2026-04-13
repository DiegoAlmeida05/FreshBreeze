<template>
  <NuxtLayout name="worker-layout" @signout="onSignOut">
    <ScheduleBoard mode="worker" />
  </NuxtLayout>
</template>

<script setup lang="ts">
import { useAuth } from '../../composables/useAuth'
import ScheduleBoard from '../../components/features/schedule/ScheduleBoard.vue'

const { signOut } = useAuth()

async function onSignOut(): Promise<void> {
  await signOut()
  await navigateTo('/login')
}
</script>
