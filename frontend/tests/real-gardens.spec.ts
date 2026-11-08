import { test, expect, type Page } from './e2e'
import { createCommunity, mainNavigation } from './community-helpers'
import { configureTerrain, confirmTerrain, registerGround, expectReady } from './garden-helpers'
import catalogue from '../src/features/real-gardens/data/dpa-2026.json' with { type: 'json' }
const expectedRegion = (code: string) => ['07','08','09','12','13','23','24'].includes(code) ? 'costa' : ['14','15','16','19','21','22'].includes(code) ? 'oriente' : code === '20' ? 'galapagos' : 'sierra'

test.setTimeout(90_000)
async function openGarden(page: Page, community = true) {
  await page.goto('/')
  await page.getByRole('button', { name: 'Descubrir Kawsapacha' }).click()
  if (community) await createCommunity(page)
  await mainNavigation(page).getByRole('button', { name: 'Mi terreno', exact: true }).click()
  await page.getByRole('button', { name: 'Cambiar ubicación', exact: true }).click()
}
test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.route('https://tile.openstreetmap.org/**', route => route.fulfill({ contentType: 'image/png', body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j5N8AAAAASUVORK5CYII=', 'base64') }))
  await page.addInitScript(() => { navigator.geolocation.getCurrentPosition = () => { throw new Error('No solicitar ubicación del dispositivo') } })
})

test('las 24 provincias, clic, teclado y selector usan las regiones reales', async ({ page }) => {
  await openGarden(page)
  await expect(page.locator('.map-visual path[role="button"]')).toHaveCount(24)
  const path = page.getByRole('button', { name: 'Seleccionar Pichincha', exact: true })
  await path.focus(); await path.press('Enter')
  await expect(page.locator('#rg-province')).toHaveValue('Pichincha')
  await page.getByRole('button', { name: 'Seleccionar Imbabura', exact: true }).click()
  for (const province of catalogue.provinces) {
    // The registered province values use the official labels defined by the app.
    const normalize = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    const choices = await page.locator('#rg-province option').evaluateAll(elements => elements.map(element => ({ value: (element as HTMLOptionElement).value, text: element.textContent! })))
    const name = choices.find(item => normalize(item.text) === normalize(province.name))!.value
    await page.locator('#rg-province').selectOption(name)
    await expect(page.locator('.my-garden-page')).toHaveAttribute('data-region', expectedRegion(province.code))
    await expect(page.getByRole('button', { name: `Seleccionar ${name}`, exact: true })).toHaveAttribute('aria-pressed', 'true')
  }
})

test('catálogo íntegro y selectores dependientes con búsqueda y teclado', async ({ page }) => {
  const provinces = new Set(catalogue.provinces.map(item => item.code)), cantons = new Map(catalogue.cantons.map(item => [item.code, item]))
  expect(provinces.size).toBe(24); expect(cantons.size).toBe(catalogue.cantons.length)
  for (const canton of cantons.values()) expect(provinces.has(canton.provinceCode)).toBe(true)
  for (const parish of catalogue.parishes) expect(cantons.has(parish.cantonCode)).toBe(true)
  await openGarden(page)
  await page.locator('#rg-province').selectOption('Imbabura')
  const canton = page.getByRole('combobox', { name: 'Cantón' }), parish = page.getByRole('combobox', { name: 'Parroquia' })
  await canton.fill('ibarra'); await canton.press('ArrowDown'); await canton.press('Enter')
  await expect(canton).toHaveValue('Ibarra')
  await parish.fill('san antonio'); await page.getByRole('option', { name: /^San Antonio / }).click()
  await expect(parish).toHaveValue('San Antonio')
  await page.locator('#rg-province').selectOption('Pichincha')
  await expect(canton).toHaveValue(''); await expect(parish).toBeDisabled()
  await canton.fill('mejia'); await expect(page.getByRole('option', { name: /^Mejía / })).toBeVisible()
})

test('marcador por clic, arrastre, zoom, teclado, cancelación y persistencia', async ({ page }) => {
  await openGarden(page)
  await configureTerrain(page)
  await page.getByRole('button', { name: 'Marcar mi huerto en el mapa', exact: true }).click()
  const dialog = page.getByRole('dialog'), map = dialog.locator('.rg-detail-map')
  await expect(dialog.getByRole('button', { name: 'Usar esta ubicación' })).toBeDisabled()
  await map.click({ position: { x: 200, y: 180 } })
  const before = await dialog.locator('.rg-map-selection').innerText(), box = (await dialog.locator('.rg-map-marker').boundingBox())!
  await page.mouse.move(box.x + 16, box.y + 14); await page.mouse.down(); await page.mouse.move(box.x + 75, box.y + 50, { steps: 12 }); await page.mouse.up()
  await expect(dialog.locator('.rg-map-selection')).not.toHaveText(before)
  await dialog.locator('.leaflet-control-zoom-in').click(); await map.focus(); await map.press('ArrowRight')
  await dialog.getByRole('button', { name: 'Marcar el centro del mapa' }).click()
  const chosen = (await dialog.locator('.rg-map-selection').innerText()).replace('Latitud, longitud: ', '')
  await dialog.getByRole('button', { name: 'Usar esta ubicación', exact: true }).click()
  await page.getByRole('button', { name: 'Ajustar ubicación en el mapa' }).click()
  await map.click({ position: { x: 250, y: 200 } }); await dialog.getByRole('button', { name: 'Cancelar', exact: true }).click()
  await expect(page.locator('.rg-coordinate-value')).toContainText(chosen)
  await confirmTerrain(page)
  await expect(page.locator('.rg-summary')).toContainText(chosen)
  await page.reload(); await expect(page.locator('.rg-summary')).toContainText(chosen)
})

test('validaciones, confirmación, borrador, edición y cancelación conservan el registro', async ({ page }) => {
  await openGarden(page)
  await expect(page.getByRole('button', { name: 'Guardar mi terreno', exact: true })).toHaveCount(0)
  await expect(page.locator('.rg-summary')).toHaveCount(0)
  await configureTerrain(page, 'ground')
  await page.getByRole('button', { name: 'Guardar mi terreno', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Confirma el registro de tu terreno' })
  await dialog.getByLabel('Nombre del huerto').fill('Huerto de prueba')
  await dialog.getByLabel('Superficie aproximada').fill('0')
  await dialog.getByRole('button', { name: 'Guardar mi terreno', exact: true }).click()
  await expect(dialog.getByLabel('Superficie aproximada')).toHaveAttribute('aria-invalid', 'true')
  await dialog.getByLabel('Superficie aproximada').fill('25')
  await dialog.getByRole('button', { name: 'Guardar mi terreno', exact: true }).click()
  await page.getByRole('button', { name: 'Editar información', exact: true }).click()
  await page.getByLabel('Nombre del huerto').fill('Nombre modificado')
  await mainNavigation(page).getByRole('button', { name: 'Comunidad', exact: true }).click()
  await mainNavigation(page).getByRole('button', { name: 'Mi terreno', exact: true }).click()
  await expect(page.getByLabel('Nombre del huerto')).toHaveValue('Nombre modificado')
  await page.getByRole('button', { name: 'Cancelar edición', exact: true }).click()
  await expect(page.locator('.rg-registered-name')).toHaveText('Huerto de prueba')
  await page.getByRole('button', { name: 'Editar información', exact: true }).click()
  await page.getByLabel('Nombre del huerto').fill('Huerto actualizado')
  await page.getByRole('button', { name: 'Guardar cambios', exact: true }).click()
  await page.reload(); await expect(page.locator('.rg-registered-name')).toHaveText('Huerto actualizado')
})

test('borrador sin comunidad se conserva al crear la comunidad requerida', async ({ page }) => {
  await openGarden(page, false)
  await page.locator('#rg-province').selectOption('Guayas')
  await configureTerrain(page)
  await page.getByRole('button', { name: 'Guardar mi terreno', exact: true }).click()
  await expect(page.locator('.rg-feedback[role=status]')).toContainText('Primero crea o selecciona una comunidad')
  await createCommunity(page, 'Raíces personales', 'Guayas')
  await mainNavigation(page).getByRole('button', { name: 'Mi terreno', exact: true }).click()
  await expect(page.locator('#rg-kind-pots')).toBeChecked()
  await confirmTerrain(page, 'Huerto pendiente', '12')
  await expect(page.locator('.rg-summary')).toContainText('Raíces personales')
})

test('fallos de GeoJSON y teselas mantienen el registro manual disponible', async ({ page }) => {
  await page.route('**/*.geojson', route => route.abort())
  await openGarden(page, false)
  await expect(page.getByText('Mapa no disponible. Usa el selector de provincias.')).toBeVisible()
  await page.locator('#rg-province').selectOption('Imbabura')
  await page.route('https://tile.openstreetmap.org/**', route => route.abort())
  await page.getByRole('button', { name: 'Marcar mi huerto en el mapa', exact: true }).click()
  await expect(page.getByText('No se pudo cargar parte del mapa.', { exact: false })).toBeVisible()
  await page.getByLabel('Latitud', { exact: true }).fill('-0.3'); await page.getByLabel('Longitud', { exact: true }).fill('-78.2')
  await page.getByRole('dialog').getByRole('button', { name: 'Usar esta ubicación', exact: true }).click()
  await expect(page.locator('.rg-coordinate-value')).toContainText('-0.300000, -78.200000')
})

for (const width of [320, 390, 768, 1024, 1366, 1672]) test(`terreno responsive al 100 %: ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 940 })
  await registerGround(page, '/', 'Napo', 'ground', true); await expectReady(page)
  await mainNavigation(page).getByRole('button', { name: 'Mi terreno', exact: true }).click()
  await expect(page.locator('.rg-summary')).toContainText('Arcilloso')
  await expect(page.locator('.rg-summary-features')).toContainText('Compost')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.getByRole('button', { name: 'Editar información', exact: true }).click()
  await page.locator('.rg-type-option:has(input[value="pots"])').click()
  await page.getByRole('button', { name: 'Guardar cambios', exact: true }).click()
  await expect(page.locator('.rg-fact-soil')).toHaveCount(0)
  await page.reload(); await expect(page.locator('.rg-fact-kind')).toContainText('Macetas')
})
