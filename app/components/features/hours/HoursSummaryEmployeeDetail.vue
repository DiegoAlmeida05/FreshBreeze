<template>
  <div class="overflow-hidden rounded-lg border border-primary-100/80 dark:border-white/10">
    <div class="hidden md:block">
      <table class="min-w-full divide-y divide-border">
        <thead class="bg-surface-soft">
          <tr>
            <th class="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted">Date</th>
            <th class="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-muted">Hours</th>
            <th class="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted">Rate Type</th>
            <th class="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-muted">Applied Rate</th>
            <th class="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-muted">Total Pay</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-border bg-surface">
          <tr v-for="day in days" :key="day.date">
            <td class="px-3 py-2 text-sm text-foreground">{{ formatDate(day.date) }}</td>
            <td class="px-3 py-2 text-right text-sm text-foreground">{{ day.totalHours.toFixed(2) }}h</td>
            <td class="px-3 py-2">
              <span class="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold" :class="rateTypeClass(day.rateType)">
                {{ formatRateType(day.rateType) }}
              </span>
            </td>
            <td class="px-3 py-2 text-right text-sm text-muted">{{ formatCurrency(day.appliedRate) }}</td>
            <td class="px-3 py-2 text-right text-sm font-semibold text-foreground">{{ formatCurrency(day.totalPay) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="space-y-2 p-2 md:hidden">
      <article
        v-for="day in days"
        :key="day.date"
        class="rounded-md border border-primary-100/80 p-2.5 dark:border-white/10"
      >
        <div class="flex items-center justify-between gap-2">
          <p class="text-sm font-semibold text-foreground">{{ formatDate(day.date) }}</p>
          <span class="inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold" :class="rateTypeClass(day.rateType)">
            {{ formatRateType(day.rateType) }}
          </span>
        </div>
        <p class="mt-1 text-xs text-muted">Hours: {{ day.totalHours.toFixed(2) }}h</p>
        <p class="text-xs text-muted">Rate: {{ formatCurrency(day.appliedRate) }}</p>
        <p class="text-xs font-semibold text-foreground">Pay: {{ formatCurrency(day.totalPay) }}</p>
      </article>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { HoursSummaryDayBreakdown } from '../../../composables/useHoursSummary'

interface Props {
  days: HoursSummaryDayBreakdown[]
}

defineProps<Props>()

function formatDate(value: string): string {
  const date = new Date(`${value}T00:00:00`)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatCurrency(value: number): string {
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'AUD',
  })
}

function formatRateType(value: HoursSummaryDayBreakdown['rateType']): string {
  if (value === 'holiday') {
    return 'Holiday'
  }

  if (value === 'sunday') {
    return 'Sunday'
  }

  return 'Weekday'
}

function rateTypeClass(value: HoursSummaryDayBreakdown['rateType']): string {
  if (value === 'holiday') {
    return 'bg-success/15 text-success'
  }

  if (value === 'sunday') {
    return 'bg-primary/15 text-primary-700 dark:text-primary-300'
  }

  return 'bg-muted/20 text-muted'
}
</script>
