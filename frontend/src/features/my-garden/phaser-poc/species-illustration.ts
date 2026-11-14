import type Phaser from 'phaser'
import type { GrowthStage } from '../growth-stages'
import type { SpeciesArt, LeafSilhouette, BloomSilhouette } from './species-art'

type VisibleStage = Exclude<GrowthStage, 'sown' | 'harvested'>
type Graphics = Phaser.GameObjects.Graphics

/** Ilustración plana y original del hábito registrado, sin foto como textura. */
export function paintSpeciesIllustration(g: Graphics, stage: VisibleStage, art: SpeciesArt) {
  const juvenile = stage === 'seedling'
  const flowering = stage === 'flowering'
  const stem = (x: number, y: number, tx: number, ty: number, width = 3, wood = false) => {
    g.lineStyle(width + 1, wood ? 0x664931 : 0x276047, .72).lineBetween(x + 1, y, tx + 1, ty)
    g.lineStyle(width, wood ? 0x91704a : art.green, 1).lineBetween(x, y, tx, ty)
  }
  const leaf = (x: number, y: number, dir: -1 | 1, size: number, kind: LeafSilhouette = art.leaf) => {
    const tipX = x + dir * 19 * size
    const tipY = y - 8 * size
    const color = art.green
    const pale = art.light
    g.lineStyle(1.6 * size, color, .95).lineBetween(x, y, tipX, tipY)
    if (kind === 'needle') {
      for (let i = 1; i < 6; i++) {
        const cx = x + dir * i * 2.9 * size
        const cy = y - i * 1.5 * size
        g.lineStyle(1.9 * size, i % 2 ? color : pale, 1)
        g.lineBetween(cx, cy, cx + dir * 5 * size, cy - (4 + i % 2 * 3) * size)
        g.lineBetween(cx, cy, cx + dir * 5 * size, cy + (5 + i % 2 * 2) * size)
      }
    } else if (kind === 'grass') {
      for (let i = -1; i <= 1; i++) {
        const lift = (7 + Math.abs(i) * 5) * size
        g.fillStyle(i === 0 ? pale : color, .96)
        g.fillTriangle(x + i * 2 * size, y, x + dir * 6 * size, y - lift * .2, tipX + dir * i * 3 * size, tipY - lift)
      }
    } else if (kind === 'palmate') {
      for (let i = -2; i <= 2; i++) {
        const px = x + dir * (12 + (2 - Math.abs(i)) * 4) * size
        const py = y - (8 + i * 5) * size
        g.fillStyle(i % 2 ? pale : color, 1).fillEllipse(px, py, 10 * size, 22 * size)
      }
    } else if (kind === 'lobed') {
      g.fillStyle(color, 1).fillEllipse(tipX - dir * 4 * size, tipY, 23 * size, 11 * size)
      g.fillStyle(pale, .98).fillEllipse(tipX - dir * 7 * size, tipY - 7 * size, 12 * size, 12 * size)
      g.fillEllipse(tipX - dir * 7 * size, tipY + 7 * size, 12 * size, 12 * size)
    } else if (kind === 'heart') {
      g.fillStyle(color, 1).fillTriangle(tipX + dir * 12 * size, tipY, tipX - dir * 8 * size, tipY - 12 * size, tipX - dir * 8 * size, tipY + 12 * size)
      g.fillStyle(pale, .96).fillEllipse(tipX - dir * 4 * size, tipY - 6 * size, 14 * size, 13 * size)
      g.fillEllipse(tipX - dir * 4 * size, tipY + 6 * size, 14 * size, 13 * size)
    } else {
      const wide = kind === 'round' ? 21 : kind === 'lance' ? 11 : 16
      const long = kind === 'lance' ? 32 : 26
      g.fillStyle(color, 1).fillEllipse(tipX, tipY, long * size, wide * size)
      g.fillStyle(pale, .65).fillEllipse(tipX + dir * 3 * size, tipY - 2 * size, long * .66 * size, wide * .5 * size)
      if (kind === 'serrated') {
        for (const sign of [-1, 1]) {
          for (let n = 0; n < 3; n++) {
            const px = tipX + dir * (n - 1) * 7 * size
            g.fillStyle(color, 1).fillTriangle(px - dir * 3 * size, tipY + sign * 6 * size, px + dir * 4 * size, tipY + sign * 11 * size, px + dir * 4 * size, tipY + sign * 5 * size)
          }
        }
      }
      g.lineStyle(1.3 * size, 0x335d3b, .7).lineBetween(tipX - dir * 10 * size, tipY + 2 * size, tipX + dir * 10 * size, tipY - 2 * size)
    }
  }

  const bloom = (x: number, y: number, motif: BloomSilhouette, size: number) => {
    const color = art.blossom
    if (motif === 'spike') {
      stem(x, y + 8 * size, x, y - 17 * size, 2)
      for (let i = 0; i < 7; i++) {
        g.fillStyle(color, .98).fillEllipse(x + (i % 2 ? 4 : -4) * size, y + (3 - i * 4) * size, 8 * size, 7 * size)
      }
    } else if (motif === 'cluster' || motif === 'tiny') {
      const count = motif === 'tiny' ? 5 : 8
      for (let i = 0; i < count; i++) {
        const angle = i * 2 * Math.PI / count
        const radius = (motif === 'tiny' ? 9 : 13) * size
        g.fillStyle(color, .98).fillCircle(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius, (motif === 'tiny' ? 3 : 5) * size)
      }
    } else if (motif === 'daisy') {
      for (let i = 0; i < 12; i++) {
        const angle = i * 2 * Math.PI / 12
        g.fillStyle(color, .98).fillEllipse(x + Math.cos(angle) * 12 * size, y + Math.sin(angle) * 12 * size, 7 * size, 11 * size)
      }
      g.fillStyle(0xe9b43a, 1).fillCircle(x, y, 8 * size)
    } else if (motif === 'orchid') {
      for (let i = 0; i < 5; i++) {
        const a = i * 2 * Math.PI / 5
        g.fillStyle(color, 1).fillEllipse(x + Math.cos(a) * 11 * size, y + Math.sin(a) * 11 * size, 18 * size, 13 * size)
      }
      g.fillStyle(0xfff2ca).fillEllipse(x, y + 4 * size, 13 * size, 14 * size)
      g.fillStyle(0xf4be61).fillCircle(x, y + 5 * size, 3 * size)
    } else if (motif === 'cotton') {
      // Flor clara esquemática: no se presenta como algodón ya cosechado.
      for (let i = 0; i < 5; i++) {
        const angle = i * 2 * Math.PI / 5
        g.fillStyle(color, .98).fillEllipse(x + Math.cos(angle) * 10 * size, y + Math.sin(angle) * 10 * size, 14 * size, 16 * size)
      }
      g.fillStyle(0xcaa95e).fillCircle(x, y, 5 * size)
    } else {
      const count = motif === 'bell' ? 5 : 6
      for (let i = 0; i < count; i++) {
        const a = i * 2 * Math.PI / count
        g.fillStyle(color, .98).fillTriangle(x, y, x + Math.cos(a - .24) * 22 * size, y + Math.sin(a - .24) * 22 * size, x + Math.cos(a + .24) * 22 * size, y + Math.sin(a + .24) * 22 * size)
      }
      g.fillStyle(0xe5b44e, 1).fillCircle(x, y, 5 * size)
    }
  }

  // La siembra y cosecha completa se manejan en el pintor principal.
  if (stage === 'sprout') {
    stem(0, 2, 0, -31, 3)
    if (art.habit === 'tuft') {
      leaf(-4, -12, -1, .67, 'grass')
      leaf(4, -13, 1, .67, 'grass')
    } else {
      leaf(0, -30, -1, .55, 'oval')
      leaf(0, -28, 1, .55, 'oval')
    }
    return
  }

  const scale = juvenile ? .7 : 1
  if (art.habit === 'tuft') {
    for (let i = -5; i <= 5; i++) {
      const dx = i * 7 * scale
      const top = -((65 + (5 - Math.abs(i)) * 8) * scale)
      g.fillStyle(i % 2 ? art.green : art.light, .98)
      g.fillTriangle(dx, 1, dx + 8 * scale, -19 * scale, dx + i * 3 * scale, top)
    }
    if (flowering) bloom(0, -98, art.bloom, .6)
    return
  }

  if (art.habit === 'rosette') {
    for (let i = 0; i < 8; i++) {
      const a = Math.PI + i * Math.PI / 7
      const x = Math.cos(a) * 15 * scale
      const y = Math.sin(a) * 12 * scale - 12 * scale
      leaf(x, y, i % 2 ? -1 : 1, .92 * scale)
    }
    if (flowering) {
      stem(0, 1, 0, -91 * scale, 3)
      bloom(0, -93 * scale, art.bloom, .73)
    }
    return
  }

  if (art.habit === 'orchid') {
    for (let i = -2; i <= 2; i++) leaf(i * 5 * scale, -6 * scale, i < 0 ? -1 : 1, 1.15 * scale, 'lance')
    stem(0, 1, 8 * scale, -80 * scale, 2.5)
    if (flowering) {
      bloom(8 * scale, -78 * scale, 'orchid', .88)
      bloom(21 * scale, -55 * scale, 'orchid', .58)
    }
    return
  }

  if (art.habit === 'vine') {
    // Liana representada en pequeño, sin afirmar que el jardín tenga una estructura de soporte.
    const points = [[0,2],[-13,-29],[15,-51],[-5,-78],[13,-106]] as const
    const limit = juvenile ? 3 : points.length
    for (let i = 1; i < limit; i++) {
      const [x,y] = points[i - 1], [tx,ty] = points[i]
      stem(x * scale, y * scale, tx * scale, ty * scale, 3)
      leaf(tx * scale, (ty + 6) * scale, -1, .72 * scale)
      leaf(tx * scale, (ty - 3) * scale, 1, .72 * scale)
    }
    if (flowering) bloom(13, -106, art.bloom, .66)
    return
  }

  const woody = art.habit === 'tree' || art.habit === 'shrub'
  if (art.habit === 'tree') {
    stem(0, 3, 0, -76 * scale, 9 * scale, true)
    const branches = juvenile ? [[0,-44,0,-65]] : [[0,-45,-41,-89],[0,-55,35,-101],[0,-69,0,-115]]
    for (const [x,y,tx,ty] of branches) {
      stem(x * scale, y * scale, tx * scale, ty * scale, 4 * scale, true)
      for (let n = 0; n < 3; n++) {
        leaf((tx + n * 7 - 8) * scale, (ty + n * 4) * scale, n % 2 ? -1 : 1, 1.05 * scale)
      }
      if (flowering) bloom(tx * scale, (ty - 6) * scale, art.bloom, .55 * scale)
    }
    return
  }

  const tops = juvenile ? [{ base: 0, x: 0, y: -61 }] : [
    { base: -15, x: -36, y: -91 },
    { base: 0, x: 0, y: -113 },
    { base: 13, x: 37, y: -92 },
  ]
  for (const top of tops) {
    stem(top.base * scale, 2, top.x * scale, top.y * scale, woody ? 4 : 3, woody)
    const levels = juvenile ? 2 : 4
    for (let i = 1; i <= levels; i++) {
      const t = i / (levels + 1)
      const x = (top.base + (top.x - top.base) * t) * scale
      const y = (top.y * t + 2 * (1 - t)) * scale
      leaf(x, y, -1, (art.habit === 'herb' ? .93 : .8) * scale)
      leaf(x, y - 3 * scale, 1, (art.habit === 'herb' ? .85 : .72) * scale)
    }
    if (flowering) bloom(top.x * scale, (top.y - 5) * scale, art.bloom, woody ? .63 : .74)
  }
}
