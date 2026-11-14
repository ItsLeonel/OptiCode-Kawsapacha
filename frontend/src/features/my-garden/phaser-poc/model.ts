import type { GardenRegion } from '../../real-gardens/garden-region'
import { toGardenFeatures, type GardenFeatures } from '../../real-gardens/garden-characteristics'
import type { GardenKind, RealGarden } from '../../real-gardens/real-garden'
import { PLOT_COUNT, type GardenPlant } from '../garden'
import { layoutSlot, type WorldPoint } from './layouts'
import { SOIL_STYLES, type SoilStyle } from './visual-config'
import { activityAffectsPlot, type GardenActivity } from '../journal/activities'
import { coastalFootprintScale } from './coastal-bed'

export { LAYOUT_PROFILES, projectGround } from './layouts'
export type { WorldPoint } from './layouts'

export type SlotId = `garden-slot-${number}`
export type VisualSlot = Readonly<{
  id: SlotId
  plot: number
  anchor: WorldPoint
  base: WorldPoint
  depth: number
  design: GardenFeatures['groundDesigns'][number] | null
  plant: Readonly<GardenPlant> | null
  lastPreparedAt?: string
  lastFertilizedAt?: string
  lastWateredAt?: string
  lastWeededAt?: string
}>

export type GardenVisualModel = Readonly<{
  kind: GardenKind
  region: GardenRegion
  name: string
  location: Readonly<RealGarden['location']>
  areaM2: number
  footprintScale: number
  soilType: RealGarden['soilType']
  soilStyle: SoilStyle
  irrigationAvailability: RealGarden['irrigationAvailability']
  characteristics: GardenFeatures
  slots: readonly VisualSlot[]
  activitySource: 'not-connected' | 'local-records'
}>

/** No inferred sowing, watering, growth or harvest. No mutation of visit records. */
export function buildGardenVisualModel(garden: RealGarden, plants: readonly GardenPlant[], region: GardenRegion, activities?: readonly GardenActivity[]): GardenVisualModel {
  // Every ground region reflects registered area; Costa keeps the exact same scale curve.
  const footprintScale = garden.kind === 'ground'
    ? coastalFootprintScale(garden.areaM2)
    : .9 + .1 * Math.sqrt(garden.areaM2 / (garden.areaM2 + 25))
  const characteristics = toGardenFeatures(garden.characteristics)
  return {
    kind: garden.kind,
    region,
    name: garden.name,
    location: { ...garden.location, coordinates: garden.location.coordinates ? { ...garden.location.coordinates } : null },
    areaM2: garden.areaM2,
    footprintScale,
    soilType: garden.soilType,
    soilStyle: SOIL_STYLES[garden.soilType ?? 'unknown'],
    irrigationAvailability: garden.irrigationAvailability,
    characteristics,
    slots: Array.from({ length: PLOT_COUNT }, (_, plot) => {
      const { anchor, base } = layoutSlot(garden.kind, plot, footprintScale, region)
      const plant = plants.find(record => record.plot === plot)
      // Multiple recorded designs are shown schematically; no physical plot assignment is saved.
      const designs = garden.kind === 'ground' ? characteristics.groundDesigns : []
      const latest = (type: GardenActivity['type']) => activities?.filter(activity => activity.type === type && activityAffectsPlot(activity, plot)).map(activity => activity.date).sort().at(-1)
      return { id: `garden-slot-${plot}`, plot, anchor, base, depth: base.y, design: designs.length ? designs[plot % designs.length] : null, plant: plant ? { ...plant } : null, lastPreparedAt: latest('preparation'), lastFertilizedAt: latest('fertilizing'), lastWateredAt: latest('watering'), lastWeededAt: latest('weeding') }
    }),
    activitySource: activities ? 'local-records' : 'not-connected',
  }
}
