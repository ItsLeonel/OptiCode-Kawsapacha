import { test, expect, type Page } from './e2e'
import { registerGround, expectReady, canvasSlot, slots, scene } from './garden-helpers'
import { mainNavigation } from './community-helpers'

// The SVG renderer was replaced by the interactive Phaser renderer. Keep the
// region/modality matrix and navigation/accessibility checks against real UI.
test.setTimeout(90_000)
const regions = { sierra: 'Imbabura', costa: 'Manabí', oriente: 'Napo', galapagos: 'Galápagos' }
const kinds = ['ground', 'pots', 'vertical', 'hanging'] as const
const errors = new WeakMap<Page, string[]>()
test.beforeEach(async ({ page }) => {
  errors.set(page, [])
  page.on('pageerror', error => errors.get(page)!.push(error.message))
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.route('https://tile.openstreetmap.org/**', route => route.abort())
  await page.addInitScript(() => { navigator.geolocation.getCurrentPosition = () => { throw new Error('No solicitar ubicación del dispositivo') } })
})
test.afterEach(async ({ page }) => expect(errors.get(page)).toEqual([]))

test('bienvenida sin registros exige comunidad y mantiene las seis acciones reales', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Descubrir Kawsapacha' }).click()
  await expect(page.getByRole('heading', { name: 'Empieza tu comunidad' })).toBeVisible()
  await expect(scene(page)).toHaveCount(0)
  await expect(page.getByRole('navigation', { name: 'Acciones de tu jardín' }).getByRole('button')).toHaveCount(6)
  await page.getByRole('button', { name: 'Crear mi comunidad', exact: true }).click()
  await expect(page.getByRole('form', { name: 'Crear comunidad', exact: true })).toBeVisible()
})

for (const kind of kinds) for (const [region, province] of Object.entries(regions)) {
  test(`escenario de producción ${kind} ${region}: seis zonas vacías y selección`, async ({ page }) => {
    await registerGround(page, '/', province, kind)
    await expectReady(page)
    await expect(page.locator('.garden-poc')).toHaveAttribute('data-region', region)
    await expect(scene(page)).toHaveAttribute('data-kind', kind)
    await expect(page.locator('.garden-poc-guide')).toHaveAttribute('data-guide-region', region)
    await expect(page.locator('.garden-poc-heading')).toContainText(province)
    await expect(page.locator('.garden-poc-slot[data-plant-id]')).toHaveCount(0)
    await expect(scene(page)).not.toHaveAttribute('data-components', /fence:|water:|irrigation:|fertilizer:/)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await canvasSlot(page, 5)
    await expect(page.getByLabel('Posición de cultivo')).toHaveValue('5')
    await page.getByRole('button', { name: 'Cerrar registro de planta' }).click()
    await expect(slots(page).nth(5)).toBeFocused()
  })
}

for (const width of [320, 390, 768, 1024, 1366, 1672]) {
  test(`responsive y teclado de producción: ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 940 })
    await registerGround(page, '/', 'Napo', 'vertical')
    await expectReady(page)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await slots(page).nth(0).focus()
    await slots(page).nth(0).press('ArrowDown')
    await expect(slots(page).nth(3)).toBeFocused()
    await page.keyboard.press('End')
    await expect(slots(page).nth(5)).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page.getByLabel('Posición de cultivo')).toHaveValue('5')
    await page.keyboard.press('Escape')
    await expect(slots(page).nth(5)).toBeFocused()
  })
}

test('todas las acciones llevan a registros, listados o progreso real; navegación atrás y adelante', async ({ page }) => {
  await registerGround(page, '/', 'Manabí', 'pots')
  await expectReady(page)
  const actions = page.getByRole('navigation', { name: 'Acciones de tu jardín' })
  for (const name of ['Registrar actividad', 'Registrar planta', 'Pasaporte Vivo']) {
    await actions.getByRole('button', { name, exact: true }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.keyboard.press('Escape')
  }
  for (const [name, title] of [['Bitácora', 'Mi historia'], ['Mis plantas', 'Mis plantas'], ['Progreso', 'Mi camino verde']]) {
    await actions.getByRole('button', { name, exact: true }).click()
    await expect(page.getByRole('heading', { name: title, exact: true, level: 1 })).toBeVisible()
    await page.goBack(); await expectReady(page)
    await page.goForward(); await expect(page.getByRole('heading', { name: title, exact: true, level: 1 })).toBeVisible()
    await mainNavigation(page).getByRole('button', { name: 'Mi Jardín', exact: true }).click(); await expectReady(page)
  }
  await page.getByRole('button', { name: 'Conocer mi camino', exact: false }).click()
  await expect(page.getByRole('heading', { name: 'Mi camino verde', exact: true, level: 1 })).toBeVisible()
})
