<template>
	<div class="sr-only" aria-live="polite">Opening login...</div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'

if (import.meta.server) {
	await navigateTo('/login', { replace: true })
}

onMounted(() => {
	const goToLogin = async () => {
		try {
			await navigateTo('/login', { replace: true })
		} catch {
			window.location.replace('/login')
		}
	}

	void goToLogin()
})
</script>
