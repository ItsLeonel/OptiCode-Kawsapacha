import { expect, test } from '@playwright/test'
import { applyJournalCommand, emptyJournal, projectPlants, validateJournal } from '../src/features/my-garden/journal/journal'
import { type GardenActivity, validateActivity } from '../src/features/my-garden/journal/activities'
import { localDate } from '../src/features/my-garden/plant-record'
import { calculateProgress } from '../src/features/my-garden/journal/progress'
import type { RealGarden } from '../src/features/real-gardens/real-garden'

const terrain: RealGarden = { name: 'Huerto de prueba', kind: 'ground', areaM2: 25, location: { province: 'Imbabura', provinceCode: '10', canton: '', cantonCode: null, parish: '', parishCode: null, reference: '', coordinates: null }, soilType: 'loam', irrigationAvailability: 'unknown', communityName: 'Comunidad de prueba' }
function setup() {
  let state = applyJournalCommand(emptyJournal(), { id: 'community', type: 'community', community: { name: 'Comunidad de prueba', responsible: 'Responsable de prueba', location: 'Imbabura', description: '' } })
  state = applyJournalCommand(state, { id: 'terrain', type: 'terrain', terrain })
  return applyJournalCommand(state, { id: 'plant', type: 'plant-add', plant: { id: 'plant-one', plot: 0, name: 'Romero', latin: 'Salvia rosmarinus', photo: '', photoId: 'photo-one', date: localDate(), state: 'not-documented' } })
}
function activity(gardenId: string, changes: Partial<GardenActivity> = {}): GardenActivity { return { id: 'activity-one', gardenId, type: 'watering', date: localDate(), responsible: 'Responsable de prueba', target: { kind: 'plant', plantId: 'plant-one', plot: 0 }, notes: 'Riego manual documentado', details: { quantity: 2, unit: 'L' }, photoIds: [], createdAt: new Date().toISOString(), validation: 'local-v1', ...changes } }

test('watering records a real event without inferring height, state, photo or plant growth', () => {
  const before = setup(), next = applyJournalCommand(before, { id: 'water', type: 'activity', activity: activity(before.gardenId) })
  expect(next.activities).toHaveLength(1)
  expect(projectPlants(next)[0]).toMatchObject({ state: 'not-documented', photoId: 'photo-one', plot: 0 })
  expect(projectPlants(next)[0].evidences).toHaveLength(0)
  expect(before.activities).toHaveLength(0)
  expect(validateActivity(activity(before.gardenId, { details: { heightCm: 30 } }), before.plants)).toContain('seguimiento')
})
test('command replay and equal activity content with a different id are idempotent', () => {
  const before = setup(), command = { id: 'water', type: 'activity', activity: activity(before.gardenId) } as const
  const first = applyJournalCommand(before, command)
  expect(applyJournalCommand(first, command)).toBe(first)
  const repeated = applyJournalCommand(first, { id: 'different-command', type: 'activity', activity: { ...command.activity, id: 'different-event' } })
  expect(repeated.activities).toHaveLength(1)
})
test('changing region, kind or terrain characteristics retains plant ids, photos and activities', () => {
  let state = setup(); state = applyJournalCommand(state, { id: 'water', type: 'activity', activity: activity(state.gardenId) })
  for (const kind of ['ground', 'pots', 'vertical', 'hanging'] as const) {
    const next = applyJournalCommand(state, { id: 'terrain-' + kind, type: 'terrain', terrain: { ...terrain, kind, location: { ...terrain.location, province: 'Galápagos' }, characteristics: { groundDesigns: ['terraces'], fences: [], waterSources: [], irrigationMethods: [], naturalFertilizers: [] } } })
    expect(next.plants).toEqual(state.plants); expect(next.activities).toEqual(state.activities)
  }
})
test('complete harvest releases a space reversibly, without deleting the plant or its evidence', () => {
  const before = setup(), harvest = activity(before.gardenId, { type: 'harvest', notes: 'Cosecha completa documentada', details: { harvestMode: 'complete', releasePlot: true } })
  const saved = applyJournalCommand(before, { id: 'harvest', type: 'activity', activity: harvest })
  expect(projectPlants(saved)[0].archivedAt).toBeTruthy(); expect(saved.plants).toHaveLength(1)
  const voided = applyJournalCommand(saved, { id: 'void', type: 'activity-void', activityId: harvest.id, reason: 'Se registró la actividad equivocada', at: new Date().toISOString() })
  expect(projectPlants(voided)[0].archivedAt).toBeUndefined(); expect(voided.activities[0].voidedAt).toBeTruthy()
})
test('occupied destinations and invalid dates cannot mutate or replace existing plants', () => {
  const state = setup(), before = structuredClone(state)
  expect(() => applyJournalCommand(state, { id: 'second', type: 'plant-add', plant: { ...state.plants[0], id: 'another' } })).toThrow('ocupado')
  expect(() => applyJournalCommand(state, { id: 'future', type: 'activity', activity: activity(state.gardenId, { date: '2099-01-01' }) })).toThrow('fecha')
  expect(state).toEqual(before)
})

test('voiding a harvest cannot displace the later occupant or erase either history', () => {
  const before = setup(), harvest = activity(before.gardenId, { type: 'harvest', details: { harvestMode: 'complete', releasePlot: true } })
  let state = applyJournalCommand(before, { id: 'harvest', type: 'activity', activity: harvest })
  state = applyJournalCommand(state, { id: 'new-plant', type: 'plant-add', plant: { ...before.plants[0], id: 'new-occupant', photoId: 'another-photo' } })
  const snapshot = structuredClone(state)
  expect(() => applyJournalCommand(state, { id: 'void', type: 'activity-void', activityId: harvest.id, reason: 'Corrección del registro de cosecha', at: new Date().toISOString() })).toThrow('otra planta')
  expect(state).toEqual(snapshot)
  expect(state.plants).toHaveLength(2)
  expect(projectPlants(state).filter(plant => !plant.archivedAt).map(plant => plant.id)).toEqual(['new-occupant'])
})

test('malformed saved records and zero quantities are rejected without overwriting data', () => {
  const state = setup()
  expect(() => validateJournal({ ...state, plants: [{ ...state.plants[0], plot: 9 }] })).toThrow('sin sobrescribirlos')
  expect(() => validateJournal({ ...state, activities: [{ id: 'broken' }] })).toThrow('sin sobrescribirlos')
  expect(validateActivity(activity(state.gardenId, { details: { quantity: 0, unit: 'L' } }), state.plants)).toContain('mayor que cero')
})

test('a new photo with the same observation keeps both evidences with one daily reward', () => {
  const before = setup(), first = activity(before.gardenId, { type: 'observation', details: { state: 'observed' }, photoIds: ['observation-a'], notes: 'Seguimiento fotográfico' })
  let state = applyJournalCommand(before, { id: 'observation-a', type: 'activity', activity: first })
  state = applyJournalCommand(state, { id: 'observation-b', type: 'activity', activity: { ...first, id: 'another-observation', photoIds: ['observation-b'] } })
  expect(state.activities).toHaveLength(2)
  expect(projectPlants(state)[0].evidences).toHaveLength(2)
  expect(projectPlants(state)[0].photoId).toBe('observation-b')
  expect(calculateProgress(state).points).toBe(12)
})
