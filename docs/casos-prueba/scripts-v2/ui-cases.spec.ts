// Reejecución de casos de interfaz contra frontend + backend reales (base temporal).
import { test, expect, type Page, type Browser } from '@playwright/test'
import { navigateModule, openGardenSection, nextCommunityStep } from '../tests/community-helpers'
import catalogue from '../src/features/real-gardens/data/dpa-2026.json' with { type: 'json' }

// Igual que el helper del equipo, pero con reintento al elegir opciones de la lista
// (la lista se redibuja mientras se escribe y el clic puede caer sobre un nodo retirado).
async function pickOption(page: Page, combo: string, text: string, code: string) {
  for (let i = 0; i < 4; i++) {
    await page.getByRole('combobox', { name: combo }).fill(text)
    try { await page.getByRole('option', { name: new RegExp(`${code}$`) }).click({ timeout: 5_000 }); return } catch { await page.waitForTimeout(500) }
  }
  throw new Error(`No se pudo elegir ${combo} ${text}`)
}
async function createCommunity(page: Page, name: string, province = 'Imbabura') {
  await navigateModule(page, 'Comunidad')
  await page.getByRole('button', { name: 'Crear mi comunidad', exact: true }).click()
  await nextCommunityStep(page)
  await page.getByLabel('Provincia de la comunidad').selectOption(province)
  const prov = catalogue.provinces.find(p => p.name.toLowerCase() === province.toLowerCase())!
  const canton = catalogue.cantons.find(c => c.provinceCode === prov.code)!
  const parish = catalogue.parishes.find(p => p.cantonCode === canton.code)!
  await pickOption(page, 'Cantón', canton.name, canton.code)
  await pickOption(page, 'Parroquia', parish.name, parish.code)
  await nextCommunityStep(page)
  await page.getByRole('button', { name: 'Editar identidad', exact: true }).click()
  await page.getByLabel('Nombre de la comunidad').fill(name)
  await page.getByRole('button', { name: 'Editar responsable', exact: true }).click()
  await page.getByLabel('Persona responsable').fill('Ana')
  await nextCommunityStep(page)
  await page.getByRole('button', { name: 'Crear comunidad', exact: true }).click()
  await expect(page.locator('.community-wizard')).toHaveCount(0)
}
import { expectReady, canvasSlot } from '../tests/garden-helpers'

const EVID = process.env.QA_EVID ?? 'qa-evidencias'
const PHOTO = 'src/features/real-gardens/assets/en-tierra-v1.jpg'
const stamp = Date.now()
const PASS = 'Prueba2026'
const shot = (page: Page, name: string) => page.screenshot({ path: `${EVID}/${name}.png` })

test.use({ viewport: { width: 1440, height: 1000 } })
test.setTimeout(180_000)
test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.route('https://tile.openstreetmap.org/**', route => route.abort())
  await page.route('https://fonts.googleapis.com/**', route => route.fulfill({ contentType: 'text/css', body: '' }))
  await page.route('https://fonts.gstatic.com/**', route => route.abort())
})

async function registerAccount(page: Page, name: string, email: string) {
  await page.goto('/')
  await page.getByRole('tab', { name: 'Crear cuenta' }).click()
  await page.getByLabel('Nombre completo').fill(name)
  await page.getByLabel('Correo electrónico').fill(email)
  await page.getByLabel('Contraseña', { exact: true }).fill(PASS)
  await page.getByLabel('Confirmar contraseña').fill(PASS)
  await page.getByRole('button', { name: 'Crear mi cuenta' }).click()
}
async function login(page: Page, email: string, password = PASS) {
  await page.goto('/')
  await page.getByRole('tab', { name: 'Iniciar sesión' }).click()
  await page.getByLabel('Correo electrónico').fill(email)
  await page.getByLabel('Contraseña', { exact: true }).fill(password)
  await page.locator('form[aria-label="Iniciar sesión"]').getByRole('button', { name: 'Iniciar sesión' }).click()
}
const logoutButton = (page: Page) => page.getByRole('button', { name: 'Cerrar sesión' })
// Tras iniciar sesión la app carga los datos del servidor y vuelve a Mi Jardín; se espera a que termine.
async function sessionReady(page: Page) {
  await expect(logoutButton(page)).toBeVisible({ timeout: 20_000 })
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(1500)
}
async function logout(page: Page) {
  const openMenu = page.getByRole('button', { name: 'Abrir menú de navegación', exact: true })
  if (await openMenu.count()) await openMenu.click()
  await logoutButton(page).click()
}
async function freshPage(browser: Browser) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, baseURL: 'http://127.0.0.1:5173' })
  const p = await ctx.newPage()
  await p.route('https://tile.openstreetmap.org/**', r => r.abort())
  return p
}

test('P-001 Bienvenida y exploración en modo visitante', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message))
  await page.goto('/')
  await expect(page.getByRole('tab', { name: 'Crear cuenta' })).toBeVisible()
  await expect(page.getByRole('tab', { name: 'Iniciar sesión' })).toBeVisible()
  await shot(page, 'P-001-1-bienvenida')
  await page.getByRole('button', { name: 'Descubrir Kawsapacha' }).click()
  await expect(page.getByText('Visitante · Sin sesión')).toBeVisible()
  await navigateModule(page, 'Comunidad')
  await shot(page, 'P-001-2-comunidad-visitante')
  await openGardenSection(page, 'Mi terreno')
  await openGardenSection(page, 'Catálogo medicinal')
  await expect(page.getByRole('heading', { name: 'Catálogo de plantas medicinales' })).toBeVisible()
  await shot(page, 'P-001-3-catalogo-visitante')
  await openGardenSection(page, 'Bitácora')
  await navigateModule(page, 'Mi Camino Verde')
  await navigateModule(page, 'Mi Huerto')
  await shot(page, 'P-001-4-mi-huerto-visitante')
  expect(errors).toEqual([])
})

