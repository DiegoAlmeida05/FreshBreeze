<template>
  <NuxtLayout name="worker-layout" @signout="onSignOut">
    <JobDetailContent :route-stop-id="routeStopId" mode="worker" />
  </NuxtLayout>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { navigateTo, useRoute, definePageMeta } from '#imports'
import JobDetailContent from '../../../components/features/schedule/JobDetailContent.vue'
import { useAuth } from '../../../composables/useAuth'

definePageMeta({
  name: 'worker-job-detail',
})

const route = useRoute()
const routeStopId = computed(() => String(route.params.routeStopId ?? ''))
const { signOut } = useAuth()

async function onSignOut(): Promise<void> {
  await signOut()
  await navigateTo('/login')
}
</script>
