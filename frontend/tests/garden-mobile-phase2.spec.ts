import { test, expect, type Page } from './e2e'
import { registerGround, expectReady, scene } from './garden-helpers'
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
    expect(x, 'parcela visible en horizontal').toBeLessThanOrEqual(position.width)
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

  const canvas = scene(page).locator('canvas')
  const box = await canvas.boundingBox()
  expect(box).not.toBeNull()
  await page.mouse.move(box!.x + box!.width * .5, box!.y + box!.height * .52)
  await page.mouse.down()
  await page.mouse.move(box!.x + box!.width * .7, box!.y + box!.height * .52, { steps: 12 })
  await page.mouse.up()
  await expect.poll(async () => (await camera(page)).left).not.toBe(initial.left)

  await page.getByRole('button', { name: 'Centrar jardín' }).click()
  await expect.poll(async () => Math.abs((await camera(page)).zoom - initial.zoom)).toBeLessThan(.001)
  await sixVisible(page)

  await page.getByRole('button', { name: 'Parcela 6: registrar planta' }).click()
  await expect(page.locator('#plant-photo')).toBeAttached()
  await page.locator('#plant-photo').setInputFiles('src/features/real-gardens/assets/en-tierra-v1.jpg')
  await page.getByRole('button', { name: 'Añadir a mi huerto', exact: true }).click()
  const passport = page.getByRole('dialog', { name: 'Romero', exact: true })
  await expect(passport).toBeVisible()
  await page.getByRole('button', { name: 'Cerrar Pasaporte Vivo' }).click()
  await page.getByRole('button', { name: 'Parcela 6: Romero, abrir Pasaporte Vivo' }).click()
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
