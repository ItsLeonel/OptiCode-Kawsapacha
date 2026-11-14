import { test, expect } from '@playwright/test'
import { analyzePlantPixels } from '../src/features/my-garden/plant-photo-analysis'
import { applyJournalCommand, emptyJournal, projectPlants } from '../src/features/my-garden/journal/journal'
import { localDate } from '../src/features/my-garden/plant-record'
import type { RealGarden } from '../src/features/real-gardens/real-garden'
import type { GardenActivity } from '../src/features/my-garden/journal/activities'
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

test('analizador extrae masa vegetal centrada sin inventar una especie', () => {
  const width = 64, height = 64
  const pixels = new Uint8ClampedArray(width * height * 4)
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const i = (y * width + x) * 4
    const plant = x >= 23 && x <= 39 && y >= 12 && y <= 51
    pixels[i] = plant ? 40 : 210
    pixels[i + 1] = plant ? 140 : 215
    pixels[i + 2] = plant ? 48 : 225
    pixels[i + 3] = 255
  }
  const visual = analyzePlantPixels(pixels, width, height)
  expect(visual).not.toBeNull()
  expect(visual?.confidence).toBe('high')
  expect(visual?.centerX).toBeGreaterThan(.4)
  expect(visual?.centerX).toBeLessThan(.6)
  expect(visual?.foliageColor).toBe('#288c30')
  expect(visual?.heightRatio).toBeGreaterThan(.6)
})
test('fondo enteramente verde se considera dudoso y ausencia vegetal no crea perfil', () => {
  const pixels = new Uint8ClampedArray(32 * 32 * 4)
  for (let i = 0; i < pixels.length; i += 4) { pixels[i] = 35; pixels[i+1] = 145; pixels[i+2] = 40; pixels[i+3] = 255 }
  expect(analyzePlantPixels(pixels, 32, 32)?.confidence).toBe('low')
  for (let i = 0; i < pixels.length; i += 4) { pixels[i] = 155; pixels[i+1] = 85; pixels[i+2] = 70 }
  expect(analyzePlantPixels(pixels, 32, 32)).toBeNull()
})

test('dos observaciones actualizan sprite por perfil y anular B recupera A', () => {
  const terrain: RealGarden = { name: 'Huerto', kind: 'ground', areaM2: 10,
    location: { province: 'Pichincha', provinceCode: '17', canton: '', cantonCode: null, parish: '', parishCode: null, reference: '', coordinates: null },
    soilType: 'loam', irrigationAvailability: 'available', communityName: 'Comunidad' }
  let journal = applyJournalCommand(emptyJournal(), { id: 'community', type: 'community',
    community: { name: 'Comunidad', responsible: 'Responsable de prueba', location: 'Pichincha', description: '' } })
  journal = applyJournalCommand(journal, { id: 'terrain', type: 'terrain', terrain })
  journal = applyJournalCommand(journal, { id: 'plant', type: 'plant-add',
    plant: { id: 'herb-a', name: 'Manzanilla', latin: 'Matricaria chamomilla', plot: 0,
      date: localDate(), photo: '', photoId: 'photo-a', growthStage: 'seedling',
      visualProfile: observation,
      evidences: [{ id: 'initial-a', date: localDate(), notes: 'Inicio', photoId: 'photo-a', growthStage: 'seedling', visualProfile: observation }] } })
  const next: PlantVisualProfile = { ...observation, coverage: .32, heightRatio: .72, densityLevel: 5, heightLevel: 4, foliageColor: '#238b38' }
  const activity: GardenActivity = { id: 'photo-b', gardenId: journal.gardenId,
    type: 'observation', date: localDate(), responsible: 'Responsable de prueba',
    target: { kind: 'plant', plantId: 'herb-a', plot: 0 }, notes: 'Segunda foto',
    details: { visualProfile: next }, photoIds: ['new-photo'], createdAt: new Date().toISOString(), validation: 'local-v1' }
  const saved = applyJournalCommand(journal, { id: 'observe-b', type: 'activity', activity })
  expect(projectPlants(saved)[0].visualProfile).toEqual(next)
  expect(projectPlants(saved)[0].growthStage).toBe('seedling')
  expect(projectPlants(saved)[0].evidences).toHaveLength(2)
  const canceled = applyJournalCommand(saved, { id: 'revert-b', type: 'activity-void', activityId: activity.id,
    reason: 'Foto incorrecta en seguimiento', at: new Date().toISOString() })
  expect(projectPlants(canceled)[0].visualProfile).toEqual(observation)
  expect(canceled.activities[0].voidedAt).toBeTruthy()
  expect(projectPlants(canceled)[0].evidences).toHaveLength(1)
})
