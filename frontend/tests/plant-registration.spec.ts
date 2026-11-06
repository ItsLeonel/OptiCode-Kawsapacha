import { test, expect, type Page } from '@playwright/test'

test.setTimeout(60_000)
test.use({ launchOptions: { args: ['--use-fake-device-for-media-stream'] } })

const PHOTO = 'src/features/real-gardens/assets/en-tierra-v1.jpg'
const navigation = (page: Page) => page.getByRole('navigation', { name: 'Navegación principal' })
const actions = (page: Page) => page.getByRole('navigation', { name: 'Acciones de tu jardín' })
const registration = (page: Page) => page.getByRole('dialog', { name: 'Registrar planta', exact: true })
const browserErrors = new WeakMap<Page, string[]>()

declare global {
  interface Window {
    cameraAudit: { calls: number; tracks: MediaStreamTrack[] }
    releaseCameraPermission?: () => Promise<void>
    photoUrls: { created: string[]; revoked: string[] }
  }
}

test.beforeEach(async ({ page }) => {
  const errors: string[] = []
  browserErrors.set(page, errors)
  page.on('pageerror', error => errors.push(error.message))
  await page.addInitScript(() => {
    window.cameraAudit = { calls: 0, tracks: [] }
    window.photoUrls = { created: [], revoked: [] }
    const create = URL.createObjectURL.bind(URL)
    const revoke = URL.revokeObjectURL.bind(URL)
    URL.createObjectURL = object => { const url = create(object); window.photoUrls.created.push(url); return url }
    URL.revokeObjectURL = url => { window.photoUrls.revoked.push(url); revoke(url) }
    if (navigator.mediaDevices?.getUserMedia) {
      const original = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices)
      navigator.mediaDevices.getUserMedia = async constraints => {
        window.cameraAudit.calls++
        const stream = await original(constraints)
        window.cameraAudit.tracks.push(...stream.getTracks())
        return stream
      }
    }
  })
})

test.afterEach(async ({ page }) => { expect(browserErrors.get(page)).toEqual([]) })

async function enterDemo(page: Page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: 'Descubrir Kawsapacha' }).click()
}

async function createGarden(page: Page, withCommunity = true) {
  await enterDemo(page)
  if (withCommunity) {
    await navigation(page).getByRole('button', { name: 'Comunidad', exact: true }).click()
    await page.getByRole('button', { name: 'Crear mi comunidad', exact: true }).click()
    await page.getByLabel('Nombre de la comunidad').fill('Comunidad de prueba')
    await page.getByRole('button', { name: 'Crear comunidad', exact: true }).click()
  }
  await navigation(page).getByRole('button', { name: 'Mi Huerto', exact: true }).click()
  await page.locator('#rg-province').selectOption('Imbabura')
  await page.getByLabel('Nombre del huerto').fill('Huerto de prueba')
  await page.getByLabel('Superficie aproximada').fill('25')
  await page.locator('.rg-type-option:has(input[value="vertical"])').click()
  await page.locator('.rg-more-characteristics summary').click()
  await page.getByLabel('Agua de riego').selectOption('unknown')
  await page.getByRole('button', { name: 'Guardar mi huerto', exact: true }).click()
  await page.getByRole('button', { name: 'Conectar con Mi Jardín' }).click()
}

async function openRegistration(page: Page) {
  await actions(page).getByRole('button', { name: 'Registrar planta', exact: true }).click()
  await expect(registration(page)).toBeVisible()
}

async function expectStopped(page: Page) {
  await expect.poll(() => page.evaluate(() => window.cameraAudit.tracks.every(track => track.readyState === 'ended'))).toBe(true)
}

