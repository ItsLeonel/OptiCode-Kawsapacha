import { test, expect, type Page } from './e2e'
import { navigateModule, openGardenSection } from './community-helpers'

// QA de presentación, sin iniciar sesión ni escribir datos en backend.
test.setTimeout(90_000)

async function assertNoHorizontalOverflow(page: Page, headingSelector: string) {
  const layout = await page.evaluate((selector) => {
    const heading = document.querySelector<HTMLElement>(selector)
    const rect = heading?.getBoundingClientRect()
    return {
      viewport: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      headingExists: Boolean(heading),
      headingLeft: rect?.left ?? 0,
      headingRight: rect?.right ?? 0,
      headingOwnOverflow: heading ? heading.scrollWidth > heading.clientWidth + 2 : true,
    }
  }, headingSelector)
  expect(layout.headingExists, headingSelector).toBe(true)
  expect(layout.documentWidth, JSON.stringify(layout)).toBeLessThanOrEqual(layout.viewport + 1)
  expect(layout.headingLeft, JSON.stringify(layout)).toBeGreaterThanOrEqual(-1)
  expect(layout.headingRight, JSON.stringify(layout)).toBeLessThanOrEqual(layout.viewport + 1)
  expect(layout.headingOwnOverflow, JSON.stringify(layout)).toBe(false)
}

for (const width of [320, 360, 390, 430, 768, 1024]) {
  test('Fase 1: títulos y pantallas a ' + width + ' px', async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')
    await expect(page.locator('.auth-welcome-board')).toBeVisible()
    await assertNoHorizontalOverflow(page, '.auth-welcome-board')

    await page.getByRole('button', { name: 'Descubrir Kawsapacha' }).click()
    await expect(page.locator('.my-garden-page')).toBeVisible()
    await assertNoHorizontalOverflow(page, '.garden-welcome h1')

    await navigateModule(page, 'Comunidad')
    await expect(page.locator('.communities-page')).toBeVisible()
    await assertNoHorizontalOverflow(page, '.community-hero h1')

    await openGardenSection(page, 'Mi terreno')
    await expect(page.locator('.real-garden-page')).toBeVisible()
    await assertNoHorizontalOverflow(page, '.rg-hero h1')

    await openGardenSection(page, 'Catálogo medicinal')
    await expect(page.locator('.mc-catalog')).toBeVisible()
    await assertNoHorizontalOverflow(page, '.mc-heading-copy h1')

    await page.screenshot({
      path: test.info().outputPath('fase1-catalogo-' + width + '.png'),
      fullPage: true,
      animations: 'disabled',
    })
  })
}

for (const width of [320, 390, 768]) {
  test('Fase 1: asistente comunitario visible a ' + width + ' px', async ({ page }) => {
    await page.setViewportSize({ width, height: 820 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')
    await page.getByRole('button', { name: 'Descubrir Kawsapacha' }).click()
    await page.getByRole('button', { name: 'Crear mi comunidad', exact: true }).click()
    const wizard = page.locator('.community-wizard')
    await expect(wizard).toBeVisible()
    const box = await wizard.boundingBox()
    expect(box).not.toBeNull()
    expect(box!.x).toBeGreaterThanOrEqual(-2)
    expect(box!.x + box!.width).toBeLessThanOrEqual(width + 2)
    expect(box!.height).toBeLessThanOrEqual(822)
    expect(await wizard.evaluate(el => el.scrollWidth <= el.clientWidth + 2)).toBe(true)
    await wizard.screenshot({
      path: test.info().outputPath('fase1-asistente-' + width + '.png'),
      animations: 'disabled',
    })
  })
}
