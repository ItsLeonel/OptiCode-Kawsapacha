import type { GardenRegion } from '../real-gardens/garden-region'
import { gameRegionAssets } from '../../shared/ui/game-ui/game-region-assets'

/** Approved original characters, kept independent from every landscape and crop. */
export const GARDEN_GUIDES: Record<GardenRegion, string> = {
  sierra: gameRegionAssets.sierra.guide,
  costa: gameRegionAssets.costa.guide,
  oriente: gameRegionAssets.oriente.guide,
  galapagos: gameRegionAssets.galapagos.guide,
}
