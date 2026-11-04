import type { GardenRegion } from '../real-gardens/garden-region'

export const SCENE_ART = {
  pots: new URL('./illustrations/macetas-v3.png', import.meta.url).href,
  vertical: new URL('./illustrations/bastidor-vertical-abierto-v4.png', import.meta.url).href,
  verticalPlanter: new URL('./illustrations/jardinera-vertical-profunda-v4.png', import.meta.url).href,
  hanging: new URL('./illustrations/pergola-v3.png', import.meta.url).href,
  ground: new URL('./illustrations/terreno-v3.png', import.meta.url).href,
  borders: new URL('./illustrations/bordes-regionales-v3.png', import.meta.url).href,
} as const

// The coordinates refer to the empty soil mouths in the decorative artwork.
// Plant records always keep their original slot; the illustration never supplies plant data.
export const VERTICAL_POINTS = [
  [32.3, 31.4], [68.4, 31.4], [32.3, 49.3],
  [68.4, 49.3], [32.3, 68.0], [68.4, 68.0],
] as const
export const HANGING_POINTS = [
  [29.8, 41.6], [50.1, 41.6], [71.0, 41.6],
  [29.8, 76.8], [50.1, 76.8], [71.0, 76.8],
] as const

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

export const REGIONAL_SURFACES: Record<GardenRegion, string> = {
  sierra: 'suelo-andino', costa: 'tierra-calida', oriente: 'madera-humeda', galapagos: 'piedra-volcanica',
}
