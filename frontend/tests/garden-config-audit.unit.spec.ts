import { expect, test } from '@playwright/test'
import {
  GARDEN_FEATURE_OPTIONS,
  IRRIGATION_METHOD_OPTIONS,
  SELECTABLE_IRRIGATION_METHOD_OPTIONS,
  toGardenFeatures,
  toggleGardenFeature,
} from '../src/features/real-gardens/garden-characteristics'
import { toGardenDraft, type RealGarden } from '../src/features/real-gardens/real-garden'
import { buildGardenVisualModel } from '../src/features/my-garden/phaser-poc/model'

const base: RealGarden = {
  name: 'Huerto de prueba', kind: 'ground', areaM2: 25,
  location: {
    province: 'Imbabura', provinceCode: '10', canton: '', cantonCode: null,
    parish: '', parishCode: null, reference: '', coordinates: null,
  },
  soilType: 'loam', irrigationAvailability: 'available', communityName: null,
  characteristics: {
    groundDesigns: ['furrows', 'terraces'], fences: ['living', 'natural'],
    waterSources: ['rain', 'well'], irrigationMethods: ['manual', 'drip'],
    naturalFertilizers: ['leaves', 'compost'],
  },
}

test('no permite seleccionar aspersión para nuevos huertos, conserva el valor legado', () => {
  expect('sprinkler' in SELECTABLE_IRRIGATION_METHOD_OPTIONS).toBe(false)
  expect(IRRIGATION_METHOD_OPTIONS.sprinkler).toBe('Aspersión')
  expect(Object.keys(SELECTABLE_IRRIGATION_METHOD_OPTIONS)).toEqual(['manual', 'hose', 'drip', 'other'])
  const legacy = toGardenFeatures({ irrigationMethods: ['sprinkler', 'drip'] })
  expect(legacy.irrigationMethods).toEqual(['sprinkler', 'drip'])
  expect(toggleGardenFeature(legacy, 'irrigationMethods', 'sprinkler').irrigationMethods).toEqual(['drip'])
  expect(GARDEN_FEATURE_OPTIONS.irrigationMethods.sprinkler).toBeTruthy()
})

test('no pierde coordenadas válidas de latitud cero al cargar datos heredados', () => {
  const legacy = { ...base, latitude: 0, longitude: -78.45 } as RealGarden & { latitude: number; longitude: number }
  expect(toGardenDraft(legacy).coordinates).toEqual({ latitude: 0, longitude: -78.45 })
})

test('configuración seleccionada se propaga sin inventar plantas a las 16 combinaciones región/modalidad', () => {
  const regions = ['sierra', 'costa', 'oriente', 'galapagos'] as const
  const kinds = ['ground', 'pots', 'vertical', 'hanging'] as const
  for (const region of regions) for (const kind of kinds) {
    const input = structuredClone({ ...base, kind })
    const visual = buildGardenVisualModel(input, [], region)
    expect(visual.kind).toBe(kind)
    expect(visual.region).toBe(region)
    expect(visual.characteristics).toEqual(input.characteristics)
    expect(visual.characteristics).not.toBe(input.characteristics)
    expect(visual.slots).toHaveLength(6)
    expect(visual.slots.every(slot => slot.plant === null)).toBe(true)
    expect(visual.slots.every(slot => slot.design === null)).toBe(kind !== 'ground')
  }
})
