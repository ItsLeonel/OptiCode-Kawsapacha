import { test, expect } from './e2e'

test('art direction: all regions and kinds, soil changes and removal of registered infrastructure', async ({ page }) => {
  test.skip(process.env.GARDEN_POC_PREVIEW === '1', 'Visual fixture is deliberately absent from the application builds.')
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('/tests/fixtures/garden-art.html?renderer=canvas')
  const stage = page.locator('.garden-poc-stage')
  await expect(stage).toHaveAttribute('data-ready', 'true', { timeout: 45_000 })
  for (const [province, region] of [['Imbabura', 'sierra'], ['Manabí', 'costa'], ['Napo', 'oriente'], ['Galápagos', 'galapagos']]) {
    await page.getByLabel('Provincia', { exact: true }).selectOption(province)
    await expect(page.locator('.garden-poc')).toHaveAttribute('data-region', region)
    for (const kind of ['ground', 'pots', 'vertical', 'hanging']) {
      await page.getByLabel('Modalidad', { exact: true }).selectOption(kind)
      await expect(stage).toHaveAttribute('data-kind', kind)
      await expect(stage).toHaveAttribute('data-components', /art:phase-1/)
      // Asset loading completes before the reference image is captured.
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(250)
      await page.locator('.garden-poc').screenshot({ path: test.info().outputPath(`${region}-${kind}-desktop.png`) })
    }
  }
  await page.getByLabel('Características', { exact: true }).selectOption('all')
  await page.getByLabel('Modalidad', { exact: true }).selectOption('ground')
  await expect(stage).toHaveAttribute('data-components', /water:well/)
  await expect(stage).toHaveAttribute('data-components', /prop:tank/)
  await expect(stage).not.toHaveAttribute('data-components', /prop:compost/)
  await page.getByLabel('Suelo', { exact: true }).selectOption('sand')
  await expect(stage).toHaveAttribute('data-soil', 'sand')
  await page.locator('.garden-poc').screenshot({ path: test.info().outputPath('all-recorded-features.png') })
  await page.getByLabel('Características', { exact: true }).selectOption('none')
  await expect(stage).not.toHaveAttribute('data-components', /fence:|water:|irrigation:|fertilizer:|design:/)
  await page.locator('.garden-poc-slot').nth(5).focus()
  await page.locator('.garden-poc-slot').nth(5).press('Enter')
  await expect(page.locator('output[aria-label="Zona activada"]')).toContainText('5')
  await page.getByLabel('Características', { exact: true }).selectOption('rain')
  await expect(stage).toHaveAttribute('data-components', /water:rain/)
  await expect(stage).not.toHaveAttribute('data-components', /prop:tank|water:stored|fence:|irrigation:|fertilizer:/)
  await expect(page.locator('.garden-poc')).not.toContainText('No se pudo cargar')
  expect(errors).toEqual([])
})
