import type { PropertyComboDTO, DailyTaskExtraComboDTO } from '../../shared/types/ComboCatalogDTO'

export interface ComboPricingInput {
  propertyBaseCombos: PropertyComboDTO[]
  propertyDefaultExtraCombos: PropertyComboDTO[]
  taskExtraCombos: DailyTaskExtraComboDTO[]
  linenPackFee: number
  amenitiesPackFee: number
  includesAmenities: boolean
}

export interface ComboPricingResult {
  baseLinen: number
  extraLinen: number
  linenTotal: number
  baseAmenities: number
  extraAmenities: number
  amenitiesTotal: number
}

function mul(price: number, qty: number): number {
  return Number((price * qty).toFixed(2))
}

function add(...values: number[]): number {
  return Number(values.reduce((a, b) => a + b, 0).toFixed(2))
}

/**
 * Calculates linen and amenities totals from the combo catalog system.
 *
 * Pack fee rules:
 * - If base group total > 0 → add pack fee ONCE
 * - If extra group total > 0 → add pack fee ONCE
 * - Pack fee is NEVER multiplied by quantity
 *
 * Amenities rules:
 * - If includesAmenities = false → amenitiesTotal = 0 (ignore all amenities combos)
 */
export function calculateComboPricing(input: ComboPricingInput): ComboPricingResult {
  const {
    propertyBaseCombos,
    propertyDefaultExtraCombos,
    taskExtraCombos,
    linenPackFee,
    amenitiesPackFee,
    includesAmenities,
  } = input

  // ── Linen ──────────────────────────────────────────────────────────────────
  const baseLinen = add(
    ...propertyBaseCombos
      .filter((c) => c.combo.category === 'linen')
      .map((c) => mul(c.combo.combo_price, c.quantity)),
  )

  const defaultExtraLinen = add(
    ...propertyDefaultExtraCombos
      .filter((c) => c.combo.category === 'linen')
      .map((c) => mul(c.combo.combo_price, c.quantity)),
  )

  const taskExtraLinen = add(
    ...taskExtraCombos
      .filter((c) => c.combo.category === 'linen')
      .map((c) => mul(c.combo.combo_price, c.quantity)),
  )

  const extraLinen = add(defaultExtraLinen, taskExtraLinen)

  let linenTotal = add(baseLinen, extraLinen)

  if ((baseLinen + extraLinen) > 0) {
    linenTotal = add(linenTotal, linenPackFee)
  }

  // ── Amenities ──────────────────────────────────────────────────────────────
  if (!includesAmenities) {
    return {
      baseLinen,
      extraLinen,
      linenTotal,
      baseAmenities: 0,
      extraAmenities: 0,
      amenitiesTotal: 0,
    }
  }

  const baseAmenities = add(
    ...propertyBaseCombos
      .filter((c) => c.combo.category === 'amenities')
      .map((c) => mul(c.combo.combo_price, c.quantity)),
  )

  const defaultExtraAmenities = add(
    ...propertyDefaultExtraCombos
      .filter((c) => c.combo.category === 'amenities')
      .map((c) => mul(c.combo.combo_price, c.quantity)),
  )

  const taskExtraAmenities = add(
    ...taskExtraCombos
      .filter((c) => c.combo.category === 'amenities')
      .map((c) => mul(c.combo.combo_price, c.quantity)),
  )

  const extraAmenities = add(defaultExtraAmenities, taskExtraAmenities)

  let amenitiesTotal = add(baseAmenities, extraAmenities)

  if ((baseAmenities + extraAmenities) > 0) {
    amenitiesTotal = add(amenitiesTotal, amenitiesPackFee)
  }

  return {
    baseLinen,
    extraLinen,
    linenTotal,
    baseAmenities,
    extraAmenities,
    amenitiesTotal,
  }
}
