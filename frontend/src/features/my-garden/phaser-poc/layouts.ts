import { coastalFootprintRatio } from './coastal-terrain'
import type { GardenKind } from '../../real-gardens/real-garden'
import type { GardenRegion } from '../../real-gardens/garden-region'
import { potArtwork } from '../pot-artwork'

export type WorldPoint = Readonly<{ x: number; y: number }>

type Mouth = Readonly<{ x: number; y: number }>
export type PotFrameGeometry = Readonly<{
  frame: number
  mouthX: number
  mouthY: number
  baseY: number
}>

/** Native image placement. Phaser's picture and the interactive plots share these values. */
export const REGIONAL_SUPPORT_PLACEMENT = { x: 330, y: 400, width: 1400, height: 900 } as const

/** Existing legacy pot-source measurements, retained for Sierra's ceramic atlas. */
export const POT_GEOMETRY = [
  { mouth: 132, base: 481 }, { mouth: 136, base: 480 }, { mouth: 132, base: 481 },
  { mouth: 108, base: 457 }, { mouth: 132, base: 457 }, { mouth: 136, base: 449 },
] as const

/** Regional art source coordinates, measured at the visible soil surface.
 * The 6 positions are ordered by permanent plot id, not by drawing depth.
 */
export const REGIONAL_SUPPORT_MOUTHS: Record<GardenRegion, Readonly<{ vertical: readonly Mouth[]; hanging: readonly Mouth[] }>> = {
  sierra: {
    vertical: [
      { x: 481, y: 275 }, { x: 895, y: 275 },
      { x: 486, y: 448 }, { x: 915, y: 445 },
      { x: 494, y: 622 }, { x: 930, y: 621 },
    ],
    hanging: [
      { x: 491, y: 337 }, { x: 681, y: 337 }, { x: 871, y: 337 },
      { x: 490, y: 576 }, { x: 679, y: 578 }, { x: 873, y: 578 },
    ],
  },
  costa: {
    vertical: [
      { x: 530, y: 278 }, { x: 809, y: 278 },
      { x: 535, y: 441 }, { x: 826, y: 441 },
      { x: 543, y: 599 }, { x: 845, y: 603 },
    ],
    hanging: [
      { x: 485, y: 354 }, { x: 677, y: 354 }, { x: 861, y: 354 },
      { x: 485, y: 580 }, { x: 677, y: 580 }, { x: 863, y: 580 },
    ],
  },
  oriente: {
    vertical: [
      { x: 551, y: 310 }, { x: 831, y: 310 },
      { x: 547, y: 448 }, { x: 835, y: 448 },
      { x: 544, y: 589 }, { x: 845, y: 589 },
    ],
    hanging: [
      { x: 499, y: 392 }, { x: 679, y: 392 }, { x: 853, y: 392 },
      { x: 499, y: 591 }, { x: 677, y: 591 }, { x: 853, y: 591 },
    ],
  },
  galapagos: {
    vertical: [
      { x: 474, y: 251 }, { x: 806, y: 253 },
      { x: 466, y: 418 }, { x: 821, y: 417 },
      { x: 458, y: 584 }, { x: 827, y: 585 },
    ],
    hanging: [
      { x: 486, y: 361 }, { x: 693, y: 361 }, { x: 886, y: 361 },
      { x: 486, y: 594 }, { x: 693, y: 594 }, { x: 887, y: 594 },
    ],
  },
}

/** Original support fallback profiles, used only if regional art cannot load. */
export const VERTICAL_GROUPS = [
  { x: 805, y: 1180, width: 450 }, { x: 1255, y: 1180, width: 450 },
] as const
export const HANGING_GROUPS = [{ x: 1030, y: 1218, width: 1260 }] as const
export const COASTAL_HANGING_GROUPS = HANGING_GROUPS

/** The regional structure is already rendered as one 1400×900 image. */
export function regionalSupportAnchor(region: GardenRegion, kind: 'vertical' | 'hanging', plot: number): WorldPoint {
  const mouth = REGIONAL_SUPPORT_MOUTHS[region][kind][plot]
  return {
    x: REGIONAL_SUPPORT_PLACEMENT.x + mouth.x * REGIONAL_SUPPORT_PLACEMENT.width / 1400,
    y: REGIONAL_SUPPORT_PLACEMENT.y + mouth.y * REGIONAL_SUPPORT_PLACEMENT.height / 900,
  }
}

export function hangingGeometry(plot: number, region: GardenRegion = 'sierra') {
  const point = regionalSupportAnchor(region, 'hanging', plot)
  return { x: point.x, y: point.y, hookY: point.y - 120, base: { x: point.x, y: point.y + 125 }, width: 270 }
}

