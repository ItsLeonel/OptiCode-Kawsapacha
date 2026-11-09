import { test, expect } from '@playwright/test'
import { gardenFeaturePlacements } from '../src/features/my-garden/phaser-poc/garden-feature-placements'

test('the four ground regions share reserved feature margins without changing other modalities', () => {
  const layout = gardenFeaturePlacements('costa', 'ground')!
  expect(layout).toBeTruthy()
  for (const region of ['sierra', 'oriente', 'galapagos'] as const) {
    expect(gardenFeaturePlacements(region, 'ground')).toEqual(layout)
  }
  expect(gardenFeaturePlacements('costa', 'pots')).toBeUndefined()
  expect(gardenFeaturePlacements('sierra', 'vertical')).toBeUndefined()

  const points = [
    ...Object.values(layout.waterSources).filter((point): point is NonNullable<typeof point> => Boolean(point)),
    ...Object.values(layout.irrigation),
    ...Object.values(layout.fertilizers),
    layout.rain,
  ]
  for (const point of points) {
    expect(point.x).toBeGreaterThanOrEqual(0)
    expect(point.x).toBeLessThanOrEqual(1920)
    expect(point.y).toBeGreaterThanOrEqual(700)
    expect(point.y).toBeLessThanOrEqual(1300)
  }

  expect(layout.channel.x + layout.channel.width).toBeLessThanOrEqual(1920)
  expect(layout.channel.y).toBeGreaterThan(790)
  expect(layout.channel.y + layout.channel.height).toBeLessThan(1190)
  expect(layout.fences).toHaveLength(9)
  expect(layout.fences.every(run => run.rotation === undefined)).toBe(true)
  // Front rails leave a centered access route open (x=850..1210).
  expect(layout.fences.filter(run => run.y === 1230).every(run => run.x + run.length / 2 <= 850 || run.x - run.length / 2 >= 1210)).toBe(true)
  expect(layout.fences.every(run => run.x - run.thickness / 2 >= 0 && run.x + run.thickness / 2 <= 1920)).toBe(true)
})

test('garden feature placements are distinct for simultaneous declared selections', () => {
  const layout = gardenFeaturePlacements('costa', 'ground')!
  const manual = layout.irrigation.manual!, hose = layout.irrigation.hose!, sprinkler = layout.irrigation.sprinkler!
  expect(new Set([manual, hose, sprinkler].map(point => `${point.x}:${point.y}`)).size).toBe(3)
  const waterSourceLocations = [layout.waterSources.stored!, layout.waterSources.well!, layout.waterSources.mains!]
    .map(point => `${point.x}:${point.y}`)
  expect(new Set(waterSourceLocations).size).toBe(3)
  expect(layout.waterSources.mains!.x).toBeLessThan(layout.channel.x)
  expect(layout.fertilizers.leaves!.x).toBeLessThan(layout.fertilizers.plantRemains!.x)
  expect(layout.fertilizers.plantRemains!.x).toBeLessThan(layout.fertilizers.compost!.x)
  expect(layout.fertilizers.fallow!.x).toBeGreaterThan(layout.rain.x)
})