test('P-010 Crear cuenta e iniciar/cerrar sesión con backend real', async ({ page }) => {
  const email = `qa.p010.${stamp}@example.com`
  await registerAccount(page, 'Tester QA', email)
  await sessionReady(page)
  await shot(page, 'P-010-1-cuenta-creada-sesion')
  await logout(page)
  await expect(page.getByRole('tab', { name: 'Iniciar sesión' })).toBeVisible()
  await login(page, email, 'ClaveIncorrecta1')
  await expect(page.getByText('Correo o contraseña incorrectos')).toBeVisible()
  await shot(page, 'P-010-2-contrasena-incorrecta')
  await login(page, email)
  await sessionReady(page)
  await logout(page)
  await registerAccount(page, 'Tester QA', email)
  await expect(page.getByText(/Ya existe una cuenta/)).toBeVisible()
  await shot(page, 'P-010-3-correo-duplicado')
  await expect(logoutButton(page)).toHaveCount(0)
})

test('P-011 y P-012 Aislamiento entre cuentas y persistencia en servidor', async ({ page, browser }) => {
  const a = `qa.p011a.${stamp}@example.com`, b = `qa.p011b.${stamp}@example.com`
  const communityName = `Comunidad Ana ${stamp}`
  await registerAccount(page, 'Ana QA', a)
  await sessionReady(page)
  await createCommunity(page, communityName)
  await expect(page.locator('.community-overview')).toContainText(communityName)
  await logout(page)
  // P-011: otra cuenta no ve la comunidad de Ana
  const pb = await freshPage(browser)
  await registerAccount(pb, 'Bruno QA', b)
  await sessionReady(pb)
  await navigateModule(pb, 'Comunidad')
  await expect(pb.getByText(communityName)).toHaveCount(0)
  await shot(pb, 'P-011-1-otra-cuenta-sin-datos-ajenos')
  // P-012: Ana en un navegador limpio recupera su comunidad desde el servidor
  const pa = await freshPage(browser)
  await login(pa, a)
  await sessionReady(pa)
  await navigateModule(pa, 'Comunidad')
  await expect(pa.getByText(communityName).first()).toBeVisible({ timeout: 20_000 })
  await shot(pa, 'P-012-1-comunidad-recuperada-otro-navegador')
})

test('P-013 Flujo integrado de demostración', async ({ page, browser }) => {
  const email = `qa.p013.${stamp}@example.com`
  await registerAccount(page, 'Carla QA', email)
  await sessionReady(page)
  await createCommunity(page, `Comunidad Carla ${stamp}`)
  await navigateModule(page, 'Mi Huerto')
  await page.getByRole('button', { name: 'Registrar mi terreno', exact: true }).click()
  await page.locator('.rg-type-option:has(input[value="ground"])').click()
  await page.locator('#rg-irrigationAvailability label:has(input[value="unknown"])').click()
  await page.locator('#rg-soilType-heading').click()
  await page.locator('#rg-soilType label:has(input[value="loam"])').click()
  await page.locator('#rg-naturalFertilizers-heading').click()
  await page.getByRole('button', { name: 'Guardar mi terreno', exact: true }).click()
  const confirm = page.getByRole('dialog', { name: 'Confirma el registro de tu terreno' })
  await confirm.getByLabel('Nombre del huerto').fill('Huerto de Carla')
  await confirm.getByLabel('Superficie aproximada').fill('20')
  await confirm.getByRole('button', { name: 'Guardar mi terreno', exact: true }).click()
  await page.getByRole('navigation', { name: 'Vistas de Mi Jardín' }).getByRole('button', { name: 'Mi Jardín', exact: true }).click()
  await expectReady(page)
  await canvasSlot(page, 1)
  const chooser = page.waitForEvent('filechooser')
  await page.getByRole('button', { name: 'Galería', exact: true }).click()
  await (await chooser).setFiles(PHOTO)
  await page.getByLabel('Especie medicinal').selectOption('Manzanilla')
  await page.getByRole('button', { name: 'Añadir a mi huerto', exact: true }).click()
  await expect(page.getByText('1 planta registrada')).toBeVisible({ timeout: 20_000 })
  await shot(page, 'P-013-1-planta-en-su-espacio')
  await canvasSlot(page, 1)
  const passport = page.getByRole('dialog', { name: 'Manzanilla', exact: true })
  await expect(passport).toContainText('Parcela 2', { timeout: 20_000 })
  await shot(page, 'P-013-2-pasaporte-planta-registrada')
  await page.getByRole('button', { name: 'Cerrar Pasaporte Vivo' }).click()
  await logout(page)
  const p2 = await freshPage(browser)
  await login(p2, email)
  await sessionReady(p2)
  await navigateModule(p2, 'Mi Huerto')
  await expectReady(p2)
  await canvasSlot(p2, 1)
  await expect(p2.getByRole('dialog', { name: 'Manzanilla', exact: true })).toContainText('Parcela 2', { timeout: 20_000 })
  await shot(p2, 'P-013-3-planta-recuperada-tras-reingreso')
})
