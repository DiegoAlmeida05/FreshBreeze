<template>
  <article class="mx-auto w-full min-w-[1080px] max-w-[1280px] rounded-xl border border-primary-100/70 bg-white p-4 text-slate-900 shadow-sm sm:p-6" data-hours-report-preview>
    <header class="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-4">
      <div>
        <img
          src="/logo/logo_escrito_transparente.png"
          alt="Fresh Breeze"
          class="h-14 w-auto object-contain"
        >
        <p class="mt-2 text-xs text-slate-500">Employee Hours Summary Report</p>
      </div>

      <div class="text-right text-xs text-slate-600">
        <p class="font-semibold text-slate-800">Employee Hours Summary</p>
        <p class="mt-1">Period: {{ formatDate(report.periodStart) }} - {{ formatDate(report.periodEnd) }}</p>
      </div>
    </header>

    <section class="mt-4 grid grid-cols-1 gap-2 border-b border-slate-200 pb-3 sm:grid-cols-2">
      <div>
        <p class="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Employee</p>
        <p class="text-sm font-semibold text-slate-900">{{ report.employeeName }}</p>
      </div>
      <div class="sm:text-right">
        <p class="text-[11px] font-semibold uppercase tracking-wide text-slate-500">ABN</p>
        <p class="text-sm text-slate-700">{{ report.employeeAbn || '-' }}</p>
      </div>
    </section>

    <div class="mt-4 overflow-x-auto">
      <table class="w-full min-w-[1160px] border-collapse text-sm">
        <thead>
          <tr class="border-y border-slate-300 bg-slate-50 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-600">
            <th class="px-3 py-2">Date</th>
            <th class="px-3 py-2">Job (hours)</th>
            <th class="px-3 py-2">Worked (hours)</th>
            <th class="px-3 py-2">Special (hours)</th>
            <th class="px-3 py-2">Final Paid (hours)</th>
            <th class="px-3 py-2">Invoice (hours)</th>
            <th class="px-3 py-2">Rate/Job</th>
            <th class="px-3 py-2 text-right">Total</th>
            <th class="px-3 py-2">Notes</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="row in report.rows" :key="row.date" class="border-b border-slate-200">
            <td class="px-3 py-2 text-slate-800">
              <p>{{ formatDate(row.date) }}</p>
              <p class="text-[10px] uppercase tracking-wide text-slate-500">{{ formatWeekday(row.date) }}</p>
            </td>
            <td class="px-3 py-2 font-medium text-slate-800">{{ row.jobHours.toFixed(2) }}</td>
            <td class="px-3 py-2 text-slate-800">{{ row.workedHours.toFixed(2) }}</td>
            <td class="px-3 py-2 text-slate-800">{{ row.specialHours > 0 ? row.specialHours.toFixed(2) : '-' }}</td>
            <td class="px-3 py-2 font-medium text-slate-800">{{ row.finalPaidHours.toFixed(2) }}</td>
            <td class="px-3 py-2 font-medium text-slate-800">{{ row.invoiceHours.toFixed(2) }}</td>
            <td class="px-3 py-2 text-slate-700">{{ formatCurrency(row.ratePerJob) }}</td>
            <td class="px-3 py-2 text-right font-medium text-slate-900">{{ formatCurrency(row.totalPay) }}</td>
            <td class="px-3 py-2 text-slate-700">{{ row.note?.trim() ? row.note : '-' }}</td>
          </tr>
        </tbody>

        <tfoot>
          <tr class="border-t-2 border-slate-800 bg-slate-50">
            <td class="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-700">Final Total</td>
            <td class="px-3 py-2 text-slate-700">-</td>
            <td class="px-3 py-2 text-slate-700">-</td>
            <td class="px-3 py-2 text-slate-700">-</td>
            <td class="px-3 py-2 font-semibold text-slate-900">{{ report.finalTotalHours.toFixed(2) }}</td>
            <td class="px-3 py-2 font-semibold text-slate-900">{{ report.finalInvoiceHours.toFixed(2) }}</td>
            <td class="px-3 py-2 text-slate-700">-</td>
            <td class="px-3 py-2 text-right text-base font-semibold text-slate-900">{{ formatCurrency(report.finalTotalPay) }}</td>
            <td class="px-3 py-2 text-slate-700">-</td>
          </tr>
        </tfoot>
      </table>
    </div>
  </article>
</template>

<script setup lang="ts">
import type { EmployeeHoursReport } from '../../../composables/useHoursReport'

interface Props {
  report: EmployeeHoursReport
}

defineProps<Props>()

function formatDate(value: string): string {
  const parsed = new Date(`${value}T00:00:00`)
  return parsed.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function formatWeekday(value: string): string {
  const parsed = new Date(`${value}T00:00:00`)
  return parsed.toLocaleDateString('en-AU', {
    weekday: 'long',
  })
}

function formatCurrency(value: number): string {
  return value.toLocaleString('en-AU', {
    style: 'currency',
    currency: 'AUD',
  })
}
</script>
