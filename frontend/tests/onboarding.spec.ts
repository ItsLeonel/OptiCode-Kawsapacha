import { configureTerrain, confirmTerrain, expectReady, canvasSlot } from './garden-helpers'
import { test, expect, type Page } from './e2e'
import { createCommunity, mainNavigation, nextCommunityStep, openCommunityInfo } from './community-helpers'

test.setTimeout(60_000)
const browserErrors = new WeakMap<Page, string[]>()

test.beforeEach(async ({ page }) => {
  const errors: string[] = []
  browserErrors.set(page, errors)
  page.on('pageerror', error => errors.push(error.message))
  await page.addInitScript(() => {
    // El onboarding no debe inventar persistencia ni guardar una sesión local.
    Storage.prototype.setItem = () => { throw new Error('Persistencia no autorizada') }
  })
})
test.afterEach(async ({ page }) => expect(browserErrors.get(page)).toEqual([]))

async function demo(page: Page) {
  await page.goto('/')
  await page.getByRole('button', { name: 'Descubrir Kawsapacha' }).click()
  await expect(page.locator('.my-garden-page')).toHaveAttribute('data-onboarding', 'community')
}

async function login(page: Page) {
  await page.getByRole('tab', { name: 'Iniciar sesión', exact: true }).click()
  await page.getByLabel('Correo electrónico', { exact: true }).fill('ana@example.com')
  await page.getByLabel('Contraseña', { exact: true }).fill('Clave1234')
  await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click()
}

async function registerGarden(page: Page) {
  await page.getByRole('button', { name: 'Registrar mi terreno', exact: true }).click()
  await configureTerrain(page)
  await confirmTerrain(page)
  await page.getByRole('button', { name: 'Volver a Mi Jard\u00edn', exact: true }).click()
  await expectReady(page)
}

test('sin comunidad: bienvenida, paisajes explorables y unión pendiente sin solicitudes inventadas', async ({ page }) => {
  const writes: string[] = []
  page.on('request', request => { if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method())) writes.push(request.url()) })
  await demo(page)
  await expect(page.getByRole('heading', { name: 'Empieza tu comunidad' })).toBeVisible()
  await expect(page.locator('.garden-parcels')).toHaveCount(0)
  await expect(page.locator('.garden-onboarding .kg-guide__portrait')).toBeVisible()
  await page.getByRole('button', { name: 'Unirme a una comunidad', exact: true }).click()
  const join = page.getByRole('dialog', { name: 'Únete a una comunidad' })
  await expect(join).toBeVisible()
  await expect(join).toContainText('La unión a comunidades aún no está disponible')
  await expect(join.getByRole('textbox')).toHaveCount(0)
  await join.getByRole('button', { name: 'Volver a Mi Jardín' }).click()
  await expect(page.locator('.my-garden-page')).toHaveAttribute('data-onboarding', 'community')
  expect(writes).toEqual([])
})

test('crear desde Mi Jardín avanza al huerto físico y conserva plantas al volver al acceso', async ({ page }) => {
  await demo(page)
  await page.getByRole('button', { name: 'Crear mi comunidad', exact: true }).click()
  await openCommunityInfo(page, 'Manabí')
  await page.getByLabel('Nombre de la comunidad').fill('Raíces de la Costa')
  await page.getByRole('button', { name: 'Editar responsable', exact: true }).click()
  await page.getByLabel('Persona responsable').fill('Ana')
  await nextCommunityStep(page)
  await page.getByRole('button', { name: 'Crear comunidad', exact: true }).click()
  await expect(page.locator('.my-garden-page')).toHaveAttribute('data-onboarding', 'real-garden')
  await expect(page.locator('.garden-onboarding-community')).toContainText('Raíces de la Costa')
  await expect(page.locator('.my-garden-page')).toHaveAttribute('data-region', 'costa')
  await expect(page.locator('.garden-parcels')).toHaveCount(0)
  await expect(page.getByRole('group', { name: 'Vista previa de los paisajes regionales' })).toHaveCount(0)
  await registerGarden(page)
  await expect(page.locator('.my-garden-page')).toHaveAttribute('data-onboarding', 'complete')
  await expect(page.locator('.garden-onboarding')).toHaveCount(0)
  await expect(page.locator('.garden-poc-slot')).toHaveCount(6)
  await canvasSlot(page, 2)
  await page.locator('#plant-photo').setInputFiles('src/features/real-gardens/assets/en-tierra-v1.jpg')
  await page.getByRole('button', { name: 'Añadir a mi huerto' }).click()
  const passport = page.getByRole('dialog', { name: 'Romero', exact: true })
  const photo = await passport.locator('.garden-passport-photo').getAttribute('src')
  await page.getByRole('button', { name: 'Cerrar Pasaporte Vivo' }).click()
  await page.getByRole('button', { name: 'Volver a bienvenida' }).click()
  await page.getByRole('button', { name: 'Descubrir Kawsapacha' }).click()
  await expect(page.locator('.my-garden-page')).toHaveAttribute('data-onboarding', 'complete')
  await expect(page.locator('.garden-poc-slot')).toHaveCount(6)
  await expect(page.locator('.garden-poc-slot[data-plant-id]')).toContainText('Romero')
  await canvasSlot(page, 2)
  await expect(passport.locator('.garden-passport-photo')).toHaveAttribute('src', photo!)
  await page.getByRole('button', { name: 'Cerrar Pasaporte Vivo' }).click()
  await expect(page.locator('.garden-poc-heading')).toContainText('Huerto de la comunidad')
})

