import type { GardenVisualModel, VisualSlot } from './model'
import { REGION_STYLES } from './visual-config'
import { WORLD } from './assets'

/** All ground geometry uses the same oblique projection. Heights stay vertical. */
export const GROUND_MATRIX = { a: 1, b: -.115, c: .38, d: .61 } as const
export const noise = (index: number, salt = 1) => {
  let value = Math.imul(index + 1, 374761393) ^ Math.imul(salt + 1, 668265263)
  value = Math.imul(value ^ value >>> 13, 1274126177)
  return ((value ^ value >>> 16) >>> 0) / 4294967296
}
export const hex = (color: number) => '#' + color.toString(16).padStart(6, '0')
type Context = CanvasRenderingContext2D
type Material = 'grass' | 'soil' | 'stone' | 'volcanic'
export type Materials = Partial<Record<Material, CanvasPattern>>

/** A material tint affects warm earth only. Grass, stone and source alpha are preserved. */
export function tintEarth(ctx: Context, model: GardenVisualModel) {
  if (!model.soilType || model.soilType === 'unknown' || model.soilType === 'other' || model.soilType === 'loam') return
  const pixels = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height)
  const rgb = [model.soilStyle.earth >>> 16, model.soilStyle.earth >>> 8 & 255, model.soilStyle.earth & 255]
  const base = [129, 81, 47]
  for (let index = 0; index < pixels.data.length; index += 4) {
    if (!pixels.data[index + 3]) continue
    const r = pixels.data[index], g = pixels.data[index + 1], b = pixels.data[index + 2]
    const mask = Math.max(0, Math.min(1, (r / Math.max(1, g) - 1.12) * 3)) * Math.max(0, Math.min(1, ((r - b) / Math.max(1, r) - .22) * 3))
    for (let channel = 0; channel < 3; channel++) {
      const original = pixels.data[index + channel]
      pixels.data[index + channel] = original * (1 - mask) + Math.min(255, original * rgb[channel] / base[channel]) * mask
    }
  }
  ctx.putImageData(pixels, 0, 0)
}

/** Square material samples repeat in world units. No terrain image is stretched. */
export function makeMaterials(source: HTMLImageElement | HTMLCanvasElement): Materials {
  return Object.fromEntries(['grass', 'soil', 'stone', 'volcanic'].map((name, index) => {
    const tile = document.createElement('canvas')
    tile.width = tile.height = 384
    const ctx = tile.getContext('2d')!
    // Mirror alternate quadrants for continuous edges, then hide repetition with grain.
    for (let row = 0; row < 2; row++) for (let col = 0; col < 2; col++) {
      ctx.save()
      ctx.translate(col ? 384 : 0, row ? 384 : 0)
      ctx.scale(col ? -1 : 1, row ? -1 : 1)
      ctx.drawImage(source, index % 2 * source.width / 2, Math.floor(index / 2) * source.height / 2, source.width / 2, source.height / 2, 0, 0, 192, 192)
      ctx.restore()
    }
    return [name, ctx.createPattern(tile, 'repeat')!]
  }))
}

function grain(ctx: Context, w: number, h: number, count: number, seed: number) {
  for (let index = 0; index < count; index++) {
    const x = noise(index, seed) * w, y = noise(index, seed + 1) * h
    ctx.fillStyle = index % 3 ? '#ffe5ac25' : '#241f1880'
    ctx.beginPath(); ctx.ellipse(x, y, .7 + noise(index, seed + 2) * 2.8, .5 + noise(index, seed + 3) * 1.4, -.15, 0, Math.PI * 2); ctx.fill()
  }
}

