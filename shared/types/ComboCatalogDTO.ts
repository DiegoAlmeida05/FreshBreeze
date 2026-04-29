export type ComboCatalogCategory = 'linen' | 'amenities'
export type PropertyComboScope = 'base' | 'default_extra'

export interface ComboCatalogItemDTO {
  id: string
  combo_id: string
  item_name: string
  quantity: number
  unit_price_excl_gst: number
  line_total_excl_gst: number
  sort_order: number
  created_at: string
  updated_at: string
}

export interface ComboCatalogItemInput {
  item_name: string
  quantity: number
  unit_price_excl_gst: number
  sort_order?: number
}

export interface ComboCatalogDTO {
  id: string
  name: string
  category: ComboCatalogCategory
  description: string
  combo_price: number
  items: ComboCatalogItemDTO[]
  active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface CreateComboCatalogDTO {
  name: string
  category: ComboCatalogCategory
  description?: string
  combo_price?: number
  items: ComboCatalogItemInput[]
  active?: boolean
  sort_order?: number
}

export interface UpdateComboCatalogDTO {
  name?: string
  category?: ComboCatalogCategory
  description?: string
  combo_price?: number
  items?: ComboCatalogItemInput[]
  active?: boolean
  sort_order?: number
}

export interface PropertyComboCatalogRef {
  id: string
  name: string
  category: ComboCatalogCategory
  combo_price: number
  active: boolean
}

export interface PropertyComboDTO {
  id: string
  property_id: string
  combo_id: string
  scope: PropertyComboScope
  quantity: number
  combo: PropertyComboCatalogRef
  created_at: string
  updated_at: string
}

export interface PropertyComboInput {
  combo_id: string
  scope: PropertyComboScope
  quantity: number
}

export interface DailyTaskExtracomboCatalogRef {
  id: string
  name: string
  category: ComboCatalogCategory
  combo_price: number
  active: boolean
}

export interface DailyTaskExtraComboDTO {
  id: string
  daily_task_id: string
  combo_id: string
  quantity: number
  note: string | null
  combo: DailyTaskExtracomboCatalogRef
  created_at: string
  updated_at: string
}

export interface DailyTaskExtraComboInput {
  combo_id: string
  quantity: number
  note: string | null
}