test('paisaje explorado y comunidad se conservan al navegar, sin crear un jardín independiente', async ({ page }) => {
  await demo(page)
  await mainNavigation(page).getByRole('button', { name: 'Descubrir plantas', exact: true }).click()
  await page.goBack()
  await expect(page.locator('.my-garden-page')).toHaveAttribute('data-region', 'sierra')
  await createCommunity(page, 'Una comunidad que cultiva su territorio', 'Napo')
  await mainNavigation(page).getByRole('button', { name: 'Mi Jardín', exact: true }).click()
  await expect(page.locator('.my-garden-page')).toHaveAttribute('data-onboarding', 'real-garden')
  await expect(page.locator('.my-garden-page')).toHaveAttribute('data-region', 'oriente')
  await expect(page.locator('.garden-parcels')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Registrar mi terreno', exact: true })).toBeVisible()
})

test('credenciales válidas sin servicio no inician sesión ni redirigen', async ({ page }) => {
  await page.goto('/')
  await login(page)
  await expect(page.getByRole('status').filter({ hasText: 'no se ha iniciado sesión' })).toBeVisible()
  await expect(page.locator('.my-garden-page')).toHaveCount(0)
})

for (const result of ['message', 'error', 'confirmed']) {
  test(`adaptador de acceso: ${result}, redirige solo con sesión confirmada`, async ({ page }) => {
    await page.goto(`/tests/fixtures/onboarding-auth.html?result=${result}`)
    await login(page)
    if (result === 'confirmed') {
      await expect(page.locator('.my-garden-page')).toHaveAttribute('data-onboarding', 'community')
      await expect(page).toHaveURL(/#mi-jardin$/)
      await expect(page.locator('.garden-visitor-notice')).toHaveText('Sesión confirmada · Guardado local')
    } else {
      await expect(page.locator('.auth-submit-message')).toContainText(result === 'error' ? 'No pudimos completar' : 'Respuesta del adaptador')
      await expect(page.locator('.my-garden-page')).toHaveCount(0)
    }
  })
}

test('una confirmación tardía no convierte la visita demo en sesión', async ({ page }) => {
  await page.goto('/tests/fixtures/onboarding-auth.html?result=confirmed&delay=1500')
  await login(page)
  await page.getByRole('button', { name: 'Descubrir Kawsapacha' }).click()
  await expect(page.locator('.garden-visitor-notice')).toContainText('Visitante sin sesión')
  await expect(page.locator('html')).toHaveAttribute('data-auth-adapter-resolved', 'true')
  await expect(page.locator('.garden-visitor-notice')).toContainText('Visitante sin sesión')
})

test('acceso confirmado conserva la comunidad y después abre directamente el huerto ya registrado', async ({ page }) => {
  await page.goto('/tests/fixtures/onboarding-auth.html?result=confirmed')
  await page.getByRole('button', { name: 'Descubrir Kawsapacha' }).click()
  await createCommunity(page, 'Comunidad de esta visita', 'Manabí')
  await page.getByRole('button', { name: 'Volver a bienvenida' }).click()
  await login(page)
  await expect(page.locator('.my-garden-page')).toHaveAttribute('data-onboarding', 'real-garden')
  await expect(page.locator('.garden-onboarding-community')).toContainText('Comunidad de esta visita')
  await registerGarden(page)
  await page.getByRole('button', { name: 'Volver a bienvenida' }).click()
  await login(page)
  await expect(page.locator('.my-garden-page')).toHaveAttribute('data-onboarding', 'complete')
  await expect(page.locator('.garden-onboarding')).toHaveCount(0)
  await expect(page.locator('.garden-poc-slot')).toHaveCount(6)
  await expect(page.locator('.garden-poc-heading')).toContainText('Huerto de la comunidad')
})

for (const width of [320, 390, 768, 1366]) {
  test(`onboarding accesible y sin desbordamiento a ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await demo(page)
    await page.locator('.garden-onboarding img').evaluateAll(images => Promise.all(images.map(img => (img as HTMLImageElement).decode())))
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    for (const button of await page.locator('.garden-onboarding button').all()) {
      const box = await button.boundingBox()
      expect(box!.height).toBeGreaterThanOrEqual(44)
    }
    await expect(page.locator('.garden-onboarding-steps')).toHaveCount(0)
    await expect(page.getByRole('heading', { name: 'Empieza tu comunidad' })).toBeVisible()
    await page.screenshot({ path: test.info().outputPath(`onboarding-${width}.png`), fullPage: true })
  })
}
