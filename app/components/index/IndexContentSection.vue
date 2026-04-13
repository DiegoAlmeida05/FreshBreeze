<template>
  <IndexColorPreview />

  <section class="grid grid-cols-1 gap-6 xl:grid-cols-3">
    <IndexClientForm />
    <IndexSidebar />
  </section>
</template>

<script setup lang="ts">
import IndexClientForm from './IndexClientForm.vue'
import IndexColorPreview from './IndexColorPreview.vue'
import IndexSidebar from './IndexSidebar.vue'
</script>
