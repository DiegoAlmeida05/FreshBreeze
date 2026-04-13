'use client'

import { useState, useEffect, useCallback } from 'react'
import { Zap, ChevronDown, AlertTriangle } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import type { Property, CleaningTeam, QuickTask } from '@/types'

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_PROPERTIES: Property[] = [
  { id: 'p1', name: 'Unit 4A – The Rocks', address: '12 Argyle St, Sydney', clientId: 'c1', clientName: 'Airbnb Premium' },
  { id: 'p2', name: 'Beachfront Suite – Bondi', address: '88 Campbell Pde, Bondi', clientId: 'c2', clientName: 'Ocean View Stays' },
  { id: 'p3', name: 'Loft 3 – Surry Hills', address: '55 Crown St, Sydney', clientId: 'c1', clientName: 'Airbnb Premium' },
  { id: 'p4', name: 'Studio – Manly', address: '7 The Corso, Manly', clientId: 'c4', clientName: 'Harbour House Rentals' },
  { id: 'p5', name: 'Penthouse – North Sydney', address: '1 Miller St, North Sydney', clientId: 'c3', clientName: 'City Lofts' },
]

const TEAMS: CleaningTeam[] = ['A', 'B', 'C']

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Add `durationHours` to `startTime` (HH:MM) and return the resulting HH:MM.
 * Handles crossing midnight.
 */
function addHoursToTime(startTime: string, durationHours: number): string {
  const [hoursStr, minutesStr] = startTime.split(':')
  const startMinutes =
    parseInt(hoursStr ?? '0', 10) * 60 + parseInt(minutesStr ?? '0', 10)
  const endMinutes = startMinutes + Math.round(durationHours * 60)
  const h = Math.floor(endMinutes / 60) % 24
  const m = endMinutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function todayISO() {
  return new Date().toISOString().split('T')[0] as string
}

function inputClass(hasError?: boolean) {
  return [
    'w-full rounded-xl bg-[#0a1628] border px-3 py-2.5 text-sm text-white',
    'placeholder:text-slate-500 focus:outline-none focus:ring-1 transition-colors',
    hasError
      ? 'border-red-500/40 focus:border-red-500/40 focus:ring-red-500/20'
      : 'border-white/[0.1] focus:border-blue-500/50 focus:ring-blue-500/20',
  ].join(' ')
}

// ─── Form types ───────────────────────────────────────────────────────────────

interface QuickTaskFormState {
  propertyId: string
  date: string
  startTime: string
  durationHours: string
  team: CleaningTeam
}

interface QuickTaskFormErrors {
  propertyId?: string
  date?: string
  startTime?: string
  durationHours?: string
}

function validateForm(form: QuickTaskFormState): QuickTaskFormErrors {
  const errors: QuickTaskFormErrors = {}
  if (!form.propertyId) errors.propertyId = 'Please select a property.'
  if (!form.date) errors.date = 'Date is required.'
  if (!form.startTime) errors.startTime = 'Start time is required.'
  const dur = parseFloat(form.durationHours)
  if (!form.durationHours || isNaN(dur) || dur <= 0) {
    errors.durationHours = 'Enter a valid duration (e.g. 2 or 1.5).'
  }
  return errors
}

// ─── Quick Task Modal ─────────────────────────────────────────────────────────

interface QuickTaskModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (task: QuickTask) => void
}

