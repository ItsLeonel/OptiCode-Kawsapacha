import { expect, type Page } from './e2e'
import { createCommunity, mainNavigation } from './community-helpers'
import type { GardenKind } from '../src/features/real-gardens/real-garden'

export const scene = (page: Page) => page.locator('.garden-poc-stage')
export const slots = (page: Page) => page.locator('.garden-poc-slot')

export async function registerGround(page: Page, entry = '/garden-lab.html', province = 'Imbabura', kind: GardenKind = 'ground', withFeatures = false) {
  await page.goto(entry)
  await page.getByRole('button', { name: 'Descubrir Kawsapacha' }).click()
  await createCommunity(page, 'Comunidad de prueba automatizada', province)
  await mainNavigation(page).getByRole('button', { name: 'Mi Jardín', exact: true }).click()
  await page.getByRole('button', { name: 'Registrar mi terreno', exact: true }).click()
  await page.locator(`.rg-type-option:has(input[value="${kind}"])`).click()
  await page.locator('#rg-irrigationAvailability label:has(input[value="unknown"])').click()
  if (kind === 'ground') {
    await page.locator('#rg-soilType-heading').click()
    await page.locator(`#rg-soilType label:has(input[value="${withFeatures ? 'clay' : 'unknown'}"])`).click()
    if (withFeatures) {
      await page.locator('#rg-groundDesigns-heading').click()
      for (const value of ['furrows', 'beds', 'raisedBeds', 'terraces']) await page.locator(`#rg-groundDesigns label:has(input[value="${value}"])`).click()
    }
  }
  if (withFeatures) {
    for (const [field, value] of [['waterSources', 'stored'], ['irrigationMethods', 'drip'], ['fences', 'natural']]) {
      await page.locator(`#rg-${field}-heading`).click()
      await page.locator(`#rg-${field} label:has(input[value="${value}"])`).click()
    }
  }
  await page.locator('#rg-naturalFertilizers-heading').click()
  if (withFeatures) await page.locator('#rg-naturalFertilizers label:has(input[value="compost"])').click()
  await page.getByRole('button', { name: 'Guardar mi terreno', exact: true }).click()
  const confirmation = page.getByRole('dialog', { name: 'Confirma el registro de tu terreno' })
  await expect(confirmation).toBeVisible()
  await confirmation.getByLabel('Nombre del huerto').fill('Terreno de prueba automatizada')
  await confirmation.getByLabel('Superficie aproximada').fill('25')
  await confirmation.getByRole('button', { name: 'Guardar mi terreno', exact: true }).click()
  await page.getByRole('button', { name: 'Volver a Mi Jardín', exact: true }).click()
}

export async function expectReady(page: Page) {
  await expect(scene(page)).toHaveAttribute('data-ready', 'true', { timeout: 45_000 })
  await expect(scene(page).locator('canvas')).toHaveCount(1)
  await expect(slots(page)).toHaveCount(6)
}

export async function slotPosition(page: Page, plot: number) {
  await scene(page).scrollIntoViewIfNeeded()
  return slots(page).nth(plot).evaluate((button, selector) => {
    const stage = document.querySelector<HTMLElement>(selector)!
    return { x: (Number((button as HTMLElement).dataset.worldX) - Number(stage.dataset.worldLeft)) * Number(stage.dataset.zoom), y: (Number((button as HTMLElement).dataset.worldY) - Number(stage.dataset.worldTop)) * Number(stage.dataset.zoom) }
  }, '.garden-poc-stage')
}

export async function canvasSlot(page: Page, plot: number, touch = false) {
  const position = await slotPosition(page, plot)
  if (touch) await scene(page).locator('canvas').tap({ position })
  else await scene(page).locator('canvas').click({ position })
}


export async function configureTerrain(page: Page, kind: GardenKind = 'pots') {
  await page.locator(`.rg-type-option:has(input[value="${kind}"])`).click()
  await page.locator('#rg-irrigationAvailability label:has(input[value="unknown"])').click()
  if (kind === 'ground') {
    await page.locator('#rg-soilType-heading').click()
    await page.locator('#rg-soilType label:has(input[value="loam"])').click()
  }
  await page.locator('#rg-naturalFertilizers-heading').click()
}

export async function confirmTerrain(page: Page, name = 'Huerto de la comunidad', area = '12') {
  // Returning to a draft preserves values; the accordion starts at its first
  // optional unfinished section. Review the last section before submitting.
  if (!(await page.getByRole('button', { name: 'Guardar mi terreno', exact: true }).isVisible())) await page.locator('#rg-naturalFertilizers-heading').click()
  await page.getByRole('button', { name: 'Guardar mi terreno', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Confirma el registro de tu terreno' })
  await expect(dialog).toBeVisible()
  await dialog.getByLabel('Nombre del huerto').fill(name)
  await dialog.getByLabel('Superficie aproximada').fill(area)
  await dialog.getByRole('button', { name: 'Guardar mi terreno', exact: true }).click()
  await expect(dialog).toHaveCount(0)
}