export function paintMeadow(ctx: Context, model: GardenVisualModel, materials: Materials, foregroundOnly = false) {
  const style = REGION_STYLES[model.region]
  const gradient = ctx.createLinearGradient(0, 500, 0, WORLD.height)
  gradient.addColorStop(0, hex(style.grassLight)); gradient.addColorStop(.4, hex(style.grass)); gradient.addColorStop(1, hex(style.grassDark))
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, WORLD.width, WORLD.height)
  if (materials.grass) {
    ctx.save(); ctx.transform(1, -.115, .38, .61, -400, 300)
    ctx.globalAlpha = .32; ctx.fillStyle = materials.grass; ctx.fillRect(0, 0, 2800, 2400); ctx.restore()
  }
  // Fine, deterministic blades provide scale without large repeated leaf motifs.
  for (let index = 0; index < 11500; index++) {
    const x = noise(index, 50) * WORLD.width, y = 540 + noise(index, 51) * 960
    const length = 3 + noise(index, 52) * 9
    ctx.strokeStyle = index % 3 ? hex(style.grassLight) + '65' : hex(style.grassDark) + '60'
    ctx.lineWidth = .8 + noise(index, 53)
    ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x - 1, y - length, x - 5, y - length * .7); ctx.stroke()
    if (index % 3 === 0) { ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 2, y - length, x + 7, y - length * .8); ctx.stroke() }
  }
  const light = ctx.createRadialGradient(1130, 620, 60, 1030, 950, 1100)
  light.addColorStop(0, '#fff1a526'); light.addColorStop(.55, '#fff1a500'); light.addColorStop(1, '#173d3b40')
  ctx.fillStyle = light; ctx.fillRect(0, 0, WORLD.width, WORLD.height)
  ctx.globalCompositeOperation = 'destination-in'
  if (foregroundOnly) {
    // The near landscape continues under every object, without veiling the whole horizon.
    const mask = document.createElement('canvas'); mask.width = WORLD.width; mask.height = WORLD.height
    const shape = mask.getContext('2d')!
    shape.fillStyle = 'white'; shape.shadowColor = 'white'; shape.shadowBlur = 38
    shape.beginPath(); shape.moveTo(165, 1500); shape.bezierCurveTo(65, 1120, 250, 720, 505, 640)
    shape.bezierCurveTo(850, 555, 1420, 465, 1720, 600); shape.bezierCurveTo(1890, 710, 1930, 1060, 1920, 1500)
    shape.closePath(); shape.fill(); ctx.drawImage(mask, 0, 0)
  } else {
    const fade = ctx.createLinearGradient(0, 490, 0, 730)
    fade.addColorStop(0, 'transparent'); fade.addColorStop(1, 'white')
    ctx.fillStyle = fade; ctx.fillRect(0, 0, WORLD.width, WORLD.height)
  }
  ctx.globalCompositeOperation = 'source-over'
}

function irregular(ctx: Context, w: number, h: number, seed: number) {
  ctx.beginPath()
  // Rounded earth contours have small deviations; corners never create a panel.
  for (let index = 0; index <= 64; index++) {
    const angle = index / 64 * Math.PI * 2
    const r = 1 + (noise(index % 64, seed) - .5) * .035
    const x = Math.sign(Math.cos(angle)) * Math.abs(Math.cos(angle)) ** .55 * w / 2 * r
    const y = Math.sign(Math.sin(angle)) * Math.abs(Math.sin(angle)) ** .6 * h / 2 * r
    if (!index) ctx.moveTo(x, y); else ctx.lineTo(x, y)
  }
  ctx.closePath()
}

function earth(ctx: Context, model: GardenVisualModel, materials: Materials, w: number, h: number, seed: number) {
  const style = model.soilStyle
  const fill = ctx.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2)
  fill.addColorStop(0, hex(style.light)); fill.addColorStop(.35, hex(style.earth)); fill.addColorStop(1, hex(style.shade))
  ctx.fillStyle = fill; ctx.fillRect(-w / 2, -h / 2, w, h)
  if (materials.soil) {
    ctx.globalCompositeOperation = 'soft-light'; ctx.globalAlpha = .65
    ctx.fillStyle = materials.soil; ctx.fillRect(-w / 2, -h / 2, w, h)
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'
  }
  ctx.save(); ctx.translate(-w / 2, -h / 2); grain(ctx, w, h, Math.round(w * h / 100), seed); ctx.restore()
}

