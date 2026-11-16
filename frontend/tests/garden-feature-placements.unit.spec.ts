import { test, expect } from '@playwright/test'
import { gardenFeaturePlacements, type GardenFeaturePlacements } from '../src/features/my-garden/phaser-poc/garden-feature-placements'

const REGIONS = ['costa', 'sierra', 'oriente', 'galapagos'] as const
const MODALITIES = ['ground', 'pots', 'vertical', 'hanging'] as const

function expectPlacementsWithinGarden(layout: GardenFeaturePlacements) {
  const points = [
    ...Object.values(layout.waterSources).filter((point): point is NonNullable<typeof point> => Boolean(point)),
    ...Object.values(layout.irrigation).filter((point): point is NonNullable<typeof point> => Boolean(point)),
    ...Object.values(layout.fertilizers).filter((point): point is NonNullable<typeof point> => Boolean(point)),
    layout.rain,
  ]
  for (const point of points) {
    expect(point.x).toBeGreaterThanOrEqual(0)
    expect(point.x).toBeLessThanOrEqual(1920)
    expect(point.y).toBeGreaterThanOrEqual(700)
    expect(point.y).toBeLessThanOrEqual(1300)
  }
  expect(layout.channel.x).toBeGreaterThanOrEqual(0)
  expect(layout.channel.x + layout.channel.width).toBeLessThanOrEqual(1920)
  expect(layout.channel.y).toBeGreaterThanOrEqual(700)
  expect(layout.channel.y + layout.channel.height).toBeLessThanOrEqual(1500)
  for (const run of layout.fences) {
    expect(run.length).toBeGreaterThan(0)
    expect(run.thickness).toBeGreaterThan(0)
    expect(run.x - run.length / 2).toBeGreaterThanOrEqual(0)
    expect(run.x + run.length / 2).toBeLessThanOrEqual(1920)
    expect(run.y - run.thickness / 2).toBeGreaterThanOrEqual(0)
    expect(run.y + run.thickness / 2).toBeLessThanOrEqual(1500)
  }
}

test('las cuatro regiones y modalidades usan posiciones propias dentro del escenario', () => {
  const coastGround = gardenFeaturePlacements('costa', 'ground')!
  expect(coastGround.fences).toHaveLength(9)
  expect(coastGround.fences.filter(run => run.y === 1230)
    .every(run => run.x + run.length / 2 <= 850 || run.x - run.length / 2 >= 1210)).toBe(true)

  for (const region of REGIONS) {
    for (const kind of MODALITIES) {
      const layout = gardenFeaturePlacements(region, kind)
      expect(layout, `Faltan ubicaciones para ${region}/${kind}`).toBeTruthy()
      expectPlacementsWithinGarden(layout!)
      if (region !== 'costa' && kind === 'ground') {
        expect(layout).not.toEqual(coastGround)
        expect(layout!.fences).toHaveLength(4)
        // Los bordes de otros paisajes dejan un acceso libre en el centro.
        expect(layout!.fences.every(run => run.x + run.length / 2 <= 850 || run.x - run.length / 2 >= 1210)).toBe(true)
      }
      if (kind !== 'ground') {
        expect(layout!.fences).toHaveLength(region === 'costa' ? 0 : 4)
      }
    }
  }
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
