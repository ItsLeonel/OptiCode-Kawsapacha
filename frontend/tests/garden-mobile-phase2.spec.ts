import { test, expect, type Page } from './e2e'
import { registerGround, expectReady, scene, canvasSlot } from './garden-helpers'
import { navigateModule } from './community-helpers'
import type { GardenKind } from '../src/features/real-gardens/real-garden'

test.setTimeout(150_000)

const mobile = { width: 390, height: 844 }
test.use({ viewport: mobile, hasTouch: true })

async function camera(page: Page) {
  return scene(page).evaluate(stage => ({
    zoom: Number(stage.dataset.zoom),
    left: Number(stage.dataset.worldLeft),
    top: Number(stage.dataset.worldTop),
    width: stage.clientWidth,
    height: stage.clientHeight,
    points: [...document.querySelectorAll<HTMLElement>('.garden-poc-slot')].map(el => ({
      x: Number(el.dataset.worldX),
      y: Number(el.dataset.worldY),
    })),
  }))
}

async function sixVisible(page: Page) {
  await expect(scene(page)).toHaveAttribute('data-ready', 'true')
  const position = await camera(page)
  expect(position.points).toHaveLength(6)
  expect(position.zoom).toBeGreaterThan(.1)
  for (const plot of position.points) {
    const x = (plot.x - position.left) * position.zoom
    const y = (plot.y - position.top) * position.zoom
    expect(x, 'parcela visible en horizontal').toBeGreaterThanOrEqual(0)
    expect(x, `parcela visible en horizontal: ${JSON.stringify(position)}`).toBeLessThanOrEqual(position.width)
    expect(y, 'parcela visible en vertical').toBeGreaterThanOrEqual(0)
    expect(y, 'parcela visible en vertical').toBeLessThanOrEqual(position.height)
  }
  await expect(page.getByRole('group', { name: 'Acceso rápido a las seis parcelas' })).toBeVisible()
  await expect(page.locator('.garden-poc-mobile-plots button')).toHaveCount(6)
  await expect(page.locator('.garden-quick-actions button')).toHaveCount(6)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
}

test('móvil: zoom, arrastre, reset, selección y Pasaporte Vivo', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await registerGround(page, '/', 'Manabí', 'ground')
  await expectReady(page)
  await sixVisible(page)
  const initial = await camera(page)
  const zoomIn = page.getByRole('button', { name: 'Acercar jardín', exact: true })
  await zoomIn.click()
  await expect.poll(async () => (await camera(page)).zoom).toBeGreaterThan(initial.zoom)
  const afterZoom = await camera(page)

  const canvas = scene(page).locator('canvas')
  const box = await canvas.boundingBox()
  expect(box).not.toBeNull()
  await page.mouse.move(box!.x + box!.width * .5, box!.y + box!.height * .52)
  await page.mouse.down()
  await page.mouse.move(box!.x + box!.width * .7, box!.y + box!.height * .52, { steps: 12 })
  await page.mouse.up()
  await expect.poll(async () => (await camera(page)).left).not.toBe(afterZoom.left)

  await page.getByRole('button', { name: 'Centrar jardín' }).click()
  await expect.poll(async () => Math.abs((await camera(page)).zoom - initial.zoom)).toBeLessThan(.001)
  await sixVisible(page)

  await page.getByRole('button', { name: 'Parcela 6: registrar planta' }).click()
  await expect(page.locator('#plant-photo')).toBeAttached()
  await page.locator('#plant-photo').setInputFiles('src/features/real-gardens/assets/en-tierra-v1.jpg')
  const species = await page.locator('#plant-species').inputValue()
  await page.getByRole('button', { name: 'Añadir a mi huerto', exact: true }).click()
  const passport = page.getByRole('dialog', { name: species, exact: true })
  await expect(passport).toBeVisible()
  await page.getByRole('button', { name: 'Cerrar Pasaporte Vivo' }).click()
  await page.getByRole('button', { name: `Parcela 6: ${species}, abrir Pasaporte Vivo` }).click()
  await expect(passport).toBeVisible()
  await page.getByRole('button', { name: 'Cerrar Pasaporte Vivo' }).click()

  await page.getByRole('navigation', { name: 'Acciones de tu jardín' }).getByRole('button', { name: 'Registrar actividad' }).click()
  await expect(page.getByRole('dialog', { name: 'Registrar actividad' })).toBeVisible()
  await page.getByRole('button', { name: 'Cerrar registro' }).click()
  await page.locator('.garden-poc').screenshot({ path: test.info().outputPath('fase2-costa-tierra-390.png') })
  expect(errors).toEqual([])
})

