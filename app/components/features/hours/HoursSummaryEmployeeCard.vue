<template>
  <article class="rounded-xl border border-primary-100/80 bg-surface p-3 shadow-card dark:border-white/10">
    <button
      type="button"
      class="flex w-full items-center justify-between gap-3 text-left"
      @click="isExpanded = !isExpanded"
    >
      <div class="min-w-0">
        <p class="truncate text-sm font-semibold text-foreground">{{ employee.employeeName }}</p>
        <p class="text-xs text-muted">{{ employee.workedDaysCount }} worked days</p>
      </div>

      <div class="grid shrink-0 grid-cols-3 gap-4 text-right">
        <div>
          <p class="text-[10px] font-semibold uppercase tracking-wide text-muted">Hours</p>
          <p class="text-sm font-semibold text-foreground">{{ employee.totalHours.toFixed(2) }}</p>
        </div>
        <div>
          <p class="text-[10px] font-semibold uppercase tracking-wide text-muted">Pay</p>
          <p class="text-sm font-semibold text-foreground">{{ formatCurrency(employee.totalPay) }}</p>
        </div>
        <div class="flex items-center justify-end">
          <span class="inline-flex h-7 w-7 items-center justify-center rounded-md border border-primary-200/70 text-muted">
            {{ isExpanded ? '−' : '+' }}
          </span>
        </div>
      </div>
    </button>

    <div v-if="isExpanded" class="mt-3">
      <HoursSummaryEmployeeDetail :days="employee.days" />
    </div>
  </article>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import HoursSummaryEmployeeDetail from './HoursSummaryEmployeeDetail.vue'
import type { HoursSummaryEmployeeItem } from '../../../composables/useHoursSummary'

interface Props {
  employee: HoursSummaryEmployeeItem
}

defineProps<Props>()

const isExpanded = ref(false)

function formatCurrency(value: number): string {
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'AUD',
  })
}
</script>
