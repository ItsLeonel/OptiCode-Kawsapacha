import { test, expect, type Page } from './e2e'
import { navigateModule, openCommunityInfo, nextCommunityStep } from './community-helpers'
import { configureTerrain, confirmTerrain } from './garden-helpers'

const picture = 'src/features/real-gardens/assets/en-tierra-v1.jpg'
const secondPicture = 'src/features/real-gardens/assets/macetas-v1.jpg'
const password = 'Testing-Photos-2026!'
async function login(page: Page, email: string) {
  await page.goto('/')
  await page.getByRole('tab', { name: 'Iniciar sesión', exact: true }).click()
  await page.getByLabel('Correo electrónico', { exact: true }).fill(email)
  await page.getByLabel('Contraseña', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click()
  await expect(page.locator('.garden-shell')).toBeVisible()
  // The existing auth flow also schedules its final navigation after 500ms.
  await page.waitForTimeout(650)
}

test('real API: create/edit both photos, regional backgrounds and another browser session', async ({ page, browser }) => {
  const email = `photos-${Date.now()}@example.test`
  const account = await page.request.post('/api/auth/register', { data: { name: 'Photo owner', email, password } })
  expect(account.status()).toBe(201)
  await login(page, email)
  await navigateModule(page, 'Comunidad')
  await page.getByRole('button', { name: 'Crear mi comunidad', exact: true }).click()
  await openCommunityInfo(page, 'Pichincha')
  await page.getByLabel('Nombre de la comunidad').fill('Comunidad con fotografía')
  await page.getByLabel('Fotografía de portada opcional').setInputFiles(picture)
  await page.getByRole('button', { name: 'Editar responsable', exact: true }).click()
  await page.getByLabel('Persona responsable').fill('Photo owner')
  await nextCommunityStep(page)
  await page.getByRole('button', { name: 'Crear comunidad', exact: true }).click()
  await expect(page.locator('.community-wizard')).toHaveCount(0)
  await navigateModule(page, 'Comunidad')
  await expect(page.locator('.community-overview-cover img')).toHaveAttribute('src', /^\/uploads\/communities\//)
  const oldPhoto = await page.locator('.community-overview-cover img').getAttribute('src')
  await expect(page.locator('.communities-page')).toHaveAttribute('data-region', 'sierra')
  await page.getByRole('button', { name: 'Editar comunidad', exact: true }).first().click()
  await nextCommunityStep(page); await nextCommunityStep(page)
  await page.getByRole('button', { name: 'Editar identidad', exact: true }).click()
  await page.getByLabel('Fotografía de portada opcional').setInputFiles(secondPicture)
  await nextCommunityStep(page)
  await page.getByRole('button', { name: 'Guardar cambios', exact: true }).click()
  await expect(page.locator('.community-overview-cover img')).not.toHaveAttribute('src', oldPhoto!)
  const communityPhoto = await page.locator('.community-overview-cover img').getAttribute('src')

  await navigateModule(page, 'Mi Huerto Vivo')
  await page.getByRole('button', { name: 'Registrar mi terreno', exact: true }).click()
  await configureTerrain(page)
  await page.getByLabel('Fotografía del terreno (opcional)').setInputFiles(picture)
  await confirmTerrain(page, 'Mi huerto con fotografía', '25')
  const gardenPhoto = page.locator('.rg-summary-illustration img')
  await expect(gardenPhoto).toHaveAttribute('src', /^\/uploads\/gardens\//)
  const firstGardenPhoto = await gardenPhoto.getAttribute('src')
  await page.getByRole('button', { name: 'Editar mi huerto', exact: true }).click()
  await page.getByLabel('Fotografía del terreno (opcional)').setInputFiles(secondPicture)
  await page.getByRole('button', { name: 'Guardar cambios', exact: true }).click()
  await expect(gardenPhoto).not.toHaveAttribute('src', firstGardenPhoto!)
  const savedGardenPhoto = await gardenPhoto.getAttribute('src')
  await page.getByRole('button', { name: 'Editar mi huerto', exact: true }).click()
  await page.getByRole('button', { name: 'Cambiar ubicación del terreno', exact: true }).click()
  await page.getByRole('button', { name: 'Seleccionar Napo', exact: true }).click()
  await expect(page.locator('.my-garden-page')).toHaveAttribute('data-region', 'oriente')
  await page.getByRole('button', { name: 'Guardar cambios', exact: true }).click()
  await expect(gardenPhoto).toHaveAttribute('src', savedGardenPhoto!)
  await expect(page.locator('.rg-registered-location')).toHaveText('Napo')
  await page.locator('.my-garden-page').screenshot({ path: test.info().outputPath('terrain-photo-amazonia.png') })
  await page.getByRole('button', { name: 'Cerrar sesión', exact: true }).click()
  const context = await browser.newContext()
  const device = await context.newPage()
  await login(device, email)
  await navigateModule(device, 'Comunidad')
  await expect(device.locator('.community-overview-cover img')).toHaveAttribute('src', communityPhoto!)
  await navigateModule(device, 'Mi Huerto Vivo')
  await device.getByRole('navigation', { name: 'Acciones de tu jardín' }).getByRole('button', { name: 'Editar terreno', exact: true }).click()
  await expect(device.locator('.rg-summary-illustration img')).toHaveAttribute('src', savedGardenPhoto!)
  await expect(device.locator('.my-garden-page')).toHaveAttribute('data-region', 'oriente')
  expect((await device.request.get(savedGardenPhoto!)).status()).toBe(200)
  await context.close()
})

test('switching selected communities uses all four static regional backgrounds', async ({ page }) => {
  const stamp = Date.now()
  const records: { id: string; token: string; email: string }[] = []
  const provinces = ['Pichincha', 'Guayas', 'Napo', 'Galápagos']
  for (let i = 0; i < provinces.length; i++) {
    const email = `region-${stamp}-${i}@example.test`
    const auth = (await (await page.request.post('/api/auth/register', { data: { name: `Owner ${i}`, email, password } })).json()).data
    const headers = { Authorization: `Bearer ${auth.token}` }
    const result = await page.request.post('/api/communities', { headers, data: { name: `Regional ${i}`, responsible: `Owner ${i}`, province: provinces[i], location: provinces[i], description: '' } })
    expect(result.status()).toBe(201)
    records.push({ id: (await result.json()).data.community.id, token: auth.token, email })
    if (i) await page.request.post(`/api/communities/${records[i].id}/members/invite`, { headers, data: { email: records[0].email, role: 'PARTICIPANTE' } })
  }
  const headers = { Authorization: `Bearer ${records[0].token}` }
  const invitations = (await (await page.request.get('/api/invitations/me', { headers })).json()).data.invitations
  for (const invitation of invitations) expect((await page.request.post(`/api/invitations/${invitation.id}/accept`, { headers })).status()).toBe(200)
  await login(page, records[0].email)
  await navigateModule(page, 'Comunidad')
  for (const [index, region] of ['sierra', 'costa', 'oriente', 'galapagos'].entries()) {
    await page.locator('.community-hero select').selectOption(records[index].id)
    await expect(page.locator('.communities-page')).toHaveAttribute('data-region', region)
    const background = await page.locator('.community-world-background').evaluate(el => getComputedStyle(el).backgroundImage)
    const url = background.slice(5, -2)
    expect((await page.request.get(url)).status()).toBe(200)
    expect(decodeURIComponent(background)).toContain(region === 'costa' ? 'fondo_comunidad_costa' : region === 'sierra' ? 'Paisaje Andino con Volcán Nevado-2.png' : region === 'oriente' ? 'Paraíso Amazónico con Cabaña y Cascada-3.png' : 'Paisaje volcánico de las Galápagos-1.png')
    await page.locator('.communities-page').screenshot({ path: test.info().outputPath(`community-${region}.png`) })
  }
})

test('legacy location fallback uses a valid community province and keeps the optional default photo', async ({ page }) => {
  const email = `legacy-region-${Date.now()}@example.test`
  const auth = (await (await page.request.post('/api/auth/register', { data: { name: 'Legacy owner', email, password } })).json()).data
  const headers = { Authorization: `Bearer ${auth.token}` }
  // Older communities have only a composed location, without a province column.
  const created = await page.request.post('/api/communities', { headers, data: { name: 'Comunidad anterior', responsible: 'Legacy owner', location: 'Napo', description: '' } })
  const community = (await created.json()).data.community
  const garden = await page.request.post('/api/gardens', { headers, data: { name: 'Huerto sin provincia válida', kind: 'pots', areaM2: 20, province: 'unknown', communityId: community.id } })
  expect(garden.status()).toBe(201)
  expect((await garden.json()).data.garden.photoUrl).toBeNull()
  await login(page, email)
  await page.getByRole('navigation', { name: 'Acciones de tu jardín' }).getByRole('button', { name: 'Editar terreno', exact: true }).click()
  await expect(page.locator('.my-garden-page')).toHaveAttribute('data-region', 'oriente')
  await expect(page.locator('.garden-region-layer')).toHaveAttribute('src', /Paraíso Amazónico/)
  await expect(page.locator('.rg-summary-illustration img')).toHaveAttribute('src', /macetas/)
})
