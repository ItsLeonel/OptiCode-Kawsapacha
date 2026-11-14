/**
 * Espejo Digital V2 — etapas observadas, no estimadas.
 * La fecha, la altura y los cuidados NO cambian automáticamente esta etapa.
 * El backend #43 será la fuente de verdad cuando publique evidencias persistentes.
 */
export const GROWTH_STAGES = {
  sown: 'Semilla sembrada',
  sprout: 'Brotación',
  seedling: 'Plántula',
  vegetative: 'Crecimiento vegetativo',
  flowering: 'Floración',
  harvested: 'Cosecha completa',
} as const

export type GrowthStage = keyof typeof GROWTH_STAGES

export function isGrowthStage(value: unknown): value is GrowthStage {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(GROWTH_STAGES, value)
}

/** No inference from time elapsed, species, irrigation or photographs alone. */
export function documentedGrowthStage(plant: { growthStage?: GrowthStage } | null): GrowthStage | null {
  return plant && isGrowthStage(plant.growthStage) ? plant.growthStage : null
}

export function isChamomile(name: string, latin: string) {
  return /manzanilla|chamomilla|matricaria|chamomile/i.test(name + ' ' + latin)
}
