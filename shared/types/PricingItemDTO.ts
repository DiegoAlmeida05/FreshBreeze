export type PricingItemCategory = 'linen' | 'amenities'
export type PropertyPricingItemScope = 'base' | 'default_extra'

export interface PricingItemDTO {
  id: string
  name: string
  category: PricingItemCategory
  unit_price: number
  active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface CreatePricingItemDTO {
  name: string
  category: PricingItemCategory
  unit_price: number
  active?: boolean
  sort_order?: number
}

export interface UpdatePricingItemDTO {
  name?: string
  category?: PricingItemCategory
  unit_price?: number
  active?: boolean
  sort_order?: number
}

export interface PricingItemRefDTO {
  id: string
  name: string
  category: PricingItemCategory
  unit_price: number
  active: boolean
}

export interface PropertyPricingItemDTO {
  id: string
  property_id: string
  pricing_item_id: string
  scope: PropertyPricingItemScope
  quantity: number
  pricing_item: PricingItemRefDTO
  created_at: string
  updated_at: string
}

export interface PropertyPricingItemInput {
  pricing_item_id: string
  scope: PropertyPricingItemScope
  quantity: number
}

export interface DailyTaskExtraItemDTO {
  id: string
  daily_task_id: string
  pricing_item_id: string
  quantity: number
  note: string | null
  pricing_item: PricingItemRefDTO
  created_at: string
  updated_at: string
}

export interface DailyTaskExtraItemInput {
  pricing_item_id: string
  quantity: number
  note: string | null
}

export interface PricingItemsSnapshotLineDTO {
  pricing_item_id: string
  name: string
  category: PricingItemCategory
  quantity: number
  unit_price: number
  line_total: number
  source: 'property_base' | 'property_default_extra' | 'task_extra'
  note?: string | null
}
