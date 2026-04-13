<template>
  <div>
    <!-- Floating action button -->
    <button
      id="quick-task-fab"
      type="button"
      class="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-2xl bg-primary-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-primary-500/30 transition-all hover:bg-primary-600 active:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:ring-offset-2"
      aria-label="Open Quick Task"
      @click="isOpen = true"
    >
      <!-- Lightning bolt -->
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        class="h-4 w-4"
      >
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
      Quick Task
    </button>

    <!-- Success toast -->
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="translate-y-4 opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="translate-y-0 opacity-100"
      leave-to-class="translate-y-4 opacity-0"
    >
      <div
        v-if="showSuccessToast"
        class="fixed bottom-20 right-6 z-50 flex items-center gap-3 rounded-xl border border-success/20 bg-surface px-4 py-3 shadow-elevated"
        role="status"
        aria-live="polite"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-4 w-4 shrink-0 text-success">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
        </svg>
        <p class="text-sm font-medium text-foreground">Task created successfully!</p>
      </div>
    </Transition>

    <!-- Modal -->
    <QuickTaskModal
      v-model="isOpen"
      @created="onTaskCreated"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import QuickTaskModal from './QuickTaskModal.vue'

const isOpen = ref(false)
const showSuccessToast = ref(false)

function onTaskCreated() {
  showSuccessToast.value = true
  setTimeout(() => {
    showSuccessToast.value = false
  }, 3000)
}
</script>
