import { createCommunity } from './community-helpers'
import { test, expect, type Page } from './e2e'

// Vite can spend over 25 seconds compiling the existing app on a cold start.
test.setTimeout(60_000)

const KINDS = ['ground', 'pots', 'vertical', 'hanging'] as const
const REGIONS = { sierra: 'Imbabura', costa: 'Manabí', oriente: 'Napo', galapagos: 'Galápagos' }
const BACKGROUNDS = { sierra: 'fondo_comunidad_sierra.webp', costa: 'fondo_comunidad_costa.webp', oriente: 'fondo_comunidad_oriente.webp', galapagos: 'fondo_comunidad_galapagos.webp' }
const browserErrors = new WeakMap<Page, string[]>()

const navigation = (page: Page) => page.getByRole('navigation', { name: 'Navegación principal' })
const actions = (page: Page) => page.getByRole('navigation', { name: 'Acciones de tu jardín' })

async function waitForLandscape(page: Page) {
  const landscape = page.locator('.garden-region-layer.is-active')
  await landscape.evaluate(element => (element as HTMLImageElement).decode())
  await expect(landscape).toHaveCSS('opacity', '1')
}

async function enterDemo(page: Page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: 'Descubrir Kawsapacha' }).click()
  await waitForLandscape(page)
}

async function chooseKind(page: Page, kind: typeof KINDS[number]) {
  await page.locator(`.rg-type-option:has(input[value="${kind}"])`).click()
  if (kind === 'ground') {
    if (!(await page.getByLabel('Tipo de suelo').isVisible())) await page.locator('.rg-more-characteristics summary').click()
    await page.getByLabel('Tipo de suelo').selectOption('unknown')
  }
}

async function registerGarden(page: Page, kind: typeof KINDS[number], province: string) {
  await createCommunity(page)
  await navigation(page).getByRole('button', { name: 'Mi jardín', exact: true }).click()
  await page.getByRole('button', { name: 'Registrar mi huerto', exact: true }).click()
  await page.locator('#rg-province').selectOption(province)
  await page.getByLabel('Nombre del huerto').fill('Huerto de prueba')
  await page.getByLabel('Superficie aproximada').fill('25')
  await chooseKind(page, kind)
  if (!(await page.getByLabel('Agua de riego').isVisible())) await page.locator('.rg-more-characteristics summary').click()
  await page.getByLabel('Agua de riego').selectOption('unknown')
  await page.getByRole('button', { name: 'Guardar mi huerto', exact: true }).click()
  await page.getByRole('button', { name: 'Conectar con Mi Jardín' }).click()
  await expect(page.locator('.my-garden-page')).toHaveAttribute('data-garden-kind', kind)
  await waitForLandscape(page)
}

async function assertSceneFits(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  const buttons = page.locator('.garden-parcels button')
  await expect(buttons).toHaveCount(6)
  const boxes = await buttons.evaluateAll(elements => elements.map(element => {
    const box = element.getBoundingClientRect()
    return { left: box.left, right: box.right, top: box.top, bottom: box.bottom, width: box.width, height: box.height }
  }))
  for (let i = 0; i < boxes.length; i++) {
    expect(boxes[i].width).toBeGreaterThanOrEqual(44)
    expect(boxes[i].height).toBeGreaterThanOrEqual(44)
    for (let j = i + 1; j < boxes.length; j++) {
      expect(Math.min(boxes[i].right, boxes[j].right) - Math.max(boxes[i].left, boxes[j].left) > 1 &&
        Math.min(boxes[i].bottom, boxes[j].bottom) - Math.max(boxes[i].top, boxes[j].top) > 1).toBe(false)
    }
  }
  const scene = await page.locator('.garden-scene').boundingBox()
  const challenges = await page.locator('.garden-challenges').boundingBox()
  if (!scene || !challenges) throw new Error('Falta el escenario o Retos verdes')
  expect(Math.min(scene.x + scene.width, challenges.x + challenges.width) - Math.max(scene.x, challenges.x) > 1 &&
    Math.min(scene.y + scene.height, challenges.y + challenges.height) - Math.max(scene.y, challenges.y) > 1).toBe(false)
}

