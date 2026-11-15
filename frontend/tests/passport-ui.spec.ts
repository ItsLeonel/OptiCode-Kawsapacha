import { test, expect } from './e2e'
import { registerGround, expectReady, canvasSlot } from './garden-helpers'

test('Pasaporte Vivo presenta fotos, acciones claras y cuidados bajo demanda', async ({ page }) => {
  test.setTimeout(120_000)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.route('https://tile.openstreetmap.org/**', route => route.abort())
  await registerGround(page, '/', 'Imbabura', 'ground')
  await expectReady(page)

  await canvasSlot(page, 0)
  await page.locator('#plant-photo').setInputFiles('src/features/real-gardens/assets/en-tierra-v1.jpg')
  await page.getByLabel('Especie medicinal').selectOption('Manzanilla')
  await page.getByRole('button', { name: 'Añadir a mi huerto', exact: true }).click()

  const passport = page.getByRole('dialog', { name: 'Manzanilla', exact: true })
  await expect(passport).toBeVisible()
  await expect(passport.getByRole('button', { name: 'Registrar actividad' })).toBeVisible()
  await expect(passport.getByRole('button', { name: 'Añadir foto' })).toBeVisible()
  await expect(passport.getByRole('button', { name: 'Ver Bitácora' })).toBeVisible()
  await expect(passport.getByText('Seguimiento fotográfico')).toBeVisible()
  await expect(passport.getByText('Etapa de crecimiento sin documentar')).toBeVisible()
  await expect(passport.getByText('Suelo húmedo')).toHaveCount(0)
  await expect(passport.getByText('Poda al día')).toHaveCount(0)

  const photos = passport.locator('details').filter({ has: page.getByText('Fotos y evolución') }).first()
  await expect(photos).not.toHaveAttribute('open')
  await photos.locator('summary').click()
  await expect(photos).toHaveAttribute('open', '')

  const guidance = passport.locator('details').filter({ has: page.getByText('Cuidados y recomendaciones') }).first()
  await expect(guidance).not.toHaveAttribute('open')
  await guidance.locator('summary').click()
  await expect(guidance).toHaveAttribute('open', '')

  await passport.getByRole('button', { name: 'Registrar actividad' }).click()
  await expect(page.getByRole('dialog', { name: /Registrar actividad/ })).toBeVisible()
})
