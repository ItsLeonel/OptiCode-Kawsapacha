import { expect, test } from '@playwright/test'
import { GROWTH_STAGES, documentedGrowthStage, isChamomile, isGrowthStage } from '../src/features/my-garden/growth-stages'
import { validatePlantUpdate, localDate, type PlantUpdate } from '../src/features/my-garden/plant-record'
import { applyJournalCommand, emptyJournal, projectPlants } from '../src/features/my-garden/journal/journal'
import { validateActivity, type GardenActivity } from '../src/features/my-garden/journal/activities'
import type { GardenPlant } from '../src/features/my-garden/garden'
import type { RealGarden } from '../src/features/real-gardens/real-garden'

const terrain: RealGarden = {
  name: 'Huerto medicinal de prueba', kind: 'ground', areaM2: 12,
  location: { province: 'Imbabura', provinceCode: '10', canton: '', cantonCode: null,
    parish: '', parishCode: null, reference: '', coordinates: null },
  soilType: 'loam', irrigationAvailability: 'available', communityName: 'Huerto de prueba',
}
const plant: GardenPlant = {
  id: 'chamomile-one', name: 'Manzanilla', latin: 'Matricaria chamomilla',
  date: localDate(), photo: '', photoId: 'photo-planting', plot: 0,
  state: 'observed', growthStage: 'sown',
  evidences: [{ id: 'seed', date: localDate(), notes: 'Semillas sembradas', photoId: 'photo-planting', growthStage: 'sown' }],
}
function journal() {
  let state = applyJournalCommand(emptyJournal(), {
    id: 'community', type: 'community',
    community: { name: 'Huerto de prueba', responsible: 'Responsable de prueba',
      location: 'Imbabura', description: '' },
  })
  state = applyJournalCommand(state, { id: 'terrain', type: 'terrain', terrain })
  return applyJournalCommand(state, { id: 'seed-plant', type: 'plant-add', plant })
}
function activity(gardenId: string, type: GardenActivity['type'], details: GardenActivity['details'], photoIds: string[] = []): GardenActivity {
  return {
    id: 'activity-' + type, gardenId, type, date: localDate(),
    responsible: 'Responsable de prueba', target: { kind: 'plant', plantId: plant.id, plot: 0 },
    notes: 'Observación real de la manzanilla', details, photoIds,
    createdAt: new Date().toISOString(), validation: 'local-v1',
  }
}

test('no se infiere crecimiento desde edad, especie, fotografía ni riegos', () => {
  expect(documentedGrowthStage({})).toBeNull()
  expect(documentedGrowthStage({ growthStage: 'sown' })).toBe('sown')
  expect(isChamomile('Manzanilla', 'Matricaria chamomilla')).toBe(true)
  expect(isGrowthStage('sprout')).toBe(true)
  expect(isGrowthStage('forty-percent')).toBe(false)
  expect(Object.keys(GROWTH_STAGES)).toHaveLength(6)
  const original = journal()
  const watered = applyJournalCommand(original, {
    id: 'water', type: 'activity', activity: activity(original.gardenId, 'watering', { quantity: 1, unit: 'L' }),
  })
  expect(projectPlants(watered)[0].growthStage).toBe('sown')
  expect(original.activities).toHaveLength(0)
})

test('brotación observada cambia la ilustración solo con fotografía nueva', () => {
  const state = journal()
  const sprout = activity(state.gardenId, 'observation', { growthStage: 'sprout', heightCm: 2 })
  expect(validateActivity(sprout, projectPlants(state))).toContain('foto real')
  const withPhoto = { ...sprout, photoIds: ['photo-sprout'] }
  expect(validateActivity(withPhoto, projectPlants(state))).toBeNull()
  const observed = applyJournalCommand(state, { id: 'sprout-evidence', type: 'activity', activity: withPhoto })
  expect(projectPlants(observed)[0].growthStage).toBe('sprout')
  expect(projectPlants(observed)[0].evidences?.at(-1)).toMatchObject({
    growthStage: 'sprout', photoId: 'photo-sprout', heightCm: 2,
  })
  expect(projectPlants(state)[0].growthStage).toBe('sown')
  const voided = applyJournalCommand(observed, {
    id: 'void', type: 'activity-void', activityId: withPhoto.id,
    reason: 'Fotografía equivocada, se revierte el registro', at: new Date().toISOString(),
  })
  expect(projectPlants(voided)[0].growthStage).toBe('sown')
  expect(voided.activities[0].voidedAt).toBeTruthy()
})

test('edición de etapa también requiere una fotografía nueva', () => {
  const update: PlantUpdate = {
    name: 'Manzanilla', latin: 'Matricaria chamomilla', plot: 0, plantedOn: '',
    state: 'observed', growthStage: 'sprout', date: localDate(), observations: 'Brote visible',
  }
  expect(validatePlantUpdate(update, plant, [plant])).toContain('fotografía nueva')
  expect(validatePlantUpdate(update, plant, [plant], true)).toBeNull()
  const first = journal()
  expect(() => applyJournalCommand(first, {
    id: 'edit-no-photo', type: 'plant-update', plantId: plant.id,
    draft: update, evidenceId: 'evidence-a', retainedPhotoId: plant.photoId,
    at: new Date().toISOString(),
  })).toThrow('fotografía nueva')
  const saved = applyJournalCommand(first, {
    id: 'edit-photo', type: 'plant-update', plantId: plant.id,
    draft: update, evidenceId: 'evidence-b', photoId: 'new-photo',
    retainedPhotoId: plant.photoId, at: new Date().toISOString(),
  })
  expect(projectPlants(saved)[0].growthStage).toBe('sprout')
  expect(projectPlants(saved)[0].evidences?.at(-1)).toMatchObject({
    growthStage: 'sprout', photoId: 'new-photo',
  })
})

test('la cosecha completa documentada no inventa un rebrote', () => {
  const state = journal()
  const harvested = applyJournalCommand(state, {
    id: 'harvest', type: 'activity',
    activity: activity(state.gardenId, 'harvest', { harvestMode: 'complete', releasePlot: false }),
  })
  expect(projectPlants(harvested)[0].growthStage).toBe('harvested')
  expect(projectPlants(harvested)[0].growthStage).not.toBe('sprout')
})
