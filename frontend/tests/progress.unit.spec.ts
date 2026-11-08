import { test, expect } from '@playwright/test'
import { emptyJournal } from '../src/features/my-garden/journal/journal'
import { calculateProgress } from '../src/features/my-garden/journal/progress'
import type { GardenActivity } from '../src/features/my-garden/journal/activities'

test('rewards derive from valid events, exclude duplicates and voids, separate responsible persons', () => {
  const journal = emptyJournal()
  journal.plants = [{ id: 'plant', name: 'Romero', latin: '', plot: 0, photo: '', photoId: 'photo', date: '2026-11-01' }]
  const first: GardenActivity = { id: 'water', gardenId: journal.gardenId, type: 'watering', date: '2026-11-01', responsible: 'Ana', target: { kind: 'plant', plantId: 'plant', plot: 0 }, notes: 'Dos litros.', details: { quantity: 2, unit: 'L' }, photoIds: [], createdAt: '2026-11-01T12:00:00Z', validation: 'local-v1' }
  journal.activities = [first, { ...first }, { ...first, id: 'same-body' }, { ...first, id: 'same-day', notes: 'Riego de la tarde.' }, { ...first, id: 'void', date: '2026-11-02', voidedAt: '2026-11-02T15:00:00Z' }, { ...first, id: 'other-actor', responsible: 'Luis' }]
  expect(calculateProgress(journal, 'Ana').points).toBe(5)
  expect(calculateProgress(journal, 'ana').points).toBe(5)
  expect(calculateProgress(journal).points).toBe(10)
  expect(calculateProgress(journal, 'Ana').level).toBe('Aprendiz')
  journal.activities = journal.activities.map(activity => ({ ...activity, voidedAt: '2026-11-03T12:00:00Z' }))
  expect(calculateProgress(journal).points).toBe(0)
})
test('levels and badges require documented milestones, not clicks, elapsed time or loaded plants', () => {
  const journal = emptyJournal()
  expect(calculateProgress(journal).badges.every(badge => !badge.earned)).toBe(true)
  journal.plants = Array.from({ length: 16 }, (_, index) => ({ id: 'plant-' + index, plot: index % 6, name: 'Romero', latin: '', photo: '', photoId: 'photo-' + index, date: `2026-10-${String(index + 1).padStart(2, '0')}`, archivedAt: '2026-11-01T12:00:00Z' }))
  journal.activities = Array.from({ length: 16 }, (_, index) => ({ id: 'event-' + index, gardenId: journal.gardenId, type: 'sowing', date: `2026-10-${String(index + 1).padStart(2, '0')}`, responsible: 'Ana', target: { kind: 'plant', plantId: 'plant-' + index, plot: index % 6 }, notes: 'Registro de prueba', photoIds: ['photo-' + index], details: {}, createdAt: `2026-10-${String(index + 1).padStart(2, '0')}T12:00:00Z`, validation: 'local-v1' }))
  expect(calculateProgress({ ...journal, activities: journal.activities.slice(0, 5) }).level).toBe('Oficial')
  expect(calculateProgress(journal).level).toBe('Maestro')
  expect(calculateProgress(journal).badges.find(badge => badge.id === 'first-sowing')?.earned).toBe(true)
  expect(calculateProgress(journal).points).toBe(320)
})