async function assertGrounding(page: Page, kind: typeof KINDS[number]) {
  const stage = page.locator('.garden-stage')
  expect(await stage.evaluate(element => getComputedStyle(element, '::after').content)).toBe('none')
  // Wait for actual transparent illustrations, not only the landscape behind them.
  await stage.locator('[data-garden-art]').evaluateAll(async elements => {
    const sources = new Set(elements.map(element => element.getAttribute('src') ?? element.getAttribute('href')!))
    await Promise.all([...sources].map(async src => { const image = new Image(); image.src = src; await image.decode() }))
  })
  if (kind === 'ground') {
    await expect(stage.locator('.garden-earth-surface')).toHaveCount(1)
    await expect(stage.locator('.garden-container, .garden-hanging-frame, .garden-vertical-structure')).toHaveCount(0)
    await expect(stage.locator('[data-garden-art=ground]')).toHaveAttribute('href', /terreno-v3/)
    const earth = await stage.locator('.garden-earth-surface').boundingBox()
    if (!earth) throw new Error('Falta el terreno continuo')
    for (const marker of await stage.locator('.garden-parcel-plus').all()) {
      const box = await marker.boundingBox()
      if (!box) throw new Error('Falta un punto de siembra')
      expect(box.x).toBeGreaterThan(earth.x)
      expect(box.x + box.width).toBeLessThan(earth.x + earth.width)
      expect(box.y).toBeGreaterThan(earth.y)
      expect(box.y + box.height).toBeLessThan(earth.y + earth.height)
    }
  } else if (kind === 'pots') {
    await expect(stage.locator('.garden-container')).toHaveCount(6)
    const variants = await stage.locator('.garden-container').evaluateAll(elements => elements.map(element => element.getAttribute('data-vessel')))
    expect(new Set(variants).size).toBe(6)
    for (const slot of await stage.locator('.garden-parcel').all()) {
      const shadow = await slot.locator('.garden-container-contact').boundingBox()
      const marker = await slot.locator('.garden-parcel-plus').boundingBox()
      const label = await slot.locator('.garden-parcel-label').boundingBox()
      const button = await slot.boundingBox()
      if (!shadow || !marker || !label || !button) throw new Error('Falta el recipiente, punto o apoyo')
      expect(marker.y + marker.height / 2).toBeLessThan(shadow.y)
      expect(shadow.y + shadow.height).toBeLessThan(button.y + button.height)
      expect(label.y).toBeGreaterThan(shadow.y)
    }
  } else {
    // Mouth centres measured in the source artwork, independent of CSS placement.
    const points = kind === 'vertical'
      ? [[.323, .314], [.684, .314], [.323, .493], [.684, .493], [.323, .68], [.684, .68]]
      : [[.298, .416], [.501, .416], [.71, .416], [.298, .768], [.501, .768], [.71, .768]]
    await expect(stage.locator(kind === 'vertical' ? '.garden-vertical-structure' : '.garden-hanging-frame')).toHaveCount(1)
    await expect(stage.locator('.garden-container')).toHaveCount(0)
    await expect(stage.locator('.garden-frame-contact')).toHaveCount(kind === 'vertical' ? 2 : 4)
    const art = await stage.locator('.garden-structure-art').boundingBox()
    if (!art) throw new Error('Falta la estructura con sus seis recipientes')
    const markers = await stage.locator('.garden-parcel-plus').all()
    for (const [index, marker] of markers.entries()) {
      const box = await marker.boundingBox()
      if (!box) throw new Error('Falta un punto interactivo')
      expect(Math.abs(box.x + box.width / 2 - (art.x + points[index][0] * art.width))).toBeLessThan(art.width * .025)
      expect(Math.abs(box.y + box.height / 2 - (art.y + points[index][1] * art.height))).toBeLessThan(art.height * .025)
    }
    for (const contact of await stage.locator('.garden-frame-contact').all()) {
      const box = await contact.boundingBox()
      if (!box) throw new Error('Falta una sombra de apoyo')
      expect(box.y).toBeGreaterThan(art.y + art.height * .84)
      expect(box.y + box.height).toBeLessThan(art.y + art.height * 1.03)
    }
  }
}

