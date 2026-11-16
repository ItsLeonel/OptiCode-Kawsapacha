import { coastalFootprintRatio } from './coastal-terrain'
import type { GardenVisualModel } from './model'
import { noise, paintStone, type Materials } from './paint-materials'
import { WORLD } from './assets'
import { paintRegionalTerrain } from './regional-terrain'

/** A ground plane, independent of the horizon and every cultivable object. */
export function paintCourtyard(ctx: CanvasRenderingContext2D, model: GardenVisualModel, materials: Materials) {
  if (model.region === 'costa') {
    paintCoastalGround(ctx, materials, model.kind === 'ground' ? coastalFootprintRatio(model.footprintScale) : 1)
    return
  }
  // Every regional modality rests on the same illustrated, continuous clearing.
  // The painter adds only very faint access wear/contact shadows, never a
  // replacement rectangle of grass, sand or volcanic stone over the artwork.
  paintRegionalTerrain(ctx, model)
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
