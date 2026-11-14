import { test, expect } from '@playwright/test'
import { compareVisualProfiles, isPlantVisualProfile, visualLevel, type PlantVisualProfile } from '../src/features/my-garden/plant-visual-profile'

const observation: PlantVisualProfile = {
  version: 1, analyzer: 'canvas-foliage-v1', confidence: 'high',
  coverage: .12, heightRatio: .3, widthRatio: .34, centerX: .5,
  heightLevel: 2, densityLevel: 2, spreadLevel: 2,
  foliageColor: '#408c42', leafTone: 'medium', orientation: 'upright', floweringHint: 'not-detected',
}
test('validar perfil fotográfico con cotas estrictas', () => {
  expect(isPlantVisualProfile(observation)).toBeTruthy()
  expect(isPlantVisualProfile({ ...observation, widthRatio: 1.4 })).toBeFalsy()
  expect(isPlantVisualProfile({ ...observation, densityLevel: 8 })).toBeFalsy()
  expect(isPlantVisualProfile({ ...observation, foliageColor: 'red' })).toBeFalsy()
  expect(visualLevel(0)).toBe(1)
  expect(visualLevel(1)).toBe(5)
})
test('comparaciones no equivalen a una medición real', () => {
  const next: PlantVisualProfile = {
    ...observation, heightRatio: .7, widthRatio: .66, densityLevel: 4,
    floweringHint: 'possible',
  }
  expect(compareVisualProfiles(observation, next)).toContain('Más cobertura foliar aparente')
  expect(compareVisualProfiles(observation, next)).toContain('Posibles flores visibles; verificar en la foto')
  expect(compareVisualProfiles(undefined, next)).toEqual([])
  expect(compareVisualProfiles(next, next)).toEqual([])
})
