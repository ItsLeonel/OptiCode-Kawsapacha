import { test, expect } from './e2e'

const viewports = [[1290, 669], [1366, 768], [1920, 1080]] as const
const cases = [
  ['stored', 'water:stored'], ['well', 'water:well'], ['channel', 'water:channel:visible-surface'], ['rain', 'water:rain:declared-indicator'],
  ['manual', 'irrigation:manual'], ['hose', 'irrigation:hose'], ['sprinkler', 'irrigation:sprinkler'], ['drip', 'irrigation:drip'],
  ['fence-living', 'fence:living:costa-art'], ['fence-natural', 'fence:natural:costa-art'], ['fence-recycled', 'fence:recycled:costa-art'], ['fence-metal', 'fence:metal:costa-art'], ['fence-conventional', 'fence:conventional:costa-art'],
  ['fert-leaves', 'fertilizer:leaves'], ['fert-remains', 'fertilizer:plantRemains'], ['fert-compost', 'fertilizer:compost'], ['fallow', 'fertilizer:fallow'],
  ['combination', 'water:channel:visible-surface'], ['all', 'water:well'],
] as const

test('Costa water, irrigation, fences and natural fertilizers: visual captures and stable six-slot camera', async ({ page }) => {
  await page.setViewportSize({ width: 1290, height: 669 })
  await page.goto('/tests/fixtures/garden-art.html?renderer=canvas&province=Manab%C3%AD')
  const stage = page.locator('.garden-poc-stage')
  await expect(stage).toHaveAttribute('data-ready', 'true', { timeout: 45_000 })
  await expect(page.locator('.garden-poc')).toHaveAttribute('data-region', 'costa')

  await page.addStyleTag({ content: `
    body { margin: 0 !important; overflow: hidden !important; }
    #root > div { max-width: none !important; margin: 0 !important; }
    .garden-poc { position: fixed !important; z-index: 100 !important; inset: 0 !important; width: 100vw !important; height: 100dvh !important; margin: 0 !important; padding: 0 !important; border: 0 !important; }
    .garden-poc-world { position: absolute !important; inset: 0 !important; width: 100% !important; height: 100% !important; padding: 0 !important; border: 0 !important; border-radius: 0 !important; }
    .garden-poc-stage { position: absolute !important; inset: 0 !important; width: 100% !important; height: 100% !important; min-height: 0 !important; padding: 0 !important; border: 0 !important; border-radius: 0 !important; }
    .garden-poc-guide { left: 12px !important; bottom: 96px !important; width: 176px !important; height: 264px !important; }
    .garden-poc-guide > span { left: 8px !important; bottom: calc(100% + 10px) !important; width: 205px !important; }
    .garden-poc-record-count { left: 18px !important; top: 112px !important; right: auto !important; bottom: auto !important; max-width: min(360px, calc(100% - 36px)) !important; }
  ` })

  for (const [profile, token] of cases) {
    await page.getByLabel('Características', { exact: true }).selectOption(profile)
    await expect.poll(() => stage.getAttribute('data-components'), { timeout: 15_000 }).toContain(token)
    await page.waitForTimeout(250)
    for (const [width, height] of viewports) {
      await page.setViewportSize({ width, height })
      await expect.poll(() => page.evaluate(() => {
        const canvas = document.querySelector('.garden-poc-stage canvas')
        return canvas ? [canvas.clientWidth, canvas.clientHeight] : null
      })).toEqual([width, height])
      const framing = await page.evaluate(() => {
        const el = document.querySelector<HTMLElement>('.garden-poc-stage')!
        const zoom = Number(el.dataset.zoom), left = Number(el.dataset.worldLeft)
        const slots = [...document.querySelectorAll<HTMLElement>('.garden-poc-slot')]
        return { left, right: left + el.clientWidth / zoom, slots: slots.map(slot => [Number(slot.dataset.worldX), Number(slot.dataset.worldY)]) }
      })
      expect(framing.left).toBeGreaterThanOrEqual(-1)
      expect(framing.right).toBeLessThanOrEqual(1921)
      expect(framing.slots).toHaveLength(6)
      await page.locator('.garden-poc').screenshot({ path: test.info().outputPath(`costa-${profile}-${width}x${height}.png`) })
    }
  }

  for (const area of ['10', '50', '100']) {
    await page.getByLabel('Superficie', { exact: true }).selectOption(area)
    await page.getByLabel('Características', { exact: true }).selectOption('combination')
    await expect.poll(() => stage.getAttribute('data-components'), { timeout: 15_000 }).toContain('water:channel:visible-surface')
    for (const [width, height] of viewports) {
      await page.setViewportSize({ width, height })
      await page.waitForTimeout(150)
      await page.locator('.garden-poc').screenshot({ path: test.info().outputPath(`costa-area-${area}-${width}x${height}.png`) })
    }
  }
})
