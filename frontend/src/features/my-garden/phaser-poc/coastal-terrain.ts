import { COASTAL_REFERENCE_SCALE } from './coastal-bed'
import type { VisualSlot } from './model'

/** Each recorded distribution uses its own transparent artwork.
 * No continuous earth slab, rectangular bed beneath it or new gameplay state.
 * Camera/plot coordinates remain owned by layouts.ts.
 */
export type CoastalRelief = NonNullable<VisualSlot['design']>

export const COASTAL_RELIEF_ART: Record<CoastalRelief, string> = {
  beds: new URL('./art/costa-v1/costa-beds-reference-v1.png', import.meta.url).href,
  furrows: new URL('./art/costa-v1/costa-furrows-reference-v1.png', import.meta.url).href,
  raisedBeds: new URL('./art/costa-v1/costa-raisedBeds-reference-v1.png', import.meta.url).href,
  terraces: new URL('./art/costa-v1/costa-terraces-reference-v1.png', import.meta.url).href,
}

export const COASTAL_RELIEF_KEY: Record<CoastalRelief, string> = {
  beds: 'costa-distribution-beds-v1',
  furrows: 'costa-distribution-furrows-v1',
  raisedBeds: 'costa-distribution-raisedBeds-v1',
  terraces: 'costa-distribution-terraces-v1',
}

export function isCoastalRelief(design: VisualSlot['design']): design is CoastalRelief {
  return design !== null
}

/** Shared footprint factor keeps Costa's anchors, paths, hit targets and art in sync. */
export function coastalFootprintRatio(footprintScale: number) {
  return Math.max(.72, Math.min(1.06, footprintScale / COASTAL_REFERENCE_SCALE))
}

type CoastalFrame = Readonly<{ x: number; y: number; width: number; height: number }>
const frameCache = new WeakMap<HTMLImageElement, readonly CoastalFrame[]>()

/** The approved PNGs are 3×2 sheets with one transparent plot in each cell. */
export function coastalReliefFrame(source: HTMLImageElement, plot: number): CoastalFrame {
  let frames = frameCache.get(source)
  if (!frames) {
    frames = Array.from({ length: 6 }, (_, index) => scanCoastalFrame(source, index))
    frameCache.set(source, frames)
  }
  return frames[plot] ?? scanCoastalFrame(source, plot)
}

function scanCoastalFrame(source: HTMLImageElement, plot: number): CoastalFrame {
  const column = plot % 3, row = Math.floor(plot / 3)
  const cellWidth = source.width / 3
  const cellHeight = source.height / 2
  const probe = document.createElement('canvas')
  probe.width = Math.ceil(cellWidth)
  probe.height = Math.ceil(cellHeight)
  const context = probe.getContext('2d', { willReadFrequently: true })
  if (!context) return { x: column * cellWidth, y: row * cellHeight, width: cellWidth, height: cellHeight }
  context.drawImage(source, column * cellWidth, row * cellHeight, cellWidth, cellHeight, 0, 0, probe.width, probe.height)
  const { data } = context.getImageData(0, 0, probe.width, probe.height)
  let left = probe.width, top = probe.height, right = -1, bottom = -1
  for (let y = 0; y < probe.height; y++) for (let x = 0; x < probe.width; x++) {
    if (data[(y * probe.width + x) * 4 + 3] <= 16) continue
    left = Math.min(left, x); top = Math.min(top, y)
    right = Math.max(right, x); bottom = Math.max(bottom, y)
  }
  if (right < left || bottom < top) return { x: column * cellWidth, y: row * cellHeight, width: cellWidth, height: cellHeight }
  const padding = 8
  left = Math.max(0, left - padding); top = Math.max(0, top - padding)
  right = Math.min(probe.width - 1, right + padding); bottom = Math.min(probe.height - 1, bottom + padding)
  const scaleX = cellWidth / probe.width, scaleY = cellHeight / probe.height
  return {
    x: column * cellWidth + left * scaleX,
    y: row * cellHeight + top * scaleY,
    width: (right - left + 1) * scaleX,
    height: (bottom - top + 1) * scaleY,
  }
}

/** Width and depth are visual approximations, not measured topographic survey.
 * At 54 m² the layout keeps the original 3x2 spacing and a clear access path.
 */
export function coastalReliefGeometry(plot: number, design: CoastalRelief, footprintScale: number) {
  const back = plot < 3
  const ratio = coastalFootprintRatio(footprintScale)
  const width = (back ? 310 : 320) * ratio
  const heights: Record<CoastalRelief, readonly [number, number]> = {
    beds: [146, 156],
    furrows: [142, 152],
    raisedBeds: [146, 156],
    terraces: [152, 162],
  }
  const height = (back ? heights[design][0] : heights[design][1]) * ratio
  return { width, height }
}
