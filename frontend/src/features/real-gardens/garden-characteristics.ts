export const GROUND_DESIGN_OPTIONS = {
  furrows: 'Surcos', beds: 'Camadas', raisedBeds: 'Camellones', terraces: 'Terrazas',
} as const

export const FENCE_OPTIONS = {
  living: 'Vivas', natural: 'Naturales', recycled: 'Recicladas', metal: 'Metálicas', conventional: 'Convencionales',
} as const

export const WATER_SOURCE_OPTIONS = {
  rain: 'Lluvia', mains: 'Red de agua', well: 'Pozo', channel: 'Río o acequia', stored: 'Agua almacenada', other: 'Otra fuente',
} as const

export const IRRIGATION_METHOD_OPTIONS = {
  manual: 'Manual (regadera)', hose: 'Manguera', drip: 'Goteo', sprinkler: 'Aspersión', other: 'Otro método',
} as const

export const NATURAL_FERTILIZER_OPTIONS = {
  fallow: 'Barbecho', leaves: 'Hojas', plantRemains: 'Restos vegetales', compost: 'Compost',
} as const

export const GARDEN_FEATURE_OPTIONS = {
  groundDesigns: GROUND_DESIGN_OPTIONS,
  fences: FENCE_OPTIONS,
  waterSources: WATER_SOURCE_OPTIONS,
  irrigationMethods: IRRIGATION_METHOD_OPTIONS,
  naturalFertilizers: NATURAL_FERTILIZER_OPTIONS,
} as const

export type GardenFeatures = { [K in keyof typeof GARDEN_FEATURE_OPTIONS]: (keyof typeof GARDEN_FEATURE_OPTIONS[K])[] }

export function toGardenFeatures(features?: Partial<GardenFeatures>): GardenFeatures {
  return {
    groundDesigns: [...(features?.groundDesigns ?? [])], fences: [...(features?.fences ?? [])],
    waterSources: [...(features?.waterSources ?? [])], irrigationMethods: [...(features?.irrigationMethods ?? [])],
    naturalFertilizers: [...(features?.naturalFertilizers ?? [])],
  }
}

export function toggleGardenFeature<K extends keyof GardenFeatures>(features: GardenFeatures, field: K, option: GardenFeatures[K][number]): GardenFeatures {
  const selected: readonly GardenFeatures[K][number][] = features[field]
  return { ...features, [field]: selected.includes(option) ? selected.filter(value => value !== option) : [...selected, option] }
}
