<template>
  <NuxtLayout name="admin-layout" @signout="onSignOut">
    <section class="space-y-6">
      <ScheduleBoard mode="admin" />
    </section>
  </NuxtLayout>
</template>

<script setup lang="ts">
import ScheduleBoard from '../../components/features/schedule/ScheduleBoard.vue'
import { useAuth } from '../../composables/useAuth'

definePageMeta({
  name: 'admin-schedule',
})

const { signOut } = useAuth()

async function onSignOut(): Promise<void> {
  await signOut()
  await navigateTo('/login')
}
</script>
