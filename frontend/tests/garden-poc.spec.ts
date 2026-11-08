import { test, expect } from './e2e'
import { scene, slots, registerGround, expectReady, slotPosition, canvasSlot } from './garden-helpers'



const passport = (page: import('@playwright/test').Page) => page.getByRole('dialog', { name: 'Romero', exact: true })

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.route('https://tile.openstreetmap.org/**', route => route.abort())
})

test('real React flow, Phaser selection, evidence, Passport, pan, zoom and clean remount', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await registerGround(page)
  await expectReady(page)
  const neutral = await scene(page).getAttribute('data-components')
  for (const feature of ['design:', 'fence:', 'water:', 'irrigation:', 'fertilizer:']) expect(neutral).not.toContain(feature)
  const initialZoom = Number(await scene(page).getAttribute('data-zoom'))
  await page.getByRole('button', { name: 'Acercar +' }).click()
  await expect.poll(async () => Number(await scene(page).getAttribute('data-zoom'))).toBeGreaterThan(initialZoom)
  await scene(page).focus()
  const left = Number(await scene(page).getAttribute('data-world-left'))
  await scene(page).press('ArrowRight')
  await expect.poll(async () => Number(await scene(page).getAttribute('data-world-left'))).toBeGreaterThan(left)
  const canvas = scene(page).locator('canvas')
  const box = (await canvas.boundingBox())!
  const beforeDrag = Number(await scene(page).getAttribute('data-world-left'))
  const zoomBeforeDrag = Number(await scene(page).getAttribute('data-zoom'))
  await page.mouse.move(box.x + box.width * .8, box.y + 70)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width * .8 - 70, box.y + 70, { steps: 8 })
  await page.mouse.up()
  await expect.poll(async () => Number(await scene(page).getAttribute('data-world-left'))).toBeGreaterThan(beforeDrag)
  await expect.poll(async () => Number(await scene(page).getAttribute('data-zoom'))).toBeCloseTo(zoomBeforeDrag, 3)
  await expect(page.getByRole('dialog', { name: 'Registrar planta', exact: true })).toHaveCount(0)
  await page.mouse.move(box.x + box.width / 2, box.y + 70)
  await page.mouse.wheel(0, -100)
  await expect.poll(async () => Number(await scene(page).getAttribute('data-zoom'))).toBeGreaterThan(zoomBeforeDrag)
  await page.getByRole('button', { name: 'Centrar terreno' }).click()
  await expect.poll(async () => Number(await scene(page).getAttribute('data-zoom'))).toBeCloseTo(initialZoom, 3)
  await canvasSlot(page, 4)
  const registration = page.getByRole('dialog', { name: 'Registrar planta', exact: true })
  await expect(registration).toBeVisible()
  await expect(registration.getByLabel('Posición de cultivo')).toHaveValue('4')
  await page.locator('#plant-photo').setInputFiles('src/features/real-gardens/assets/en-tierra-v1.jpg')
  await registration.getByRole('button', { name: 'Añadir a mi huerto' }).click()
  await expect(passport(page)).toBeVisible()
  const evidence = await page.locator('.garden-passport-photo').getAttribute('src')
  expect(evidence).toMatch(/^blob:/)
  await page.getByRole('button', { name: 'Cerrar Pasaporte Vivo' }).click()
  await expect(slots(page).nth(4)).toContainText('Romero')
  await page.getByRole('button', { name: 'Centrar terreno' }).click()
  await canvasSlot(page, 4)
  await expect(passport(page)).toBeVisible()
  await expect(page.locator('.garden-passport-photo')).toHaveAttribute('src', evidence!)
  await page.getByRole('button', { name: 'Cerrar Pasaporte Vivo' }).click()
  await expect(slots(page).nth(4)).toBeFocused()
  await page.locator('.garden-poc').screenshot({ path: test.info().outputPath('phaser-ground-desktop.png') })
  const ids = await slots(page).evaluateAll(buttons => buttons.map(button => (button as HTMLElement).dataset.slotId))
  await page.getByRole('navigation', { name: 'Navegación principal' }).getByRole('button', { name: 'Mi terreno', exact: true }).click()
  await expect(page.locator('.garden-poc-stage canvas')).toHaveCount(0)
  await page.getByRole('button', { name: 'Volver a Mi Jardín', exact: true }).click()
  await expectReady(page)
  expect(await slots(page).evaluateAll(buttons => buttons.map(button => (button as HTMLElement).dataset.slotId))).toEqual(ids)
  await canvasSlot(page, 4)
  await expect(page.locator('.garden-passport-photo')).toHaveAttribute('src', evidence!)
  expect(errors).toEqual([])
})