test('galería sin comunidad: especie, posición, siembra, jardín y Pasaporte conservan la misma fotografía', async ({ page }) => {
  await createGarden(page, false)
  await page.locator('.garden-parcels button').nth(2).click()
  await expect(page.getByLabel('Posición de cultivo')).toHaveValue('2')
  await expect(page.getByRole('button', { name: 'Recientes', exact: true })).toHaveCount(0)
  await expect(page.getByLabel('Fecha de siembra')).toHaveValue('')
  await page.locator('#plant-photo').setInputFiles(PHOTO)
  await expect(page.getByAltText('Vista previa de tu planta', { exact: true })).toBeVisible()
  await page.getByLabel('Especie medicinal').selectOption('Manzanilla')
  await page.getByLabel('Posición de cultivo').selectOption('4')
  await page.getByLabel('Fecha de siembra').fill('2026-10-12')
  expect(await page.evaluate(() => window.cameraAudit.calls)).toBe(0)
  await page.screenshot({ path: test.info().outputPath('registro-escritorio.png') })
  await page.getByRole('button', { name: 'Añadir a mi huerto' }).click()
  const passport = page.getByRole('dialog', { name: 'Manzanilla', exact: true })
  await expect(passport).toBeVisible()
  await expect(registration(page)).toHaveCount(0)
  await expect(passport).toContainText('Parcela 5')
  await expect(passport).toContainText('Matricaria chamomilla')
  await expect(passport).toContainText('Fecha de siembra')
  await expect(passport).toContainText(/12\/10\/2026/)
  const photo = await page.locator('.garden-passport-photo').getAttribute('src')
  expect(await page.evaluate(url => window.photoUrls.revoked.includes(url!), photo)).toBe(false)
  await page.getByRole('button', { name: 'Cerrar Pasaporte Vivo' }).click()
  await expect(page.locator('.garden-parcel-photo img')).toHaveAttribute('src', photo!)
  await expect(page.locator('.garden-parcels button').nth(4)).toHaveAttribute('aria-label', /Manzanilla/)
  await openRegistration(page)
  await expect(page.getByLabel('Posición de cultivo').locator('option[value="4"]')).toHaveJSProperty('disabled', true)
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click()
  await actions(page).getByRole('button', { name: 'Bitácora', exact: true }).click()
  await page.getByRole('button', { name: /Abrir Pasaporte Vivo/ }).click()
  await expect(passport).toBeVisible()
  await expect(page.locator('.garden-passport-photo')).toHaveAttribute('src', photo!)
})