export function paintStone(ctx: Context, x: number, y: number, w: number, h: number, seed: number, volcanic = false) {
  ctx.save(); ctx.translate(x, y)
  ctx.fillStyle = '#142a2440'; ctx.beginPath(); ctx.ellipse(7, 8, w * .55, h * .6, -.1, 0, Math.PI * 2); ctx.fill()
  ctx.translate(0, 5); irregular(ctx, w, h, seed); ctx.fillStyle = volcanic ? '#3e4742' : '#756344'; ctx.fill()
  ctx.translate(0, -6); irregular(ctx, w, h, seed)
  const gradient = ctx.createLinearGradient(0, -h / 2, 0, h / 2)
  gradient.addColorStop(0, volcanic ? '#a4ad97' : '#e8d6a1'); gradient.addColorStop(.5, volcanic ? '#7d8779' : '#c5b07b'); gradient.addColorStop(1, volcanic ? '#56675e' : '#9b895f')
  ctx.fillStyle = gradient; ctx.fill()
  ctx.save(); ctx.clip(); ctx.translate(-w / 2, -h / 2); grain(ctx, w, h, Math.round(w * h / 15), seed + 5); ctx.restore()
  ctx.strokeStyle = volcanic ? '#ccd0b25c' : '#fff4c57a'; ctx.lineWidth = 1.5; ctx.stroke()
  ctx.restore()
}

export function paintFloor(ctx: Context, model: GardenVisualModel, materials: Materials) {
  const style = REGION_STYLES[model.region]
  // Worn earth is part of the meadow, with feathered edges and world-sized grain.
  ctx.save(); ctx.translate(1030, 990)
  const m = GROUND_MATRIX; ctx.transform(m.a, m.b, m.c, m.d, 0, 0)
  const w = model.kind === 'ground' ? 1090 : 1020, h = model.kind === 'ground' ? 740 : 580
  for (let edge = 20; edge > 0; edge -= 4) {
    irregular(ctx, w + edge * 4, h + edge * 4, 80)
    ctx.fillStyle = hex(style.path) + '0b'; ctx.fill()
  }
  irregular(ctx, w, h, 80); ctx.save(); ctx.clip()
  // A selected layout sits in a connected clearing; neutral soil has no invented rows.
  if (model.kind === 'ground') earth(ctx, model, materials, w, h, 91)
  else {
    ctx.fillStyle = hex(style.path); ctx.globalAlpha = .75; ctx.fill(); ctx.globalAlpha = 1
    grain(ctx, w, h, 2000, 91)
  }
  ctx.restore(); ctx.restore()

  const paths = [
    new Path2D('M 1010 1500 C 1030 1350 940 1230 740 1200 C 420 1150 340 960 325 850'),
    new Path2D('M 450 1000 C 770 990 1160 915 1590 888'),
  ]
  paths.forEach(path => {
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'
    for (let edge = 8; edge > 0; edge--) { ctx.strokeStyle = hex(style.path) + '0a'; ctx.lineWidth = 72 + edge * 5; ctx.stroke(path) }
    ctx.strokeStyle = hex(style.path); ctx.lineWidth = 66; ctx.stroke(path)
    ctx.strokeStyle = '#f9e4a32b'; ctx.lineWidth = 48; ctx.stroke(path)
  })
  // Individually modelled stones, with irregular spacing and a consistent light.
  const points = [[1007, 1460], [995, 1400], [971, 1337], [932, 1280], [866, 1237], [786, 1208], [705, 1188], [626, 1159], [550, 1124], [483, 1077], [424, 1014], [380, 952], [348, 887]]
  points.forEach(([x, y], index) => paintStone(ctx, x, y, 74 + noise(index, 8) * 24, 35 + noise(index, 9) * 12, index + 10, model.region === 'galapagos'))
  // A short branch reaches the water side without asserting a water installation.
  for (let index = 0; index < 9; index++) paintStone(ctx, 550 + index * 116, 985 - index * 14, 59 + noise(index, 14) * 20, 30, index + 21, model.region === 'galapagos')
}

function mound(ctx: Context, model: GardenVisualModel, materials: Materials, x: number, y: number, w: number, h: number, elevation: number, seed: number) {
  ctx.save(); ctx.translate(x, y)
  irregular(ctx, w + 8, h + 10, seed); ctx.fillStyle = '#30231370'; ctx.fill()
  ctx.translate(-elevation * .16, -elevation)
  irregular(ctx, w, h, seed)
  ctx.save(); ctx.clip(); earth(ctx, model, materials, w, h, seed); ctx.restore()
  ctx.strokeStyle = hex(model.soilStyle.light) + '95'; ctx.lineWidth = 2; ctx.stroke()
  ctx.restore()
}

