<template>
	<main class="flex min-h-screen items-center justify-center bg-surface px-6">
		<section class="w-full max-w-sm rounded-3xl border border-border bg-white/80 px-6 py-10 text-center shadow-elevated backdrop-blur">
			<img
				src="/logo/logo_escrito_transparente.png"
				alt="FreshBreeze"
				class="mx-auto h-auto w-full max-w-[220px] object-contain"
			/>
			<div class="mt-6 flex items-center justify-center gap-2 text-sm text-muted">
				<div class="h-4 w-4 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
				Redirecting...
			</div>
		</section>
	</main>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'

let hardRedirectTimeoutId = 0

onMounted(() => {
	const goToLogin = async () => {
		try {
			await navigateTo('/login', { replace: true })
		} catch {
			window.location.replace('/login')
		}
	}

	// Fail-safe: if client navigation gets stuck on PWA resume,
	// force a hard navigation to unblock first render.
	hardRedirectTimeoutId = window.setTimeout(() => {
		window.location.replace('/login')
	}, 1200)

	void goToLogin()
})

onBeforeUnmount(() => {
	if (hardRedirectTimeoutId) {
		window.clearTimeout(hardRedirectTimeoutId)
		hardRedirectTimeoutId = 0
	}
})
</script>