test.beforeEach(async ({ page }) => {
  const errors: string[] = []
  browserErrors.set(page, errors)
  page.on('pageerror', error => errors.push(error.message))
  await page.addInitScript(() => {
    navigator.geolocation.getCurrentPosition = () => { throw new Error('No se debe solicitar ubicación del dispositivo') }
    navigator.geolocation.watchPosition = () => { throw new Error('No se debe solicitar ubicación del dispositivo') }
  })
})

test.afterEach(async ({ page }) => { expect(browserErrors.get(page)).toEqual([]) })

test('bienvenida sin registros: paisaje, Retos verdes y acceso al huerto real', async ({ page }) => {
  await enterDemo(page)
  await expect(page.getByRole('heading', { name: /Tu jardín comienza/ })).toBeVisible()
  await expect(page.locator('.garden-parcels')).toHaveCount(0)
  await expect(page.locator('.garden-parcel-photo')).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Retos verdes' })).toBeVisible()
  await expect(actions(page).getByRole('button')).toHaveCount(4)
  await page.screenshot({ path: test.info().outputPath('bienvenida-mi-jardin.png'), fullPage: true })
  await page.getByRole('button', { name: 'Registrar mi huerto', exact: true }).click()
  await expect(page.getByRole('form', { name: 'Registrar mi huerto', exact: true })).toBeVisible()
})

for (const kind of KINDS) {
  for (const [region, province] of Object.entries(REGIONS)) {
    test(`escenario ${kind} ${region}: seis espacios, fondo y registro`, async ({ page }) => {
      await enterDemo(page)
      await registerGarden(page, kind, province)
      await expect(page.locator('.my-garden-page')).toHaveAttribute('data-region', region)
      await expect(page.locator('.garden-region-layer.is-active')).toHaveAttribute('src', new RegExp(BACKGROUNDS[region as keyof typeof BACKGROUNDS]))
      await expect(page.locator('.garden-regional-details')).toHaveAttribute('data-decoration', region)
      await expect(page.locator('.garden-stage')).toHaveAttribute('data-kind', kind)
      await expect(page.locator('.garden-parcel-photo')).toHaveCount(0)
      await expect(page.locator('.garden-territory')).toContainText(province)
      await assertSceneFits(page)
      await assertGrounding(page, kind)
      await page.locator('.garden-region-layer.is-active').evaluate(image => (image as HTMLImageElement).decode())
      await expect(page.locator('.garden-region-layer.is-active')).toHaveCSS('opacity', '1')
      await page.screenshot({ path: test.info().outputPath(`${kind}-${region}.png`), fullPage: true })
      await page.locator('.garden-parcels button').nth(5).click()
      await expect(page.getByRole('heading', { name: 'Registrar planta', exact: true })).toBeVisible()
      await expect(page.getByLabel('Posición de cultivo')).toHaveValue('5')
      await page.getByRole('button', { name: 'Cerrar registro de planta' }).click()
      await expect(page.locator('.garden-parcels button').nth(5)).toHaveClass(/is-selected/)
      await expect(page.locator('.my-garden-page')).toHaveAttribute('data-region', region)
    })
  }
}