for (const { province, kind } of [
  { province: 'Imbabura', kind: 'vertical' },
  { province: 'Napo', kind: 'hanging' },
  { province: 'Galápagos', kind: 'pots' },
] satisfies { province: string; kind: GardenKind }[]) {
  test('móvil: seis parcelas y acciones en ' + province + ' / ' + kind, async ({ page }) => {
    await registerGround(page, '/', province, kind)
    await expectReady(page)
    await sixVisible(page)
    await page.getByRole('button', { name: 'Parcela 6: registrar planta' }).click()
    await expect(page.locator('#plant-photo')).toBeAttached()
    await page.getByRole('button', { name: 'Cerrar registro de planta' }).click()
    await page.locator('.garden-poc').screenshot({
      path: test.info().outputPath('fase2-' + province + '-' + kind + '-390.png'),
    })
  })
}

test('320 px: seis accesos, navegación y controles sin barra horizontal', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 })
  await registerGround(page, '/', 'Imbabura', 'ground')
  await expectReady(page)
  await sixVisible(page)
  const menu = page.getByRole('button', { name: 'Abrir menú de navegación' })
  await expect(menu).toBeVisible()
  await menu.click()
  await expect(page.getByRole('navigation', { name: 'Módulos principales' })).toBeVisible()
  await page.getByRole('button', { name: 'Cerrar menú de navegación' }).click()
  await expect(page.locator('.garden-poc-mobile-zoom button')).toHaveCount(3)
  await page.locator('.garden-poc').screenshot({ path: test.info().outputPath('fase2-320.png') })
})

test('tableta: conserva la interfaz sin habilitar el zoom móvil', async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1024 })
  await registerGround(page, '/', 'Manabí', 'ground')
  await expectReady(page)
  await expect(page.locator('.garden-poc-mobile-zoom')).toBeHidden()
  await expect(page.locator('.garden-poc-mobile-plots')).toBeHidden()
  const before = await camera(page)
  // Desktop/tablet uses the original fixed framing.
  expect(before.zoom).toBeGreaterThan(0)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  await navigateModule(page, 'Mi Camino Verde')
  await expect(page.getByRole('navigation', { name: 'Módulos principales' })).toBeVisible()
})

/* Cobertura completa: las 16 combinaciones deben permitir tocar la parcela P6
 * directamente en Phaser y abrir el registro fotográfico, no solo el acceso HTML. */
