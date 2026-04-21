import { useAuth } from './useAuth'
import { useSupabaseClient } from './useSupabaseClient'

export interface WorkerInvoiceRow {
  id: string
  employee_id: string
  worker_profile_id: string | null
  week_start: string
  week_end: string
  invoice_number: number
  issue_date: string
  due_date: string
  recipient_name: string | null
  recipient_email: string
  recipient_phone: string | null
  email_subject: string
  notes: string | null
  manual_invoice_amount: number
  subtotal: number
  total: number
  balance_due: number
  pdf_url: string | null
  status: string
  created_at: string | null
  updated_at: string | null
  email_body: string | null
}

interface WorkerInvoiceLineInsert {
  worker_invoice_id: string
  sort_order: number
  work_date: string
  description: string
  qty: number
  unit_price: number
  line_total: number
  created_at: string
  updated_at: string
}

export interface CreateWorkerInvoicePayload {
  week_start: string
  week_end: string
  invoice_number: number
  recipient_name?: string | null
  recipient_email: string
  recipient_phone?: string | null
  email_subject: string
  email_body?: string | null
  notes?: string | null
  issue_date: string
  due_date: string
  manual_invoice_amount: number
  pdf_url?: string | null
  line_description?: string
}

export function useWorkerInvoices() {
  const supabase = useSupabaseClient()
  const auth = useAuth()

  async function replaceInvoiceLines(invoiceId: string, amount: number, workDate: string, lineDescription?: string): Promise<void> {
    const { error: deleteError } = await supabase
      .from('worker_invoice_lines')
      .delete()
      .eq('worker_invoice_id', invoiceId)

    if (deleteError) {
      throw new Error(deleteError.message)
    }

    const timestamp = new Date().toISOString()
    const lineInsert: WorkerInvoiceLineInsert = {
      worker_invoice_id: invoiceId,
      sort_order: 1,
      work_date: workDate,
      description: lineDescription?.trim() || 'Cleaning Services',
      qty: 1,
      unit_price: amount,
      line_total: amount,
      created_at: timestamp,
      updated_at: timestamp,
    }

    const { error: insertError } = await supabase
      .from('worker_invoice_lines')
      .insert(lineInsert)

    if (insertError) {
      throw new Error(insertError.message)
    }
  }

  async function getWorkerProfileIdForEmployee(employeeId: string): Promise<string | null> {
    const { data, error } = await supabase
      .from('worker_profiles')
      .select('id')
      .eq('employee_id', employeeId)
      .maybeSingle<{ id: string }>()

    if (error) {
      throw new Error(error.message)
    }

    return data?.id ?? null
  }

  async function getEmployeeIdForCurrentUser(): Promise<string> {
    const user = await auth.getCurrentUser()

    const { data, error } = await supabase
      .from('employees')
      .select('id')
      .eq('profile_id', user.id)
      .maybeSingle<{ id: string }>()

    if (error) {
      throw new Error(error.message)
    }

    if (!data) {
      throw new Error('No employee record found for current user.')
    }

    return data.id
  }

  async function listInvoicesByWeek(weekStartDate: string): Promise<WorkerInvoiceRow[]> {
    const employeeId = await getEmployeeIdForCurrentUser()

    const { data, error } = await supabase
      .from('worker_invoices')
      .select('id, employee_id, worker_profile_id, week_start, week_end, invoice_number, issue_date, due_date, recipient_name, recipient_email, recipient_phone, email_subject, notes, manual_invoice_amount, subtotal, total, balance_due, pdf_url, status, created_at, updated_at, email_body')
      .eq('employee_id', employeeId)
      .eq('week_start', weekStartDate)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(error.message)
    }

    return (data ?? []) as WorkerInvoiceRow[]
  }

  async function listInvoices(): Promise<WorkerInvoiceRow[]> {
    const employeeId = await getEmployeeIdForCurrentUser()

    const { data, error } = await supabase
      .from('worker_invoices')
      .select('id, employee_id, worker_profile_id, week_start, week_end, invoice_number, issue_date, due_date, recipient_name, recipient_email, recipient_phone, email_subject, notes, manual_invoice_amount, subtotal, total, balance_due, pdf_url, status, created_at, updated_at, email_body')
      .eq('employee_id', employeeId)
      .order('updated_at', { ascending: false })

    if (error) {
      throw new Error(error.message)
    }

    return (data ?? []) as WorkerInvoiceRow[]
  }

  async function getInvoiceForWeek(weekStartDate: string): Promise<WorkerInvoiceRow | null> {
    const invoices = await listInvoicesByWeek(weekStartDate)
    return invoices.length > 0 ? invoices[0]! : null
  }

  async function createInvoice(payload: CreateWorkerInvoicePayload): Promise<WorkerInvoiceRow> {
    const employeeId = await getEmployeeIdForCurrentUser()
    const workerProfileId = await getWorkerProfileIdForEmployee(employeeId)
    const amount = Number(payload.manual_invoice_amount.toFixed(2))

    const insertPayload = {
      employee_id: employeeId,
      worker_profile_id: workerProfileId,
      week_start: payload.week_start,
      week_end: payload.week_end,
      invoice_number: Math.max(0, Math.round(payload.invoice_number)),
      issue_date: payload.issue_date,
      due_date: payload.due_date,
      recipient_name: payload.recipient_name?.trim() || null,
      recipient_email: payload.recipient_email.trim(),
      recipient_phone: payload.recipient_phone?.trim() || null,
      email_subject: payload.email_subject.trim(),
      notes: payload.notes?.trim() || null,
      manual_invoice_amount: amount,
      subtotal: amount,
      total: amount,
      balance_due: amount,
      pdf_url: payload.pdf_url?.trim() || null,
      status: 'draft',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      email_body: payload.email_body?.trim() || null,
    }

    const { data, error } = await supabase
      .from('worker_invoices')
      .insert(insertPayload)
      .select('id, employee_id, worker_profile_id, week_start, week_end, invoice_number, issue_date, due_date, recipient_name, recipient_email, recipient_phone, email_subject, notes, manual_invoice_amount, subtotal, total, balance_due, pdf_url, status, created_at, updated_at, email_body')
      .single<WorkerInvoiceRow>()

    if (error || !data) {
      throw new Error(error?.message ?? 'Failed to create invoice.')
    }

    await replaceInvoiceLines(data.id, amount, payload.week_start, payload.line_description)

    return data
  }

  async function updateInvoice(invoiceId: string, payload: Partial<CreateWorkerInvoicePayload>): Promise<WorkerInvoiceRow> {
    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (payload.invoice_number !== undefined) {
      updatePayload.invoice_number = Math.max(0, Math.round(payload.invoice_number))
    }

    if (payload.recipient_name !== undefined) {
      updatePayload.recipient_name = payload.recipient_name?.trim() || null
    }

    if (payload.recipient_email !== undefined) {
      updatePayload.recipient_email = payload.recipient_email.trim()
    }

    if (payload.recipient_phone !== undefined) {
      updatePayload.recipient_phone = payload.recipient_phone?.trim() || null
    }

    if (payload.email_subject !== undefined) {
      updatePayload.email_subject = payload.email_subject.trim()
    }

    if (payload.email_body !== undefined) {
      updatePayload.email_body = payload.email_body?.trim() || null
    }

    if (payload.notes !== undefined) {
      updatePayload.notes = payload.notes?.trim() || null
    }

    if (payload.issue_date !== undefined) {
      updatePayload.issue_date = payload.issue_date
    }

    if (payload.due_date !== undefined) {
      updatePayload.due_date = payload.due_date
    }

    if (payload.manual_invoice_amount !== undefined) {
      const amount = Number(payload.manual_invoice_amount.toFixed(2))
      updatePayload.manual_invoice_amount = amount
      updatePayload.subtotal = amount
      updatePayload.total = amount
      updatePayload.balance_due = amount
    }

    if (payload.pdf_url !== undefined) {
      updatePayload.pdf_url = payload.pdf_url?.trim() || null
    }

    const { data, error } = await supabase
      .from('worker_invoices')
      .update(updatePayload)
      .eq('id', invoiceId)
      .select('id, employee_id, worker_profile_id, week_start, week_end, invoice_number, issue_date, due_date, recipient_name, recipient_email, recipient_phone, email_subject, notes, manual_invoice_amount, subtotal, total, balance_due, pdf_url, status, created_at, updated_at, email_body')
      .single<WorkerInvoiceRow>()

    if (error || !data) {
      throw new Error(error?.message ?? 'Failed to update invoice.')
    }

    const lineAmount = payload.manual_invoice_amount !== undefined
      ? Number(payload.manual_invoice_amount.toFixed(2))
      : data.manual_invoice_amount
    const lineWorkDate = payload.week_start ?? data.week_start

    await replaceInvoiceLines(data.id, lineAmount, lineWorkDate, payload.line_description)

    return data
  }

  async function deleteInvoice(invoiceId: string): Promise<void> {
    const { error: linesError } = await supabase
      .from('worker_invoice_lines')
      .delete()
      .eq('worker_invoice_id', invoiceId)

    if (linesError) {
      throw new Error(linesError.message)
    }

    const { error: invoiceError } = await supabase
      .from('worker_invoices')
      .delete()
      .eq('id', invoiceId)

    if (invoiceError) {
      throw new Error(invoiceError.message)
    }
  }

  return {
    listInvoices,
    listInvoicesByWeek,
    getInvoiceForWeek,
    createInvoice,
    updateInvoice,
    deleteInvoice,
  }
}
