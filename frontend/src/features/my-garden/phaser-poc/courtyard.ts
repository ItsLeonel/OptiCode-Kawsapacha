import { coastalFootprintRatio } from './coastal-terrain'
import type { GardenVisualModel } from './model'
import { hex, noise, paintStone, type Materials } from './paint-materials'
import { REGION_STYLES } from './visual-config'
import { WORLD } from './assets'

/** A ground plane, independent of the horizon and every cultivable object. */
export function paintCourtyard(ctx: CanvasRenderingContext2D, model: GardenVisualModel, materials: Materials) {
  if (model.region === 'costa') {
    paintCoastalGround(ctx, materials, model.kind === 'ground' ? coastalFootprintRatio(model.footprintScale) : 1)
    return
  }
  const palette = REGION_STYLES[model.region]
  if (model.kind === 'ground') {
    paintRegionalGround(ctx, model, materials)
    return
  }
  const color = ctx.createLinearGradient(0, 630, 0, 1500)
  color.addColorStop(0, hex(palette.grassLight)); color.addColorStop(.35, hex(palette.grass)); color.addColorStop(1, hex(palette.grassDark))
  ctx.fillStyle = color; ctx.fillRect(0, 0, WORLD.width, WORLD.height)
  if (materials.grass) {
    ctx.save(); ctx.transform(1, -.08, .32, .65, -400, 250)
    ctx.globalAlpha = .7; ctx.fillStyle = materials.grass; ctx.fillRect(0, 0, 2800, 2500); ctx.restore()
  }
  // Small bare patches and blades break repetition without inventing cultivated plants.
  for (let index = 0; index < 8000; index++) {
    const x = noise(index, 405) * WORLD.width, y = 680 + noise(index, 406) * 820
    ctx.fillStyle = index % 4 ? '#f5e89f40' : '#173d2640'
    ctx.fillRect(x, y, 2 + noise(index, 407) * 3, .7)
  }
  const mask = document.createElement('canvas'); mask.width = WORLD.width; mask.height = WORLD.height
  const shape = mask.getContext('2d')!
  shape.fillStyle = 'white'; shape.shadowColor = 'white'; shape.shadowBlur = 65
  shape.beginPath(); shape.moveTo(80, 1500); shape.bezierCurveTo(100, 1150, 245, 840, 480, 780)
  shape.bezierCurveTo(850, 730, 1370, 650, 1650, 670); shape.bezierCurveTo(1890, 750, 1930, 1100, 1920, 1500)
  shape.closePath(); shape.fill()
  ctx.globalCompositeOperation = 'destination-in'; ctx.drawImage(mask, 0, 0); ctx.globalCompositeOperation = 'source-over'
  const paths = [new Path2D('M 1040 1500 C 1000 1340 780 1270 570 1160 C 405 1070 390 920 430 800'), new Path2D('M 480 1030 C 800 1040 1150 955 1630 920')]
  const trail = document.createElement('canvas'); trail.width = WORLD.width; trail.height = WORLD.height
  const ground = trail.getContext('2d')!
  ground.fillStyle = materials.soil ?? hex(palette.path); ground.fillRect(0, 0, trail.width, trail.height)
  ground.globalCompositeOperation = 'soft-light'; ground.fillStyle = '#ddc396'; ground.fillRect(0, 0, trail.width, trail.height)
  ground.globalCompositeOperation = 'source-over'
  for (let index = 0; index < 18000; index++) {
    const x = noise(index, 801) * WORLD.width, y = noise(index, 802) * WORLD.height
    ground.fillStyle = index % 3 ? '#ffefc238' : '#50382740'
    ground.beginPath(); ground.ellipse(x, y, 1 + noise(index, 803) * 2, .5 + noise(index, 804), -.15, 0, Math.PI * 2); ground.fill()
  }
  const pathMask = document.createElement('canvas'); pathMask.width = WORLD.width; pathMask.height = WORLD.height
  const edge = pathMask.getContext('2d')!; edge.lineCap = 'round'; edge.lineJoin = 'round'
  for (const path of paths) {
    for (let width = 88; width > 45; width -= 3) { edge.strokeStyle = '#ffffff18'; edge.lineWidth = width; edge.stroke(path) }
  }
  // Blades at the verge make the earth belong to the meadow, with no hard border.
  edge.globalCompositeOperation = 'destination-out'; edge.fillStyle = '#000000c0'
  for (let index = 0; index < 9000; index++) {
    const x = noise(index, 805) * WORLD.width, y = 780 + noise(index, 806) * 720
    edge.beginPath(); edge.ellipse(x, y, 2 + noise(index, 807) * 7, 1 + noise(index, 808) * 2, -.2, 0, Math.PI * 2); edge.fill()
  }
  ground.globalCompositeOperation = 'destination-in'; ground.drawImage(pathMask, 0, 0)
  ctx.drawImage(trail, 0, 0)
  const stones = [[1030, 1450], [990, 1380], [927, 1320], [840, 1274], [742, 1228], [650, 1185], [558, 1138], [492, 1078], [447, 1006], [423, 930], [420, 846], [610, 1024], [800, 1013], [1000, 987], [1205, 955], [1410, 936], [1610, 921]]
  for (const [index, [x, y]] of stones.entries()) {
    ctx.save(); ctx.translate(x, y); ctx.rotate((noise(index, 622) - .5) * .4)
    const width = 62 + noise(index, 623) * 15, height = 32 + noise(index, 624) * 10
    const outline = new Path2D()
    for (let corner = 0; corner < 8; corner++) {
      const angle = corner * Math.PI / 4, r = .85 + noise(corner + index * 8, 625) * .2
      const px = Math.cos(angle) * width / 2 * r, py = Math.sin(angle) * height / 2 * r
      if (!corner) outline.moveTo(px, py); else outline.lineTo(px, py)
    }
    outline.closePath(); ctx.fillStyle = '#24382250'; ctx.translate(4, 5); ctx.fill(outline); ctx.translate(-4, -5)
    ctx.save(); ctx.clip(outline); ctx.fillStyle = model.region === 'galapagos' ? '#737e70' : '#b3a184'; ctx.fillRect(-50, -30, 100, 60)
    for (let grain = 0; grain < 180; grain++) { ctx.fillStyle = grain % 2 ? '#ffedbf30' : '#4a4b3b35'; ctx.fillRect(noise(grain, 810 + index) * 90 - 45, noise(grain, 850 + index) * 50 - 25, 1.5, .8) }
    const light = ctx.createLinearGradient(0, -height / 2, 0, height / 2)
    light.addColorStop(0, '#fff1cc70'); light.addColorStop(1, '#4b4f3c40'); ctx.fillStyle = light; ctx.fillRect(-50, -30, 100, 60); ctx.restore()
    ctx.strokeStyle = '#e4d7ae80'; ctx.lineWidth = 1.5; ctx.stroke(outline); ctx.restore()
  }
}

