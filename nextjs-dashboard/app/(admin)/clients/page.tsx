'use client'

import { useState } from 'react'
import {
  Search,
  ChevronDown,
  Pencil,
  Trash2,
  Plus,
  DollarSign,
  Check,
  AlertTriangle,
} from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import type { Client } from '@/types'

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_CLIENTS: Client[] = [
  {
    id: '1',
    name: 'Airbnb Premium',
    color: '#3B82F6',
    hourlyRate: 58,
    linenComboPrice: 35,
    amenitiesComboPrice: 22,
    extraTowelPrice: 5,
    isActive: true,
  },
  {
    id: '2',
    name: 'Ocean View Stays',
    color: '#10B981',
    hourlyRate: 52,
    linenComboPrice: 30,
    amenitiesComboPrice: 18,
    extraTowelPrice: 4,
    isActive: true,
  },
  {
    id: '3',
    name: 'City Lofts',
    color: '#F59E0B',
    hourlyRate: 45,
    linenComboPrice: 28,
    amenitiesComboPrice: 15,
    extraTowelPrice: 3,
    isActive: false,
  },
  {
    id: '4',
    name: 'Harbour House Rentals',
    color: '#8B5CF6',
    hourlyRate: 60,
    linenComboPrice: 40,
    amenitiesComboPrice: 25,
    extraTowelPrice: 6,
    isActive: true,
  },
  {
    id: '5',
    name: 'Sunset Villas',
    color: '#EF4444',
    hourlyRate: 50,
    linenComboPrice: 32,
    amenitiesComboPrice: 20,
    extraTowelPrice: 4,
    isActive: false,
  },
]

const PRESET_COLORS = [
  '#3B82F6',
  '#10B981',
  '#F59E0B',
  '#EF4444',
  '#8B5CF6',
  '#EC4899',
  '#06B6D4',
  '#84CC16',
  '#F97316',
  '#6366F1',
]

// ─── Shared helpers ───────────────────────────────────────────────────────────

function formatCurrency(value: number) {
  return `$${value.toFixed(2)}`
}

function isValidHex(val: string) {
  return /^#[0-9A-Fa-f]{6}$/.test(val)
}

// ─── Shared input class ───────────────────────────────────────────────────────

function inputClass(hasError?: boolean) {
  return [
    'w-full rounded-xl bg-[#0a1628] border px-3 py-2.5 text-sm text-white',
    'placeholder:text-slate-500 focus:outline-none focus:ring-1 transition-colors',
    hasError
      ? 'border-red-500/40 focus:border-red-500/50 focus:ring-red-500/20'
      : 'border-white/[0.1] focus:border-blue-500/50 focus:ring-blue-500/20',
  ].join(' ')
}

// ─── Form types ───────────────────────────────────────────────────────────────

interface ClientFormState {
  name: string
  color: string
  hexInput: string
  hourlyRate: string
  linenComboPrice: string
  amenitiesComboPrice: string
  extraTowelPrice: string
  isActive: boolean
}

interface ClientFormErrors {
  name?: string
  color?: string
  hourlyRate?: string
}

function defaultFormState(client?: Client): ClientFormState {
  if (client) {
    return {
      name: client.name,
      color: client.color,
      hexInput: client.color,
      hourlyRate: String(client.hourlyRate),
      linenComboPrice: String(client.linenComboPrice),
      amenitiesComboPrice: String(client.amenitiesComboPrice),
      extraTowelPrice: String(client.extraTowelPrice),
      isActive: client.isActive,
    }
  }
  return {
    name: '',
    color: '#3B82F6',
    hexInput: '#3B82F6',
    hourlyRate: '',
    linenComboPrice: '',
    amenitiesComboPrice: '',
    extraTowelPrice: '',
    isActive: true,
  }
}

function validateClientForm(form: ClientFormState): ClientFormErrors {
  const errors: ClientFormErrors = {}
  if (!form.name.trim()) errors.name = 'Client name is required.'
  if (!isValidHex(form.color)) errors.color = 'Select or enter a valid hex color.'
  const rate = parseFloat(form.hourlyRate)
  if (!form.hourlyRate || isNaN(rate) || rate <= 0) {
    errors.hourlyRate = 'Enter a valid hourly rate greater than 0.'
  }
  return errors
}

