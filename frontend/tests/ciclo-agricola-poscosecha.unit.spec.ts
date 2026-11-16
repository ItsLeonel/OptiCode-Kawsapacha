import { expect, test } from '@playwright/test'
import { ACTIVITY_TYPES, validateActivity, type GardenActivity } from '../src/features/my-garden/journal/activities'
import {
  POSTHARVEST_STEPS, nextPostharvestStep, completedPostharvestSteps, dryingElapsedDays,
} from '../src/features/my-garden/journal/postharvest-cycle'
import { LOCAL_POINTS } from '../src/features/my-garden/journal/progress'
import type { GardenPlant } from '../src/features/my-garden/garden'

const plant: GardenPlant = {
  id: 'manzanilla-1', name: 'Manzanilla', latin: 'Matricaria chamomilla', plot: 0,
  date: '2026-10-01', plantedOn: '2026-10-01', photo: 'evidence.png',
}
const make = (type: GardenActivity['type'], id: string, date: string, details: GardenActivity['details'] = {}): GardenActivity => ({
  id, type, gardenId: 'huerto-1', date, responsible: 'Responsable agricultor',
  notes: 'Registro real de prueba', target: { kind: 'plot', plot: 0 },
  details, photoIds: [], createdAt: date + 'T12:00:00.000Z', validation: 'local-v1',
})
const harvest: GardenActivity = make('harvest', 'h-001', '2026-10-20', { harvestMode: 'partial' })
const batch = (stage: keyof typeof POSTHARVEST_STEPS, date: string, other: GardenActivity['details'] = {}) =>
  make('postharvest', 'batch-' + stage, date, { sourceHarvestId: harvest.id, postharvestStep: stage, ...other })

test('tipos obligatorios de cultivo, rituales, señalética y poscosecha están disponibles', () => {
  expect(Object.keys(ACTIVITY_TYPES)).toContain('sowing_ritual')
  expect(Object.keys(ACTIVITY_TYPES)).toContain('gratitude_ritual')
  expect(Object.keys(ACTIVITY_TYPES)).toContain('signage')
  expect(Object.keys(ACTIVITY_TYPES)).toContain('postharvest')
  expect(Object.keys(POSTHARVEST_STEPS)).toHaveLength(5)
})

test('poscosecha exige cosecha auténtica y secuencia cronológica verificable', () => {
  expect(validateActivity(batch('cleaning', '2026-10-21'), [plant], [])).toContain('cosecha')
  expect(validateActivity(batch('drying-end', '2026-10-21'), [plant], [harvest])).toContain('Limpieza')
  expect(validateActivity(batch('cleaning', '2026-10-19'), [plant], [harvest])).toContain('anteceder')
  const steps: GardenActivity[] = [harvest]
  const cleaning = batch('cleaning', '2026-10-21')
  expect(validateActivity(cleaning, [plant], steps)).toBeNull()
  steps.push(cleaning)
  expect(nextPostharvestStep(steps, harvest.id)).toBe('drying-start')
  const start = batch('drying-start', '2026-10-22', { method: 'shade' })
  expect(validateActivity(start, [plant], steps)).toBeNull()
  expect(validateActivity(batch('drying-start', '2026-10-23'), [plant], steps)).toContain('secado a la sombra')
  steps.push(start)
  const finish = batch('drying-end', '2026-11-03')
  expect(dryingElapsedDays(steps, harvest.id, finish.date)).toBe(12)
  expect(validateActivity(finish, [plant], steps)).toBeNull()
  steps.push(finish)
  const packing = batch('packaging', '2026-11-04', {
    batchCode: 'MAN-2026-001', packageDate: '2026-11-04', expiryDate: '2027-01-04',
    storageLabel: 'Uso tradicional de referencia; verificar precauciones.',
  })
  expect(validateActivity(packing, [plant], steps)).toBeNull()
  steps.push(packing)
  const storage = batch('storage', '2026-11-05', { storagePlace: 'Estante seco de bodega' })
  expect(validateActivity(storage, [plant], steps)).toBeNull()
  steps.push(storage)
  expect(completedPostharvestSteps(steps, harvest.id)).toHaveLength(5)
  expect(nextPostharvestStep(steps, harvest.id)).toBeNull()
  expect(validateActivity({ ...batch('cleaning', '2026-11-06'), id: 'batch-cleaning-duplicate' }, [plant], steps)).toContain('todas las etapas')
})

test('no acepta etiquetado con caducidad inventada o anterior a fecha de empaquetado', () => {
  const steps = [harvest, batch('cleaning','2026-10-21'), batch('drying-start','2026-10-22',{method:'shade'}), batch('drying-end','2026-11-03')]
  const missing = batch('packaging', '2026-11-04', { batchCode:'LOT-A', packageDate:'2026-11-04', storageLabel:'Revisado' })
  expect(validateActivity(missing, [plant], steps)).toContain('caducidad')
  expect(validateActivity(batch('packaging','2026-11-04', {...missing.details,expiryDate:'2026-02-30'}), [plant], steps)).toContain('caducidad')
  expect(validateActivity(batch('packaging','2026-11-04', {...missing.details,expiryDate:'2026-11-03'}), [plant], steps)).toContain('caducidad')
})

test('anulación de una etapa obliga a reconstruir el siguiente paso, sin destruir registros', () => {
  const clean = batch('cleaning','2026-10-21')
  const start = { ...batch('drying-start','2026-10-22',{method:'shade'}), voidedAt:'2026-10-23T12:00:00Z', voidReason:'Error de fecha' }
  const history = [harvest, clean, start]
  expect(completedPostharvestSteps(history, harvest.id)).toEqual(['cleaning'])
  expect(nextPostharvestStep(history, harvest.id)).toBe('drying-start')
  expect(validateActivity(batch('drying-end','2026-11-03'), [plant], history)).toContain('Inicio del secado')
})

test('los nuevos registros no reciben puntos oficiales ni hacen crecer plantas', () => {
  expect(LOCAL_POINTS.postharvest).toBe(0)
  expect(LOCAL_POINTS.signage).toBe(0)
  expect(LOCAL_POINTS.sowing_ritual).toBe(0)
  expect(LOCAL_POINTS.gratitude_ritual).toBe(0)
  const ritual = make('sowing_ritual','r-01','2026-10-01')
  const signal = { ...make('signage','sign-01','2026-10-22',{ traditionalTemperature:'unknown' }), target: {kind:'plant',plantId:plant.id,plot:0} as const }
  expect(validateActivity(ritual, [plant], [])).toBeNull()
  expect(validateActivity(signal, [plant], [])).toBeNull()
})
