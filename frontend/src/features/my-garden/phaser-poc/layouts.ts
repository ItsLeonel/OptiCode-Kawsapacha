import type { GardenKind } from '../../real-gardens/real-garden'
import type { GardenRegion } from '../../real-gardens/garden-region'
import { potArtwork } from '../pot-artwork'

export type WorldPoint = Readonly<{ x: number; y: number }>

/** Measured source pixels: opening center and actual contact, excluding transparent padding. */
export const POT_GEOMETRY = [
  { mouth: 132, base: 481 }, { mouth: 136, base: 480 }, { mouth: 132, base: 481 },
  { mouth: 108, base: 457 }, { mouth: 132, base: 457 }, { mouth: 136, base: 449 },
] as const

export const VERTICAL_GROUPS = [
  { x: 625, y: 1080, width: 450 }, { x: 1010, y: 940, width: 450 }, { x: 1400, y: 1110, width: 450 },
] as const
export const HANGING_GROUPS = [
  { x: 1080, y: 1000, width: 720 }, { x: 590, y: 1280, width: 450 }, { x: 1530, y: 1190, width: 330 },
] as const
export function hangingGeometry(plot: number) {
  const group = HANGING_GROUPS[plot < 3 ? 0 : plot < 5 ? 1 : 2]
  const offset = plot < 3 ? (plot - 1) * 175 : plot < 5 ? (plot - 3.5) * 145 : 0
  const x = group.x + offset
  const top = group.y - group.width * .54 - offset * .075
  return { x, y: top + (plot < 3 ? 160 : 100), hookY: top, base: { x, y: group.y - offset * .08 }, width: plot < 3 ? 182 : 160 }
}

/** Geometry belongs to the illustration; it never changes plot identifiers. */
export const LAYOUT_PROFILES = {
  ground: { implemented: true, label: 'En tierra', support: 'continuous-ground', icon: 'seed', hitX: 138, hitY: 85 },
  pots: { implemented: true, label: 'Macetas', support: 'grounded-containers', icon: 'pot', hitX: 125, hitY: 88 },
  vertical: { implemented: true, label: 'Vertical', support: 'anchored-frame', icon: 'vertical', hitX: 112, hitY: 55 },
  hanging: { implemented: true, label: 'Colgante', support: 'grounded-pergola', icon: 'hanging', hitX: 70, hitY: 62 },
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
  const base = projectGround(column, row, scale)
  if (kind === 'vertical') {
    const group = VERTICAL_GROUPS[column]
    const anchor = { x: group.x, y: group.y - group.width * (row ? .18 : .53) }
    return { anchor, base: { x: group.x, y: group.y } }
  }
  if (kind === 'hanging') {
    const geometry = hangingGeometry(plot)
    return { anchor: { x: geometry.x, y: geometry.y }, base: geometry.base }
  }
  const pot = POT_GEOMETRY[potArtwork(region, plot).variant]
  return { base, anchor: kind === 'pots' ? { x: base.x, y: base.y - (pot.base - pot.mouth) / 512 * (row ? 245 : 213) * scale } : base }
}