// ─── Client Form (shared by create + edit modals) ─────────────────────────────

interface ClientFormProps {
  initialClient?: Client
  onSubmit: (data: Omit<Client, 'id'>) => Promise<void>
  onCancel: () => void
  submitLabel: string
}

function ClientForm({ initialClient, onSubmit, onCancel, submitLabel }: ClientFormProps) {
  const [form, setForm] = useState<ClientFormState>(() => defaultFormState(initialClient))
  const [errors, setErrors] = useState<ClientFormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  function set<K extends keyof ClientFormState>(key: K, value: ClientFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function clearError(key: keyof ClientFormErrors) {
    setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  function handleColorPick(color: string) {
    set('color', color)
    set('hexInput', color)
    clearError('color')
  }

  function handleHexInput(val: string) {
    set('hexInput', val)
    if (isValidHex(val)) {
      set('color', val)
      clearError('color')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const formErrors = validateClientForm(form)
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors)
      return
    }
    setIsSubmitting(true)
    await onSubmit({
      name: form.name.trim(),
      color: form.color,
      hourlyRate: parseFloat(form.hourlyRate),
      linenComboPrice: parseFloat(form.linenComboPrice) || 0,
      amenitiesComboPrice: parseFloat(form.amenitiesComboPrice) || 0,
      extraTowelPrice: parseFloat(form.extraTowelPrice) || 0,
      isActive: form.isActive,
    })
    setIsSubmitting(false)
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="space-y-4">
      {/* Client name */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-slate-300">
          Client name <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => {
            set('name', e.target.value)
            clearError('name')
          }}
          placeholder="e.g. Airbnb Premium"
          className={inputClass(!!errors.name)}
        />
        {errors.name && (
          <p className="mt-1 flex items-center gap-1 text-xs text-red-400">
            <AlertTriangle className="h-3 w-3" />
            {errors.name}
          </p>
        )}
      </div>

      {/* Color */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-slate-300">
          Color <span className="text-red-400">*</span>
        </label>
        <div className="mb-2 flex flex-wrap gap-2">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => handleColorPick(c)}
              style={{ backgroundColor: c }}
              className="relative h-7 w-7 rounded-full ring-2 ring-transparent transition-transform hover:scale-110 focus:outline-none focus:ring-blue-500/50 focus:ring-offset-1 focus:ring-offset-[#0f1b35]"
              aria-label={`Select color ${c}`}
            >
              {form.color === c && (
                <Check className="absolute inset-0 m-auto h-3.5 w-3.5 text-white drop-shadow" />
              )}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span
            className="h-9 w-9 shrink-0 rounded-xl border border-white/[0.1] shadow-inner"
            style={{ backgroundColor: form.color }}
          />
          <input
            type="text"
            value={form.hexInput}
            onChange={(e) => handleHexInput(e.target.value)}
            placeholder="#3B82F6"
            maxLength={7}
            className="flex-1 rounded-xl bg-[#0a1628] border border-white/[0.1] px-3 py-2.5 font-mono text-sm text-white placeholder:text-slate-500 focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/20"
          />
        </div>
        {errors.color && (
          <p className="mt-1 flex items-center gap-1 text-xs text-red-400">
            <AlertTriangle className="h-3 w-3" />
            {errors.color}
          </p>
        )}
      </div>

      {/* Hourly rate */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-slate-300">
          Hourly rate ($/hr) <span className="text-red-400">*</span>
        </label>
        <div className="relative">
          <input
            type="text"
            inputMode="decimal"
            value={form.hourlyRate}
            onChange={(e) => {
              set('hourlyRate', e.target.value)
              clearError('hourlyRate')
            }}
            placeholder="55.00"
            className={[inputClass(!!errors.hourlyRate), 'pr-9'].join(' ')}
          />
          <DollarSign className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        </div>
        {errors.hourlyRate && (
          <p className="mt-1 flex items-center gap-1 text-xs text-red-400">
            <AlertTriangle className="h-3 w-3" />
            {errors.hourlyRate}
          </p>
        )}
      </div>

      {/* Invoice prices (3-col grid) */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-slate-300">Invoice prices</label>
        <div className="grid grid-cols-3 gap-3">
          {(
            [
              { key: 'linenComboPrice', label: 'Linen combo' },
              { key: 'amenitiesComboPrice', label: 'Amenities combo' },
              { key: 'extraTowelPrice', label: 'Extra towel' },
            ] as { key: keyof ClientFormState; label: string }[]
          ).map(({ key, label }) => (
            <div key={key}>
              <p className="mb-1 text-[11px] text-slate-400">{label}</p>
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  value={form[key] as string}
                  onChange={(e) => set(key, e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-xl bg-[#0a1628] border border-white/[0.1] px-3 py-2.5 pr-8 text-sm text-white placeholder:text-slate-500 focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/20"
                />
                <DollarSign className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Active toggle */}
      <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.03] px-4 py-3 transition-colors hover:bg-white/[0.05]">
        <input
          type="checkbox"
          checked={form.isActive}
          onChange={(e) => set('isActive', e.target.checked)}
          className="sr-only"
        />
        <div
          className={`relative h-5 w-10 rounded-full transition-colors duration-200 ${
            form.isActive ? 'bg-blue-500' : 'bg-slate-600'
          }`}
        >
          <div
            className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${
              form.isActive ? 'translate-x-5' : 'translate-x-0.5'
            }`}
          />
        </div>
        <span className="text-sm text-slate-300">Active client</span>
      </label>

      {/* Actions */}
      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-xl border border-white/[0.1] px-4 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-white/[0.05] hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 rounded-xl bg-gradient-to-r from-blue-500 to-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition-all hover:from-blue-400 hover:to-blue-600 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
        >
          {isSubmitting ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  )
}

// ─── Clients Page ─────────────────────────────────────────────────────────────

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>(MOCK_CLIENTS)
  const [search, setSearch] = useState('')
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [deletingClientId, setDeletingClientId] = useState<string | null>(null)

  const filtered = clients.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()),
  )
  const visible = filtered.slice(0, itemsPerPage)

  // ── Handlers ──
  async function handleCreate(data: Omit<Client, 'id'>) {
    const newClient: Client = { ...data, id: crypto.randomUUID() }
    setClients((prev) => [newClient, ...prev])
    setIsCreateOpen(false)
  }

  async function handleEdit(data: Omit<Client, 'id'>) {
    if (!editingClient) return
    setClients((prev) =>
      prev.map((c) => (c.id === editingClient.id ? { ...data, id: c.id } : c)),
    )
    setEditingClient(null)
  }

  function handleDelete(id: string) {
    setClients((prev) => prev.filter((c) => c.id !== id))
    setDeletingClientId(null)
  }

  // ── Render ──
  return (
    <div className="min-h-screen bg-[#060d1f] px-6 py-8">
      {/* Page header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Client Management</h1>
          <p className="mt-1 text-sm text-slate-400">
            {filtered.length} {filtered.length === 1 ? 'client' : 'clients'} found
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition-all hover:from-blue-400 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
        >
          <Plus className="h-4 w-4" />
          Add client
        </button>
      </div>

      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative min-w-[260px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by client name"
            className="w-full rounded-xl border border-white/[0.08] bg-[#0f1b35] py-2.5 pl-9 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-blue-500/30 focus:outline-none focus:ring-1 focus:ring-blue-500/20"
          />
        </div>

        {/* Items per page */}
        <div className="relative">
          <select
            value={itemsPerPage}
            onChange={(e) => setItemsPerPage(Number(e.target.value))}
            className="appearance-none cursor-pointer rounded-xl border border-white/[0.08] bg-[#0f1b35] px-4 py-2.5 pr-9 text-sm text-slate-300 focus:border-blue-500/30 focus:outline-none"
          >
            {[10, 25, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n} per page
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0f1b35] shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.07]">
                {[
                  'Color',
                  'Name',
                  'Rate/hr',
                  'Linen combo',
                  'Amenities combo',
                  'Extra towel',
                  'Status',
                  'Actions',
                ].map((h, i) => (
                  <th
                    key={h}
                    className={[
                      'px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400',
                      i === 0 ? 'pl-5' : '',
                      i === 7 ? 'pr-5 text-right' : 'text-left',
                    ].join(' ')}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {visible.map((client) => (
                <tr
                  key={client.id}
                  className="transition-colors hover:bg-white/[0.02]"
                >
                  {/* Color */}
                  <td className="py-3.5 pl-5">
                    <span
                      className="block h-5 w-5 rounded-full ring-2 ring-white/10"
                      style={{ backgroundColor: client.color }}
                    />
                  </td>

                  {/* Name */}
                  <td className="px-4 py-3.5 font-medium text-white">
                    {client.name}
                  </td>

                  {/* Rate/hr */}
                  <td className="px-4 py-3.5 tabular-nums text-slate-300">
                    {formatCurrency(client.hourlyRate)}/hr
                  </td>

                  {/* Linen */}
                  <td className="px-4 py-3.5 tabular-nums text-slate-300">
                    {formatCurrency(client.linenComboPrice)}
                  </td>

                  {/* Amenities */}
                  <td className="px-4 py-3.5 tabular-nums text-slate-300">
                    {formatCurrency(client.amenitiesComboPrice)}
                  </td>

                  {/* Extra towel */}
                  <td className="px-4 py-3.5 tabular-nums text-slate-300">
                    {formatCurrency(client.extraTowelPrice)}
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3.5">
                    <span
                      className={[
                        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
                        client.isActive
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-slate-500/10 text-slate-400',
                      ].join(' ')}
                    >
                      <span
                        className={[
                          'mr-1.5 h-1.5 w-1.5 rounded-full',
                          client.isActive ? 'bg-emerald-400' : 'bg-slate-500',
                        ].join(' ')}
                      />
                      {client.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 pr-5">
                    <div className="flex items-center justify-end gap-1 rounded-lg border border-white/[0.07] px-1 py-0.5">
                      <button
                        type="button"
                        onClick={() => setEditingClient(client)}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-blue-500/10 hover:text-blue-400 focus:outline-none"
                        title="Edit client"
                        aria-label={`Edit ${client.name}`}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingClientId(client.id)}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-red-500/10 hover:text-red-400 focus:outline-none"
                        title="Delete client"
                        aria-label={`Delete ${client.name}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {visible.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-5 py-14 text-center text-sm text-slate-500"
                  >
                    No clients found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer pagination hint */}
        {filtered.length > itemsPerPage && (
          <div className="border-t border-white/[0.05] px-5 py-3 text-xs text-slate-500">
            Showing {Math.min(itemsPerPage, filtered.length)} of {filtered.length} clients
          </div>
        )}
      </div>

      {/* ── Create modal ── */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="New client"
        size="md"
      >
        <ClientForm
          onSubmit={handleCreate}
          onCancel={() => setIsCreateOpen(false)}
          submitLabel="Create"
        />
      </Modal>

      {/* ── Edit modal ── */}
      <Modal
        isOpen={!!editingClient}
        onClose={() => setEditingClient(null)}
        title="Edit client"
        size="md"
      >
        {editingClient && (
          <ClientForm
            initialClient={editingClient}
            onSubmit={handleEdit}
            onCancel={() => setEditingClient(null)}
            submitLabel="Save changes"
          />
        )}
      </Modal>

      {/* ── Delete confirmation modal ── */}
      <Modal
        isOpen={!!deletingClientId}
        onClose={() => setDeletingClientId(null)}
        title="Delete client"
        size="sm"
      >
        <div className="space-y-5">
          <div className="flex items-start gap-3 rounded-xl bg-red-500/5 border border-red-500/10 p-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
            <p className="text-sm text-slate-300">
              Are you sure you want to delete{' '}
              <span className="font-semibold text-white">
                {clients.find((c) => c.id === deletingClientId)?.name}
              </span>
              ? This action cannot be undone.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setDeletingClientId(null)}
              className="flex-1 rounded-xl border border-white/[0.1] px-4 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-white/[0.05] hover:text-white focus:outline-none"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => deletingClientId && handleDelete(deletingClientId)}
              className="flex-1 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-400 transition-colors hover:bg-red-500/20 hover:text-red-300 focus:outline-none"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
