import type { GardenFeatures } from '../../real-gardens/garden-characteristics'
import type { GardenKind } from '../../real-gardens/real-garden'
import type { GardenRegion } from '../../real-gardens/garden-region'

export type FeaturePoint = Readonly<{ x: number; y: number }>
export type FencePlacement = FeaturePoint & Readonly<{ length: number; thickness: number; rotation?: number }>
export type GardenFeaturePlacements = Readonly<{
  waterSources: Partial<Record<GardenFeatures['waterSources'][number], FeaturePoint>>
  channel: Readonly<{ x: number; y: number; width: number; height: number }>
  rain: FeaturePoint
  irrigation: Partial<Record<GardenFeatures['irrigationMethods'][number], FeaturePoint>>
  fertilizers: Partial<Record<GardenFeatures['naturalFertilizers'][number], FeaturePoint>>
  fences: readonly FencePlacement[]
}>

/** Costa · En tierra feature locations, in world coordinates. These are reserved service margins outside the six crop footprints. */
const COSTA_GROUND: GardenFeaturePlacements = {
  waterSources: {
    stored: { x: 120, y: 900 },
    well: { x: 360, y: 930 },
    mains: { x: 360, y: 1075 },
  },
  channel: { x: 1680, y: 1086, width: 220, height: 90 },
  rain: { x: 450, y: 700 },
  irrigation: {
    drip: { x: 390, y: 1160 },
    manual: { x: 1652, y: 900 },
    hose: { x: 1760, y: 900 },
    sprinkler: { x: 1868, y: 900 },
  },
  fertilizers: {
    leaves: { x: 1700, y: 1280 },
    plantRemains: { x: 1790, y: 1280 },
    compost: { x: 1880, y: 1280 },
    fallow: { x: 570, y: 1160 },
  },
  fences: [
    // Only rear and front runs remain; the side edges stay fully open.
    // Rear modules are centered on the grass line and stop clear of the first row.
    { x: 362, y: 756, length: 334, thickness: 68 },
    { x: 696, y: 756, length: 334, thickness: 68 },
    { x: 1030, y: 756, length: 334, thickness: 68 },
    { x: 1364, y: 756, length: 334, thickness: 68 },
    { x: 1698, y: 756, length: 334, thickness: 68 },
    // Front rails align around a centered 360-unit entrance.
    { x: 365, y: 1230, length: 340, thickness: 80 },
    { x: 692.5, y: 1230, length: 315, thickness: 80 },
    { x: 1367.5, y: 1230, length: 315, thickness: 80 },
    { x: 1695, y: 1230, length: 340, thickness: 80 },
  ],
}

/** Ground infrastructure is kept in reserved margins around the shared six-plot footprint. */
const FEATURE_PLACEMENT_OVERRIDES: Partial<Record<GardenRegion, Partial<Record<GardenKind, GardenFeaturePlacements>>>> = {
  costa: { ground: COSTA_GROUND },
  sierra: { ground: COSTA_GROUND },
  oriente: { ground: COSTA_GROUND },
  galapagos: { ground: COSTA_GROUND },
}

export function gardenFeaturePlacements(region: GardenRegion, kind: GardenKind) {
  return FEATURE_PLACEMENT_OVERRIDES[region]?.[kind]
}