test('Canvas fallback, keyboard equivalent and responsive at 100% zoom', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await registerGround(page, '/garden-lab.html?renderer=canvas', 'Manabí')
  await expectReady(page)
  await expect(scene(page)).toHaveAttribute('data-renderer', 'Canvas')
  await expect(page.locator('.garden-poc')).toHaveAttribute('data-region', 'costa')
  for (const width of [320, 390, 768, 1366]) {
    await page.setViewportSize({ width, height: 900 })
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
    for (const button of await page.locator('.garden-poc-toolbar button, .garden-poc-world-actions button').all()) {
      const box = await button.boundingBox()
      expect(box!.width).toBeGreaterThanOrEqual(44)
      expect(box!.height).toBeGreaterThanOrEqual(44)
    }
  }
  await slots(page).first().focus()
  await slots(page).first().press('End')
  await expect(slots(page).last()).toBeFocused()
  await slots(page).last().press('Enter')
  await expect(page.getByRole('dialog', { name: 'Registrar planta', exact: true })).toBeVisible()
  await expect(page.getByLabel('Posición de cultivo')).toHaveValue('5')
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click()
  await expect(slots(page).last()).toBeFocused()
})

for (const [province, region] of [['Napo', 'oriente'], ['Galápagos', 'galapagos']] as const) {
  test(`landscape follows the recorded province: ${region}`, async ({ page }) => {
    await registerGround(page, '/garden-lab.html?renderer=canvas', province)
    await expectReady(page)
    await expect(page.locator('.garden-poc')).toHaveAttribute('data-region', region)
    await expect(page.locator('.garden-poc-heading')).toContainText(province)
  })
}

test.describe('touch input', () => {
  test.use({ hasTouch: true, viewport: { width: 390, height: 844 } })
  test('finger drag pans without activating a slot; accessible touch selection opens React', async ({ page }) => {
    await registerGround(page, '/garden-lab.html?renderer=canvas')
    await expectReady(page)
    await scene(page).scrollIntoViewIfNeeded()
    const box = (await scene(page).boundingBox())!
    const before = Number(await scene(page).getAttribute('data-world-left'))
    const cdp = await page.context().newCDPSession(page)
    const x = box.x + box.width * .8
    const y = box.y + 80
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] })
    for (let distance = 10; distance <= 70; distance += 10) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x - distance, y }] })
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
    await expect.poll(async () => Number(await scene(page).getAttribute('data-world-left'))).toBeGreaterThan(before)
    await expect(page.getByRole('dialog', { name: 'Registrar planta', exact: true })).toHaveCount(0)
    await page.getByRole('button', { name: 'Centrar terreno' }).click()
    await canvasSlot(page, 2, true)
    await expect(page.getByRole('dialog', { name: 'Registrar planta', exact: true })).toBeVisible()
    await expect(page.getByLabel('Posición de cultivo')).toHaveValue('2')
    await cdp.detach()
  })
})

test('missing decorative assets retain accessible registration and real data', async ({ page }) => {
  await page.route('**/paisaje-sierra-v1.png*', route => route.abort())
  await page.route('**/terreno-continuo-v3.png*', route => route.abort())
  await registerGround(page, '/garden-lab.html?renderer=canvas')
  await expectReady(page)
  await expect(page.locator('.garden-poc')).toContainText('No se pudo cargar')
  await slots(page).first().focus()
  await slots(page).first().press('Enter')
  await expect(page.getByRole('dialog', { name: 'Registrar planta', exact: true })).toBeVisible()
})

