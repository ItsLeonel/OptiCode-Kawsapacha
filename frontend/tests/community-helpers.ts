import { expect, type Page } from '@playwright/test'
import catalogue from '../src/features/real-gardens/data/dpa-2026.json' with { type: 'json' }

export const mainNavigation = (page: Page) => page.getByRole('navigation', { name: 'Módulos principales' })

/** Abre uno de los módulos principales; los nombres anteriores son alias de pruebas. */
export async function navigateModule(page: Page, name: 'Mi Huerto' | 'Mi Huerto Vivo' | 'Comunidad' | 'Mi Camino Verde' | 'Mi camino verde') {
  const openMenu = page.getByRole('button', { name: 'Abrir menú de navegación', exact: true })
  if (await openMenu.count()) await openMenu.click()
  const label = name === 'Mi Huerto Vivo' ? 'Mi Huerto' : name === 'Mi camino verde' ? 'Mi Camino Verde' : name
  await mainNavigation(page).getByRole('button', { name: label, exact: true }).click()
}

/** Abre una sección interna de Mi Huerto, sin añadirla al menú principal. */
export async function openGardenSection(page: Page, section: 'Mi terreno' | 'Catálogo medicinal' | 'Bitácora') {
  await navigateModule(page, 'Mi Huerto')
  if (section === 'Mi terreno') {
    await page.getByRole('navigation', { name: 'Vistas de Mi Jardín' })
      .getByRole('button', { name: 'Mi terreno', exact: true }).click()
  } else {
    await page.getByRole('navigation', { name: 'Acciones de tu jardín' })
      .getByRole('button', { name: section, exact: true }).click()
  }
}
export const nextCommunityStep = (page: Page) => page.getByRole('button', { name: 'Continuar →', exact: true }).click()

export async function chooseCommunityTerritory(page: Page, province = 'Imbabura', sector?: string) {
  await page.getByLabel('Provincia de la comunidad').selectOption(province)
  const normalize = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('es-EC')
  const provinceRecord = catalogue.provinces.find(item => normalize(item.name) === normalize(province))!
  const canton = catalogue.cantons.find(item => item.provinceCode === provinceRecord.code)!
  const parish = catalogue.parishes.find(item => item.cantonCode === canton.code)!
  await page.getByRole('combobox', {name: 'Cantón'}).fill(canton.name)
  await page.getByRole('option', {name: new RegExp(`${canton.code}$`)}).click()
  await page.getByRole('combobox', {name: 'Parroquia'}).fill(parish.name)
  await page.getByRole('option', {name: new RegExp(`${parish.code}$`)}).click()
  if (sector !== undefined) await page.getByLabel('Sector o barrio').fill(sector)
}

export async function openCommunityInfo(page: Page, province = 'Imbabura', sector?: string) {
  await nextCommunityStep(page)
  await chooseCommunityTerritory(page, province, sector)
  await nextCommunityStep(page)
  await page.getByRole('button', {name:'Editar identidad',exact:true}).click()
}

export async function createCommunity(page: Page, name = 'Comunidad de prueba', province = 'Imbabura') {
  await navigateModule(page, 'Comunidad')
  await page.getByRole('button', { name: 'Crear mi comunidad', exact: true }).click()
  await openCommunityInfo(page, province)
  await page.getByLabel('Nombre de la comunidad').fill(name)
  await page.getByRole('button', {name:'Editar responsable',exact:true}).click()
  await page.getByLabel('Persona responsable').fill('Ana')
  await nextCommunityStep(page)
  await page.getByRole('button', { name: 'Crear comunidad', exact: true }).click()
  await expect(page.locator('.community-wizard')).toHaveCount(0)
}

export async function ensureGardenCommunity(page: Page) {
  // Preserve the garden draft in App while satisfying the new V1 requirement.
  await createCommunity(page)
  await openGardenSection(page, 'Mi terreno')
}
