import type { GardenRegion } from '../../real-gardens/garden-region'

/** Existing independent art; no screen capture is used as a texture. */
export const LANDSCAPES: Record<GardenRegion, string> = {
  sierra: new URL('./art/paisaje-sierra-v1.png', import.meta.url).href,
  costa: new URL('./art/paisaje-costa-v1.png', import.meta.url).href,
  oriente: new URL('./art/paisaje-amazonia-v1.png', import.meta.url).href,
  galapagos: new URL('./art/paisaje-galapagos-v1.png', import.meta.url).href,
}
export const TRELLIS_ART = new URL('./art/bastidor-natural-v3.png', import.meta.url).href
export const PERGOLA_ART = new URL('./art/pergola-natural-v3.png', import.meta.url).href
export const SUPPLIES_ART = new URL('./art/materiales-huerto-v3.png', import.meta.url).href
export const INFRASTRUCTURE_ART = new URL('./art/infraestructura-natural-v4.png', import.meta.url).href
export const MODULAR_ART = new URL('./art/entorno-modular-v1.png', import.meta.url).href
export const MATERIAL_ART = new URL('./art/materiales-v1.png', import.meta.url).href
export const ORGANIC_SOIL_ART = new URL('./art/suelos-organicos-v2.png', import.meta.url).href
export const POTS_ART = new URL('../illustrations/macetas-v3.png', import.meta.url).href
export const TROUGH_ART = new URL('../illustrations/jardinera-vertical-profunda-v4.png', import.meta.url).href
export const BED_ART = new URL('../../../assets/cama-cultivo-v2.png', import.meta.url).href
export const BORDER_ART = new URL('../illustrations/bordes-regionales-v3.png', import.meta.url).href
export const COSTA_PLOT_ART = [
  new URL('./art/costa-v1/parcela-plana-costa-a.png', import.meta.url).href,
  new URL('./art/costa-v1/parcela-plana-costa-b.png', import.meta.url).href,
  new URL('./art/costa-v1/parcela-plana-costa-c.png', import.meta.url).href,
  new URL('./art/costa-v1/parcela-plana-costa-d.png', import.meta.url).href,
  new URL('./art/costa-v1/parcela-plana-costa-e.png', import.meta.url).href,
  new URL('./art/costa-v1/parcela-plana-costa-f.png', import.meta.url).href,
] as const
export const COSTA_MARSH_PLOT_ART = new URL('./art/costa-v1/parcela-pantanosa-costa.png', import.meta.url).href
export const COSTA_FENCE_ART = {
  segment: new URL('./art/costa-v1/cerca-malla-costa-tramo.png', import.meta.url).href,
  foliage: new URL('./art/costa-v1/cerca-malla-costa-tramo-flora.png', import.meta.url).href,
  corner: new URL('./art/costa-v1/cerca-malla-costa-esquina.png', import.meta.url).href,
  gate: new URL('./art/costa-v1/cerca-malla-costa-puerta.png', import.meta.url).href,
} as const
export const WORLD = { width: 1920, height: 1500, centerX: 1030, centerY: 875 } as const
export const SCENE_LAYERS = ['landscape', 'ground', 'structures', 'parcels', 'plants', 'effects', 'feedback'] as const

/** Hand calibrated transparent frames. Source files are never modified. */
export const PROP_FRAMES = {
  house: [0, 80, 550, 420], tank: [600, 75, 370, 425], compost: [1035, 75, 500, 430],
  fence: [15, 675, 495, 320], wall: [520, 560, 505, 435], pergola: [1025, 575, 510, 425],
} as const

export function photoTextureKey(id: string, url: string) {
  // URLs may change while the plant id stays stable (and may contain private data).
  let hash = 2166136261
  for (let index = 0; index < url.length; index++) hash = Math.imul(hash ^ url.charCodeAt(index), 16777619)
  return `evidence-${id}-${hash >>> 0}`
}