test('normal entry mounts the validated interactive Phaser renderer', async ({ page }) => {
  test.skip(process.env.GARDEN_POC_PREVIEW === '1', 'The separate build intentionally contains garden-lab.html only; normal entry is checked on the development server.')
  const requested: string[] = []
  page.on('request', request => { if (/phaser|createGardenGame|garden-poc/i.test(request.url())) requested.push(request.url()) })
  await registerGround(page, '/')
  await expectReady(page)
  await expect(page.locator('.garden-poc')).toHaveCount(1)
  await expect(page.locator('.garden-scene')).toHaveCount(0)
  expect(requested.length).toBeGreaterThan(0)
})

for (const kind of ['ground', 'pots', 'vertical', 'hanging'] as const) {
  test(`modular ${kind}: recorded features, six empty spaces, canvas selection and responsive`, async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    await registerGround(page, '/garden-lab.html', 'Imbabura', kind, true)
    await expectReady(page)
    await expect(scene(page)).toHaveAttribute('data-kind', kind)
    const components = await scene(page).getAttribute('data-components')
    for (const token of ['fence:natural', 'water:stored', 'irrigation:drip', 'fertilizer:compost']) expect(components).toContain(token)
    expect(components!.match(/slot:garden-slot-/g)).toHaveLength(6)
    if (kind === 'ground') {
      await expect(scene(page)).toHaveAttribute('data-soil', 'clay')
      for (const design of ['furrows', 'beds', 'raisedBeds', 'terraces']) expect(components).toContain(`design:${design}`)
    }
    await expect(page.getByRole('button', { name: /Zona de cultivo \d · Registrar una planta/ })).toHaveCount(6)
    await expect(page.locator('.garden-poc-slots, .garden-poc-slot-number')).toHaveCount(0)
    await expect(page.locator('.garden-poc-accessible')).toHaveClass(/garden-poc-sr-only/)
    await expect(page.locator('.garden-poc')).not.toContainText('No se pudo cargar')
    await page.locator('.garden-poc-world-actions button').first().click()
    await expect(page.locator('.garden-poc-data')).toContainText('Agua almacenada')
    await expect(page.locator('.garden-poc-data')).toContainText('Goteo')
    await page.getByRole('button', { name: 'Cerrar características', exact: true }).click()
    await page.getByRole('button', { name: 'Centrar terreno' }).click()
    await scene(page).locator('canvas').hover({ position: await slotPosition(page, 4) })
    await expect(page.locator('.garden-poc-context')).toContainText('Registrar una planta')
    await expect(page.getByRole('dialog', { name: 'Registrar planta', exact: true })).toHaveCount(0)
    await page.getByRole('button', { name: 'Ayuda del jardín' }).click()
    await expect(page.locator('.garden-poc-help')).toContainText('Explora tu jardín')
    await page.getByRole('button', { name: 'Seleccionar una zona con teclado' }).click()
    await expect(slots(page).first()).toBeFocused()
    await expect(page.locator('.garden-poc-context')).toContainText('Registrar una planta')
    await page.getByRole('button', { name: 'Centrar terreno' }).click()
    await page.mouse.move(0, 0)
    await page.locator('.garden-poc').screenshot({ path: test.info().outputPath(`modular-${kind}-desktop.png`) })
    await canvasSlot(page, 5)
    await expect(page.getByRole('dialog', { name: 'Registrar planta', exact: true })).toBeVisible()
    await expect(page.getByLabel('Posición de cultivo')).toHaveValue('5')
    await page.getByRole('button', { name: 'Cancelar', exact: true }).click()
    await page.setViewportSize({ width: 390, height: 844 })
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
    await expectReady(page)
    await page.getByRole('button', { name: 'Centrar terreno' }).click()
    await page.mouse.move(0, 0)
    await page.locator('.garden-poc').screenshot({ path: test.info().outputPath(`modular-${kind}-mobile.png`) })
    expect(errors).toEqual([])
  })
}
