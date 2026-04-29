import { useAuth } from './useAuth'
import { useSupabaseClient } from './useSupabaseClient'

export interface WorkerProfileSettings {
  id: string | null
  employee_id: string
  legal_name: string
  abn: string
  invoice_email: string
  invoice_phone: string
  payment_bsb: string
  payment_account: string
  hourly_rate_weekday_override: number
  hourly_rate_sunday_override: number
  hourly_rate_holiday_override: number
  default_recipient_name: string
  default_recipient_email: string
  default_recipient_phone: string
  signature_data_url: string
  created_at: string | null
  updated_at: string | null
}

interface WorkerProfileRow {
  id: string
  employee_id: string
  legal_name: string | null
  abn: string | null
  invoice_email: string | null
  invoice_phone: string | null
  payment_bsb: string | null
  payment_account: string | null
  hourly_rate_weekday_override: number | null
  hourly_rate_sunday_override: number | null
  hourly_rate_holiday_override: number | null
  default_recipient_name: string | null
  default_recipient_email: string | null
  default_recipient_phone: string | null
  signature_data_url: string | null
  created_at: string | null
  updated_at: string | null
}

function toSettings(row: WorkerProfileRow): WorkerProfileSettings {
  return {
    id: row.id,
    employee_id: row.employee_id,
    legal_name: row.legal_name ?? '',
    abn: row.abn ?? '',
    invoice_email: row.invoice_email ?? '',
    invoice_phone: row.invoice_phone ?? '',
    payment_bsb: row.payment_bsb ?? '',
    payment_account: row.payment_account ?? '',
    hourly_rate_weekday_override: Number.isFinite(row.hourly_rate_weekday_override) ? Number(row.hourly_rate_weekday_override) : 40,
    hourly_rate_sunday_override: Number.isFinite(row.hourly_rate_sunday_override) ? Number(row.hourly_rate_sunday_override) : 45,
    hourly_rate_holiday_override: Number.isFinite(row.hourly_rate_holiday_override) ? Number(row.hourly_rate_holiday_override) : 50,
    default_recipient_name: row.default_recipient_name ?? 'Fresh Breeze BnB services',
    default_recipient_email: row.default_recipient_email ?? 'contact@freshbreezebnb.com.au',
    default_recipient_phone: row.default_recipient_phone ?? '0406 343 824',
    signature_data_url: row.signature_data_url ?? '',
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

function defaultSettings(employeeId: string, fallbackEmail: string, fallbackName: string): WorkerProfileSettings {
  return {
    id: null,
    employee_id: employeeId,
    legal_name: fallbackName,
    abn: '',
    invoice_email: fallbackEmail,
    invoice_phone: '',
    payment_bsb: '',
    payment_account: '',
    hourly_rate_weekday_override: 40,
    hourly_rate_sunday_override: 45,
    hourly_rate_holiday_override: 50,
    default_recipient_name: 'Fresh Breeze BnB services',
    default_recipient_email: 'contact@freshbreezebnb.com.au',
    default_recipient_phone: '0406 343 824',
    signature_data_url: '',
    created_at: null,
    updated_at: null,
  }
}

export function useWorkerProfileSettings() {
  const supabase = useSupabaseClient()
  const auth = useAuth()
  const { getCached, setCached, invalidate } = useDataCache()

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

  async function getSettings(): Promise<WorkerProfileSettings> {
    // Verifica cache primeiro (válido por 15 minutos)
    const cachedSettings = getCached<WorkerProfileSettings>('worker-profile-settings')
    if (cachedSettings) {
      return cachedSettings
    }

    const [profile, employeeId] = await Promise.all([
      auth.getProfile(),
      getEmployeeIdForCurrentUser(),
    ])

    const { data, error } = await supabase
      .from('worker_profiles')
      .select('id, employee_id, legal_name, abn, invoice_email, invoice_phone, payment_bsb, payment_account, hourly_rate_weekday_override, hourly_rate_sunday_override, hourly_rate_holiday_override, default_recipient_name, default_recipient_email, default_recipient_phone, signature_data_url, created_at, updated_at')
      .eq('employee_id', employeeId)
      .maybeSingle<WorkerProfileRow>()

    if (error) {
      throw new Error(error.message)
    }
const settings = toSettings(data)
    
    // Armazena no cache (15 minutos)
    setCached('worker-profile-settings', settings, 15 * 60 * 1000)
    
    return settings
    if (!data) {
      const base = defaultSettings(employeeId, profile.email, profile.full_name)
      return await saveSettings(base)
    }

    return toSettings(data)
  }

  async function saveSettings(payload: WorkerProfileSettings): Promise<WorkerProfileSettings> {
    const employeeId = await getEmployeeIdForCurrentUser()

    const upsertPayload = {
      employee_id: employeeId,
      legal_name: payload.legal_name.trim() || null,
      abn: payload.abn.trim() || null,
      invoice_email: payload.invoice_email.trim() || null,
      invoice_phone: payload.invoice_phone.trim() || null,
      payment_bsb: payload.payment_bsb.trim() || null,
      payment_account: payload.payment_account.trim() || null,
      hourly_rate_weekday_override: Number.isFinite(payload.hourly_rate_weekday_override) ? payload.hourly_rate_weekday_override : 0,
      hourly_rate_sunday_override: Number.isFinite(payload.hourly_rate_sunday_override) ? payload.hourly_rate_sunday_override : 0,
      hourly_rate_holiday_override: Number.isFinite(payload.hourly_rate_holiday_override) ? payload.hourly_rate_holiday_override : 0,
      default_recipient_name: payload.default_recipient_name.trim() || null,
      default_recipient_email: payload.default_recipient_email.trim() || null,
      default_recipient_phone: payload.default_recipient_phone.trim() || null,
      signature_data_url: payload.signature_data_url.trim() || null,
      updated_at: new Date().toISOString(),
    }
const settings = toSettings(data)
    
    // Invalida cache após salvar para forçar refresh
    invalidate('worker-profile-settings')
    
    return settings
    const { data, error } = await supabase
      .from('worker_profiles')
      .upsert(upsertPayload, { onConflict: 'employee_id' })
      .select('id, employee_id, legal_name, abn, invoice_email, invoice_phone, payment_bsb, payment_account, hourly_rate_weekday_override, hourly_rate_sunday_override, hourly_rate_holiday_override, default_recipient_name, default_recipient_email, default_recipient_phone, signature_data_url, created_at, updated_at')
      .single<WorkerProfileRow>()

    if (error || !data) {
      throw new Error(error?.message ?? 'Failed to save worker settings.')
    }

    return toSettings(data)
  }

  return {
    getSettings,
    saveSettings,
  }
}
