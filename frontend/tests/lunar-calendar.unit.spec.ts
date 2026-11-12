import { test, expect } from '@playwright/test'
import {
  daysInMonth, estimateLunarMonth, formatLunarDate, lunarTimeZone,
  normalizeStage, shiftMonth, stageForFraction,
} from '../src/features/my-garden/lunar/lunar-model'

test('el calendario lunar muestra todos los días, incluidos los años bisiestos', () => {
  expect(estimateLunarMonth('2028-02', 'America/Guayaquil').days).toHaveLength(29)
  expect(estimateLunarMonth('2027-02', 'America/Guayaquil').days).toHaveLength(28)
  expect(estimateLunarMonth('2026-11', 'America/Guayaquil').days).toHaveLength(30)
  expect(daysInMonth('2026-12')).toBe(31)
})

test('navegar meses atraviesa años correctamente', () => {
  expect(shiftMonth('2026-12', 1)).toBe('2027-01')
  expect(shiftMonth('2026-01', -1)).toBe('2025-12')
  expect(formatLunarDate('2026-11-11')).toContain('noviembre')
})

test('la zona horaria regional distingue Galápagos', () => {
  expect(lunarTimeZone('galapagos')).toBe('Pacific/Galapagos')
  expect(lunarTimeZone('oriente')).toBe('America/Guayaquil')
})

test('mapea las cuatro etapas ancestrales de la Luna', () => {
  expect(stageForFraction(0)).toBe('dark')
  expect(stageForFraction(.25)).toBe('waxing')
  expect(stageForFraction(.5)).toBe('full')
  expect(stageForFraction(.75)).toBe('waning')
  expect(normalizeStage('Wiñak Killa / Luna creciente')).toBe('waxing')
  expect(normalizeStage('Luna menguante')).toBe('waning')
})

test('las sugerencias son orientativas, no restricciones para cuidar plantas', () => {
  for (const day of estimateLunarMonth('2026-11', 'America/Guayaquil').days) {
    expect(day.recommendations.length).toBeGreaterThan(0)
    expect(day.recommendations.every(item => item.advisory)).toBeTruthy()
  }
})
