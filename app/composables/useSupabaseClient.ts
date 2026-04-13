import type { SupabaseClient } from '@supabase/supabase-js'

export function useSupabaseClient(): SupabaseClient {
  const { $supabase } = useNuxtApp()

  return $supabase as SupabaseClient
}
