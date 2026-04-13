import type { CreateClientDTO, ClientDTO, UpdateClientDTO } from '../../shared/types/ClientDTO'
import { useSupabaseClient } from './useSupabaseClient'

const clientSelectFields = 'id, name, color, hourly_rate, linen_combo_price, amenities_combo_price, extra_towel_price, active, created_at, updated_at'

export function useClients() {
  const supabase = useSupabaseClient()

  async function fetchClients(): Promise<ClientDTO[]> {
    const { data, error } = await supabase
      .from('clients')
      .select(clientSelectFields)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(error.message)
    }

    return (data ?? []) as ClientDTO[]
  }

  async function getClientById(id: string): Promise<ClientDTO | null> {
    const { data, error } = await supabase
      .from('clients')
      .select(clientSelectFields)
      .eq('id', id)
      .maybeSingle()

    if (error) {
      throw new Error(error.message)
    }

    return data ? (data as ClientDTO) : null
  }

  async function createClient(payload: CreateClientDTO): Promise<ClientDTO> {
    const { data, error } = await supabase
      .from('clients')
      .insert(payload)
      .select(clientSelectFields)
      .single()

    if (error || !data) {
      throw new Error(error?.message ?? 'Failed to create client.')
    }

    return data as ClientDTO
  }

  async function updateClient(id: string, payload: UpdateClientDTO): Promise<ClientDTO> {
    const { data, error } = await supabase
      .from('clients')
      .update(payload)
      .eq('id', id)
      .select(clientSelectFields)
      .single()

    if (error || !data) {
      throw new Error(error?.message ?? 'Failed to update client.')
    }

    return data as ClientDTO
  }

  async function deleteClient(id: string): Promise<void> {
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(error.message)
    }
  }

  return {
    fetchClients,
    getClientById,
    createClient,
    updateClient,
    deleteClient,
  }
}
