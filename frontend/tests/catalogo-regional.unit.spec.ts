import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'

// El runner de Playwright usa Node y lee JSON como archivo, sin atributos de importación.
const rawSpecies = JSON.parse(readFileSync(new URL('../src/features/medicinal-catalog/regional-species.json', import.meta.url), 'utf8')) as Array<{
  id: string
  name: string
  latinName: string
  family: string
  description: string
  sourceUrl: string
  photoSourceUrl: string
  defaultPhotoUrl: string
  regions: string
}>
const catalog = rawSpecies.map(plant => ({ ...plant, regions: JSON.parse(plant.regions) as string[] }))
const regions = ['sierra', 'costa', 'oriente', 'galapagos']

test('catálogo MSP/INIAP: especies únicas y fichas con fuentes', () => {
  expect(catalog.length).toBeGreaterThanOrEqual(25)
  expect(new Set(catalog.map(plant => plant.id)).size).toBe(catalog.length)
  for (const plant of catalog) {
    expect(plant.id).toBeTruthy()
    expect(plant.latinName).toBeTruthy()
    expect(plant.family).toBeTruthy()
    expect(plant.description).toBeTruthy()
    expect(plant.regions.length).toBeGreaterThan(0)
    expect(plant.regions.every(region => regions.includes(region))).toBe(true)
    expect(plant.sourceUrl).toMatch(/^https:\/\//)
    expect(plant.photoSourceUrl ? plant.defaultPhotoUrl !== '' : plant.defaultPhotoUrl === '').toBe(true)
  }
})

test('regionalización: Galápagos documentada, no disponibilidad jurídica implícita', () => {
  const byRegion = (region: string) => catalog.filter(plant => plant.regions.includes(region))
  expect(byRegion('sierra').length).toBeGreaterThanOrEqual(8)
  expect(byRegion('costa').length).toBeGreaterThanOrEqual(5)
  expect(byRegion('oriente').length).toBeGreaterThanOrEqual(4)
  expect(byRegion('galapagos').length).toBeGreaterThanOrEqual(8)
  expect(byRegion('oriente').some(plant => plant.name === 'Guayusa')).toBe(true)
  expect(byRegion('galapagos').some(plant => plant.name === 'Hierba luisa')).toBe(true)
  expect(byRegion('costa').some(plant => plant.name === 'Achiote')).toBe(true)
  expect(byRegion('sierra').some(plant => plant.name === 'Romero')).toBe(true)
})

test('registros existentes conservan sus ocho identificadores sin duplicarse', () => {
  for (const name of ['Romero','Manzanilla','Menta','Toronjil','Hierbabuena','Lavanda','Orégano','Llantén']) {
    expect(catalog.find(plant => plant.name === name)?.id).toBe(name)
  }
})
