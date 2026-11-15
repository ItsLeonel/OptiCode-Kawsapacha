import { regionForProvince } from '../../../shared/geo/region'
import type { RealGarden } from '../../../shared/contracts/real-garden'
import type { GardenPlant } from '../garden'
import { buildGardenVisualModel } from './model'
import type { GardenActivity } from '../journal/activities'

/** Reuse the existing territorial resolver; do not infer soil from the region. */
export function toGardenVisualModel(garden: RealGarden, plants: readonly GardenPlant[], activities?: readonly GardenActivity[]) {
  return buildGardenVisualModel(garden, plants, regionForProvince(garden.location.province), activities)
}
