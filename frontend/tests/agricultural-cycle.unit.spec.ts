import { expect, test } from '@playwright/test'
import type { GardenActivity } from '../src/features/my-garden/journal/activities'
import { validateActivity } from '../src/features/my-garden/journal/activities'
import { listHarvestLots, statusForHarvestLot, validatePostharvestStep } from '../src/features/my-garden/journal/postharvest'

const origin: GardenActivity = {
  id: 'real-harvest-1', gardenId: 'garden-1', type: 'harvest', date: '2026-11-01',
  responsible: 'Elena', target: { kind: 'plot', plot: 0 }, notes: 'Cosecha real',
  details: { harvestMode: 'partial', quantity: 2, unit: 'kg' }, photoIds: ['photo-1'],
  createdAt: '2026-11-01T15:00:00.000Z', validation: 'local-v1',
}
function record(type: GardenActivity['type'], date: string, id: string): GardenActivity {
  return {
    ...origin, id, type, date, target: {kind:'garden'}, details: {sourceHarvestId: origin.id},
    photoIds: [], createdAt: date + 'T15:00:00.000Z',
  }
}
function check(type: GardenActivity['type'], date: string, history: GardenActivity[], id = 'candidate') {
  return validatePostharvestStep(record(type, date, id), history)
}

test('lotes de poscosecha provienen de cosechas documentadas, sin crear lotes artificiales', () => {
  expect(listHarvestLots([], 'garden-1')).toEqual([])
  expect(listHarvestLots([origin], 'garden-1')).toHaveLength(1)
  expect(listHarvestLots([origin], 'another-garden')).toHaveLength(0)
  expect(listHarvestLots([{...origin,voidedAt:'2026-11-02T01:00:00Z'}], 'garden-1')).toHaveLength(0)
})

test('el orden limpieza, secado, empaquetado y bodega se exige de forma cronológica', () => {
  expect(check('cleaning','2026-11-02',[origin])).toBeNull()
  expect(check('drying','2026-11-03',[origin])).toContain('Registra primero')
  const cleaning = record('cleaning','2026-11-02','cleaning-1')
  expect(check('drying','2026-11-03',[origin,cleaning])).toBeNull()
  const drying = record('drying','2026-11-03','drying-1')
  expect(check('storage','2026-11-08',[origin,cleaning,drying])).toContain('Registra primero')
  const packageRec = {...record('packaging','2026-11-08','pack-1'),details:{sourceHarvestId:origin.id,packagedOn:'2026-11-08'}}
  expect(validatePostharvestStep(packageRec,[origin,cleaning,drying])).toBeNull()
  expect(check('storage','2026-11-09',[origin,cleaning,drying,packageRec])).toBeNull()
  expect(statusForHarvestLot(origin.id,[origin,cleaning,drying,packageRec])).toBe('storage')
  expect(statusForHarvestLot(origin.id,[origin,cleaning,drying,packageRec,record('storage','2026-11-09','storage-1')])).toBeNull()
})

test('una etapa repetida, cosecha anulada, fuera de orden o de otro huerto se rechaza', () => {
  const clean=record('cleaning','2026-11-02','clean-1')
  expect(check('cleaning','2026-11-04',[origin,clean])).toContain('ya está documentada')
  expect(check('cleaning','2026-10-31',[origin])).toContain('antes de la cosecha')
  expect(check('drying','2026-11-01',[origin,clean])).toContain('anterior')
  expect(check('cleaning','2026-11-03',[{...origin,voidedAt:'2026-11-02'}])).toContain('no está registrada')
  expect(check('cleaning','2026-11-03',[{...origin,gardenId:'garden-2'}])).toContain('no está registrada')
  expect(check('cleaning','2026-11-03',[])).toContain('no está registrada')
})

test('empaquetado exige datos de etiqueta y caducidad declarada, sin inferirla', () => {
  const a:GardenActivity = {...record('packaging','2026-11-08','pack'),
    details:{sourceHarvestId:'real-harvest-1',packagedOn:'2026-11-08',
      labelCommonName:'Manzanilla',labelScientificName:'Matricaria chamomilla',expiryDate:'2027-02-08'}}
  expect(validateActivity(a,[])).toBeNull()
  expect(validateActivity({...a,details:{...a.details,expiryDate:'2026-10-30'}},[])).toContain('caducidad')
  expect(validateActivity({...a,details:{...a.details,labelScientificName:''}},[])).toContain('nombre común')
  expect(validateActivity({...a,details:{...a.details,expiryDate:undefined}},[])).toContain('fecha de empaque')
  expect(validateActivity({...a,details:{...a.details,storageLocation:'x'.repeat(301)}},[])).toContain('hasta 300')
})

test('registrar riego o poscosecha nunca cambia etapa de crecimiento', () => {
  expect(record('watering','2026-11-03','water-1').details.growthStage).toBeUndefined()
  expect(record('drying','2026-11-04','dry-1').details.growthStage).toBeUndefined()
})
