import type { GardenVisualModel } from './model'
import { hex, noise, type Materials } from './paint-materials'
import { REGION_STYLES } from './visual-config'
import { WORLD } from './assets'

/** A ground plane, independent of the horizon and every cultivable object. */
export function paintCourtyard(ctx: CanvasRenderingContext2D, model: GardenVisualModel, materials: Materials) {
  const palette = REGION_STYLES[model.region]
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