for (const province of ['Pichincha', 'Guayas', 'Napo', 'Galápagos'] as const) {
  for (const kind of ['ground', 'pots', 'vertical', 'hanging'] as const) {
    test(`matriz táctil: ${province} / ${kind} / P6`, async ({ page }) => {
      await registerGround(page, '/', province, kind)
      await expectReady(page)
      await sixVisible(page)
      if (kind === 'pots') {
        const framing = await camera(page)
        const centers = framing.points.map(point => (point.x - framing.left) * framing.zoom)
        // Reservar espacio para la maceta y su pedestal, no solo su ancla.
        expect(Math.min(...centers), 'Maceta izquierda con margen visible').toBeGreaterThan(44)
        expect(Math.max(...centers), 'Maceta derecha con margen visible').toBeLessThan(framing.width - 44)
      }
      await canvasSlot(page, 5, true)
      await expect(page.locator('#plant-photo')).toBeAttached()
      await page.getByRole('button', { name: 'Cerrar registro de planta' }).click()

      const obstruction = await page.evaluate(() => {
        const badge = document.querySelector<HTMLElement>('.garden-storage-status')
        const shortcuts = document.querySelector<HTMLElement>('.garden-poc-mobile-plots')
        if (!badge || !shortcuts) return false
        const a = badge.getBoundingClientRect()
        const b = shortcuts.getBoundingClientRect()
        return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top
      })
      expect(obstruction, 'Aviso de guardado no puede tapar los accesos de parcelas').toBe(false)
      const statusBounds = await page.locator('.garden-storage-status').evaluate(element => {
        const r = element.getBoundingClientRect()
        return { x: r.left, right: r.right, viewport: window.innerWidth }
      }).catch(() => null)
      if (statusBounds) {
        expect(statusBounds.x, 'Aviso visible desde el borde izquierdo').toBeGreaterThanOrEqual(0)
        expect(statusBounds.right, 'Aviso visible hasta el borde derecho').toBeLessThanOrEqual(statusBounds.viewport)
      }
    })
  }
}


test('Fase 3: encuadre del jardín en cinco tamaños, imágenes y controles accesibles', async ({ page }) => {
  const pageErrors: string[] = []
  page.on('pageerror', error => pageErrors.push(error.message))
  await registerGround(page, '/', 'Manabí', 'ground')
  await expectReady(page)
  const measurements: { width: number; resizeToReadyMs: number; canvasWidth: number; canvasHeight: number }[] = []

  for (const width of [320, 360, 390, 430, 768]) {
    const started = Date.now()
    await page.setViewportSize({ width, height: width === 768 ? 1024 : 844 })
    await expectReady(page)
    const layout = await camera(page)
    expect(layout.width).toBeGreaterThan(0)
    expect(layout.height).toBeGreaterThan(0)
    const renderer = await scene(page).locator('canvas').evaluate(canvas => ({
      intrinsicWidth: canvas.width,
      intrinsicHeight: canvas.height,
      rectWidth: canvas.getBoundingClientRect().width,
      rectHeight: canvas.getBoundingClientRect().height,
    }))
    expect(renderer.intrinsicWidth).toBeGreaterThan(0)
    expect(renderer.intrinsicHeight).toBeGreaterThan(0)
    expect(renderer.rectWidth).toBeGreaterThan(0)
    expect(renderer.rectHeight).toBeGreaterThan(0)
    const elapsed = Date.now() - started
    // A generous CI budget detects catastrophic resize stalls, not minor noise.
    expect(elapsed, `El jardín debe responder al ancho ${width}px`).toBeLessThan(30_000)
    measurements.push({ width, resizeToReadyMs: elapsed, canvasWidth: renderer.intrinsicWidth, canvasHeight: renderer.intrinsicHeight })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true)
    if (width <= 700) {
      await sixVisible(page)
      await expect(page.getByRole('button', { name: 'Acercar jardín' })).toBeVisible()
      await expect(page.locator('.garden-poc-heading p')).toHaveCSS('white-space', 'normal')
      await expect(page.locator('.garden-quick-actions button')).toHaveCount(6)
    } else {
      await expect(page.locator('.garden-poc-mobile-zoom')).toBeHidden()
    }
    await page.locator('.garden-poc').screenshot({
      path: test.info().outputPath(`fase3-viewport-${width}.png`),
      animations: 'disabled',
    })
  }
  await test.info().attach('fase3-mobile-performance.json', {
    body: Buffer.from(JSON.stringify({ measurements, pageErrors }, null, 2)),
    contentType: 'application/json',
  })
  expect(pageErrors).toEqual([])
})
