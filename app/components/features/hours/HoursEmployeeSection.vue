<template>
  <div class="border-b border-primary-100/40 dark:border-white/10">
    <!-- Header: Employee name + compact summary -->
    <header class="flex flex-wrap items-baseline justify-between gap-2 bg-primary-50/20 px-2 py-1 text-xs dark:bg-white/[0.02]">
      <div>
        <p class="font-semibold text-foreground text-sm">{{ group.employeeName }}</p>
        <p class="text-[10px] text-muted">{{ group.rateLabel }} · {{ formattedRate }}</p>
      </div>

      <div class="flex gap-2 text-xs">
        <span>
          <span class="text-muted">T:</span>
          <span class="font-semibold text-foreground">{{ group.taskMinutesTotal }}</span>
        </span>
        <span>
          <span class="text-muted">A:</span>
          <span class="font-semibold text-foreground">{{ group.adjustmentMinutesTotal }}</span>
        </span>
        <span>
          <span class="text-muted">Σ:</span>
          <span class="font-semibold text-foreground">{{ group.totalPaidMinutes }}</span>
        </span>
        <span class="font-semibold text-foreground">{{ formattedSubtotalPay }}</span>
      </div>
    </header>

    <div class="overflow-x-auto">
      <div class="min-w-[820px]">
        <div class="grid grid-cols-[minmax(220px,1.8fr)_68px_78px_60px_68px_minmax(180px,1fr)_74px] gap-2 border-b border-primary-100/30 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted dark:border-white/10">
          <span>Task</span>
          <span>Planned</span>
          <span>Actual</span>
          <span>Diff</span>
          <span>Total</span>
          <span>Note</span>
          <span class="text-right">Save</span>
        </div>

        <div v-if="group.entries.length > 0">
          <HoursEntryRow
            v-for="entryItem in group.entries"
            :key="entryItem.entry.id"
            :entry="entryItem"
            :is-saving="savingEntryIds.has(entryItem.entry.id)"
            @save-entry="(payload) => emit('save-entry', payload)"
          />
        </div>

        <div v-else class="px-2 py-2 text-xs text-muted">
          No tasks scheduled for this employee.
        </div>

        <HoursDayAdjustmentsBlock
          :adjustment-entry="group.adjustmentEntry"
          :rate-used="group.rateUsed"
          :is-saving="savingAdjustmentIds.has(group.adjustmentEntry?.id ?? '')"
          @save-adjustment="(payload) => emit('save-adjustment', payload)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import HoursDayAdjustmentsBlock from './HoursDayAdjustmentsBlock.vue'
import HoursEntryRow from './HoursEntryRow.vue'
import type { DayEntriesByEmployee } from '../../../composables/useEmployeeHoursAdmin'
import type { UpdateEmployeeTimeEntryAdminDTO } from '../../../../shared/types/EmployeeTimeEntryAdminDTO'

interface SavePayload {
  id: string
  actual_minutes: number
  note: string | null
}

interface SaveAdjustmentPayload {
  entryId: string
  payload: UpdateEmployeeTimeEntryAdminDTO
}

interface Props {
  group: DayEntriesByEmployee
  savingEntryIds: Set<string>
  savingAdjustmentIds: Set<string>
}

interface Emits {
  'save-entry': [payload: SavePayload]
  'save-adjustment': [payload: SaveAdjustmentPayload]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const formattedRate = computed(() => {
  return props.group.rateUsed.toLocaleString('en-US', {
    style: 'currency',
    currency: 'AUD',
  })
})

const formattedSubtotalPay = computed(() => {
  return props.group.subtotalPay.toLocaleString('en-US', {
    style: 'currency',
    currency: 'AUD',
  })
})
</script>