function QuickTaskModal({ isOpen, onClose, onSubmit }: QuickTaskModalProps) {
  const defaultForm = useCallback(
    (): QuickTaskFormState => ({
      propertyId: '',
      date: todayISO(),
      startTime: '09:00',
      durationHours: '2',
      team: 'A',
    }),
    [],
  )

  const [form, setForm] = useState<QuickTaskFormState>(defaultForm)
  const [errors, setErrors] = useState<QuickTaskFormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setForm(defaultForm())
      setErrors({})
    }
  }, [isOpen, defaultForm])

  function set<K extends keyof QuickTaskFormState>(key: K, value: QuickTaskFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  // Derived data
  const selectedProperty = MOCK_PROPERTIES.find((p) => p.id === form.propertyId)
  const duration = parseFloat(form.durationHours) || 0
  const computedEndTime =
    form.startTime && duration > 0
      ? addHoursToTime(form.startTime, duration)
      : null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const formErrors = validateForm(form)
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors)
      return
    }
    setIsSubmitting(true)
    await new Promise((r) => setTimeout(r, 400)) // simulate async
    onSubmit({
      propertyId: form.propertyId,
      clientId: selectedProperty!.clientId,
      clientName: selectedProperty!.clientName,
      date: form.date,
      startTime: form.startTime,
      endTime: computedEndTime!,
      durationHours: parseFloat(form.durationHours),
      team: form.team,
    })
    setIsSubmitting(false)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Quick Task" size="md">
      <form noValidate onSubmit={handleSubmit} className="space-y-4">
        {/* Property */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-300">
            Property <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <select
              value={form.propertyId}
              onChange={(e) => set('propertyId', e.target.value)}
              className={[
                inputClass(!!errors.propertyId),
                'cursor-pointer appearance-none pr-9',
              ].join(' ')}
            >
              <option value="">Select a property...</option>
              {MOCK_PROPERTIES.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          </div>
          {errors.propertyId && (
            <p className="mt-1 flex items-center gap-1 text-xs text-red-400">
              <AlertTriangle className="h-3 w-3 shrink-0" />
              {errors.propertyId}
            </p>
          )}
        </div>

        {/* Client (auto-filled read-only) */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-300">
            Client{' '}
            <span className="text-slate-500">(auto-filled)</span>
          </label>
          <input
            type="text"
            readOnly
            value={selectedProperty?.clientName ?? ''}
            placeholder="Auto-filled from property"
            className="w-full cursor-not-allowed rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5 text-sm text-slate-400 placeholder:text-slate-600 focus:outline-none"
          />
        </div>

        {/* Date + Team */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-300">
              Date <span className="text-red-400">*</span>
            </label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => set('date', e.target.value)}
              className={inputClass(!!errors.date)}
            />
            {errors.date && (
              <p className="mt-1 flex items-center gap-1 text-xs text-red-400">
                <AlertTriangle className="h-3 w-3 shrink-0" />
                {errors.date}
              </p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-300">Team</label>
            <div className="flex gap-2">
              {TEAMS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => set('team', t)}
                  className={[
                    'flex-1 rounded-xl border py-2.5 text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/30',
                    form.team === t
                      ? 'border-blue-500/60 bg-blue-500/20 text-blue-300'
                      : 'border-white/[0.1] bg-[#0a1628] text-slate-400 hover:border-white/20 hover:text-slate-200',
                  ].join(' ')}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Start time + Duration */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-300">
              Start time <span className="text-red-400">*</span>
            </label>
            <input
              type="time"
              value={form.startTime}
              onChange={(e) => set('startTime', e.target.value)}
              className={inputClass(!!errors.startTime)}
            />
            {errors.startTime && (
              <p className="mt-1 flex items-center gap-1 text-xs text-red-400">
                <AlertTriangle className="h-3 w-3 shrink-0" />
                {errors.startTime}
              </p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-300">
              Est. duration (hours) <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={form.durationHours}
              onChange={(e) => set('durationHours', e.target.value)}
              placeholder="e.g. 2 or 1.5"
              className={inputClass(!!errors.durationHours)}
            />
            {errors.durationHours && (
              <p className="mt-1 flex items-center gap-1 text-xs text-red-400">
                <AlertTriangle className="h-3 w-3 shrink-0" />
                {errors.durationHours}
              </p>
            )}
          </div>
        </div>

        {/* Auto end-time preview */}
        {computedEndTime && form.startTime && (
          <div className="flex items-center gap-2 rounded-xl border border-blue-500/15 bg-blue-500/5 px-4 py-3">
            <Zap className="h-4 w-4 shrink-0 text-blue-400" />
            <p className="text-sm text-slate-300">
              End time:{' '}
              <span className="font-semibold text-white">{computedEndTime}</span>
              <span className="ml-2 text-slate-500">
                ({form.startTime} + {form.durationHours}h)
              </span>
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-white/[0.1] px-4 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-white/[0.05] hover:text-white focus:outline-none"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 rounded-xl bg-gradient-to-r from-blue-500 to-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition-all hover:from-blue-400 hover:to-blue-600 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          >
            {isSubmitting ? 'Creating...' : 'Create Task'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ─── Quick Task Button (exported for use in layout/topbar) ────────────────────

export function QuickTaskButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [lastTask, setLastTask] = useState<QuickTask | null>(null)

  function handleSubmit(task: QuickTask) {
    // Replace with your actual task creation logic (API call, state update etc.)
    console.log('[QuickTask] Created:', task)
    setLastTask(task)
    setIsOpen(false)
  }

  return (
    <>
      {/* Floating button – fixed bottom-right corner */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-700 px-5 py-3 text-sm font-semibold text-white shadow-2xl shadow-blue-500/30 transition-all hover:from-blue-400 hover:to-blue-600 hover:shadow-blue-500/40 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:ring-offset-2 focus:ring-offset-[#060d1f]"
        aria-label="Open Quick Task"
      >
        <Zap className="h-4 w-4" />
        Quick Task
      </button>

      <QuickTaskModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSubmit={handleSubmit}
      />

      {/* Optional: success toast preview (remove if unused) */}
      {lastTask && (
        <div
          className="fixed bottom-20 right-6 z-50 max-w-xs rounded-2xl border border-emerald-500/20 bg-[#0f1b35] p-4 shadow-2xl"
          role="status"
        >
          <p className="text-sm font-medium text-emerald-400">Task created!</p>
          <p className="mt-0.5 text-xs text-slate-400">
            {MOCK_PROPERTIES.find((p) => p.id === lastTask.propertyId)?.name} •{' '}
            {lastTask.date} • {lastTask.startTime}–{lastTask.endTime} • Team{' '}
            {lastTask.team}
          </p>
          <button
            type="button"
            onClick={() => setLastTask(null)}
            className="mt-2 text-xs text-slate-500 underline-offset-2 hover:text-slate-300 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}
    </>
  )
}