export function paintPlot(ctx: Context, model: GardenVisualModel, design: VisualSlot['design'], materials: Materials) {
  ctx.translate(220, 150)
  const m = GROUND_MATRIX; ctx.transform(m.a, m.b, m.c, m.d, 0, 0)
  if (design === 'terraces') {
    for (let tier = 0; tier < 3; tier++) {
      const y = -108 + tier * 85
      mound(ctx, model, materials, 0, y, 278, 100, (3 - tier) * 14, 110 + tier)
      // Stone retaining lips follow the projected front of each level.
      for (let stone = 0; stone < 9; stone++) paintStone(ctx, -128 + stone * 32, y + 34 - (3 - tier) * 14, 34, 23, stone + tier * 20, model.region === 'galapagos')
    }
  } else {
    const count = design === 'furrows' ? 5 : 2
    for (let ridge = 0; ridge < count; ridge++) {
      const width = design === 'furrows' ? 35 : 112
      const x = (ridge - (count - 1) / 2) * (design === 'furrows' ? 56 : 143)
      const elevation = design === 'raisedBeds' ? 34 : design === 'beds' ? 12 : 17
      mound(ctx, model, materials, x, 0, width, 260, elevation, 140 + ridge)
    }
  }
}

/** Structural timber has volume, end grain and a shared upper-left key light. */
export function paintBeam(ctx: Context, x1: number, y1: number, x2: number, y2: number, thickness: number, seed = 1) {
  ctx.save(); ctx.translate(x1, y1); ctx.rotate(Math.atan2(y2 - y1, x2 - x1))
  const length = Math.hypot(x2 - x1, y2 - y1)
  ctx.fillStyle = '#40321c60'; ctx.fillRect(6, -thickness / 2 + 8, length, thickness)
  const gradient = ctx.createLinearGradient(0, -thickness / 2, 0, thickness / 2)
  gradient.addColorStop(0, '#f4bd60'); gradient.addColorStop(.15, '#c68b3d'); gradient.addColorStop(.65, '#ac682d'); gradient.addColorStop(1, '#674021')
  ctx.fillStyle = gradient; ctx.beginPath(); ctx.roundRect(0, -thickness / 2, length, thickness, 3); ctx.fill()
  ctx.save(); ctx.clip()
  for (let i = 0; i < 22; i++) {
    const y = (noise(i, seed) - .5) * thickness
    ctx.strokeStyle = i % 2 ? '#5b351d50' : '#ffe3a23d'; ctx.lineWidth = .6 + noise(i, 18)
    ctx.beginPath(); ctx.moveTo(0, y); ctx.bezierCurveTo(length * .3, y - 4, length * .6, y + 4, length, y); ctx.stroke()
  }
  ctx.restore()
  ctx.strokeStyle = '#ffe2a37d'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(2, -thickness / 2 + 2); ctx.lineTo(length - 2, -thickness / 2 + 2); ctx.stroke()
  for (const x of [thickness * .6, length - thickness * .6]) {
    ctx.fillStyle = '#3d3d2d'; ctx.beginPath(); ctx.arc(x, 0, Math.max(2, thickness * .085), 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = '#d2cba5'; ctx.fillRect(x - 1, -2, 2, 1)
  }
  ctx.restore()
}

export function paintSupport(ctx: Context, model: GardenVisualModel) {
  // Texture origin is world (320, 360); anchors and beams use world coordinates.
  ctx.translate(-320, -360)
  const tilt = (x: number) => -.115 * (x - 1010)
  const vertical = model.kind === 'vertical'
  const left = 500, right = 1510
  for (const x of [left, right]) {
    const y = 1195 + tilt(x)
    paintStone(ctx, x + 6, y + 6, 105, 55, x, model.region === 'galapagos')
    paintBeam(ctx, x, y - 14, x, 525 + tilt(x), 49, x)
    // Diagonal braces actually meet the uprights and top rail.
    paintBeam(ctx, x, 670 + tilt(x), x + (x === left ? 125 : -125), 530 + tilt(x), 25, x + 1)
  }
  if (vertical) {
    // Open lattice rather than a stretched wall; the regional landscape stays visible.
    for (let index = 0; index < 10; index++) {
      const x = 545 + index * 102
      paintBeam(ctx, x, 1120 + tilt(x), x, 555 + tilt(x), 13, index)
    }
    for (let row = 0; row < 6; row++) paintBeam(ctx, left + 10, 605 + row * 96 + tilt(left), right - 10, 605 + row * 96 + tilt(right), 20, row + 30)
  } else {
    // Rear roof joists establish the second ground axis without a solid roof.
    for (let index = 0; index < 8; index++) {
      const x = left - 24 + index * 153
      paintBeam(ctx, x - 45, 487 + tilt(x), x + 55, 560 + tilt(x), 31, index + 50)
    }
    paintBeam(ctx, left, 805 + tilt(left), right, 805 + tilt(right), 33, 72)
  }
  paintBeam(ctx, left - 40, 535 + tilt(left), right + 40, 535 + tilt(right), 52, 80)
  // Small woven diamonds echo the approved Ecuadorian textile accents.
  for (let index = 0; index < 7; index++) {
    const x = 930 + index * 24, y = 535 + tilt(x)
    ctx.save(); ctx.translate(x, y); ctx.rotate(-.115)
    ctx.fillStyle = index % 2 ? '#ebbd4c' : '#8d3542'
    ctx.beginPath(); ctx.moveTo(0, -13); ctx.lineTo(10, 0); ctx.lineTo(0, 13); ctx.lineTo(-10, 0); ctx.closePath(); ctx.fill(); ctx.restore()
  }
}

export function paintFence(ctx: Context, kind: GardenVisualModel['characteristics']['fences'][number], seed: number) {
  // Each section is 200 units long; adjacent sections share one post.
  ctx.translate(15, 155)
  const slope = -.115
  if (kind === 'living') {
    for (let index = 0; index < 9; index++) {
      const x = index * 24, y = x * slope
      const fill = ctx.createRadialGradient(x - 12, y - 58, 2, x, y - 32, 47)
      fill.addColorStop(0, '#b6c955'); fill.addColorStop(.4, '#6b9638'); fill.addColorStop(1, '#32572e')
      ctx.fillStyle = fill; ctx.beginPath(); ctx.ellipse(x, y - 32, 32, 47 + noise(index, seed) * 7, 0, 0, Math.PI * 2); ctx.fill()
    }
  } else if (kind === 'metal') {
    ctx.strokeStyle = '#4c665b'; ctx.lineWidth = 8
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -109); ctx.stroke()
    ctx.strokeStyle = '#c4c8ad'; ctx.lineWidth = 1.7
    for (let index = -5; index < 14; index++) {
      const x = index * 23
      ctx.save(); ctx.beginPath(); ctx.rect(0, -110, 200, 100); ctx.clip()
      ctx.beginPath(); ctx.moveTo(x, -110 + x * slope); ctx.lineTo(x + 100, x * slope); ctx.moveTo(x, x * slope); ctx.lineTo(x + 100, -110 + x * slope); ctx.stroke(); ctx.restore()
    }
    for (const y of [-100, -22]) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(200, y + 200 * slope); ctx.stroke() }
  } else {
    for (const y of [-38, -85]) paintBeam(ctx, 0, y, 200, y + 200 * slope, 16, seed)
    if (kind !== 'natural') for (let index = 0; index < 8; index++) {
      const x = 15 + index * 25
      paintBeam(ctx, x, -10 + x * slope, x, -108 + x * slope + (kind === 'recycled' ? noise(index, seed) * 16 : 0), 19, index + seed)
      if (kind === 'recycled' && index % 3 === 0) { ctx.fillStyle = '#76938755'; ctx.fillRect(x - 7, -80 + x * slope, 14, 57) }
    }
    paintBeam(ctx, 0, 0, 0, -120, 25, seed)
    ctx.strokeStyle = '#efdb9b'; ctx.lineWidth = 2
    for (let loop = 0; loop < 4; loop++) { ctx.beginPath(); ctx.moveTo(-14, -39 + loop * 3); ctx.lineTo(14, -31 + loop * 3); ctx.stroke() }
  }
}
