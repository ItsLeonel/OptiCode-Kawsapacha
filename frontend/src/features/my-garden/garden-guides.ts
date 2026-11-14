import type { GardenRegion } from '../real-gardens/garden-region'

/** Approved original characters, kept independent from every landscape and crop. */
export const GARDEN_GUIDES: Record<GardenRegion, string> = {
  sierra: new URL('../../shared/assets/comunidad-v3/personajes/personaje_sierra_v3.png', import.meta.url).href,
  costa: new URL('../../shared/assets/comunidad-v3/personajes/personaje_costa_v3.png', import.meta.url).href,
  oriente: new URL('../../shared/assets/comunidad-v3/personajes/personaje_oriente_v3.png', import.meta.url).href,
  galapagos: new URL('../../shared/assets/comunidad-v3/personajes/personaje_galapagos_v3.png', import.meta.url).href,
}