test('sin comunidad y sin crypto.randomUUID: registra la fotografía y permite abrir su Pasaporte', async ({ page }) => {
  await createGarden(page, false)
  // This API can be unavailable outside secure contexts, while Gallery still works.
  await page.evaluate(() => Object.defineProperty(crypto, 'randomUUID', { value: undefined, configurable: true }))
  await page.locator('.garden-parcels button').nth(1).click()
  await page.locator('#plant-photo').setInputFiles(PHOTO)
  await page.getByLabel('Especie medicinal').selectOption('Toronjil')
  await page.getByLabel('Fecha de siembra').fill('2026-10-20')
  await expect(page.getByRole('button', { name: 'Añadir a mi huerto' })).toBeEnabled()
  await page.getByRole('button', { name: 'Añadir a mi huerto' }).click()
  await expect(registration(page)).toHaveCount(0)
  const passport = page.getByRole('dialog', { name: 'Toronjil', exact: true })
  await expect(passport).toBeVisible()
  await expect(passport).toContainText('Parcela 2')
  await expect(passport).toContainText('Melissa officinalis')
  await expect(passport).toContainText('20/10/2026')
  const photo = await page.locator('.garden-passport-photo').getAttribute('src')
  await page.getByRole('button', { name: 'Cerrar Pasaporte Vivo' }).click()
  const slot = page.locator('.garden-parcels button').nth(1)
  await expect(slot).toHaveAttribute('aria-label', /Toronjil.*Pasaporte Vivo/)
  await expect(slot.locator('img')).toHaveAttribute('src', photo!)
  expect(await slot.locator('img').evaluate(image => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0)
  await slot.click()
  await expect(passport).toBeVisible()
  await expect(page.locator('.garden-passport-photo')).toHaveAttribute('src', photo!)
})

test('un fallo al guardar muestra un aviso y conserva la fotografía para reintentar sin comunidad', async ({ page }) => {
  await createGarden(page, false)
  await openRegistration(page)
  await page.locator('#plant-photo').setInputFiles(PHOTO)
  await page.getByLabel('Especie medicinal').selectOption('Hierbabuena')
  await page.getByLabel('Posición de cultivo').selectOption('3')
  await expect(page.getByRole('button', { name: 'Añadir a mi huerto' })).toBeEnabled()
  const preview = await page.getByAltText('Vista previa de tu planta', { exact: true }).getAttribute('src')
  await page.evaluate(() => {
    const original = URL.createObjectURL
    let failOnce = true
    URL.createObjectURL = object => {
      if (failOnce) { failOnce = false; throw new Error('Prueba de fallo al conservar la fotografía') }
      return original(object)
    }
  })
  await page.getByRole('button', { name: 'Añadir a mi huerto' }).click()
  await expect(page.getByRole('alert')).toHaveText('No se pudo registrar tu planta. Tu fotografía sigue disponible; vuelve a intentarlo.')
  await expect(registration(page)).toBeVisible()
  await expect(page.getByAltText('Vista previa de tu planta', { exact: true })).toHaveAttribute('src', preview!)
  await expect(page.getByLabel('Especie medicinal')).toHaveValue('Hierbabuena')
  await expect(page.getByLabel('Posición de cultivo')).toHaveValue('3')
  await expect(page.locator('.garden-parcel-photo')).toHaveCount(0)
  await page.getByRole('button', { name: 'Añadir a mi huerto' }).click()
  await expect(registration(page)).toHaveCount(0)
  await expect(page.getByRole('dialog', { name: 'Hierbabuena', exact: true })).toBeVisible()
  await expect(page.getByRole('dialog', { name: 'Hierbabuena', exact: true })).not.toContainText('Fecha de siembra')
  await page.getByRole('button', { name: 'Cerrar Pasaporte Vivo' }).click()
  await expect(page.locator('.garden-parcel.is-occupied')).toHaveCount(1)
  await expect(page.locator('.garden-parcels button').nth(3)).toHaveAttribute('aria-label', /Hierbabuena.*Pasaporte Vivo/)
})

test('archivos inválidos y cancelación: no guardan plantas ni conservan vistas previas', async ({ page }) => {
  await createGarden(page)
  await openRegistration(page)
  const submit = page.getByRole('button', { name: 'Añadir a mi huerto' })
  await page.locator('#plant-photo').setInputFiles({ name: 'notas.txt', mimeType: 'text/plain', buffer: Buffer.from('sin imagen') })
  await expect(page.getByRole('alert')).toContainText('JPG, PNG o WebP')
  await expect(submit).toBeDisabled()
  await page.locator('#plant-photo').setInputFiles({ name: 'grande.jpg', mimeType: 'image/jpeg', buffer: Buffer.alloc(3 * 1024 * 1024 + 1) })
  await expect(page.getByRole('alert')).toContainText('hasta 3 MB')
  await page.locator('#plant-photo').setInputFiles({ name: 'rota.jpg', mimeType: 'image/jpeg', buffer: Buffer.from('no es un JPEG') })
  await expect(page.getByRole('alert')).toContainText('No se puede leer')
  await page.locator('#plant-photo').setInputFiles(PHOTO)
  await expect(submit).toBeEnabled()
  const preview = await page.getByAltText('Vista previa de tu planta', { exact: true }).getAttribute('src')
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click()
  await expect.poll(() => page.evaluate(url => window.photoUrls.revoked.includes(url!), preview)).toBe(true)
  await expect(page.locator('.garden-parcel-photo')).toHaveCount(0)
  await expect(actions(page).getByRole('button', { name: 'Registrar planta', exact: true })).toBeFocused()
  await openRegistration(page)
  await expect(page.getByRole('button', { name: 'Añadir a mi huerto' })).toBeDisabled()
  await page.keyboard.press('Escape')
  await expect(registration(page)).toHaveCount(0)
})

test('catálogo conserva la especie elegida y el registro incompleto tiene salida accesible', async ({ page }) => {
  await enterDemo(page)
  await navigation(page).getByRole('button', { name: 'Descubrir plantas', exact: true }).click()
  await page.locator('.species-card').filter({ hasText: 'Lavanda' }).getByRole('button').click()
  await expect(page.getByLabel('Especie medicinal')).toHaveValue('Lavanda')
  await expect(page.getByRole('button', { name: 'Añadir a mi huerto' })).toBeDisabled()
  await expect(registration(page).getByText('Primero registra tu huerto.', { exact: false })).toBeVisible()
  await page.getByRole('button', { name: 'Ir a Mi Huerto', exact: true }).click()
  await expect(registration(page)).toHaveCount(0)
  await expect(page.getByRole('form', { name: 'Registrar mi huerto', exact: true })).toBeVisible()
})

for (const withCommunity of [false, true]) {
  test(`sin huerto, comunidad ${withCommunity ? 'registrada' : 'ausente'}: bloquea guardar y dirige a Mi Huerto`, async ({ page }) => {
    await enterDemo(page)
    if (withCommunity) {
      await navigation(page).getByRole('button', { name: 'Comunidad', exact: true }).click()
      await page.getByRole('button', { name: 'Crear mi comunidad', exact: true }).click()
      await page.getByLabel('Nombre de la comunidad').fill('Comunidad de prueba')
      await page.getByRole('button', { name: 'Crear comunidad', exact: true }).click()
      await navigation(page).getByRole('button', { name: 'Mi jardín', exact: true }).click()
    }
    await openRegistration(page)
    await expect(registration(page).getByText('Primero registra tu huerto.', { exact: false })).toBeVisible()
    await expect(registration(page)).toContainText('La comunidad es opcional.')
    await page.locator('#plant-photo').setInputFiles(PHOTO)
    await expect(page.getByAltText('Vista previa de tu planta', { exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Añadir a mi huerto' })).toBeDisabled()
    // Check the submit validation too, even if submission bypasses the disabled button.
    await registration(page).locator('form').evaluate(form => form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })))
    await expect(page.getByRole('alert')).toHaveText('Primero registra tu huerto')
    await expect(page.locator('.garden-parcel-photo')).toHaveCount(0)
    await page.getByRole('button', { name: 'Ir a Mi Huerto', exact: true }).click()
    await expect(registration(page)).toHaveCount(0)
    await expect(page.getByRole('form', { name: 'Registrar mi huerto', exact: true })).toBeVisible()
  })
}

test('los seis espacios pueden registrarse sin fecha y nunca se reemplaza uno ocupado', async ({ page }) => {
  await createGarden(page)
  for (let plot = 0; plot < 6; plot++) {
    await openRegistration(page)
    await expect(page.getByLabel('Posición de cultivo')).toHaveValue(String(plot))
    await page.locator('#plant-photo').setInputFiles(PHOTO)
    await page.getByRole('button', { name: 'Añadir a mi huerto' }).click()
    await expect(page.getByRole('dialog', { name: 'Romero', exact: true })).not.toContainText('Fecha de siembra')
    await page.getByRole('button', { name: 'Cerrar Pasaporte Vivo' }).click()
  }
  await expect(page.locator('.garden-parcel.is-occupied')).toHaveCount(6)
  await openRegistration(page)
  await expect(page.getByText('Los seis espacios están ocupados.', { exact: false })).toBeVisible()
  await expect(page.getByLabel('Posición de cultivo')).toBeDisabled()
  await expect(page.getByRole('button', { name: 'Añadir a mi huerto' })).toBeDisabled()
})

test.describe('captura del navegador con dispositivo de vídeo de prueba', () => {
  test.use({ permissions: ['camera'] })

  test('captura JPEG sin comunidad: libera cámara y registra la foto', async ({ page }) => {
    await createGarden(page, false)
    await openRegistration(page)
    expect(await page.evaluate(() => window.cameraAudit.calls)).toBe(0)
    await page.getByRole('button', { name: 'Cámara', exact: true }).click()
    const capture = page.getByRole('button', { name: 'Tomar fotografía' })
    await expect(capture).toBeEnabled()
    await expect.poll(() => page.evaluate(() => window.cameraAudit.tracks.filter(track => track.readyState === 'live').length)).toBe(1)
    await expect(page.locator('.plant-viewfinder video')).toHaveJSProperty('muted', true)
    await capture.click()
    await expectStopped(page)
    await expect(page.getByAltText('Vista previa de tu planta', { exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Añadir a mi huerto' }).click()
    await expect(page.getByRole('dialog', { name: 'Romero', exact: true })).toBeVisible()
    const photo = await page.locator('.garden-passport-photo').getAttribute('src')
    const info = await page.evaluate(async url => { const blob = await (await fetch(url!)).blob(); return { type: blob.type, size: blob.size } }, photo)
    expect(info.type).toBe('image/jpeg')
    expect(info.size).toBeGreaterThan(100)
    expect(info.size).toBeLessThanOrEqual(3 * 1024 * 1024)
    await expectStopped(page)
  })

  test('cerrar, cancelar, Escape, Galería y desconexión liberan cada flujo', async ({ page }) => {
    await enterDemo(page)
    for (const close of ['close', 'cancel', 'escape', 'gallery', 'disconnect'] as const) {
      await openRegistration(page)
      await page.getByRole('button', { name: 'Cámara', exact: true }).click()
      await expect(page.getByRole('button', { name: 'Tomar fotografía' })).toBeEnabled()
      if (close === 'close') await page.getByRole('button', { name: 'Cerrar registro de planta' }).click()
      if (close === 'cancel') await page.getByRole('button', { name: 'Cancelar', exact: true }).click()
      if (close === 'escape') await page.keyboard.press('Escape')
      if (close === 'gallery') {
        const chooser = page.waitForEvent('filechooser')
        await page.getByRole('button', { name: 'Galería', exact: true }).click()
        await (await chooser).setFiles(PHOTO)
      }
      if (close === 'disconnect') {
        await page.evaluate(() => window.cameraAudit.tracks.at(-1)?.dispatchEvent(new Event('ended')))
        await expect(page.getByRole('alert')).toContainText('desconectó')
      }
      await expectStopped(page)
      if (close === 'gallery' || close === 'disconnect') await page.keyboard.press('Escape')
    }
    expect(await page.evaluate(() => window.cameraAudit.calls)).toBe(5)
  })

  test('permiso que llega después del cierre también libera la cámara', async ({ page }) => {
    await enterDemo(page)
    await page.evaluate(() => {
      const original = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices)
      navigator.mediaDevices.getUserMedia = constraints => new Promise(resolve => {
        window.releaseCameraPermission = async () => resolve(await original(constraints))
      })
    })
    await openRegistration(page)
    await page.getByRole('button', { name: 'Cámara', exact: true }).click()
    await expect(page.getByText('Esperando permiso de cámara…')).toBeVisible()
    await page.keyboard.press('Escape')
    await page.evaluate(() => window.releaseCameraPermission?.())
    await expect.poll(() => page.evaluate(() => window.cameraAudit.tracks.length)).toBe(1)
    await expectStopped(page)
    await expect(registration(page)).toHaveCount(0)
  })

  test('un error al capturar deja reintentar y cierra el flujo al salir', async ({ page }) => {
    await enterDemo(page)
    await page.evaluate(() => { HTMLCanvasElement.prototype.toBlob = callback => callback(null) })
    await openRegistration(page)
    await page.getByRole('button', { name: 'Cámara', exact: true }).click()
    await page.getByRole('button', { name: 'Tomar fotografía' }).click()
    await expect(page.getByRole('alert')).toContainText('No se pudo tomar')
    await expect(page.getByRole('button', { name: 'Tomar fotografía' })).toBeEnabled()
    await page.keyboard.press('Escape')
    await expectStopped(page)
  })
})

for (const [name, message] of [['NotAllowedError', 'Permiso de cámara denegado'], ['NotFoundError', 'No encontramos una cámara'], ['NotReadableError', 'otra aplicación'], ['AbortError', 'No se pudo iniciar']] as const) {
  test(`cámara ${name}: error comprensible y Galería disponible`, async ({ page }) => {
    await enterDemo(page)
    await page.evaluate(errorName => {
      navigator.mediaDevices.getUserMedia = async () => { throw new DOMException('Prueba de error', errorName) }
    }, name)
    await openRegistration(page)
    await page.getByRole('button', { name: 'Cámara', exact: true }).click()
    await expect(page.getByRole('alert')).toContainText(message)
    const chooser = page.waitForEvent('filechooser')
    await page.getByRole('button', { name: 'Galería', exact: true }).click()
    await (await chooser).setFiles(PHOTO)
    await expect(page.getByAltText('Vista previa de tu planta', { exact: true })).toBeVisible()
    await expect(page.getByRole('alert')).toHaveCount(0)
  })
}

test('navegador sin API de cámara permite Galería', async ({ page }) => {
  await enterDemo(page)
  await page.evaluate(() => Object.defineProperty(navigator, 'mediaDevices', { value: undefined, configurable: true }))
  await openRegistration(page)
  await page.getByRole('button', { name: 'Cámara', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('no está disponible')
  await page.locator('#plant-photo').setInputFiles(PHOTO)
  await expect(page.getByAltText('Vista previa de tu planta', { exact: true })).toBeVisible()
})

for (const width of [320, 390, 768, 1440]) {
  test(`modal al 100 % y tarjeta legible: ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await createGarden(page)
    const territory = page.getByLabel('Ubicación de tu huerto')
    await expect(territory).toBeVisible()
    expect(await territory.locator('strong').evaluate(element => parseFloat(getComputedStyle(element).fontSize))).toBeGreaterThanOrEqual(16)
    expect(await territory.locator('small').first().evaluate(element => parseFloat(getComputedStyle(element).fontSize))).toBeGreaterThanOrEqual(14)
    await openRegistration(page)
    await page.locator('#plant-photo').setInputFiles(PHOTO)
    const dialog = registration(page)
    await page.screenshot({ path: test.info().outputPath(`registro-inicio-${width}.png`) })
    expect(await dialog.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    const controls = dialog.locator('button:visible, select, input[type=date]')
    for (const control of await controls.all()) {
      const box = await control.boundingBox()
      expect(box?.height).toBeGreaterThanOrEqual(44)
    }
    const submit = page.getByRole('button', { name: 'Añadir a mi huerto' })
    await submit.focus()
    await page.keyboard.press('Tab')
    await expect(page.getByRole('button', { name: 'Cerrar registro de planta' })).toBeFocused()
    await page.keyboard.press('Shift+Tab')
    await expect(submit).toBeFocused()
    await expect(submit).toHaveCSS('outline-style', 'solid')
    await page.screenshot({ path: test.info().outputPath(`registro-${width}.png`) })
    await page.keyboard.press('Escape')
    await expect(actions(page).getByRole('button', { name: 'Registrar planta', exact: true })).toBeFocused()
  })
}