/** Source frames for each region's 3×2 sheet; the rim and the actual base
 * are tied to the same transform so a registered plant cannot drift sideways.
 */
const REGIONAL_POT_METRICS: Record<Exclude<GardenRegion, 'sierra'>, readonly Readonly<{ mouthX: number; mouthY: number; baseY: number }>[]> = {
  costa: [
    { mouthX: 276, mouthY: 120, baseY: 464 }, { mouthX: 247, mouthY: 138, baseY: 466 }, { mouthX: 233, mouthY: 126, baseY: 468 },
    { mouthX: 273, mouthY: 115, baseY: 472 }, { mouthX: 250, mouthY: 108, baseY: 471 }, { mouthX: 222, mouthY: 117, baseY: 474 },
  ],
  oriente: [
    { mouthX: 261, mouthY: 138, baseY: 461 }, { mouthX: 242, mouthY: 145, baseY: 463 }, { mouthX: 237, mouthY: 135, baseY: 463 },
    { mouthX: 261, mouthY: 138, baseY: 444 }, { mouthX: 237, mouthY: 131, baseY: 445 }, { mouthX: 236, mouthY: 134, baseY: 445 },
  ],
  galapagos: [
    { mouthX: 253, mouthY: 150, baseY: 457 }, { mouthX: 238, mouthY: 139, baseY: 462 }, { mouthX: 246, mouthY: 125, baseY: 463 },
    { mouthX: 258, mouthY: 127, baseY: 447 }, { mouthX: 251, mouthY: 128, baseY: 447 }, { mouthX: 253, mouthY: 107, baseY: 444 },
  ],
}

export function potFrameGeometry(region: GardenRegion, plot: number): PotFrameGeometry {
  if (region !== 'sierra') return { frame: plot, ...REGIONAL_POT_METRICS[region][plot] }
  const variant = potArtwork(region, plot).variant
  const frame = POT_GEOMETRY[variant]
  return { frame: variant, mouthX: 256, mouthY: frame.mouth, baseY: frame.base }
}

export const LAYOUT_PROFILES = {
  ground: { implemented: true, label: 'En tierra', support: 'continuous-ground', icon: 'seed', hitX: 138, hitY: 85 },
  pots: { implemented: true, label: 'Macetas', support: 'grounded-containers', icon: 'pot', hitX: 108, hitY: 64 },
  vertical: { implemented: true, label: 'Vertical', support: 'anchored-frame', icon: 'vertical', hitX: 106, hitY: 46 },
  hanging: { implemented: true, label: 'Colgante', support: 'grounded-pergola', icon: 'hanging', hitX: 87, hitY: 44 },
} as const satisfies Record<GardenKind, object>

export function projectGround(column: number, row: number, scale = 1): WorldPoint {
  return {
    x: 1040 + ((column - 1) * 350 + (row - .5) * 105) * scale,
    y: 985 + ((row - .5) * 290 - (column - 1) * 28) * scale,
  }
}

export function layoutSlot(kind: GardenKind, plot: number, scale: number, region: GardenRegion = 'sierra') {
  const column = plot % 3
  const row = Math.floor(plot / 3)
  if (kind === 'vertical') {
    const anchor = regionalSupportAnchor(region, 'vertical', plot)
    return { anchor, base: { x: anchor.x, y: anchor.y + 78 } }
  }
  if (kind === 'hanging') {
    const geometry = hangingGeometry(plot, region)
    return { anchor: { x: geometry.x, y: geometry.y }, base: geometry.base }
  }
  if (kind === 'pots') {
    const base = { x: 650 + column * 380, y: row ? 1170 : 931 }
    const width = (row ? 294 : 278) * scale
    const frame = potFrameGeometry(region, plot)
    return {
      anchor: {
        x: base.x + (frame.mouthX - 256) * width / 512,
        y: base.y - (frame.baseY - frame.mouthY) * width / 512,
      },
      base,
    }
  }
  // Preserve the original, approved 3×2 ground layout in all four regions.
  return { anchor: {
    x: 1030 + (660 + column * 370 - 1030) * coastalFootprintRatio(scale),
    y: 990 + ((row === 0 ? 890 : 1090) - 990) * coastalFootprintRatio(scale),
  }, base: {
    x: 1030 + (660 + column * 370 - 1030) * coastalFootprintRatio(scale),
    y: 990 + ((row === 0 ? 890 : 1090) - 990) * coastalFootprintRatio(scale),
  } }
}
