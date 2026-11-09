import { test, expect } from './e2e'

test('all four regions render four recorded reliefs in six interactive ground slots', async ({ page }) => {
  const regions = [
    ['Imbabura', 'sierra'],
    ['Manabí', 'costa'],
    ['Napo', 'oriente'],
    ['Galápagos', 'galapagos'],
  ] as const
  for (const [province, region] of regions) {
    await page.goto(`/tests/fixtures/garden-art.html?renderer=canvas&province=${encodeURIComponent(province)}`)
    const garden = page.locator('.garden-poc')
    const stage = page.locator('.garden-poc-stage')
    await expect(stage).toHaveAttribute('data-ready', 'true', { timeout: 45_000 })
    await expect(garden).toHaveAttribute('data-region', region)
    await expect(stage).toHaveAttribute('data-components', /art:phase-1/)
    const components = await stage.getAttribute('data-components')
    expect(components).toContain(`parcel:${region}-relief:furrows`)
    for (const design of ['furrows', 'beds', 'raisedBeds', 'terraces']) expect(components).toContain(`design:${design}`)
    for (let plot = 0; plot < 6; plot++) expect(components).toContain(`slot:garden-slot-${plot}`)
    await expect(page.locator('.garden-poc-slot')).toHaveCount(6)
    const lastSlot = page.locator('.garden-poc-slot').nth(5)
    await lastSlot.focus()
    await lastSlot.press('Enter')
    await expect(page.locator('output[aria-label="Zona activada"]')).toHaveText('5')
  }
})
