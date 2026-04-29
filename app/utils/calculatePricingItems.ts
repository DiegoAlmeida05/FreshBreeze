import type {
  DailyTaskExtraItemDTO,
  PricingItemsSnapshotLineDTO,
  PropertyPricingItemDTO,
} from '../../shared/types/PricingItemDTO'

export interface PricingItemsCalculationInput {
  propertyBaseItems: PropertyPricingItemDTO[]
  propertyDefaultExtraItems: PropertyPricingItemDTO[]
  taskExtraItems: DailyTaskExtraItemDTO[]
  linenPackFee: number
  amenitiesPackFee: number
  includesAmenities: boolean
}

export interface PricingItemsCalculationResult {
  baseLinen: number
  extraLinen: number
  linenTotal: number
  baseAmenities: number
  extraAmenities: number
  amenitiesTotal: number
  snapshotLines: PricingItemsSnapshotLineDTO[]
}

function roundCurrency(value: number): number {
  return Number(value.toFixed(2))
}

function sum(values: number[]): number {
  return roundCurrency(values.reduce((acc, value) => acc + value, 0))
}

function toSnapshotLine(
  source: PricingItemsSnapshotLineDTO['source'],
  row: PropertyPricingItemDTO | DailyTaskExtraItemDTO,
): PricingItemsSnapshotLineDTO {
  const pricingItem = row.pricing_item
  const lineTotal = roundCurrency(Number(pricingItem.unit_price ?? 0) * Number(row.quantity ?? 0))

  return {
    pricing_item_id: pricingItem.id,
    name: pricingItem.name,
    category: pricingItem.category,
    quantity: Number(row.quantity ?? 0),
    unit_price: roundCurrency(Number(pricingItem.unit_price ?? 0)),
    line_total: lineTotal,
    source,
    note: 'note' in row ? row.note : null,
  }
}

function lineAmount(unitPrice: number, quantity: number): number {
  return roundCurrency(unitPrice * quantity)
}

// Billing rule: this calculator only uses selected pricing items.
// Operational fields such as includes_chocolates / extra_chocolate_qty are intentionally excluded
// to prevent duplicate charging when a Chocolate pricing item is also configured.
export function calculatePricingItems(input: PricingItemsCalculationInput): PricingItemsCalculationResult {
  const {
    propertyBaseItems,
    propertyDefaultExtraItems,
    taskExtraItems,
    linenPackFee,
    amenitiesPackFee,
    includesAmenities,
  } = input

  const baseLines = propertyBaseItems.map((row) => toSnapshotLine('property_base', row))
  const defaultExtraLines = propertyDefaultExtraItems.map((row) => toSnapshotLine('property_default_extra', row))
  const taskExtraLines = taskExtraItems.map((row) => toSnapshotLine('task_extra', row))
  const snapshotLines = [...baseLines, ...defaultExtraLines, ...taskExtraLines]

  const baseLinen = sum(
    propertyBaseItems
      .filter((item) => item.pricing_item.category === 'linen')
      .map((item) => lineAmount(item.pricing_item.unit_price, item.quantity)),
  )

  const defaultExtraLinen = sum(
    propertyDefaultExtraItems
      .filter((item) => item.pricing_item.category === 'linen')
      .map((item) => lineAmount(item.pricing_item.unit_price, item.quantity)),
  )

  const taskExtraLinen = sum(
    taskExtraItems
      .filter((item) => item.pricing_item.category === 'linen')
      .map((item) => lineAmount(item.pricing_item.unit_price, item.quantity)),
  )

  const extraLinen = sum([defaultExtraLinen, taskExtraLinen])
  let linenTotal = sum([baseLinen, extraLinen])

  // Pack fee is charged once per category per job, regardless of source split.
  if ((baseLinen + extraLinen) > 0) {
    linenTotal = sum([linenTotal, roundCurrency(linenPackFee)])
  }

  if (!includesAmenities) {
    return {
      baseLinen,
      extraLinen,
      linenTotal,
      baseAmenities: 0,
      extraAmenities: 0,
      amenitiesTotal: 0,
      snapshotLines: snapshotLines.filter((line) => line.category !== 'amenities'),
    }
  }

  const baseAmenities = sum(
    propertyBaseItems
      .filter((item) => item.pricing_item.category === 'amenities')
      .map((item) => lineAmount(item.pricing_item.unit_price, item.quantity)),
  )

  const defaultExtraAmenities = sum(
    propertyDefaultExtraItems
      .filter((item) => item.pricing_item.category === 'amenities')
      .map((item) => lineAmount(item.pricing_item.unit_price, item.quantity)),
  )

  const taskExtraAmenities = sum(
    taskExtraItems
      .filter((item) => item.pricing_item.category === 'amenities')
      .map((item) => lineAmount(item.pricing_item.unit_price, item.quantity)),
  )

  const extraAmenities = sum([defaultExtraAmenities, taskExtraAmenities])
  let amenitiesTotal = sum([baseAmenities, extraAmenities])

  // Pack fee is charged once per category per job, regardless of source split.
  if ((baseAmenities + extraAmenities) > 0) {
    amenitiesTotal = sum([amenitiesTotal, roundCurrency(amenitiesPackFee)])
  }

  return {
    baseLinen,
    extraLinen,
    linenTotal,
    baseAmenities,
    extraAmenities,
    amenitiesTotal,
    snapshotLines,
  }
}
