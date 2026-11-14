import type Phaser from 'phaser'
import { isChamomile, type GrowthStage } from '../growth-stages'
import { resolveSpeciesArt } from './species-art'
import { paintSpeciesIllustration } from './species-illustration'

/**
 * Manzanilla: hojas finamente divididas y capítulos blancos con centro dorado.
 * Todas las proporciones son símbolos visuales del estado registrado, no medidas.
 */
function paintChamomile(g: Phaser.GameObjects.Graphics, stage: Exclude<GrowthStage, 'sown' | 'harvested'>) {
  const dark = 0x27613e
  const stem = 0x4f9251
  const highlight = 0x9ccf68

  function stalk(x: number, y: number, tipX: number, tipY: number, width = 3) {
    g.lineStyle(width + 1, dark, .85).lineBetween(x + 1, y, tipX + 1, tipY)
    g.lineStyle(width, stem, 1).lineBetween(x, y, tipX, tipY)
  }

  // La manzanilla tiene hojas plumosas, no las hojas grandes del sprite genérico.
  function finelyCutLeaf(x: number, y: number, direction: -1 | 1, size = 1) {
    const tipX = x + direction * 28 * size
    const tipY = y - 14 * size
    stalk(x, y, tipX, tipY, 1.7)
    for (let i = 1; i <= 5; i++) {
      const t = i / 6
      const bx = x + (tipX - x) * t
      const by = y + (tipY - y) * t
      const leaflet = (6.5 - i * .5) * size
      for (const side of [-1, 1]) {
        g.lineStyle(Math.max(.9, 1.35 * size), side === 1 ? highlight : stem, .98)
        g.lineBetween(bx, by, bx + direction * 3 * size, by + side * leaflet)
        g.fillStyle(side === 1 ? highlight : 0x65b15b, .96)
        g.fillEllipse(bx + direction * 4.5 * size, by + side * leaflet, 6 * size, 2.3 * size)
      }
    }
    g.fillStyle(highlight, 1).fillEllipse(tipX, tipY, 7 * size, 2.5 * size)
  }

  function daisy(x: number, y: number, scale = 1) {
    // Los pétalos son estrechos; se distribuyen radialmente alrededor del disco.
    g.fillStyle(0x426943, .3).fillCircle(x + 1.5 * scale, y + 3 * scale, 18 * scale)
    for (let i = 0; i < 12; i++) {
      const angle = (i * 2 * Math.PI) / 12 - Math.PI / 2
      const cos = Math.cos(angle)
      const sin = Math.sin(angle)
      const px = -sin
      const py = cos
      const tipX = x + cos * 19 * scale
      const tipY = y + sin * 19 * scale
      g.fillStyle(i % 3 ? 0xfffcf0 : 0xe4efdf, .99)
      g.fillTriangle(
        x + px * 3 * scale, y + py * 3 * scale,
        x - px * 3 * scale, y - py * 3 * scale,
        tipX, tipY,
      )
      g.fillCircle(tipX, tipY, 3.3 * scale)
    }
    g.fillStyle(0xc18526, 1).fillCircle(x + 1 * scale, y + 2 * scale, 8.6 * scale)
    g.fillStyle(0xeac445, 1).fillCircle(x, y, 8.3 * scale)
    for (let i = 0; i < 6; i++) {
      const angle = i * 2 * Math.PI / 6
      g.fillStyle(0xf8de6e, .95).fillCircle(
        x + Math.cos(angle) * 4.5 * scale,
        y + Math.sin(angle) * 4.5 * scale,
        1.15 * scale,
      )
    }
  }

  if (stage === 'sprout') {
    stalk(0, 2, 0, -30, 3)
    g.fillStyle(0x92c96a).fillEllipse(-10, -27, 23, 10)
    g.fillStyle(0x4b9f50).fillEllipse(10, -27, 23, 10)
    g.lineStyle(1.3, dark).lineBetween(-3, -27, -16, -28)
    g.lineBetween(3, -27, 17, -28)
    return
  }

  const seedling = stage === 'seedling'
  const flowering = stage === 'flowering'
  // Volumen de hojas y ramificación crece solo si la etapa fue declarada.
  const stems = seedling
    ? [{ base: 0, x: 0, top: -56 }]
    : [
        { base: -12, x: -29, top: -83 },
        { base: -2, x: 0, top: -105 },
        { base: 13, x: 33, top: -90 },
      ]
  for (let i = 0; i < stems.length; i++) {
    const item = stems[i]
    stalk(item.base, 4, item.x, item.top, seedling ? 3 : 3.8)
    const leafPairs = seedling ? 3 : 5
    for (let n = 1; n <= leafPairs; n++) {
      const progress = n / (leafPairs + 1)
      const x = item.base + (item.x - item.base) * progress
      const y = 4 + (item.top - 4) * progress
      const size = (seedling ? .72 : .87) * (1 - progress * .16)
      finelyCutLeaf(x, y, -1, size)
      finelyCutLeaf(x, y - 3, 1, size * .88)
    }
  }

  if (flowering) {
    // Cuatro capítulos a distintas alturas: manzanilla, no flor genérica.
    daisy(-29, -88, .80)
    daisy(0, -108, 1)
    daisy(34, -94, .84)
    daisy(16, -71, .62)
  }
}

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
    if (chamomile) {
      // Semillas de manzanilla diminutas: se amplían discretamente por legibilidad.
      for (const x of [-11, 0, 12]) {
        g.fillStyle(0xbf944a).fillEllipse(x, -1, 4.8, 2.4)
        g.lineStyle(.8, 0xf7dfab, .95).strokeEllipse(x, -1, 4.8, 2.4)
      }
    } else {
      g.fillStyle(0xc99948).fillEllipse(1, -1, 12, 7)
      g.lineStyle(1.5, 0xf8d991).strokeEllipse(1, -1, 12, 7)
    }
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

  if (chamomile) {
    paintChamomile(g, stage)
    return
  }

  // Las 30 especies catalogadas disponen de siluetas simbólicas diferenciadas.
  // Para una planta de nombre libre/desconocido sigue disponible la figura neutra.
  const speciesArt = resolveSpeciesArt(name, latin)
  if (speciesArt) {
    paintSpeciesIllustration(g, stage, speciesArt)
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
