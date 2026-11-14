import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'
import type Phaser from 'phaser'
import { ACTIVITY_TYPES, type ActivityType } from '../src/features/my-garden/journal/activities'
import { playActivityAnimation, type EffectNode, TOOL_ANIMATION_MS } from '../src/features/my-garden/phaser-poc/activity-animations'
import type { GardenVisualModel } from '../src/features/my-garden/phaser-poc/model'

const folder = 'src/features/my-garden/phaser-poc/art/activity-tools'
const keys = {
  watering: 'watering-can.svg',
  fertilizing: 'compost-basket.svg',
  weeding: 'hand-rake.svg',
  harvest: 'harvest-basket.svg',
} as const

function harness() {
  const images: string[] = []
  const commands: string[] = []
  const created = new Set<EffectNode>()
  function node() {
    const g: Record<string, (...args: unknown[]) => unknown> = {}
    for (const key of ['setPosition', 'setAlpha', 'setScale', 'setDisplaySize', 'fillStyle', 'fillEllipse', 'fillTriangle', 'fillCircle',
      'lineStyle', 'lineBetween', 'strokeEllipse', 'strokeCircle', 'fillRoundedRect', 'strokeRoundedRect']) {
      g[key] = () => { commands.push(key); return g }
    }
    return g
  }
  const scene = {
    textures: { exists: () => true },
    time: { delayedCall: () => ({}) },
    tweens: { add: () => ({}) },
  } as unknown as Phaser.Scene
  const ctx = {
    scene,
    graphics: (_depth: number) => { const g = node() as unknown as EffectNode; created.add(g); return g as Phaser.GameObjects.Graphics },
    image: (key: string, _x: number, _y: number, _depth: number) => {
      images.push(key)
      const img = node() as unknown as Phaser.GameObjects.Image
      created.add(img)
      return img
    },
    live: (g: EffectNode) => created.has(g),
    destroy: (g: EffectNode) => { created.delete(g) },
  }
  const model = {
    kind: 'ground',
    slots: [{ plot: 2, anchor: { x: 630, y: 710 } }],
  } as unknown as GardenVisualModel
  return { ctx, model, images, commands, created }
}

test('cuatro implementos originales son SVG transparentes sin plantas incrustadas', () => {
  for (const [activity, filename] of Object.entries(keys)) {
    const source = readFileSync(folder + '/' + filename, 'utf-8')
    expect(source, activity).toContain('<svg')
    expect(source, activity).toContain('viewBox="0 0 240 220"')
    expect(source, activity).not.toMatch(/<image\b|<foreignObject|garden-bed|cultivo|plant-/i)
    expect(source, activity).toContain('url(#andean)')
  }
})

test('regar usa regadera, chorro y huella de suelo en el espacio registrado', () => {
  const h = harness()
  playActivityAnimation(h.ctx, h.model, 'watering', 2, false)
  expect(h.images).toEqual(['activity-tool-watering'])
  expect(h.commands.filter(x => x === 'strokeEllipse').length).toBeGreaterThan(0)
  expect(h.commands.filter(x => x === 'lineBetween').length).toBeGreaterThan(4)
  expect(TOOL_ANIMATION_MS).toBeLessThanOrEqual(3000)
  expect(h.model.slots[0].anchor).toEqual({ x: 630, y: 710 })
  expect(h.created.size).toBeGreaterThan(3)
})

test('abonado, deshierbe y cosecha usan implementos diferentes y no modifican plantas', () => {
  for (const type of ['fertilizing', 'weeding', 'harvest'] as const) {
    const h = harness()
    playActivityAnimation(h.ctx, h.model, type, 2, false)
    expect(h.images).toEqual(['activity-tool-' + type])
    expect(h.created.size).toBeGreaterThan(1)
  }
})

test('todas las actividades tienen una señal temporal incluso con movimiento reducido', () => {
  for (const type of Object.keys(ACTIVITY_TYPES) as ActivityType[]) {
    const h = harness()
    playActivityAnimation(h.ctx, h.model, type, 2, true)
    expect(h.created.size, type).toBeGreaterThan(0)
  }
})
