const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { prepareDatabase } = require('./setup-db.cjs')
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j5N8AAAAASUVORK5CYII=', 'base64')

test('real SQLite migration, uploads, persistence and authorization', async t => {
  const database = await prepareDatabase({ verifyUpgrade: true })
  process.env.DATABASE_URL = database.databaseUrl
  process.env.UPLOADS_DIR = database.uploads
  process.env.JWT_SECRET = 'isolated-photo-test-secret-not-a-real-account'
  const app = require('../dist/app').default
  const { prisma } = require('../dist/config/prisma')
  const server = app.listen(0, '127.0.0.1')
  await new Promise(resolve => server.once('listening', resolve))
  const base = `http://127.0.0.1:${server.address().port}`
  t.after(async () => { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); await prisma.$disconnect() })
  async function call(endpoint, token, body, method = 'POST') {
    const response = await fetch(base + endpoint, { method, headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body instanceof FormData || body === undefined ? {} : { 'Content-Type': 'application/json' }) }, body: body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body) })
    return { status: response.status, json: await response.json() }
  }
  function form(fields, bytes = png, type = 'image/png') {
    const data = new FormData()
    for (const [key, value] of Object.entries(fields)) data.append(key, String(value))
    data.append('picture', new Blob([bytes], { type }), 'C:\\fakepath\\private-photo.png')
    return data
  }
  const register = async name => {
    const result = await call('/api/auth/register', null, { name, email: `${name}@example.test`, password: 'Testing-Photos-2026!' })
    assert.equal(result.status, 201)
    return result.json.data
  }
  let owner, outsider, community, garden
  await t.test('additive migration preserves existing rows and references', async () => {
    const old = await prisma.community.findUniqueOrThrow({ where: { id: 'legacy-community' } })
    assert.equal(old.name, 'Existing community'); assert.equal(old.location, 'Napo'); assert.equal(old.photoUrl, null)
    const oldGarden = await prisma.realGarden.findUniqueOrThrow({ where: { id: 'legacy-garden' } })
    assert.equal(oldGarden.communityId, old.id); assert.equal(oldGarden.areaM2, 25); assert.equal(oldGarden.photoUrl, null)
    assert.deepEqual(await prisma.$queryRawUnsafe('PRAGMA foreign_key_check'), [])
  })
  await t.test('community photo is stored as an HTTP reference and survives a new login', async () => {
    owner = await register('Owner'); outsider = await register('Outsider')
    const created = await call('/api/communities', owner.token, form({ name: 'Community with photo', responsible: 'Owner', location: 'Napo', province: 'Napo', type: 'personal' }))
    assert.equal(created.status, 201); community = created.json.data.community
    assert.equal(community.province, 'Napo'); assert.match(community.photoUrl, /^\/uploads\/communities\/[a-f0-9-]+\.png$/)
    assert.deepEqual(Buffer.from(await (await fetch(base + community.photoUrl)).arrayBuffer()), png)
    const login = await call('/api/auth/login', null, { email: 'Owner@example.test', password: 'Testing-Photos-2026!' })
    const list = await call('/api/communities', login.json.data.token, undefined, 'GET')
    assert.equal(list.json.data.communities[0].photoUrl, community.photoUrl)
  })
  await t.test('replace, retain and remove community photos without accepting client paths', async () => {
    const previous = community.photoUrl
    const changed = await call(`/api/communities/${community.id}`, owner.token, form({ province: 'Guayas' }), 'PUT')
    assert.equal(changed.status, 200); community = changed.json.data.community
    assert.notEqual(community.photoUrl, previous); assert.equal((await fetch(base + previous)).status, 404)
    const retained = await call(`/api/communities/${community.id}`, owner.token, { description: 'Edited', photoUrl: 'C:/private/file.png' }, 'PUT')
    assert.equal(retained.json.data.community.photoUrl, community.photoUrl)
  })
  await t.test('garden photo persists and a province edit retains it', async () => {
    const created = await call('/api/gardens', owner.token, form({ name: 'Garden with photo', kind: 'ground', areaM2: 25, province: 'Napo', provinceCode: '15', communityId: community.id, coordinates: JSON.stringify({ latitude: -1, longitude: -77 }) }))
    assert.equal(created.status, 201); garden = created.json.data.garden
    assert.match(garden.photoUrl, /^\/uploads\/gardens\/[a-f0-9-]+\.png$/); assert.equal(garden.latitude, -1)
    const changed = await call(`/api/gardens/${garden.id}`, owner.token, { province: 'Guayas', provinceCode: '09', canton: '', cantonCode: null, parish: '', parishCode: null, coordinates: null }, 'PUT')
    assert.equal(changed.json.data.garden.photoUrl, garden.photoUrl)
    assert.equal(changed.json.data.garden.latitude, null); assert.equal(changed.json.data.garden.canton, '')
    const login = await call('/api/auth/login', null, { email: 'Owner@example.test', password: 'Testing-Photos-2026!' })
    const list = await call(`/api/gardens?communityId=${community.id}`, login.json.data.token, undefined, 'GET')
    assert.equal(list.json.data.gardens[0].photoUrl, garden.photoUrl); assert.equal(list.json.data.gardens[0].province, 'Guayas')
  })
  await t.test('outsiders and participants cannot change photos, including garden-create upsert', async () => {
    const filesBefore = fs.readdirSync(path.join(database.uploads, 'gardens'))
    assert.equal((await call(`/api/communities/${community.id}`, outsider.token, form({}), 'PUT')).status, 403)
    assert.equal((await call(`/api/gardens/${garden.id}`, outsider.token, form({}), 'PUT')).status, 403)
    assert.equal((await call('/api/gardens', outsider.token, form({ name: 'Attack', kind: 'ground', areaM2: 10, province: 'Napo', communityId: community.id }))).status, 403)
    await prisma.communityMember.create({ data: { communityId: community.id, userId: outsider.user.id, roleInCommunity: 'PARTICIPANTE', status: 'ACCEPTED' } })
    assert.equal((await call(`/api/communities/${community.id}`, outsider.token, form({}), 'PUT')).status, 403)
    assert.equal((await call(`/api/gardens/${garden.id}`, outsider.token, form({}), 'PUT')).status, 403)
    assert.equal((await call(`/api/gardens/${garden.id}`, null, form({}), 'PUT')).status, 401)
    assert.deepEqual(fs.readdirSync(path.join(database.uploads, 'gardens')), filesBefore)
    assert.equal((await prisma.realGarden.findUniqueOrThrow({ where: { id: garden.id } })).photoUrl, garden.photoUrl)
  })
  await t.test('invalid MIME, mismatched content and oversized uploads leave the photo intact', async () => {
    for (const [bytes, type] of [[Buffer.from('<svg/>'), 'image/svg+xml'], [Buffer.from('not an image'), 'image/png'], [Buffer.alloc(3 * 1024 * 1024 + 1), 'image/png']]) {
      const response = await call(`/api/gardens/${garden.id}`, owner.token, form({}, bytes, type), 'PUT')
      assert.equal(response.status, 400)
    }
    assert.equal((await prisma.realGarden.findUniqueOrThrow({ where: { id: garden.id } })).photoUrl, garden.photoUrl)
  })
  await t.test('garden replacement and explicit removal preserve all other records', async () => {
    const previous = garden.photoUrl
    const changed = await call(`/api/gardens/${garden.id}`, owner.token, form({}), 'PUT')
    assert.equal(changed.status, 200); garden = changed.json.data.garden
    assert.notEqual(garden.photoUrl, previous); assert.equal((await fetch(base + previous)).status, 404)
    const removed = await call(`/api/gardens/${garden.id}`, owner.token, { removePhoto: true }, 'PUT')
    assert.equal(removed.json.data.garden.photoUrl, null); assert.equal((await fetch(base + garden.photoUrl)).status, 404)
    const removedCommunity = await call(`/api/communities/${community.id}`, owner.token, { removePhoto: true }, 'PUT')
    assert.equal(removedCommunity.json.data.community.photoUrl, null)
    const optional = await call('/api/gardens', outsider.token, { name: 'Optional photo', kind: 'pots', areaM2: 12, province: 'Napo' })
    assert.equal(optional.status, 201); assert.equal(optional.json.data.garden.photoUrl, null)
    assert.equal(await prisma.realGarden.count({ where: { id: 'legacy-garden' } }), 1)
  })
  await t.test('a failed database write removes only the new upload', async () => {
    const { withEntityPhoto } = require('../dist/services/entity-photo.service')
    const before = fs.readdirSync(path.join(database.uploads, 'gardens'))
    await assert.rejects(withEntityPhoto('gardens', { buffer: png, size: png.length, mimetype: 'image/png' }, false, null, async () => { throw new Error('Simulated database failure') }), /Simulated/)
    assert.deepEqual(fs.readdirSync(path.join(database.uploads, 'gardens')), before)
  })
  await t.test('archiving multiple plants in the same plot sets plotIndex to null and frees the plot for new sowing', async () => {
    const species = await prisma.medicinalCatalog.create({
      data: { id: 'archive-test-romero', name: 'Romero', latinName: 'Salvia rosmarinus', icon: '🌿', regions: '["costa","sierra","oriente","galapagos"]' },
    })
    const plant1Res = await call(`/api/gardens/${garden.id}/plants`, owner.token, form({ speciesId: species.id, plotIndex: 1, customName: 'Romero 1', notes: 'Primera siembra' }))
    assert.equal(plant1Res.status, 201)
    const plant1 = plant1Res.json.data.plant
    assert.equal(plant1.plotIndex, 1)

    // Participante no puede archivar
    const forbiddenRes = await call(`/api/plants/${plant1.id}/archive`, outsider.token, undefined, 'PATCH')
    assert.equal(forbiddenRes.status, 403)

    // Responsable archiva la primera planta y libera la parcela 1
    const arch1 = await call(`/api/plants/${plant1.id}/archive`, owner.token, undefined, 'PATCH')
    assert.equal(arch1.status, 200)
    assert.equal(arch1.json.data.plant.plotIndex, null)
    assert.equal(arch1.json.data.plant.lifecycleStatus, 'ARCHIVED')
    assert.ok(arch1.json.data.plant.archivedAt)

    // Sembrar segunda planta en la misma parcela 1 liberada y archivarla también (verifica que múltiples plotIndex=null no colisionen en SQLite)
    const plant2Res = await call(`/api/gardens/${garden.id}/plants`, owner.token, form({ speciesId: species.id, plotIndex: 1, customName: 'Romero 2', notes: 'Segunda siembra' }))
    assert.equal(plant2Res.status, 201)
    const plant2 = plant2Res.json.data.plant
    assert.equal(plant2.plotIndex, 1)

    const arch2 = await call(`/api/plants/${plant2.id}/archive`, owner.token, undefined, 'PATCH')
    assert.equal(arch2.status, 200)
    assert.equal(arch2.json.data.plant.plotIndex, null)

    // Sembrar tercera planta activa en la parcela 1
    const plant3Res = await call(`/api/gardens/${garden.id}/plants`, owner.token, form({ speciesId: species.id, plotIndex: 1, customName: 'Romero 3', notes: 'Tercera siembra activa' }))
    assert.equal(plant3Res.status, 201)
    assert.equal(plant3Res.json.data.plant.plotIndex, 1)

    // El listado conserva las 2 archivadas y la 1 activa
    const listRes = await call(`/api/gardens/${garden.id}/plants`, owner.token, undefined, 'GET')
    assert.equal(listRes.status, 200)
    const allPlants = listRes.json.data.plants
    assert.equal(allPlants.length, 3)
    assert.equal(allPlants.filter(p => p.plotIndex === null && p.lifecycleStatus === 'ARCHIVED').length, 2)
    assert.equal(allPlants.filter(p => p.plotIndex === 1 && p.lifecycleStatus !== 'ARCHIVED').length, 1)
  })
})
