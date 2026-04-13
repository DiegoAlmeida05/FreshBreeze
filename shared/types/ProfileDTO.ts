export interface ProfileDTO {
  id: string
  full_name: string
  email: string
  role: 'admin' | 'worker'
  active: boolean
  created_at: string
  updated_at: string
}
