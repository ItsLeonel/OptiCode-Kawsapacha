import type { GardenRegion } from '../real-gardens/garden-region'

const POT_ORDER: Record<GardenRegion, readonly number[]> = {
  sierra: [0, 5, 3, 1, 4, 2],
  costa: [0, 1, 2, 3, 4, 5],
  oriente: [1, 5, 0, 2, 3, 4],
  galapagos: [3, 4, 0, 5, 1, 2],
}
const POT_BASE = [481, 480, 481, 457, 457, 449]
const SOIL_FROM_BOTTOM = [.75, .67, .72, .74, .74, .69]

export function potArtwork(region: GardenRegion, slot: number) {
  const variant = POT_ORDER[region][slot]
  return { variant, column: variant % 3, row: Math.floor(variant / 3), offsetY: 480 - POT_BASE[variant], soilFromBottom: SOIL_FROM_BOTTOM[variant] }
}

