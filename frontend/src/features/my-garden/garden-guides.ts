import type { GardenRegion } from '../real-gardens/garden-region'

/** Approved original characters, kept independent from every landscape and crop. */
export const GARDEN_GUIDES: Record<GardenRegion, string> = {
  sierra: new URL('./phaser-poc/art/guides/sierra.png', import.meta.url).href,
  costa: new URL('./phaser-poc/art/guides/costa.png', import.meta.url).href,
  oriente: new URL('./phaser-poc/art/guides/oriente.png', import.meta.url).href,
  galapagos: new URL('./phaser-poc/art/guides/galapagos.png', import.meta.url).href,
}