test('fotografía y Pasaporte Vivo se conservan al cambiar tipo y región', async ({ page }) => {
  await enterDemo(page)
  await registerGarden(page, 'ground', REGIONS.sierra)
  await navigation(page).getByRole('button', { name: 'Comunidad', exact: true }).click()
  await expect(page.locator('.community-overview')).toContainText('Comunidad de prueba')
  await navigation(page).getByRole('button', { name: 'Mi jardín', exact: true }).click()
  await page.locator('.garden-parcels button').nth(5).click()
  await page.locator('#plant-photo').setInputFiles('src/features/real-gardens/assets/en-tierra-v1.jpg')
  await page.getByRole('button', { name: 'Añadir a mi huerto' }).click()
  await expect(page.getByRole('dialog', { name: 'Romero' })).toBeVisible()
  const photo = await page.locator('.garden-passport-photo').getAttribute('src')
  await expect(page.getByRole('dialog')).toContainText('Parcela 6')
  await page.getByRole('button', { name: 'Cerrar Pasaporte Vivo' }).click()
  await navigation(page).getByRole('button', { name: 'Mi jardín', exact: true }).click()
  for (const [index, kind] of KINDS.entries()) {
    await actions(page).getByRole('button', { name: 'Mi huerto real', exact: true }).click()
    await page.getByRole('button', { name: 'Editar mi huerto', exact: true }).click()
    await page.locator('#rg-province').selectOption(Object.values(REGIONS)[index])
    await chooseKind(page, kind)
    await page.getByRole('button', { name: 'Guardar cambios', exact: true }).click()
    await page.getByRole('button', { name: 'Conectar con Mi Jardín' }).click()
    await expect(page.locator('.garden-parcel.is-occupied')).toHaveCount(1)
    await expect(page.locator('.garden-parcels button').nth(5)).toHaveAttribute('aria-label', /Romero.*Pasaporte Vivo/)
    await expect(page.locator('.garden-parcel-photo img')).toHaveAttribute('src', photo!)
    await page.locator('.garden-parcels button').nth(5).click()
    await expect(page.getByRole('dialog', { name: 'Romero' })).toBeVisible()
    await expect(page.locator('.garden-passport-photo')).toHaveAttribute('src', photo!)
    await page.getByRole('button', { name: 'Cerrar Pasaporte Vivo' }).click()
  }
  await actions(page).getByRole('button', { name: 'Pasaporte Vivo', exact: true }).click()
  await expect(page.getByRole('dialog', { name: 'Romero' })).toBeVisible()
  await page.getByRole('button', { name: 'Cerrar Pasaporte Vivo' }).click()
  await actions(page).getByRole('button', { name: 'Bitácora', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Bitácora de cultivo', exact: true })).toBeVisible()
  await expect(page.locator('.garden-history-events')).toContainText('Romero')
})

test('barra colorida: contraste, foco, cuatro acciones y Retos verdes', async ({ page }) => {
  await enterDemo(page)
  await registerGarden(page, 'pots', REGIONS.costa)
  const backgrounds = await actions(page).getByRole('button').evaluateAll(buttons => buttons.map(button => getComputedStyle(button).backgroundImage))
  expect(new Set(backgrounds).size).toBe(4)
  const ratios = await actions(page).getByRole('button').evaluateAll(buttons => buttons.map(button => {
    const style = getComputedStyle(button)
    const luminance = (rgb: number[]) => rgb.map(value => value / 255).map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4).reduce((sum, value, index) => sum + value * [.2126, .7152, .0722][index], 0)
    const ink = luminance(style.color.match(/[\d.]+/g)!.slice(0, 3).map(Number))
    return Math.min(...[...style.backgroundImage.matchAll(/rgb\(([^)]+)\)/g)].map(match => {
      const background = luminance(match[1].split(',').map(Number))
      return (Math.max(ink, background) + .05) / (Math.min(ink, background) + .05)
    }))
  }))
  for (const ratio of ratios) { expect(Number.isFinite(ratio)).toBe(true); expect(ratio).toBeGreaterThanOrEqual(4.5) }
  const register = actions(page).getByRole('button', { name: 'Registrar planta', exact: true })
  await register.focus()
  await page.keyboard.press('Tab')
  await page.keyboard.press('Shift+Tab')
  await expect(register).toBeFocused()
  await expect(register).toHaveCSS('outline-style', 'solid')
  await register.press('Enter')
  await expect(page.getByRole('heading', { name: 'Registrar planta', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Cerrar registro de planta' }).click()
  await navigation(page).getByRole('button', { name: 'Mi jardín', exact: true }).click()
  await actions(page).getByRole('button', { name: 'Bitácora', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Mi historia', exact: true })).toBeVisible()
  await navigation(page).getByRole('button', { name: 'Mi jardín', exact: true }).click()
  await actions(page).getByRole('button', { name: 'Mi huerto real', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Mi huerto registrado', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Conectar con Mi Jardín' }).click()
  await actions(page).getByRole('button', { name: 'Pasaporte Vivo', exact: true }).click()
  await expect(page.getByText('Tu Pasaporte Vivo comienza con una fotografía.', { exact: false })).toBeVisible()
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click()
  await navigation(page).getByRole('button', { name: 'Mi jardín', exact: true }).click()
  await page.getByRole('button', { name: /Nuestra primera comunidad/ }).click()
  await expect(page.locator('.communities-page')).toBeVisible()
})

for (const [width, columns] of [[1440, 2], [390, 2]]) {
  test(`teclado de seis espacios: ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 940 })
    await enterDemo(page)
    await registerGarden(page, 'vertical', REGIONS.oriente)
    const buttons = page.locator('.garden-parcels button')
    await buttons.nth(0).focus()
    await page.keyboard.press('ArrowDown')
    await expect(buttons.nth(columns)).toBeFocused()
    await page.keyboard.press('ArrowRight')
    await expect(buttons.nth(columns + 1)).toBeFocused()
    await page.keyboard.press('Home')
    await expect(buttons.nth(0)).toBeFocused()
    await page.keyboard.press('End')
    await expect(buttons.nth(5)).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page.getByLabel('Posición de cultivo')).toHaveValue('5')
  })
}

for (const width of [320, 390, 768, 1024, 1366, 1672]) {
  test(`responsive al 100 %: ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 940 })
    await enterDemo(page)
    await registerGarden(page, 'hanging', REGIONS.galapagos)
    await assertSceneFits(page)
    await assertGrounding(page, 'hanging')
    await page.screenshot({ path: test.info().outputPath(`jardin-${width}.png`), fullPage: true })
  })
}

test('preferencia sin movimiento y persistencia temporal al navegar', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await enterDemo(page)
  await registerGarden(page, 'hanging', REGIONS.galapagos)
  await expect(page.locator('.garden-region-layer.is-active')).toHaveCSS('transition-duration', '0s')
  const action = actions(page).getByRole('button', { name: 'Registrar planta', exact: true })
  await action.hover()
  await expect(action).toHaveCSS('transform', 'none')
  await navigation(page).getByRole('button', { name: 'Comunidad', exact: true }).click()
  await navigation(page).getByRole('button', { name: 'Mi jardín', exact: true }).click()
  await expect(page.locator('.my-garden-page')).toHaveAttribute('data-garden-kind', 'hanging')
  await expect(page.locator('.my-garden-page')).toHaveAttribute('data-region', 'galapagos')
  await page.reload()
  await page.getByRole('button', { name: 'Descubrir Kawsapacha' }).click()
  await expect(page.locator('.garden-start')).toBeVisible()
})

test.describe('toque', () => {
  test.use({ hasTouch: true, viewport: { width: 390, height: 844 } })
  test('un macetero suspendido abre el registro de su espacio', async ({ page }) => {
    await enterDemo(page)
    await registerGarden(page, 'hanging', REGIONS.sierra)
    await page.locator('.garden-parcels button').nth(1).tap()
    await expect(page.getByLabel('Posición de cultivo')).toHaveValue('1')
  })
})

for (const kind of ['ground', 'pots', 'vertical'] as const) {
  test(`responsive de ${kind}: 390px`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await enterDemo(page)
    await registerGarden(page, kind, REGIONS.oriente)
    await assertSceneFits(page)
    await assertGrounding(page, kind)
    await page.screenshot({ path: test.info().outputPath(`${kind}-390.png`), fullPage: true })
    await page.locator('.garden-parcels button').nth(5).click()
    await expect(page.getByLabel('Posición de cultivo')).toHaveValue('5')
  })
}
