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

/** Service margins for all raised containers: no fixtures overlap the six active openings. */
const RAISED_FEATURES: GardenFeaturePlacements = {
  waterSources: {
    stored: { x: 1745, y: 1138 },
    well: { x: 1700, y: 1006 },
    mains: { x: 1730, y: 1092 },
  },
  channel: { x: 1610, y: 1230, width: 260, height: 105 },
  rain: { x: 1740, y: 740 },
  irrigation: {
    drip: { x: 270, y: 1160 }, manual: { x: 270, y: 1085 },
    hose: { x: 260, y: 1200 }, sprinkler: { x: 400, y: 1160 },
  },
  fertilizers: {
    leaves: { x: 1550, y: 1240 },
    plantRemains: { x: 1700, y: 1260 },
    compost: { x: 1780, y: 1195 },
    fallow: { x: 1710, y: 770 },
  },
  fences: [],
}

function withPlacements(base: GardenFeaturePlacements, patch: Partial<GardenFeaturePlacements>): GardenFeaturePlacements {
  return {
    waterSources: { ...base.waterSources, ...patch.waterSources },
    channel: patch.channel ?? base.channel,
    rain: patch.rain ?? base.rain,
    irrigation: { ...base.irrigation, ...patch.irrigation },
    fertilizers: { ...base.fertilizers, ...patch.fertilizers },
    fences: patch.fences ?? base.fences,
  }
}

const SIERRA_GROUND = withPlacements(COSTA_GROUND, {
  irrigation: { hose: { x: 1735, y: 930 } },
  fertilizers: {
    leaves: { x: 1665, y: 1180 },
    plantRemains: { x: 1835, y: 1178 },
    compost: { x: 1545, y: 1070 },
  },
  fences: [
    { x: 330, y: 778, length: 174, thickness: 68 },
    { x: 1660, y: 782, length: 188, thickness: 68 },
    { x: 330, y: 1222, length: 182, thickness: 74 },
    { x: 1660, y: 1220, length: 182, thickness: 74 },
  ],
})

const SIERRA_RAISED = withPlacements(RAISED_FEATURES, {
  waterSources: { well: { x: 1778, y: 954 } },
  irrigation: { hose: { x: 305, y: 963 } },
  fertilizers: {
    leaves: { x: 1686, y: 1175 },
    plantRemains: { x: 1836, y: 1172 },
    compost: { x: 1562, y: 1080 },
  },
  fences: [
    { x: 350, y: 798, length: 170, thickness: 64 },
    { x: 1655, y: 800, length: 182, thickness: 64 },
    { x: 340, y: 1224, length: 176, thickness: 70 },
    { x: 1668, y: 1224, length: 176, thickness: 70 },
  ],
})

const ORIENTE_GROUND = withPlacements(COSTA_GROUND, {
  irrigation: { hose: { x: 1738, y: 935 } },
  fertilizers: {
    leaves: { x: 1658, y: 1175 },
    plantRemains: { x: 1830, y: 1180 },
    compost: { x: 1535, y: 1070 },
  },
  fences: [
    { x: 470, y: 772, length: 172, thickness: 68 },
    { x: 1645, y: 768, length: 186, thickness: 68 },
    { x: 338, y: 1226, length: 182, thickness: 74 },
    { x: 1735, y: 1224, length: 182, thickness: 74 },
  ],
})

const ORIENTE_RAISED = withPlacements(RAISED_FEATURES, {
  waterSources: { well: { x: 1778, y: 957 } },
  irrigation: { hose: { x: 304, y: 961 } },
  fertilizers: {
    leaves: { x: 1685, y: 1170 },
    plantRemains: { x: 1835, y: 1172 },
    compost: { x: 1555, y: 1077 },
  },
  fences: [
    { x: 485, y: 792, length: 168, thickness: 64 },
    { x: 1640, y: 788, length: 184, thickness: 64 },
    { x: 342, y: 1228, length: 176, thickness: 70 },
    { x: 1735, y: 1226, length: 176, thickness: 70 },
  ],
})

const GALAPAGOS_GROUND = withPlacements(COSTA_GROUND, {
  irrigation: { hose: { x: 1736, y: 932 } },
  fertilizers: {
    leaves: { x: 1660, y: 1180 },
    plantRemains: { x: 1825, y: 1178 },
    compost: { x: 1540, y: 1072 },
  },
  fences: [
    { x: 270, y: 756, length: 170, thickness: 66 },
    { x: 1615, y: 760, length: 188, thickness: 66 },
    { x: 300, y: 1218, length: 180, thickness: 72 },
    { x: 1742, y: 1218, length: 180, thickness: 72 },
  ],
})

const GALAPAGOS_RAISED = withPlacements(RAISED_FEATURES, {
  waterSources: { well: { x: 1778, y: 955 } },
  irrigation: { hose: { x: 300, y: 958 } },
  fertilizers: {
    leaves: { x: 1680, y: 1176 },
    plantRemains: { x: 1830, y: 1175 },
    compost: { x: 1560, y: 1084 },
  },
  fences: [
    { x: 295, y: 774, length: 168, thickness: 62 },
    { x: 1615, y: 776, length: 184, thickness: 62 },
    { x: 312, y: 1220, length: 174, thickness: 68 },
    { x: 1738, y: 1220, length: 174, thickness: 68 },
  ],
})

/** Ground infrastructure is kept in reserved margins around the shared six-plot footprint. */
const FEATURE_PLACEMENT_OVERRIDES: Partial<Record<GardenRegion, Partial<Record<GardenKind, GardenFeaturePlacements>>>> = {
  costa: { ground: COSTA_GROUND, pots: RAISED_FEATURES, vertical: RAISED_FEATURES, hanging: RAISED_FEATURES },
  sierra: { ground: SIERRA_GROUND, pots: SIERRA_RAISED, vertical: SIERRA_RAISED, hanging: SIERRA_RAISED },
  oriente: { ground: ORIENTE_GROUND, pots: ORIENTE_RAISED, vertical: ORIENTE_RAISED, hanging: ORIENTE_RAISED },
  galapagos: { ground: GALAPAGOS_GROUND, pots: GALAPAGOS_RAISED, vertical: GALAPAGOS_RAISED, hanging: GALAPAGOS_RAISED },
}

export function gardenFeaturePlacements(region: GardenRegion, kind: GardenKind) {
  return FEATURE_PLACEMENT_OVERRIDES[region]?.[kind]
}
