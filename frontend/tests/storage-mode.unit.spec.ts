import { test, expect } from '@playwright/test'
import { AUTHENTICATED_JOURNAL, basicServerNotes, validateBasicServerActivity } from '../src/features/my-garden/journal/storage-mode'
import type { ActivityDraft } from '../src/features/my-garden/journal/activities'
import type { GardenPlant } from '../src/features/my-garden/garden'
import { localDate } from '../src/features/my-garden/plant-record'
import { emptyJournal } from '../src/features/my-garden/journal/journal'

const plant: GardenPlant = { id: 'api-plant', name: 'Romero', latin: 'Salvia rosmarinus', plot: 0, date: '2026-11-14', photo: '' }
const activity: ActivityDraft = { id: 'care-1', type: 'watering', date: localDate(), responsible: 'Cuenta real',
  notes: 'Riego comprobado', target: { kind: 'plant', plantId: plant.id, plot: 0 }, details: { method: 'Regadera', quantity: 2, unit: 'L' } }

test('una sesión autenticada empieza con un registro aislado, nunca adopta plantas del visitante', () => {
  const guest = { ...emptyJournal(), plants: [plant], activities: [] }
  expect(AUTHENTICATED_JOURNAL).toMatchObject({ plants: [], activities: [], community: null, terrain: null })
  expect(guest.plants).toHaveLength(1)
  expect(AUTHENTICATED_JOURNAL.gardenId).toBe('')
})
test('cuidados básicos solo se permiten con planta autenticada y sin evidencia perdida', () => {
  expect(validateBasicServerActivity(activity, [plant], 'Cuenta real', 'server-garden')).toBeNull()
  expect(basicServerNotes(activity)).toContain('Método: Regadera')
  expect(basicServerNotes(activity)).toContain('Cantidad declarada: 2 L')
  expect(validateBasicServerActivity({ ...activity, photo: new Blob(['foto'], { type:'image/jpeg' }) }, [plant], 'Cuenta real', 'server-garden')).toContain('fotos')
  expect(validateBasicServerActivity(activity, [], 'Cuenta real', 'server-garden')).toContain('planta')
  expect(validateBasicServerActivity(activity, [plant], 'Otra persona', 'server-garden')).toContain('cuenta iniciada')
  expect(validateBasicServerActivity({ ...activity, date: '2020-01-01' }, [plant], 'Cuenta real', 'server-garden')).toContain('fecha')
})
test('seguimiento y poscosecha nunca se guardan como actividad del visitante al estar autenticado', () => {
  for (const type of ['observation', 'postharvest', 'sowing', 'signage'] as const) {
    expect(validateBasicServerActivity({ ...activity, type }, [plant], 'Cuenta real', 'server-garden')).toContain('API unificada')
  }
})
test('una cosecha parcial con cantidad se puede enviar al servidor; completa no', () => {
  const harvest: ActivityDraft = { ...activity, type: 'harvest', details: { harvestMode: 'partial', quantity: 300, unit: 'g' } }
  expect(validateBasicServerActivity(harvest, [plant], 'Cuenta real', 'server-garden')).toBeNull()
  expect(validateBasicServerActivity({ ...harvest, details: { ...harvest.details, harvestMode: 'complete' } }, [plant], 'Cuenta real', 'server-garden')).toContain('completas')
  expect(validateBasicServerActivity({ ...harvest, details: { harvestMode: 'partial' } }, [plant], 'Cuenta real', 'server-garden')).toContain('cantidad')
  expect(basicServerNotes(harvest)).toContain('parcial')
})
