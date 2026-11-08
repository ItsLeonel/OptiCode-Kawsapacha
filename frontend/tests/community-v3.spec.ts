import { test, expect, type Page } from './e2e'
import { chooseCommunityTerritory, mainNavigation, nextCommunityStep } from './community-helpers'

test.setTimeout(90_000)
const errors = new WeakMap<Page, string[]>()
const regions = [
  { key: 'sierra', label: 'Sierra', province: 'Pichincha' },
  { key: 'costa', label: 'Costa', province: 'Guayas' },
  { key: 'oriente', label: 'Amazonía', province: 'Pastaza' },
  { key: 'galapagos', label: 'Galápagos', province: 'Galápagos' },
] as const

test.beforeEach(async ({ page }) => {
  errors.set(page, [])
  page.on('pageerror', error => errors.get(page)!.push(error.message))
  await page.emulateMedia({ reducedMotion: 'reduce' })
})
test.afterEach(async ({ page }) => expect(errors.get(page)).toEqual([]))

async function settleArt(page: Page) {
  await page.evaluate(async () => {
    await document.fonts.ready
    await Promise.all([...document.images].map(img => img.decode()))
    const urls = new Set([...document.querySelectorAll('svg image')].map(el => el.getAttribute('href')).filter((url): url is string => Boolean(url)))
    for (const el of document.querySelectorAll('.cw-world,.community-world-background')) {
      for (const match of getComputedStyle(el).backgroundImage.matchAll(/url\(["']?([^"')]+)["']?\)/g)) urls.add(match[1])
    }
    await Promise.all([...urls].map(async src => { const img = new Image(); img.src = src; await img.decode() }))
    await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))
  })
}

async function capture(page: Page, path: string, fullPage = false) {
  await settleArt(page)
  const layout = await page.evaluate(() => ({ viewport: innerWidth, width: document.documentElement.scrollWidth, outside: [...document.querySelectorAll<HTMLElement>('body *')].filter(el => el.getBoundingClientRect().right > innerWidth + 1 && getComputedStyle(el).position !== 'fixed').slice(0, 14).map(el => ({ tag: el.tagName, class: String(el.className), right: Math.round(el.getBoundingClientRect().right) })) }))
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), { message: JSON.stringify(layout) }).toBe(true)
  if (await page.locator('.community-wizard').count()) {
    expect(await page.locator('.community-wizard').evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true)
    await expect(page.locator('.community-wizard .kg-step-track')).toHaveCount(0)
    await page.locator('.community-wizard').evaluate(el => el.scrollTo({ top: 0, behavior: 'instant' }))
  }
  await page.screenshot({ path, fullPage, animations: 'disabled' })
}

for (const region of regions) {
  test(`V3: ${region.label}, seis pantallas y recursos regionales reales`, async ({ page }) => {
    await page.setViewportSize({ width: 1672, height: 941 })
    await page.goto('/')
    await page.getByRole('button', { name: 'Descubrir Kawsapacha' }).click()
    await expect(page.getByRole('heading', { name: 'Empieza tu comunidad', exact: true })).toBeVisible()
    await mainNavigation(page).getByRole('button', { name: 'Comunidad', exact: true }).click()
    await page.getByRole('button', { name: 'Crear mi comunidad', exact: true }).click()
    await nextCommunityStep(page)
    await chooseCommunityTerritory(page, region.province, 'Sector de prueba')
    await expect(page.locator('.game-province')).toHaveCount(24)
    await expect(page.locator('.cw-world')).toHaveAttribute('data-region', region.key)
    await expect(page.locator('.community-wizard .kg-guide__portrait')).toHaveAttribute('src', new RegExp(`personaje_${region.key}_v3`))
    await expect(page.getByLabel('Provincia de la comunidad')).toHaveValue(region.province)
    await capture(page, `artifacts/comunidad-v3/ubicacion-${region.key}.png`)
    await page.getByRole('button', { name: '← Atrás', exact: true }).click()
    await capture(page, `artifacts/comunidad-v3/tipo-${region.key}.png`)
    await nextCommunityStep(page)
    await nextCommunityStep(page)
    await page.getByRole('button', { name: 'Editar identidad', exact: true }).click()
    await page.getByLabel('Nombre de la comunidad').fill(`Mi comunidad · ${region.province}`)
    await page.getByLabel('Acerca de la comunidad').fill('Un lugar para cultivar y compartir saberes.')
    await page.getByRole('button', { name: 'Editar responsable', exact: true }).click()
    await page.getByLabel('Persona responsable').fill('Responsable de prueba')
    await page.getByRole('button', { name: 'Editar identidad', exact: true }).click()
    await capture(page, `artifacts/comunidad-v3/datos-${region.key}.png`)
    await nextCommunityStep(page)
    await expect(page.locator('.cw-summary')).toContainText(region.province)
    await expect(page.getByRole('dialog')).not.toContainText('¡Comunidad creada!')
    await capture(page, `artifacts/comunidad-v3/confirmacion-${region.key}.png`)
    await page.getByRole('button', { name: 'Crear comunidad', exact: true }).click()
    await expect(page.locator('.community-overview')).toContainText(`Mi comunidad · ${region.province}`)
    await expect(page.locator('.communities-page')).toHaveAttribute('data-region', region.key)
    await expect(page.locator('.community-action')).toHaveCount(3)
    await expect(page.getByRole('button', { name: /Publicar mi experiencia/ })).toBeVisible()
    await expect(page.locator('.communities-page')).not.toContainText(/\b(?:XP|monedas|puntos)\b/i)
    await capture(page, `artifacts/comunidad-v3/comunidad-${region.key}.png`)
    await mainNavigation(page).getByRole('button', { name: 'Mi Jardín', exact: true }).click()
    await expect(page.locator('.my-garden-page')).toHaveAttribute('data-region', region.key)
    await expect(page.locator('.garden-parcels')).toHaveCount(0)
    await capture(page, `artifacts/comunidad-v3/mi-jardin-con-comunidad-${region.key}.png`)
  })
}

for (const width of [320, 390, 768]) {
  test(`V3 responsive sin barra de pasos a ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 })
    await page.goto('/')
    await page.getByRole('button', { name: 'Descubrir Kawsapacha' }).click()
    await capture(page, `artifacts/comunidad-v3/movil-${width}-mi-jardin.png`, true)
    await page.getByRole('button', { name: 'Crear mi comunidad', exact: true }).click()
    await capture(page, `artifacts/comunidad-v3/movil-${width}-tipo.png`)
    await nextCommunityStep(page)
    await chooseCommunityTerritory(page, 'Pichincha')
    await capture(page, `artifacts/comunidad-v3/movil-${width}-ubicacion.png`)
    await nextCommunityStep(page)
    await page.getByRole('button', { name: 'Editar identidad', exact: true }).click()
    await page.getByLabel('Nombre de la comunidad').fill('Comunidad de prueba')
    await page.getByRole('button', { name: 'Editar responsable', exact: true }).click()
    await page.getByLabel('Persona responsable').fill('Responsable de prueba')
    await nextCommunityStep(page)
    await capture(page, `artifacts/comunidad-v3/movil-${width}-confirmacion.png`)
    await page.getByRole('button', { name: '← Atrás', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Editar responsable', exact: true })).toBeVisible()
  })
}
