import { coastalFootprintRatio } from './coastal-terrain'
import type { GardenVisualModel } from './model'
import { noise } from './paint-materials'

type Context = CanvasRenderingContext2D
type Region = Exclude<GardenVisualModel['region'], 'costa'>

/** Palette applies ONLY to the subtle paths and contact shadows, not to the
 * terrain background. Its actual soil/vegetation lives in region-scenes/*.webp.
 */
const PALETTE: Record<Region, { wear: string; edge: string; shade: string; fleck: string }> = {
  sierra: { wear: '#a29356', edge: '#547043', shade: '#26371e', fleck: '#efe1a4' },
  oriente: { wear: '#655c3a', edge: '#365638', shade: '#142f25', fleck: '#b0c57c' },
  galapagos: { wear: '#564d43', edge: '#79745d', shade: '#292821', fleck: '#c2b49a' },
}

function contact(ctx: Context, x: number, y: number, rx: number, ry: number, color: string, strength = .24) {
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(1, ry / rx)
  const shade = ctx.createRadialGradient(0, 0, 0, 0, 0, rx)
  shade.addColorStop(0, color)
  shade.addColorStop(.48, color + '77')
  shade.addColorStop(1, color + '00')
  ctx.globalAlpha = strength
  ctx.fillStyle = shade
  ctx.fillRect(-rx, -rx, rx * 2, rx * 2)
  ctx.restore()
}

/** Shared, transparent finishing layer for En tierra, Macetas, Vertical and
 * Colgante. It never paints an opaque lawn, no matter the region or camera.
 * The entire visible landscape and soil originate from the SAME image.
 */
export function paintRegionalTerrain(ctx: Context, model: GardenVisualModel) {
  if (model.region === 'costa') return
  const palette = PALETTE[model.region]
  const ground = model.kind === 'ground'
  const ratio = coastalFootprintRatio(model.footprintScale)

  if (ground) {
    // Very fine, broken trails in the free aisles between 3 x 2 crop spaces.
    // The reference landscape remains visible beneath every mark.
    const paths = [
      new Path2D('M 844 804 C 856 872 837 959 849 1040 C 842 1120 854 1177 847 1230'),
      new Path2D('M 1218 804 C 1207 868 1224 954 1217 1030 C 1205 1120 1222 1191 1217 1230'),
      new Path2D('M 475 991 C 680 976 855 1000 1035 991 S 1410 989 1590 992'),
    ]
    ctx.save()
    ctx.translate(1030, 990)
    ctx.scale(ratio, ratio)
    ctx.translate(-1030, -990)
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'
    for (const path of paths) {
      ctx.strokeStyle = palette.shade
      ctx.globalAlpha = .05
      ctx.lineWidth = 28
      ctx.stroke(path)
      ctx.strokeStyle = palette.wear
      ctx.globalAlpha = .14
      ctx.lineWidth = 18
      ctx.stroke(path)
      ctx.strokeStyle = palette.edge
      ctx.globalAlpha = .12
      ctx.lineWidth = 6
      ctx.stroke(path)
    }
    ctx.restore()

    // Bed-to-earth contact; irregular source artwork has its own feathered rim.
    for (const slot of model.slots) {
      contact(ctx, slot.anchor.x + 5, slot.anchor.y + 29 * ratio,
        190 * ratio, 51 * ratio, palette.shade, .24)
    }
  } else {
    // Pots / trellises / pergolas use the same clearing and only their own
    // localized support shadows. No alternate rectangular floor is painted.
    for (const slot of model.slots) {
      if (model.kind === 'pots') contact(ctx, slot.base.x + 4, slot.base.y + 12, 86, 27, palette.shade, .25)
    }
  }

  // Extremely sparse flecks inherit the regional pigment; skip most of the
  // cropped foreground artwork and every crop footprint.
  ctx.save()
  for (let i = 0; i < 235; i++) {
    const x = 220 + noise(i, 725) * 1480
    const y = 810 + noise(i, 726) * 470
    if (ground && model.slots.some(slot => Math.abs(slot.anchor.x - x) < 165 * ratio && Math.abs(slot.anchor.y - y) < 115 * ratio)) continue
    ctx.globalAlpha = .12 + noise(i, 727) * .09
    ctx.fillStyle = i % 3 ? palette.edge : palette.fleck
    ctx.beginPath()
    ctx.ellipse(x, y, 1.4 + noise(i, 728) * 2.5, .65 + noise(i, 729), 0, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}
