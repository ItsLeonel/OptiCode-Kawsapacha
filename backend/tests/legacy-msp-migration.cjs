// Prueba aislada de migración MSP V1 sobre una base SQLite temporal.
// Uso: node tests/legacy-msp-migration.cjs seed|after-migrate|after-reconcile
const assert = require('node:assert/strict')
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
const fixtureId = 'legacy-msp-fixture-v1'
const userId = fixtureId + '-user'
const mspId = fixtureId + '-reviewer'
const communityId = fixtureId + '-community'
const gardenId = fixtureId + '-garden'
const speciesId = fixtureId + '-species'
const plantAId = fixtureId + '-plant-valid'
const plantBId = fixtureId + '-plant-review'
const sowingId = fixtureId + '-sowing'
const wateringId = fixtureId + '-watering'
const correctionId = fixtureId + '-correction'
const rejectedId = fixtureId + '-rejected'
const manuallyReviewedPendingId = fixtureId + '-manual-pending'

async function seed() {
  await prisma.user.createMany({
    data: [
      { id: userId, name: 'Usuario de migracion', email: 'legacy-fixture@example.invalid', passwordHash: 'test' },
      { id: mspId, name: 'Revisor MSP', email: 'legacy-msp@example.invalid', passwordHash: 'test', role: 'ADMIN_MSP' },
    ],
  })
  await prisma.community.create({
    data: {
      id: communityId, name: 'Comunidad pendiente antigua', responsible: 'Usuario de migracion',
      location: 'Pichincha', description: 'Datos de prueba', status: 'PENDING', creatorId: userId,
    },
  })
  await prisma.realGarden.create({
    data: { id: gardenId, name: 'Huerto histórico', kind: 'ground',
      areaM2: 15, province: 'Pichincha', provinceCode: '17',
      communityId, createdById: userId },
  })
  await prisma.medicinalCatalog.create({
    data: { id: speciesId, name: 'Romero', latinName: 'Salvia rosmarinus', icon: '🌱' },
  })
  for (const [id, plotIndex] of [[plantAId, 0], [plantBId, 1]]) {
    await prisma.cultivatedPlant.create({
      data: { id, realGardenId: gardenId, speciesId, plotIndex, customName: 'Romero histórico',
        registeredById: userId, reviewStatus: 'PENDING' },
    })
  }
  const activities = [
    { id: sowingId, plantId: plantAId, type: 'sowing', performedDate: '2026-11-01', reviewStatus: 'PENDING' },
    { id: wateringId, plantId: plantAId, type: 'watering', performedDate: '2026-11-02', reviewStatus: 'PENDING' },
    { id: correctionId, plantId: plantBId, type: 'sowing', performedDate: '2026-11-01',
      reviewStatus: 'NEEDS_CHANGES', reviewedById: mspId, reviewedAt: new Date('2026-11-03T00:00:00Z') },
    { id: rejectedId, plantId: plantAId, type: 'observation', performedDate: '2026-11-03',
      reviewStatus: 'REJECTED', reviewedById: mspId, reviewedAt: new Date('2026-11-04T00:00:00Z') },
    { id: manuallyReviewedPendingId, plantId: plantAId, type: 'signage', performedDate: '2026-11-04',
      reviewStatus: 'PENDING', reviewedById: mspId, reviewedAt: new Date('2026-11-05T00:00:00Z') },
  ]
  for (const a of activities) {
    await prisma.gardenActivity.create({
      data: { ...a, gardenId, actorUserId: userId, targetKind: 'plant' },
    })
  }
  assert.equal(await prisma.rewardLedger.count({ where: { userId } }), 0)
  console.log('Fixture legado preparado: comunidad pendiente, 2 plantas y 5 actividades sin ledger.')
}

async function afterMigrate() {
  const [community, plantA, plantB, activities] = await Promise.all([
    prisma.community.findUniqueOrThrow({ where: { id: communityId } }),
    prisma.cultivatedPlant.findUniqueOrThrow({ where: { id: plantAId } }),
    prisma.cultivatedPlant.findUniqueOrThrow({ where: { id: plantBId } }),
    prisma.gardenActivity.findMany({ where: { gardenId } }),
  ])
  const status = Object.fromEntries(activities.map(a => [a.id, a.reviewStatus]))
  assert.equal(community.status, 'PENDING', 'La comunidad no debe aprobarse automáticamente')
  assert.equal(plantA.reviewStatus, 'APPROVED')
  assert.equal(plantB.reviewStatus, 'PENDING', 'Preservar siembra con solicitud MSP de corrección')
  assert.equal(status[sowingId], 'APPROVED')
  assert.equal(status[wateringId], 'APPROVED')
  assert.equal(status[correctionId], 'NEEDS_CHANGES')
  assert.equal(status[rejectedId], 'REJECTED')
  assert.equal(status[manuallyReviewedPendingId], 'PENDING')
  for (const id of [sowingId, wateringId]) {
    const act = activities.find(x => x.id === id)
    assert.equal(act.reviewedAt, null, 'La conversión no debe simular un auditor humano')
    assert.equal(act.reviewedById, null)
  }
  assert.equal(await prisma.rewardLedger.count({ where: { userId } }), 0, 'La migración SQL no inventa créditos')
  console.log('Migración verificada: solo registros sin decisión humana se convierten.')
}

async function afterReconcile() {
  await afterMigrateWithoutLedgerAssertion()
  const ledger = await prisma.rewardLedger.findMany({ where: { userId }, orderBy: { awardedAt: 'asc' } })
  const eligible = ledger.filter(x => x.sourceId === sowingId || x.sourceId === wateringId)
  assert.equal(eligible.length, 2, 'Exactamente dos actividades puntuables históricas')
  assert.equal(eligible.reduce((sum, x) => sum + x.pointsDelta, 0), 25, '20 por siembra y 5 por riego')
  const before = await prisma.rewardLedger.count({ where: { userId } })
  console.log(`Conciliación verificada: ${before} asientos, exactamente 25 Semillas históricas.`)
}
async function afterMigrateWithoutLedgerAssertion() {
  const [plantB, correction, rejected] = await Promise.all([
    prisma.cultivatedPlant.findUniqueOrThrow({ where: { id: plantBId } }),
    prisma.gardenActivity.findUniqueOrThrow({ where: { id: correctionId } }),
    prisma.gardenActivity.findUniqueOrThrow({ where: { id: rejectedId } }),
  ])
  assert.equal(plantB.reviewStatus, 'PENDING')
  assert.equal(correction.reviewStatus, 'NEEDS_CHANGES')
  assert.equal(rejected.reviewStatus, 'REJECTED')
}
const phase = process.argv[2]
const work = phase === 'seed' ? seed : phase === 'after-migrate' ? afterMigrate : phase === 'after-reconcile' ? afterReconcile : null
if (!work) { console.error('Uso: node legacy-msp-migration.cjs seed|after-migrate|after-reconcile'); process.exit(2) }
work().catch(e => { console.error(e); process.exitCode = 1 }).finally(() => prisma.$disconnect())
