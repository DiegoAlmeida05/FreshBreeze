export interface ChocolateCalculationInput {
  includesChocolates: boolean
  bedsSingle: number
  bedsQueen: number
  bedsKing: number
  extraBedsSingle: number
  extraBedsQueen: number
  extraBedsKing: number
  extraChocolatesQty: number
}

export interface ChocolateCalculationResult {
  baseChocolates: number
  extraChocolates: number
  totalChocolates: number
}

function safeCount(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0
}

export function calculateChocolates(input: ChocolateCalculationInput): ChocolateCalculationResult {
  const extraChocolates = safeCount(input.extraChocolatesQty)

  if (!input.includesChocolates) {
    return {
      baseChocolates: 0,
      extraChocolates,
      totalChocolates: extraChocolates,
    }
  }

  const totalSingles = safeCount(input.bedsSingle) + safeCount(input.extraBedsSingle)
  const totalQueens = safeCount(input.bedsQueen) + safeCount(input.extraBedsQueen)
  const totalKings = safeCount(input.bedsKing) + safeCount(input.extraBedsKing)

  const baseChocolates = totalSingles + (totalQueens * 2) + (totalKings * 2)

  return {
    baseChocolates,
    extraChocolates,
    totalChocolates: baseChocolates + extraChocolates,
  }
}