/** Level, continuous playfield shared by the three non-coastal regions.
 * Regional palettes and edge materials distinguish the landscape while the
 * crop-ready center remains clear and consistent with the six-slot layout.
 */
function paintRegionalGround(ctx: CanvasRenderingContext2D, model: GardenVisualModel, materials: Materials) {
  const palette = REGION_STYLES[model.region]
  const edge = new Path2D('M 0 738 C 230 708 430 729 680 720 C 980 707 1210 731 1480 715 C 1670 705 1790 730 1920 713 L 1920 1500 L 0 1500 Z')
  ctx.save()
  ctx.fillStyle = '#172e24'; ctx.globalAlpha = .2; ctx.fill(edge); ctx.globalAlpha = 1
  const lawn = ctx.createLinearGradient(0, 720, 0, 1500)
  lawn.addColorStop(0, hex(palette.grassLight)); lawn.addColorStop(.36, hex(palette.grass)); lawn.addColorStop(1, hex(palette.grassDark))
  ctx.fillStyle = lawn; ctx.fill(edge); ctx.clip(edge)
  if (materials.grass) { ctx.globalAlpha = .2; ctx.fillStyle = materials.grass; ctx.fillRect(0, 710, WORLD.width, 800); ctx.globalAlpha = 1 }

  // Narrow access paths are aligned with the shared 3 × 2 plot lanes.
  const paths = [
    new Path2D('M 845 790 C 835 870 855 1080 845 1200'),
    new Path2D('M 1215 790 C 1205 870 1225 1080 1215 1200'),
    new Path2D('M 420 990 C 660 971 840 1008 1030 990 S 1420 972 1640 990'),
  ]
  ctx.lineJoin = 'round'; ctx.lineCap = 'round'
  for (const path of paths) {
    ctx.strokeStyle = '#263b2a45'; ctx.lineWidth = 20; ctx.stroke(path)
    ctx.strokeStyle = hex(palette.path); ctx.globalAlpha = .64; ctx.lineWidth = 13; ctx.stroke(path)
    ctx.strokeStyle = '#f0dfb65c'; ctx.globalAlpha = .48; ctx.lineWidth = 5; ctx.stroke(path)
    ctx.globalAlpha = 1
  }
  for (let i = 0; i < 1800; i++) {
    const x = noise(i, 2040) * WORLD.width, y = 755 + noise(i, 2041) * 690
    if (i % 4 === 0) continue
    ctx.fillStyle = i % 3 ? '#e7edb52b' : '#183b2930'
    ctx.beginPath(); ctx.ellipse(x, y, 2 + noise(i, 2042) * 3, 1 + noise(i, 2043), -.2, 0, Math.PI * 2); ctx.fill()
  }
  // Regional stone accents stay on the perimeter, away from the six crop anchors.
  const volcanic = model.region === 'galapagos'
  const stones = model.region === 'sierra'
    ? [[260, 1190], [320, 1260], [1640, 1170], [1710, 1230], [520, 1390], [1480, 1375]]
    : model.region === 'oriente'
      ? [[250, 1210], [310, 1290], [1650, 1190], [1720, 1260], [510, 1400], [1490, 1390]]
      : [[265, 1190], [325, 1270], [1645, 1175], [1710, 1245], [500, 1400], [1510, 1380]]
  stones.forEach(([x, y], i) => paintStone(ctx, x, y, volcanic ? 50 : 43, volcanic ? 29 : 24, 260 + i, volcanic))
  ctx.restore()

  // Feather the lawn only where it meets the regional landscape image.
  ctx.save(); ctx.globalCompositeOperation = 'destination-out'
  const blend = ctx.createLinearGradient(0, 713, 0, 786)
  blend.addColorStop(0, 'rgba(0,0,0,.96)'); blend.addColorStop(.55, 'rgba(0,0,0,.35)'); blend.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = blend; ctx.fillRect(0, 710, WORLD.width, 80); ctx.restore()
}

