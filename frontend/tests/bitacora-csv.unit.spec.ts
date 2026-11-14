import { expect, test } from '@playwright/test'
import { createActivityCsv, type CsvActivityRow } from '../src/features/my-garden/journal/report-csv'

const sample: CsvActivityRow[] = [
  { id: 'r-1', date: '2026-11-14', name: 'Riego', responsible: 'Ana',
    target: 'Manzanilla · Espacio 1', notes: 'Se aplicó agua', photoCount: 1,
    voided: false, source: 'local', details: '{"method":"regadera"}' },
  { id: 's-2', date: '2026-11-13', name: 'Abonado', responsible: 'Mario',
    target: 'Espacio 1', notes: 'Compost', photoCount: 0,
    voided: true, source: 'server', details: '{}' },
]

test('reporte incluye fecha, origen, cantidad real de fotografías y anulaciones', () => {
  const csv = createActivityCsv(sample)
  expect(csv.charCodeAt(0)).toBe(0xFEFF)
  expect(csv).toContain('Bitácora local')
  expect(csv).toContain('Servidor (cuidados básicos)')
  expect(csv).toContain('"Sí"')
  expect(csv).toContain('"No"')
  expect(csv).toContain('"1"')
  expect(csv).toContain('Manzanilla · Espacio 1')
})

test('exportación neutraliza fórmulas CSV y conserva comillas y saltos de línea', () => {
  const csv = createActivityCsv([{ ...sample[0], responsible: '=HYPERLINK("https://ejemplo.invalid")',
    notes: '+cmd|"prueba"\n@SOMETHING' }])
  expect(csv).toContain('\'=HYPERLINK')
  expect(csv).toContain('""https://ejemplo.invalid""')
  expect(csv).toContain('"\'+cmd|""prueba""\n@SOMETHING"')
})

test('reporte sin actividades es válido y no genera filas inventadas', () => {
  const csv = createActivityCsv([])
  expect(csv.split('\r\n').filter(Boolean)).toHaveLength(1)
})
