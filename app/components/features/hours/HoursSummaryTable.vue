<template>
  <section class="space-y-3">
    <div class="grid grid-cols-2 gap-2 rounded-xl border border-primary-100/80 bg-primary-50/40 p-3 dark:border-white/10 dark:bg-white/[0.03] md:grid-cols-5">
      <div>
        <p class="text-[10px] font-semibold uppercase tracking-wide text-muted">Employees</p>
        <p class="text-sm font-semibold text-foreground">{{ grandTotals.employeeCount }}</p>
      </div>
      <div>
        <p class="text-[10px] font-semibold uppercase tracking-wide text-muted">Worked Days</p>
        <p class="text-sm font-semibold text-foreground">{{ grandTotals.workedDaysCount }}</p>
      </div>
      <div>
        <p class="text-[10px] font-semibold uppercase tracking-wide text-muted">Total Minutes</p>
        <p class="text-sm font-semibold text-foreground">{{ grandTotals.totalMinutes }}</p>
      </div>
      <div>
        <p class="text-[10px] font-semibold uppercase tracking-wide text-muted">Total Hours</p>
        <p class="text-sm font-semibold text-foreground">{{ grandTotals.totalHours.toFixed(2) }}</p>
      </div>
      <div>
        <p class="text-[10px] font-semibold uppercase tracking-wide text-muted">Total Pay</p>
        <p class="text-sm font-semibold text-foreground">{{ formatCurrency(grandTotals.totalPay) }}</p>
      </div>
    </div>

    <div class="space-y-2">
      <HoursSummaryEmployeeCard
        v-for="employee in employees"
        :key="employee.employeeId"
        :employee="employee"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import HoursSummaryEmployeeCard from './HoursSummaryEmployeeCard.vue'
import type { HoursSummaryEmployeeItem, HoursSummaryGrandTotals } from '../../../composables/useHoursSummary'

interface Props {
  employees: HoursSummaryEmployeeItem[]
  grandTotals: HoursSummaryGrandTotals
}

defineProps<Props>()

function formatCurrency(value: number): string {
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'AUD',
  })
}
</script>