/** Broad, level coastal lawn: the sea remains a separate background layer. */
function paintCoastalGround(ctx: CanvasRenderingContext2D, materials: Materials, footprintScale = 1) {
  // The level garden begins behind the rear fence. The irregular shoreline
  // lets the illustrated sea remain the backdrop rather than a solid color bar.
  const edge = new Path2D(
    'M 0 736 C 230 706 410 728 680 723 C 975 707 1180 733 1470 716 C 1660 705 1780 731 1920 714 L 1920 1500 L 0 1500 Z',
  )
  ctx.save()
  ctx.fillStyle = '#24492d'
  ctx.globalAlpha = .21
  ctx.fill(edge)
  ctx.globalAlpha = 1
  const lawn = ctx.createLinearGradient(0, 708, 0, WORLD.height)
  lawn.addColorStop(0, '#80ae53')
  lawn.addColorStop(.22, '#7dac46')
  lawn.addColorStop(.66, '#75a543')
  lawn.addColorStop(1, '#648e3c')
  ctx.fillStyle = lawn
  ctx.fill(edge)

  ctx.save()
  ctx.clip(edge)
  if (materials.grass) {
    ctx.globalAlpha = .29
    ctx.fillStyle = materials.grass
    ctx.fillRect(0, 700, WORLD.width, 800)
    ctx.globalAlpha = 1
  }
  // Broad, low-contrast shade patches give the lawn depth without introducing
  // fictitious cultivated plants or concealing any plot.
  for (let patch = 0; patch < 34; patch++) {
    const x = noise(patch, 1530) * WORLD.width
    const y = 765 + noise(patch, 1531) * 650
    const radius = 75 + noise(patch, 1532) * 170
    const shade = ctx.createRadialGradient(x, y, 0, x, y, radius)
    shade.addColorStop(0, patch % 3 ? '#c3d97623' : '#325b2b1b')
    shade.addColorStop(1, '#325b2b00')
    ctx.fillStyle = shade
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2)
  }

  // Narrow curved paths follow the free space between plots. Their translucent
  // grain blends into the lawn; none of the strokes passes through a parcel.
  const paths = [
    new Path2D('M 845 790 C 835 870 855 1080 845 1200'),
    new Path2D('M 1215 790 C 1205 870 1225 1080 1215 1200'),
    // The cross aisle now sits in the measured gap between the two rows.
    new Path2D('M 420 990 C 660 971 840 1008 1030 990 S 1420 972 1640 990'),
  ]
  // Paths follow the scaled cultivated footprint; the sea, coastline,
  // foreground décor and outer perimeter remain at the original world scale.
  ctx.save()
  ctx.translate(1030, 990)
  ctx.scale(footprintScale, footprintScale)
  ctx.translate(-1030, -990)
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  for (const path of paths) {
    ctx.strokeStyle = '#486c3520'; ctx.lineWidth = 18; ctx.stroke(path)
    ctx.strokeStyle = '#a58d6250'; ctx.lineWidth = 13; ctx.stroke(path)
    ctx.strokeStyle = '#d4bd8b4d'; ctx.lineWidth = 8; ctx.stroke(path)
  }
  ctx.restore()
  // Sparse stepping stones along the perimeter; the center remains clear.
  ;([[282, 1108, 39, 19], [312, 1139, 34, 18],
     [1640, 1109, 39, 19], [1670, 1151, 34, 18]] as const)
    .forEach(([x, y, width, height], index) => {
      paintStone(ctx, x, y, width, height, 210 + index)
    })
  // Small irregular grains/grass overlap the paths, avoiding perfectly straight
  // paved strips. Everything is decorative and remains behind the slots.
  for (let index = 0; index < 4700; index++) {
    const x = noise(index, 1165) * WORLD.width
    const y = 770 + noise(index, 1166) * 700
    const fringe = x < 230 || x > 1690 || y > 1180
    if (!fringe && index % 3 === 0) continue
    ctx.strokeStyle = index % 4 === 0 ? '#28592a43' : '#dff3aa3c'
    ctx.lineWidth = .8 + noise(index, 1167) * 1.4
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x - 2 + noise(index, 1168) * 2, y - 2 - noise(index, 1169) * 5)
    ctx.stroke()
  }
  ctx.restore()

  // Feather only the rear lawn edge. The main playfield remains fully opaque,
  // so the background is visible without washing out the six crop slots.
  ctx.save()
  ctx.globalCompositeOperation = 'destination-out'
  const shorelineBlend = ctx.createLinearGradient(0, 712, 0, 780)
  shorelineBlend.addColorStop(0, 'rgba(0,0,0,0.98)')
  shorelineBlend.addColorStop(.55, 'rgba(0,0,0,0.40)')
  shorelineBlend.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = shorelineBlend
  ctx.fillRect(0, 710, WORLD.width, 75)
  ctx.restore()

  // Fine organic tufts soften the meeting point with the seascape.
  for (let index = 0; index < 325; index++) {
    const x = index / 324 * WORLD.width
    const y = 719 + noise(index, 1120) * 17 + Math.sin(x / 125) * 5
    ctx.fillStyle = index % 2 ? '#9abf6775' : '#5f934c70'
    ctx.beginPath()
    ctx.ellipse(x, y, 3 + noise(index, 1121) * 6, 2 + noise(index, 1122) * 2, -.17, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}
