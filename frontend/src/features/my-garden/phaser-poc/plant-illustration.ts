import type Phaser from 'phaser'
import { isChamomile, type GrowthStage } from '../growth-stages'

/**
 * Ilustraciones originales vectoriales. Se anclan a la tierra/maceta, no a una
 * fotografía circular. La observación declarada decide la etapa, nunca la edad.
 */
export function paintObservedPlant(
  g: Phaser.GameObjects.Graphics,
  stage: GrowthStage | null,
  name: string,
  latin: string,
) {
  const chamomile = isChamomile(name, latin)
  const leafGreen = 0x39834a
  const leafLight = 0x92c85a
  const stemDark = 0x356d3c
  const soil = 0x795237

  const leaf = (x: number, y: number, width: number, height: number, bright = false) => {
    g.fillStyle(bright ? leafLight : leafGreen, .98).fillEllipse(x, y, width, height)
    g.lineStyle(1.8, bright ? 0x4b9446 : 0x246042, .95)
    g.lineBetween(x - width * .30, y + height * .18, x + width * .24, y - height * .12)
  }
  const branch = (x: number, y: number, tipX: number, tipY: number, width = 4) => {
    g.lineStyle(width + 2, 0x1f522f, .36).lineBetween(x + 1, y, tipX + 1, tipY)
    g.lineStyle(width, stemDark, .98).lineBetween(x, y, tipX, tipY)
  }
  const flower = (x: number, y: number, scale = 1) => {
    const pale = chamomile ? 0xfffaf1 : /lavand/i.test(name) ? 0xc3a1e7 : 0xf5d584
    g.fillStyle(pale, .98)
    for (let i = 0; i < 8; i++) {
      const angle = i * Math.PI / 4
      g.fillCircle(x + Math.cos(angle) * 12 * scale, y + Math.sin(angle) * 12 * scale, 6.6 * scale)
    }
    g.fillStyle(0xe6af3e, 1).fillCircle(x, y, 8 * scale)
    g.fillStyle(0x9d742c, .85).fillCircle(x + 2 * scale, y - 2 * scale, 2 * scale)
  }

  // Sombra y superficie de cultivo coherentes con cualquier modalidad.
  g.fillStyle(0x23382a, .18).fillEllipse(3, 8, 94, 22)
  g.fillStyle(soil, .87).fillEllipse(0, 4, 80, 13)

  if (stage === null) {
    // Plantación registrada, pero todavía sin etapa demostrada: sin planta ficticia.
    g.lineStyle(4, 0x765434).lineBetween(0, 0, 0, -29)
    g.fillStyle(0xd5b178, .98).fillRoundedRect(-20, -45, 40, 22, 4)
    g.lineStyle(2, 0x865f3d).strokeRoundedRect(-20, -45, 40, 22, 4)
    g.lineStyle(2, 0x695033).lineBetween(-10, -34, 10, -34)
    return
  }

  if (stage === 'sown') {
    // Semilla visible sobre un pequeño surco, no un brote inventado.
    for (const x of [-23, 0, 23]) {
      g.lineStyle(2, 0x4f3624, .75).lineBetween(x - 10, 1, x + 7, 1)
    }
    g.fillStyle(0xc99948).fillEllipse(1, -1, 12, 7)
    g.lineStyle(1.5, 0xf8d991).strokeEllipse(1, -1, 12, 7)
    return
  }

  if (stage === 'harvested') {
    // Rastro visual de una cosecha completa documentada.
    for (const x of [-22, 0, 22]) {
      branch(x, 2, x + (x < 0 ? -2 : 3), -18, 4)
      g.lineStyle(2, 0xc9ae7a).lineBetween(x - 3, -18, x + 4, -18)
    }
    return
  }

  if (stage === 'sprout') {
    branch(0, 1, 0, -34, 5)
    leaf(-13, -31, 27, 12, true)
    leaf(13, -31, 27, 12, false)
    return
  }

  // Los tamaños son estados ilustrativos, NO medidas de altura de la planta real.
  const young = stage === 'seedling'
  const tall = stage === 'flowering'
  const height = young ? 66 : tall ? 125 : 102
  const stems = young
    ? [{ baseX: 0, topX: 0, height }]
    : [{ baseX: -13, topX: -35, height: height * .81 },
       { baseX: -4, topX: 0, height },
       { baseX: 10, topX: 35, height: height * .85 }]

  for (const stem of stems) {
    branch(stem.baseX, 1, stem.topX, -stem.height, young ? 4 : 5)
    const leaves = young ? 2 : 4
    for (let level = 0; level < leaves; level++) {
      const t = (level + 1) / (leaves + 1)
      const cy = -stem.height * t
      const cx = stem.baseX + (stem.topX - stem.baseX) * t
      const w = young ? 30 : (chamomile ? 27 : 32)
      leaf(cx - (young ? 12 : 16), cy + 4, w, young ? 13 : 16, true)
      leaf(cx + (young ? 12 : 16), cy - 2, w, young ? 13 : 16, false)
    }
    if (tall) flower(stem.topX, -stem.height, chamomile ? .92 : .77)
  }
  if (young) {
    leaf(-7, -56, 25, 11, true)
    leaf(8, -60, 22, 10, false)
  }
}
