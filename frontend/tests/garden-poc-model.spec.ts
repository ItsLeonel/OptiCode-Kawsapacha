import { test, expect } from '@playwright/test'
import type { RealGarden } from '../src/features/real-gardens/real-garden'
import type { GardenPlant } from '../src/features/my-garden/garden'
import { buildGardenVisualModel, LAYOUT_PROFILES } from '../src/features/my-garden/phaser-poc/model'
import { GardenSceneBridge } from '../src/features/my-garden/phaser-poc/bridge'
import { SOIL_STYLES } from '../src/features/my-garden/phaser-poc/visual-config'
import { WORLD } from '../src/features/my-garden/phaser-poc/assets'
import { coastalFootprintRatio } from '../src/features/my-garden/phaser-poc/coastal-terrain'

// Test fixtures only. The lab never inserts these records into the application.
const garden: RealGarden = {
  name: 'Terreno de prueba automatizada', kind: 'ground', areaM2: 25,
  location: { province: 'Imbabura', provinceCode: '10', canton: '', cantonCode: null, parish: '', parishCode: null, reference: '', coordinates: null },
  soilType: 'unknown', irrigationAvailability: 'available', communityName: null,
  characteristics: { groundDesigns: ['furrows'], fences: ['living'], waterSources: ['rain'], irrigationMethods: ['drip'], naturalFertilizers: ['compost'] },
}
const plant: GardenPlant = { id: 'recorded-plant', plot: 4, name: 'Romero', latin: 'Salvia rosmarinus', date: '2026-11-07', photo: 'blob:real-photo-evidence' }

test('adapter: six stable ids preserve the plant and its evidence across kinds, area and region', () => {
  const expected = Array.from({ length: 6 }, (_, plot) => `garden-slot-${plot}`)
  for (const kind of ['ground', 'pots', 'vertical', 'hanging'] as const) {
    for (const [province, region] of [['Imbabura', 'sierra'], ['Manabí', 'costa'], ['Napo', 'oriente'], ['Galápagos', 'galapagos']] as const) {
      const model = buildGardenVisualModel({ ...garden, kind, areaM2: .01, location: { ...garden.location, province } }, [plant], region)
      expect(model.region).toBe(region)
      expect(model.slots.map(slot => slot.id)).toEqual(expected)
      expect(model.slots.map(slot => slot.plot)).toEqual([0, 1, 2, 3, 4, 5])
      expect(model.slots[4].plant).toEqual(plant)
      expect(model.slots.filter(slot => slot.plant)).toHaveLength(1)
      expect(model.activitySource).toBe('not-connected')
    }
  }
  expect(LAYOUT_PROFILES.ground.implemented).toBe(true)
  expect(Object.values(LAYOUT_PROFILES).every(profile => profile.implemented)).toBe(true)
})

test('adapter: no invented activity, shallow evidence copy and independent configuration arrays', () => {
  const input = structuredClone(garden)
  const before = structuredClone(input)
  const model = buildGardenVisualModel(input, [plant], 'sierra')
  expect(input).toEqual(before)
  expect(model.slots[4].plant).not.toBe(plant)
  expect(model.slots[4].plant).not.toHaveProperty('plantedOn')
  expect(model).not.toHaveProperty('growth')
  expect(model).not.toHaveProperty('harvest')
  model.characteristics.fences.push('natural')
  expect(input).toEqual(before)
  const empty = buildGardenVisualModel({ ...garden, characteristics: undefined, irrigationAvailability: 'unknown' }, [], 'sierra')
  expect(Object.values(empty.characteristics).every(values => values.length === 0)).toBe(true)
  expect(empty.slots.every(slot => slot.plant === null)).toBe(true)
})

test('bridge: independent instances, latest snapshots, blocking and listener cleanup', () => {
  const model = buildGardenVisualModel(garden, [], 'sierra')
  const a = new GardenSceneBridge({ model, selected: null, blocked: false })
  const b = new GardenSceneBridge({ model, selected: null, blocked: false })
  const events: string[] = []
  const otherEvents: string[] = []
  const unsubscribe = a.onEvent(event => events.push(event.type))
  b.onEvent(event => otherEvents.push(event.type))
  a.emit({ type: 'activate-slot', slot: 'garden-slot-4' })
  expect(events).toEqual(['activate-slot'])
  expect(otherEvents).toEqual([])
  a.command({ type: 'snapshot', snapshot: { model, selected: 'garden-slot-4', blocked: true } })
  a.emit({ type: 'activate-slot', slot: 'garden-slot-0' })
  expect(events).toHaveLength(1)
  expect(a.snapshot.selected).toBe('garden-slot-4')
  unsubscribe()
  a.emit({ type: 'ready', renderer: 'Canvas' })
  expect(events).toHaveLength(1)
})

