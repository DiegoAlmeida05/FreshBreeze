import type { PricingItemCategory, PricingItemRefDTO } from './PricingItemDTO'

export interface PricingSetItemDTO {
  id: string
  set_id: string
  pricing_item_id: string
  quantity: number
  pricing_item: PricingItemRefDTO
}

export interface PricingSetDTO {
  id: string
  name: string
  category: PricingItemCategory
  active: boolean
  created_at: string
  items: PricingSetItemDTO[]
}

export interface PricingSetItemInput {
  pricing_item_id: string
  quantity: number
}

export interface CreatePricingSetDTO {
  name: string
  category: PricingItemCategory
  active?: boolean
  items: PricingSetItemInput[]
}

export interface UpdatePricingSetDTO {
  name?: string
  category?: PricingItemCategory
  active?: boolean
  items?: PricingSetItemInput[]
}