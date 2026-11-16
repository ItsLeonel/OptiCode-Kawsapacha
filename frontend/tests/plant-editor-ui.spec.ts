import { test, expect } from './e2e'
import { registerGround, expectReady, canvasSlot } from './garden-helpers'

test('Actualizar planta agrupa campos, muestra vista previa y exige foto para cambiar de etapa', async ({ page }) => {
  test.setTimeout(120_000)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.route('https://tile.openstreetmap.org/**', route => route.abort())
  await registerGround(page, '/', 'Imbabura', 'ground')
  await expectReady(page)

  await canvasSlot(page, 0)
  await page.locator('#plant-photo').setInputFiles('src/features/real-gardens/assets/en-tierra-v1.jpg')
  await page.getByRole('button', { name: 'Añadir a mi huerto', exact: true }).click()

  const passport = page.getByRole('dialog', { name: 'Romero', exact: true })
  await expect(passport).toBeVisible()
  await passport.getByRole('button', { name: 'Añadir foto' }).click()

  const editor = page.getByRole('dialog', { name: 'Actualizar planta' })
  await expect(editor).toBeVisible()
  for (const title of ['Datos de la planta', 'Nueva observación', 'Evidencia fotográfica']) {
    await expect(editor.getByRole('heading', { name: title })).toBeVisible()
  }
  await expect(editor.getByRole('img', { name: 'Fotografía actual de Romero' })).toBeVisible()
  await expect(editor.getByRole('button', { name: 'Guardar cambios' })).toBeVisible()

  await editor.getByLabel('Etapa de crecimiento observada').selectOption('flowering')
  await expect(editor.getByText('Cambiaste la etapa de crecimiento')).toBeVisible()
  await editor.getByRole('button', { name: 'Guardar cambios' }).click()
  await expect(editor.getByRole('alert')).toContainText('Adjunta una fotografía nueva')
  await expect(editor).toBeVisible()

  await editor.getByLabel('Nueva fotografía de la planta').setInputFiles('src/features/real-gardens/assets/macetas-v1.jpg')
  await expect(editor.getByRole('img', { name: 'Vista previa de la fotografía seleccionada' })).toBeVisible()
  await editor.getByLabel('Observaciones', { exact: false }).fill('Floración observada hoy y documentada con fotografía.')
  await expect(editor.getByRole('button', { name: 'Guardar cambios' })).toBeEnabled({ timeout: 20_000 })
  await editor.getByRole('button', { name: 'Guardar cambios' }).click()
  await expect(editor).toHaveCount(0)
  await expect(passport).toBeVisible()
  await expect(passport.locator('.passport-stage')).toContainText('Floración')
})
