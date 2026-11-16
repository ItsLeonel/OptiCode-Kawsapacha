import { test, expect } from './e2e'
import { canvasSlot } from './garden-helpers'

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

for (const [province, region] of [['Imbabura', 'sierra'], ['Napo', 'oriente'], ['Galápagos', 'galapagos']] as const) {
  test(`${region}: six canvas targets and keyboard controls survive every distribution, area and modality switch`, async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
    await page.setViewportSize({ width: 1366, height: 768 })
    await page.goto(`/tests/fixtures/garden-art.html?renderer=canvas&province=${encodeURIComponent(province)}`)
    const stage = page.locator('.garden-poc-stage')
    const activated = page.locator('output[aria-label="Zona activada"]')
    await expect(stage).toHaveAttribute('data-ready', 'true', { timeout: 45_000 })
    await expect(stage).toHaveAttribute('data-components', new RegExp(`terrain:integrated:${region}`))

    // The continuous WebP owns both landscape and soil. Every modality adds
    // transparent finishing only; an opaque lawn would hide the new scenery.
    const terrain = await page.evaluate(async ({ region, province }) => {
      const base = '/src/features/my-garden/phaser-poc/'
      const { paintCourtyard } = await import(base + 'courtyard.ts')
      const { buildGardenVisualModel } = await import(base + 'model.ts')
      const { LANDSCAPES } = await import(base + 'assets.ts')
      const landscape = new Image(); landscape.src = LANDSCAPES[region]; await landscape.decode()
      const finishes = ['ground', 'pots', 'vertical', 'hanging'].map(kind => {
        const model = buildGardenVisualModel({
          name: 'Transición regional', kind, areaM2: 25, soilType: 'loam', irrigationAvailability: 'unknown', communityName: null,
          location: { province, provinceCode: null, canton: '', cantonCode: null, parish: '', parishCode: null, reference: '', coordinates: null },
        }, [], region)
        const original = JSON.stringify(model)
        const canvas = document.createElement('canvas'); canvas.width = 1920; canvas.height = 1500
        const ctx = canvas.getContext('2d')!
        paintCourtyard(ctx, model, {})
        const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data
        let maxAlpha = 0, transparent = 0, skyAlpha = 0
        for (let i = 3; i < pixels.length; i += 4) {
          maxAlpha = Math.max(maxAlpha, pixels[i])
          if (pixels[i] === 0) transparent++
          if (i < canvas.width * 400 * 4) skyAlpha = Math.max(skyAlpha, pixels[i])
        }
        return {
          kind, maxAlpha, skyAlpha, transparentFraction: transparent / (pixels.length / 4),
          unchangedModel: original === JSON.stringify(model),
          restoredContext: ctx.globalAlpha === 1 && ctx.globalCompositeOperation === 'source-over',
        }
      })
      return {
        finishes, source: landscape.src, width: landscape.naturalWidth, height: landscape.naturalHeight,
      }
    }, { region, province })
    expect(terrain.source).toContain(`/region-scenes/${region}-integrado.webp`)
    expect(terrain.width).toBeGreaterThan(1000)
    expect(terrain.height).toBeGreaterThan(700)
    for (const finish of terrain.finishes) {
      expect(finish.maxAlpha, `${finish.kind}: no opaque replacement ground`).toBeLessThan(160)
      expect(finish.maxAlpha).toBeGreaterThan(0)
      expect(finish.skyAlpha).toBe(0)
      expect(finish.transparentFraction).toBeGreaterThan(.75)
      expect(finish.unchangedModel && finish.restoredContext).toBe(true)
    }

    for (const design of ['beds', 'furrows', 'raisedBeds', 'terraces']) {
      await page.getByLabel('Características', { exact: true }).selectOption(`design-${design}`)
      await expect(stage).toHaveAttribute('data-components', new RegExp(`parcel:${region}-relief:${design}`))
      await page.waitForLoadState('networkidle')
      for (const token of [`fence:perimeter:${region}`, 'water:stored', 'water:well', 'irrigation:drip:side-kit', 'irrigation:sprinkler', 'fertilizer:compost']) {
        expect(await stage.getAttribute('data-components')).toContain(token)
      }
      expect((await stage.getAttribute('data-components'))!.match(/design:\w+/g)).toEqual([`design:${design}`])
      for (let plot = 0; plot < 6; plot++) {
        await canvasSlot(page, plot)
        await expect(activated).toHaveText(String(plot))
        const button = page.locator('.garden-poc-slot').nth(plot)
        await button.focus()
        await button.press('Enter')
        await expect(activated).toHaveText(String(plot))
      }
      await page.locator('.garden-poc-heading h1').focus()
      await page.mouse.move(0, 0)
      await page.locator('.garden-poc').screenshot({ path: test.info().outputPath(`${region}-${design}.png`) })
    }

    for (const area of ['10', '50', '100']) {
      await page.getByLabel('Superficie', { exact: true }).selectOption(area)
      for (let plot = 0; plot < 6; plot++) {
        await canvasSlot(page, plot)
        await expect(activated).toHaveText(String(plot))
      }
    }

    // A cached container floor must never replace the continuous ground plane.
    await page.mouse.move(0, 0)
    await page.locator('.garden-poc-heading h1').focus()
    const groundColors = () => stage.evaluate(async element => {
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
      const stage = element as HTMLElement
      const ctx = stage.querySelector('canvas')!.getContext('2d')!
      const zoom = Number(stage.dataset.zoom), left = Number(stage.dataset.worldLeft), top = Number(stage.dataset.worldTop)
      // Sample the clear cross aisle, excluding props whose browser image
      // resampling can differ slightly after an atlas is used by another view.
      return [600, 1030, 1450].map(x => {
        const { data } = ctx.getImageData(Math.round((x - left) * zoom), Math.round((990 - top) * zoom), 16, 8)
        return [0, 1, 2].map(channel => Math.round(Array.from({ length: 128 }, (_, i) => data[i * 4 + channel]).reduce((sum, value) => sum + value, 0) / 128))
      })
    })
    const ground = await groundColors()
    await page.getByLabel('Modalidad', { exact: true }).selectOption('pots')
    await expect(stage).toHaveAttribute('data-kind', 'pots')
    await page.getByLabel('Modalidad', { exact: true }).selectOption('ground')
    await expect(stage).toHaveAttribute('data-kind', 'ground')
    expect(await groundColors(), 'ground surface stays identical after returning from pots').toEqual(ground)

    for (const fence of ['living', 'natural', 'recycled', 'metal', 'conventional']) {
      await page.getByLabel('Características', { exact: true }).selectOption(`fence-${fence}`)
      await expect(stage).toHaveAttribute('data-components', new RegExp(`fence:${fence}(?: |$)`))
      await page.locator('.garden-poc').screenshot({ path: test.info().outputPath(`${region}-fence-${fence}.png`) })
    }
    await page.getByLabel('Características', { exact: true }).selectOption('all')
    await expect(stage).toHaveAttribute('data-components', /water:channel:visible-surface/)
    for (const viewport of [{ width: 1920, height: 1080 }, { width: 390, height: 844 }]) {
      await page.setViewportSize(viewport)
      for (let plot = 0; plot < 6; plot++) {
        await canvasSlot(page, plot)
        await expect(activated).toHaveText(String(plot))
      }
      await page.locator('.garden-poc-heading h1').focus()
      await page.mouse.move(0, 0)
      await page.locator('.garden-poc').screenshot({ path: test.info().outputPath(`${region}-all-${viewport.width}.png`) })
    }
    await expect(page.locator('.garden-poc-alert')).toHaveCount(0)
    expect(errors).toEqual([])
  })
}

test('Costa retains its approved PNG fences and gate in every container modality', async ({ page }) => {
  await page.goto('/tests/fixtures/garden-art.html?renderer=canvas&province=Manab%C3%AD&kind=pots&features=fence-metal')
  const stage = page.locator('.garden-poc-stage')
  await expect(stage).toHaveAttribute('data-ready', 'true', { timeout: 45_000 })
  for (const kind of ['pots', 'vertical', 'hanging']) {
    await page.getByLabel('Modalidad', { exact: true }).selectOption(kind)
    await expect(stage).toHaveAttribute('data-kind', kind)
    await expect(stage).toHaveAttribute('data-components', /fence:metal:costa-png/)
    await expect(stage).toHaveAttribute('data-components', /fence:metal:costa-gate/)
    await expect(stage).toHaveAttribute('data-components', /fence:perimeter:costa/)
    await expect(page.locator('.garden-poc-slot')).toHaveCount(6)
    await page.locator('.garden-poc-slot').nth(5).focus()
    await page.locator('.garden-poc-slot').nth(5).press('Enter')
    await expect(page.locator('output[aria-label="Zona activada"]')).toHaveText('5')
  }
})
