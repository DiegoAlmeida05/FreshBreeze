'use client'

import { useState } from 'react'
import {
  Pencil,
  Trash2,
  Plus,
  DollarSign,
  Eye,
  EyeOff,
  AlertTriangle,
  User,
  ChevronDown,
} from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import type { Employee, EmployeeRole } from '@/types'

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_EMPLOYEES: Employee[] = [
  {
    id: '1',
    fullName: 'Sarah Johnson',
    email: 'sarah.j@freshbreeze.com',
    phone: '+61 412 345 678',
    abn: '51 824 753 556',
    address: '12 Harbour St, Sydney NSW 2000',
    weekdayRate: 38.5,
    sundayRate: 52.0,
    holidayRate: 65.0,
    role: 'worker',
    isActive: true,
  },
  {
    id: '2',
    fullName: 'Marcus Chen',
    email: 'marcus.c@freshbreeze.com',
    phone: '+61 423 456 789',
    abn: '72 345 678 901',
    address: '88 George St, Parramatta NSW 2150',
    weekdayRate: 38.5,
    sundayRate: 52.0,
    holidayRate: 65.0,
    role: 'worker',
    isActive: true,
  },
  {
    id: '3',
    fullName: 'Lisa Park',
    email: 'lisa.p@freshbreeze.com',
    phone: '+61 434 567 890',
    abn: '48 901 234 567',
    address: '4 Pacific Hwy, North Sydney NSW 2060',
    weekdayRate: 55.0,
    sundayRate: 75.0,
    holidayRate: 90.0,
    role: 'admin',
    isActive: true,
  },
  {
    id: '4',
    fullName: 'Tom Williams',
    email: 'tom.w@freshbreeze.com',
    phone: '+61 445 678 901',
    abn: '63 456 789 012',
    address: '7 King St, Newtown NSW 2042',
    weekdayRate: 38.5,
    sundayRate: 52.0,
    holidayRate: 65.0,
    role: 'worker',
    isActive: false,
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRate(value: number) {
  return `$${value.toFixed(2)}`
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/)
  const first = parts[0]?.[0] ?? ''
  const last = parts[parts.length - 1]?.[0] ?? ''
  return (parts.length === 1 ? first : first + last).toUpperCase()
}

function roleBadgeClass(role: EmployeeRole) {
  return role === 'admin'
    ? 'bg-violet-500/10 text-violet-400'
    : 'bg-sky-500/10 text-sky-400'
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

interface EmployeeFormState {
  fullName: string
  email: string
  password: string
  phone: string
  abn: string
  address: string
  weekdayRate: string
  sundayRate: string
  holidayRate: string
  role: EmployeeRole
  isActive: boolean
}

interface EmployeeFormErrors {
  fullName?: string
  email?: string
  password?: string
  weekdayRate?: string
  sundayRate?: string
  holidayRate?: string
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validateEmployeeForm(
  form: EmployeeFormState,
  isCreate: boolean,
): EmployeeFormErrors {
  const errors: EmployeeFormErrors = {}
  if (!form.fullName.trim()) errors.fullName = 'Full name is required.'
  if (!form.email.trim()) {
    errors.email = 'Email is required.'
  } else if (!EMAIL_REGEX.test(form.email)) {
    errors.email = 'Enter a valid email address.'
  }
  if (isCreate) {
    if (!form.password) {
      errors.password = 'Password is required.'
    } else if (form.password.length < 8) {
      errors.password = 'Password must be at least 8 characters.'
    }
  }
  const wd = parseFloat(form.weekdayRate)
  if (!form.weekdayRate || isNaN(wd) || wd <= 0)
    errors.weekdayRate = 'Enter a valid rate.'
  const su = parseFloat(form.sundayRate)
  if (!form.sundayRate || isNaN(su) || su <= 0)
    errors.sundayRate = 'Enter a valid rate.'
  const ho = parseFloat(form.holidayRate)
  if (!form.holidayRate || isNaN(ho) || ho <= 0)
    errors.holidayRate = 'Enter a valid rate.'
  return errors
}

function defaultForm(employee?: Employee): EmployeeFormState {
  if (employee) {
    return {
      fullName: employee.fullName,
      email: employee.email,
      password: '',
      phone: employee.phone,
      abn: employee.abn,
      address: employee.address,
      weekdayRate: String(employee.weekdayRate),
      sundayRate: String(employee.sundayRate),
      holidayRate: String(employee.holidayRate),
      role: employee.role,
      isActive: employee.isActive,
    }
  }
  return {
    fullName: '',
    email: '',
    password: '',
    phone: '',
    abn: '',
    address: '',
    weekdayRate: '',
    sundayRate: '',
    holidayRate: '',
    role: 'worker',
    isActive: true,
  }
}

// ─── Employee Form ────────────────────────────────────────────────────────────

interface EmployeeFormProps {
  initialEmployee?: Employee
  onSubmit: (data: Omit<Employee, 'id'> & { password?: string }) => Promise<void>
  onCancel: () => void
  submitLabel: string
}

function EmployeeForm({
  initialEmployee,
  onSubmit,
  onCancel,
  submitLabel,
}: EmployeeFormProps) {
  const isCreate = !initialEmployee
  const [form, setForm] = useState<EmployeeFormState>(() => defaultForm(initialEmployee))
  const [errors, setErrors] = useState<EmployeeFormErrors>({})
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  function set<K extends keyof EmployeeFormState>(key: K, value: EmployeeFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }
  function clearError(key: keyof EmployeeFormErrors) {
    setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const formErrors = validateEmployeeForm(form, isCreate)
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors)
      return
    }
    setIsSubmitting(true)
    await onSubmit({
      fullName: form.fullName.trim(),
      email: form.email.trim().toLowerCase(),
      ...(form.password ? { password: form.password } : {}),
      phone: form.phone.trim(),
      abn: form.abn.trim(),
      address: form.address.trim(),
      weekdayRate: parseFloat(form.weekdayRate),
      sundayRate: parseFloat(form.sundayRate),
      holidayRate: parseFloat(form.holidayRate),
      role: form.role,
      isActive: form.isActive,
    })
    setIsSubmitting(false)
  }

  // ── Section heading helper ──
  function SectionHeading({ label }: { label: string }) {
    return (
      <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-slate-500">
        {label}
      </h3>
    )
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="space-y-5">
      {/* ── Basic Info ── */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
        <SectionHeading label="Basic Info" />
        <div className="space-y-3">
          {/* Full name */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-300">
              Full name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.fullName}
              onChange={(e) => {
                set('fullName', e.target.value)
                clearError('fullName')
              }}
              placeholder="e.g. Sarah Johnson"
              className={inputClass(!!errors.fullName)}
            />
            {errors.fullName && (
              <p className="mt-1 flex items-center gap-1 text-xs text-red-400">
                <AlertTriangle className="h-3 w-3 shrink-0" />
                {errors.fullName}
              </p>
            )}
          </div>

          {/* Email + Password row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-300">
                Email <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => {
                  set('email', e.target.value)
                  clearError('email')
                }}
                placeholder="sarah@example.com"
                className={inputClass(!!errors.email)}
              />
              {errors.email && (
                <p className="mt-1 flex items-center gap-1 text-xs text-red-400">
                  <AlertTriangle className="h-3 w-3 shrink-0" />
                  {errors.email}
                </p>
              )}
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-300">
                Password{' '}
                {isCreate && <span className="text-red-400">*</span>}
                {!isCreate && (
                  <span className="ml-1 text-slate-500">(leave blank to keep)</span>
                )}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => {
                    set('password', e.target.value)
                    clearError('password')
                  }}
                  placeholder={isCreate ? 'Min. 8 characters' : '••••••••'}
                  className={[inputClass(!!errors.password), 'pr-9'].join(' ')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 flex w-9 items-center justify-center text-slate-500 hover:text-slate-300 transition-colors focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 flex items-center gap-1 text-xs text-red-400">
                  <AlertTriangle className="h-3 w-3 shrink-0" />
                  {errors.password}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Contact ── */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
        <SectionHeading label="Contact" />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-300">Phone</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => set('phone', e.target.value)}
              placeholder="+61 412 345 678"
              className={inputClass()}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-300">ABN</label>
            <input
              type="text"
              value={form.abn}
              onChange={(e) => set('abn', e.target.value)}
              placeholder="51 824 753 556"
              className={inputClass()}
            />
          </div>
          <div className="col-span-2">
            <label className="mb-1.5 block text-xs font-medium text-slate-300">Address</label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => set('address', e.target.value)}
              placeholder="123 Main St, Sydney NSW 2000"
              className={inputClass()}
            />
          </div>
        </div>
      </div>

      {/* ── Payment Rates ── */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
        <SectionHeading label="Payment Rates" />
        <div className="grid grid-cols-3 gap-3">
          {(
            [
              { key: 'weekdayRate', label: 'Weekday', error: errors.weekdayRate },
              { key: 'sundayRate', label: 'Sunday', error: errors.sundayRate },
              { key: 'holidayRate', label: 'Holiday', error: errors.holidayRate },
            ] as {
              key: keyof EmployeeFormState
              label: string
              error?: string
            }[]
          ).map(({ key, label, error }) => (
            <div key={key}>
              <label className="mb-1.5 block text-xs font-medium text-slate-300">
                {label} <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  value={form[key] as string}
                  onChange={(e) => {
                    set(key, e.target.value)
                    clearError(key as keyof EmployeeFormErrors)
                  }}
                  placeholder="0.00"
                  className={[inputClass(!!error), 'pr-8 text-right'].join(' ')}
                />
                <DollarSign className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
              </div>
              {error && (
                <p className="mt-1 flex items-center gap-1 text-xs text-red-400">
                  <AlertTriangle className="h-3 w-3 shrink-0" />
                  {error}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Role & Status ── */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
        <SectionHeading label="Role & Status" />
        <div className="flex items-center gap-4">
          {/* Role dropdown */}
          <div className="flex-1">
            <label className="mb-1.5 block text-xs font-medium text-slate-300">Role</label>
            <div className="relative">
              <select
                value={form.role}
                onChange={(e) => set('role', e.target.value as EmployeeRole)}
                disabled={!isCreate}
                className="w-full appearance-none cursor-pointer rounded-xl border border-white/[0.1] bg-[#0a1628] px-3 py-2.5 pr-9 text-sm text-white focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="worker">Worker</option>
                <option value="admin">Admin</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
            </div>
            {!isCreate && (
              <p className="mt-1 text-[11px] text-slate-500">
                Role cannot be changed after creation.
              </p>
            )}
          </div>

          {/* Active toggle */}
          <label className="flex cursor-pointer items-center gap-3 self-end rounded-xl border border-white/[0.05] bg-white/[0.03] px-4 py-2.5 transition-colors hover:bg-white/[0.05]">
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
            <span className="whitespace-nowrap text-sm text-slate-300">Active employee</span>
          </label>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-xl border border-white/[0.1] px-4 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-white/[0.05] hover:text-white focus:outline-none"
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

// ─── Employees Page ───────────────────────────────────────────────────────────

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>(MOCK_EMPLOYEES)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [deletingEmployeeId, setDeletingEmployeeId] = useState<string | null>(null)

  // ── Handlers ──
  async function handleCreate(data: Omit<Employee, 'id'> & { password?: string }) {
    const { password: _pw, ...rest } = data
    const newEmployee: Employee = { ...rest, id: crypto.randomUUID() }
    setEmployees((prev) => [newEmployee, ...prev])
    setIsCreateOpen(false)
  }

  async function handleEdit(data: Omit<Employee, 'id'> & { password?: string }) {
    if (!editingEmployee) return
    const { password: _pw, ...rest } = data
    setEmployees((prev) =>
      prev.map((e) => (e.id === editingEmployee.id ? { ...rest, id: e.id } : e)),
    )
    setEditingEmployee(null)
  }

  function handleDelete(id: string) {
    setEmployees((prev) => prev.filter((e) => e.id !== id))
    setDeletingEmployeeId(null)
  }

  // ── Render ──
  return (
    <div className="min-h-screen bg-[#060d1f] px-6 py-8">
      {/* Page header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Employee Management</h1>
          <p className="mt-1 text-sm text-slate-400">
            {employees.length} {employees.length === 1 ? 'employee' : 'employees'} ·{' '}
            {employees.filter((e) => e.isActive).length} active
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition-all hover:from-blue-400 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
        >
          <Plus className="h-4 w-4" />
          Add employee
        </button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0f1b35] shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.07]">
                {[
                  'Employee',
                  'Contact',
                  'Weekday',
                  'Sunday',
                  'Holiday',
                  'Role',
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
              {employees.map((emp) => (
                <tr key={emp.id} className="transition-colors hover:bg-white/[0.02]">
                  {/* Avatar + name */}
                  <td className="py-3.5 pl-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-xs font-semibold text-blue-300">
                        {getInitials(emp.fullName)}
                      </div>
                      <div>
                        <p className="font-medium text-white">{emp.fullName}</p>
                        <p className="text-[11px] text-slate-500">{emp.abn || '—'}</p>
                      </div>
                    </div>
                  </td>

                  {/* Contact */}
                  <td className="px-4 py-3.5">
                    <p className="text-slate-300">{emp.email}</p>
                    <p className="text-[11px] text-slate-500">{emp.phone || '—'}</p>
                  </td>

                  {/* Rates */}
                  <td className="px-4 py-3.5 tabular-nums text-slate-300">
                    {formatRate(emp.weekdayRate)}/hr
                  </td>
                  <td className="px-4 py-3.5 tabular-nums text-slate-300">
                    {formatRate(emp.sundayRate)}/hr
                  </td>
                  <td className="px-4 py-3.5 tabular-nums text-slate-300">
                    {formatRate(emp.holidayRate)}/hr
                  </td>

                  {/* Role */}
                  <td className="px-4 py-3.5">
                    <span
                      className={[
                        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize',
                        roleBadgeClass(emp.role),
                      ].join(' ')}
                    >
                      {emp.role}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3.5">
                    <span
                      className={[
                        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
                        emp.isActive
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-slate-500/10 text-slate-400',
                      ].join(' ')}
                    >
                      <span
                        className={[
                          'mr-1.5 h-1.5 w-1.5 rounded-full',
                          emp.isActive ? 'bg-emerald-400' : 'bg-slate-500',
                        ].join(' ')}
                      />
                      {emp.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 pr-5">
                    <div className="flex items-center justify-end gap-1 rounded-lg border border-white/[0.07] px-1 py-0.5">
                      <button
                        type="button"
                        onClick={() => setEditingEmployee(emp)}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-blue-500/10 hover:text-blue-400 focus:outline-none"
                        title="Edit employee"
                        aria-label={`Edit ${emp.fullName}`}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingEmployeeId(emp.id)}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-red-500/10 hover:text-red-400 focus:outline-none"
                        title="Delete employee"
                        aria-label={`Delete ${emp.fullName}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {employees.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-14 text-center text-sm text-slate-500">
                    No employees found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Create modal ── */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="New employee"
        size="lg"
      >
        <EmployeeForm
          onSubmit={handleCreate}
          onCancel={() => setIsCreateOpen(false)}
          submitLabel="Create employee"
        />
      </Modal>

      {/* ── Edit modal ── */}
      <Modal
        isOpen={!!editingEmployee}
        onClose={() => setEditingEmployee(null)}
        title="Edit employee"
        size="lg"
      >
        {editingEmployee && (
          <EmployeeForm
            initialEmployee={editingEmployee}
            onSubmit={handleEdit}
            onCancel={() => setEditingEmployee(null)}
            submitLabel="Save changes"
          />
        )}
      </Modal>

      {/* ── Delete confirmation ── */}
      <Modal
        isOpen={!!deletingEmployeeId}
        onClose={() => setDeletingEmployeeId(null)}
        title="Delete employee"
        size="sm"
      >
        <div className="space-y-5">
          <div className="flex items-start gap-3 rounded-xl border border-red-500/10 bg-red-500/5 p-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
            <p className="text-sm text-slate-300">
              Are you sure you want to delete{' '}
              <span className="font-semibold text-white">
                {employees.find((e) => e.id === deletingEmployeeId)?.fullName}
              </span>
              ? This action cannot be undone.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setDeletingEmployeeId(null)}
              className="flex-1 rounded-xl border border-white/[0.1] px-4 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-white/[0.05] hover:text-white"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => deletingEmployeeId && handleDelete(deletingEmployeeId)}
              className="flex-1 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-400 transition-colors hover:bg-red-500/20 hover:text-red-300"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