test('four layouts have independent anchors and keep unregistered slots empty', () => {
  const layouts = new Map<string, string>()
  for (const kind of ['ground', 'pots', 'vertical', 'hanging'] as const) {
    const model = buildGardenVisualModel({ ...garden, kind, characteristics: undefined }, [], 'sierra')
    expect(model.slots.every(slot => slot.plant === null && slot.design === null)).toBe(true)
    expect(new Set(model.slots.map(slot => `${slot.anchor.x}:${slot.anchor.y}`)).size).toBe(6)
    expect(model.slots.every(slot => slot.depth === slot.base.y)).toBe(true)
    layouts.set(kind, JSON.stringify(model.slots.map(slot => slot.anchor)))
  }
  expect(new Set(layouts.values()).size).toBe(4)
})

test('the six target centers remain individually selectable at mobile width', () => {
  for (const kind of ['ground', 'pots', 'vertical', 'hanging'] as const) {
    const model = buildGardenVisualModel({ ...garden, kind }, [], 'sierra')
    const zoom = kind === 'ground' ? 320 / WORLD.width : Math.max(320 / WORLD.width, 460 / WORLD.height)
    const ratio = coastalFootprintRatio(model.footprintScale)
    const profile = LAYOUT_PROFILES[kind]
    const hitX = Math.max(kind === 'ground' ? 160 * ratio : profile.hitX, 22 / zoom)
    const hitY = Math.max(kind === 'ground' ? 74 * ratio : profile.hitY, 22 / zoom)
    for (const first of model.slots) for (const second of model.slots) if (first.plot < second.plot) {
      // Expanded 44px targets may meet; another target must never cover a
      // slot's center, which the renderer selects by nearest distance.
      expect(Math.hypot((first.anchor.x - second.anchor.x) / hitX, (first.anchor.y - second.anchor.y) / hitY), `${kind}: ${first.plot}/${second.plot}`).toBeGreaterThan(1)
    }
  }
})

test('soil and distributions reflect only recorded configuration, independently of the region', () => {
  const characteristics = { ...garden.characteristics!, groundDesigns: ['furrows', 'beds', 'raisedBeds', 'terraces'] as const }
  for (const soil of Object.keys(SOIL_STYLES) as (keyof typeof SOIL_STYLES)[]) {
    const model = buildGardenVisualModel({ ...garden, soilType: soil, characteristics: { ...characteristics, groundDesigns: [...characteristics.groundDesigns] } }, [], 'galapagos')
    expect(model.soilType).toBe(soil)
    expect(model.soilStyle).toEqual(SOIL_STYLES[soil])
    expect(new Set(model.slots.map(slot => slot.design))).toEqual(new Set(characteristics.groundDesigns))
    expect(model.activitySource).toBe('not-connected')
  }
  const unknown = buildGardenVisualModel({ ...garden, soilType: null, characteristics: undefined }, [], 'oriente')
  expect(unknown.soilStyle).toEqual(SOIL_STYLES.unknown)
  expect(Object.values(unknown.characteristics).every(values => values.length === 0)).toBe(true)
})

test('regional ground anchors follow the approved Costa footprint at every registered area', () => {
  for (const areaM2 of [1, 10, 25, 50, 100, 1000]) {
    const reference = buildGardenVisualModel({ ...garden, areaM2 }, [], 'costa')
    for (const region of ['sierra', 'oriente', 'galapagos'] as const) {
      const model = buildGardenVisualModel({ ...garden, areaM2 }, [plant], region)
      expect(model.slots.map(slot => slot.anchor)).toEqual(reference.slots.map(slot => slot.anchor))
      expect(model.slots[4].plant).toEqual(plant)
      expect(new Set(model.slots.map(slot => slot.anchor.y)).size).toBe(2)
      expect(new Set(model.slots.map(slot => slot.anchor.x)).size).toBe(3)
    }
  }
})
