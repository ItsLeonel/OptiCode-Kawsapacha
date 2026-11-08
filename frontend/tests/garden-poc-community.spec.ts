import { test, expect } from './e2e'
import { createCommunity, mainNavigation, nextCommunityStep, chooseCommunityTerritory } from './community-helpers'

test('existing community territory edits retain the form and save once', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Descubrir Kawsapacha' }).click()
  await createCommunity(page, 'Comunidad que cambia', 'Pichincha')
  await page.getByRole('button', { name: 'Editar comunidad', exact: true }).click()
  await nextCommunityStep(page)
  await page.getByLabel('Provincia de la comunidad').selectOption('Guayas')
  await nextCommunityStep(page)
  await expect(page.getByRole('alert')).toContainText('cantón que pertenezca')
  await chooseCommunityTerritory(page, 'Guayas', 'Nuevo sector')
  await nextCommunityStep(page)
  await nextCommunityStep(page)
  await page.getByRole('button', { name: 'Guardar cambios', exact: true }).click()
  await expect(page.locator('.community-overview-location')).toContainText('Guayas · Guayaquil')
  await mainNavigation(page).getByRole('button', { name: 'Mi Jardín', exact: true }).click()
})
