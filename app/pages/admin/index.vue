<template>
  <NuxtLayout name="admin-layout" @signout="onSignOut">
    <template #topbar-title>
      <h1 class="text-base font-semibold text-foreground">Dashboard</h1>
    </template>

    <div class="space-y-6">
      <div>
        <p class="text-xs font-semibold uppercase tracking-wide text-primary-600">Welcome</p>
        <h2 class="mt-1 text-2xl font-semibold text-foreground">Administrative Dashboard</h2>
      </div>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div class="card-surface border-primary-200 bg-gradient-to-br from-primary-50/70 to-surface">
          <p class="text-xs font-semibold uppercase tracking-wide text-muted">Total clients</p>
          <p class="mt-2 text-3xl font-bold text-primary-700">—</p>
        </div>
        <div class="card-surface border-primary-warm-200 bg-gradient-to-br from-primary-warm-50/70 to-surface">
          <p class="text-xs font-semibold uppercase tracking-wide text-muted">Appointments today</p>
          <p class="mt-2 text-3xl font-bold text-primary-warm-700">—</p>
        </div>
        <div class="card-surface border-success/30 bg-gradient-to-br from-success/10 to-surface">
          <p class="text-xs font-semibold uppercase tracking-wide text-muted">Active workers</p>
          <p class="mt-2 text-3xl font-bold text-success">—</p>
        </div>
      </div>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { useAuth } from '../../composables/useAuth'

const { signOut } = useAuth()

async function onSignOut(): Promise<void> {
  await signOut()
  await navigateTo('/login')
}
</script>
