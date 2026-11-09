import type { SoilType } from '../../real-gardens/real-garden'
import type { SoilStyle } from './visual-config'
import type { VisualSlot } from './model'

/** The original coastal plot art remains the base, including its grass, stones and alpha. */
const DESIGN_FRAME: Partial<Record<NonNullable<VisualSlot['design']>, number>> = {
  furrows: 1,
  beds: 2,
  raisedBeds: 3,
  terraces: 4,
}

const clamp = (value: number, min = 0, max = 1) => Math.max(min, Math.min(max, value))

/**
 * A descriptive soil tint for the *interior* of the existing coastal bed.
 * It is not a claim about actual moisture, fertility, texture or soil analysis.
 *
 * Source pixels are read afresh for each (plot, soil, design) texture. The
 * effect never accumulates across edits and cannot recolour the scenery.
 */
function tintCoastalSoil(ctx: CanvasRenderingContext2D, soilType: SoilType | null, style: SoilStyle) {
  if (!soilType || soilType === 'loam' || soilType === 'marsh' || soilType === 'other' || soilType === 'unknown') return
  const { width, height } = ctx.canvas
  const image = ctx.getImageData(0, 0, width, height)
  const pixels = image.data
  const reference: readonly number[] = [129, 81, 47] // Original neutral earth hue.
  const target: readonly number[] = [style.earth >>> 16, (style.earth >>> 8) & 255, style.earth & 255]
  const factor = target.map((value, channel) => value / reference[channel])

  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const offset = (y * width + x) * 4
    if (pixels[offset + 3] === 0) continue

    // Restrict tint to the oval INSIDE the approved coastal bed artwork.
    // Feathering protects grass, framing stones and transparent borders.
    const ellipseX = (x - width * .5) / (width * .415)
    const ellipseY = (y - height * .51) / (height * .335)
    const distance = ellipseX * ellipseX + ellipseY * ellipseY
    if (distance >= 1) continue
    const interior = clamp((1 - distance) / .28)

    const r = pixels[offset], g = pixels[offset + 1], b = pixels[offset + 2]
    // The hue test excludes green leaves, grey stones and bluish wet areas.
    const brown = clamp((r - g - 8) / 28) * clamp((g - b - 2) / 20)
    const blend = interior * brown * .92
    if (blend < .001) continue
    for (let channel = 0; channel < 3; channel++) {
      pixels[offset + channel] = Math.round(clamp(pixels[offset + channel] * (1 + (factor[channel] - 1) * blend), 0, 255))
    }
  }
  ctx.putImageData(image, 0, 0)
}

/**
 * Composite a recorded bed layout INSIDE the unchanged plot silhouette.
 * The existing organic-soil atlas provides four recognizable earth reliefs.
 */
export function paintCoastalBed(
  ctx: CanvasRenderingContext2D,
  coastalBed: HTMLImageElement,
  soilType: SoilType | null,
  style: SoilStyle,
  design: VisualSlot['design'],
  organicSoilAtlas?: HTMLImageElement,
) {
  const width = ctx.canvas.width, height = ctx.canvas.height
  ctx.drawImage(coastalBed, 0, 0, width, height)
  const frame = design ? DESIGN_FRAME[design] : undefined
  if (frame !== undefined && organicSoilAtlas) {
    const sourceX = (frame % 3) * 512
    const sourceY = Math.floor(frame / 3) * 512
    ctx.save()
    ctx.beginPath()
    ctx.ellipse(width * .5, height * .50, width * .39, height * .325, 0, 0, Math.PI * 2)
    ctx.clip()
    ctx.globalAlpha = soilType === 'marsh' ? .66 : .91
    // The source shape has soft transparent edges; the crop cannot hide the
    // outer grassy rim or resize the six approved coastal plot PNGs.
    ctx.drawImage(organicSoilAtlas, sourceX, sourceY, 512, 512,
      width * .065, height * .085, width * .87, height * .84)
    ctx.restore()
  }
  tintCoastalSoil(ctx, soilType, style)
}

/** Original coastal beds remain the fallback ONLY when no other layout is selected. */
export function paintCoastalOriginalBed(
  ctx: CanvasRenderingContext2D,
  coastalBed: HTMLImageElement,
  soilType: SoilType | null,
  style: SoilStyle,
) {
  ctx.drawImage(coastalBed, 0, 0, ctx.canvas.width, ctx.canvas.height)
  tintCoastalSoil(ctx, soilType, style)
}

/** Mixed distributions: standalone transparent relieves, never on top of a bed. */
export function paintCoastalStandaloneRelief(
  ctx: CanvasRenderingContext2D,
  atlas: HTMLImageElement,
  soilType: SoilType | null,
  style: SoilStyle,
  design: NonNullable<VisualSlot['design']>,
) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
  const frame = DESIGN_FRAME[design]
  if (frame === undefined) throw new Error(`Distribución sin recurso: ${design}`)
  ctx.drawImage(atlas, frame % 3 * 512, Math.floor(frame / 3) * 512, 512, 512,
    0, 0, ctx.canvas.width, ctx.canvas.height)
  if (soilType !== 'marsh') tintReliefSoil(ctx, soilType, style)
}

function tintReliefSoil(ctx: CanvasRenderingContext2D, soilType: SoilType | null, style: SoilStyle) {
  if (!soilType || soilType === 'loam' || soilType === 'other' || soilType === 'unknown') return
  const image = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height)
  const px = image.data
  const tint = [style.earth >>> 16, (style.earth >>> 8) & 255, style.earth & 255]
  const original = [129, 81, 47]
  for (let i = 0; i < px.length; i += 4) {
    if (px[i + 3] < 10) continue
    const r = px[i], g = px[i + 1], b = px[i + 2]
    const brown = clamp((r - g - 7) / 27) * clamp((g - b - 1) / 19)
    if (!brown) continue
    for (let c = 0; c < 3; c++) px[i + c] = Math.round(clamp(px[i + c] * (1 + (tint[c] / original[c] - 1) * brown * .85), 0, 255))
  }
  ctx.putImageData(image, 0, 0)
}

/** Match the exact approved plot width/paths at the 54 m² reference. */
export const COASTAL_REFERENCE_SCALE = .9 + .1 * Math.sqrt(54 / (54 + 25))

/** Visual schematic footprint, NOT an exact real-world square-metre projection. */
export function coastalFootprintScale(areaM2: number) {
  if (!Number.isFinite(areaM2) || areaM2 <= 0) return COASTAL_REFERENCE_SCALE
  // 54 m² preserves the approved coastal arrangement exactly. Values outside
  // the displayable range are capped to protect all six plots and the HUD.
  return clamp(COASTAL_REFERENCE_SCALE * Math.pow(areaM2 / 54, .27), .72, 1.10)
}
