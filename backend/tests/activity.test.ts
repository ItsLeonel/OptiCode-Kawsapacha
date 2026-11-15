// backend/tests/activity.test.ts
import assert from 'assert'
import { prisma } from '../src/config/prisma'
import {
  createGardenActivity,
  listGardenActivities,
  getGardenActivityDetail,
  voidGardenActivity,
  VALID_ACTIVITY_TYPES,
} from '../src/services/activity.service'
import { listPlantsByGarden, getPlantPassport, updatePlantDetails } from '../src/services/plant.service'

export async function runActivityTests() {
  console.log('🧪 Iniciando pruebas de Bitácora Viva y Actividades Agrícolas...')

  // Crear usuario y huerto de prueba
  const testEmail = `test-activity-${Date.now()}@kawsapacha.org`
  const user = await prisma.user.create({
    data: {
      name: 'Usuario Test Actividad',
      email: testEmail,
      passwordHash: 'dummyhash',
      role: 'RESPONSABLE',
    },
  })

  const garden = await prisma.realGarden.create({
    data: {
      name: 'Huerto Bitácora Viva Test',
      kind: 'ground',
      areaM2: 50,
      province: 'Imbabura',
      provinceCode: '10',
      createdById: user.id,
    },
  })

  let species = await prisma.medicinalCatalog.findFirst()
  if (!species) {
    species = await prisma.medicinalCatalog.create({
      data: {
        name: 'Toronjil Andino',
        latinName: 'Melissa officinalis',
        icon: '🌿',
      },
    })
  }

  const plant = await prisma.cultivatedPlant.create({
    data: {
      realGardenId: garden.id,
      speciesId: species.id,
      plotIndex: 1,
      customName: 'Toronjil de prueba',
      registeredById: user.id,
      reviewStatus: 'PENDING',
    },
  })

  try {
    // 0. Verificar que una planta pendiente de aprobación MSP bloquea los cuidados
    let pendingBlocked = false
    try {
      await createGardenActivity({
        gardenId: garden.id,
        actorUserId: user.id,
        type: 'watering',
        performedDate: '2026-11-02',
        targetKind: 'plant',
        plantId: plant.id,
        notes: 'Intento de riego en planta no aprobada',
      })
    } catch (err: any) {
      if (err.code === 'PLANT_NOT_APPROVED') pendingBlocked = true
    }
    assert.ok(pendingBlocked, 'Debe bloquear actividades de cuidado si la siembra está pendiente de aprobación MSP')

    // 0b. Verificar que el espacio con planta pendiente también bloquea actividades por plot (ej. sowing u observation)
    let plotPendingBlocked = false
    try {
      await createGardenActivity({
        gardenId: garden.id,
        actorUserId: user.id,
        type: 'observation',
        performedDate: '2026-11-02',
        targetKind: 'plot',
        plotIndex: 1,
        notes: 'Intento de observación en espacio pendiente MSP',
      })
    } catch (err: any) {
      if (err.code === 'PLANT_NOT_APPROVED') plotPendingBlocked = true
    }
    assert.ok(plotPendingBlocked, 'Debe bloquear actividades dirigidas al espacio mientras la planta esté pendiente MSP')

    let sowingOnPendingBlocked = false
    try {
      await createGardenActivity({
        gardenId: garden.id,
        actorUserId: user.id,
        type: 'sowing',
        performedDate: '2026-11-02',
        targetKind: 'plot',
        plotIndex: 1,
        notes: 'Intento de siembra en espacio ocupado/pendiente',
      })
    } catch (err: any) {
      if (err.code === 'PLANT_NOT_APPROVED') sowingOnPendingBlocked = true
    }
    assert.ok(sowingOnPendingBlocked, 'Debe bloquear siembra adicional en un espacio con planta pendiente MSP')

    // Aprobar la planta para continuar el flujo de cuidados válidos
    await prisma.cultivatedPlant.update({
      where: { id: plant.id },
      data: { reviewStatus: 'APPROVED' },
    })

    // Seguridad de extremo a extremo: una cuenta ajena no debe leer ni editar
    // plantas o fotos del huerto de otra comunidad.
    const outsider = await prisma.user.create({
      data: {
        name: 'Usuario fuera del huerto',
        email: `no-miembro-${Date.now()}@kawsapacha.org`,
        passwordHash: 'dummyhash',
        role: 'USUARIO',
      },
    })
    try {
      await assert.rejects(() => listPlantsByGarden(garden.id, outsider.id), { code: 'FORBIDDEN' })
      await assert.rejects(() => getPlantPassport(plant.id, outsider.id), { code: 'FORBIDDEN' })
      await assert.rejects(
        () => updatePlantDetails({ plantId: plant.id, requestingUserId: outsider.id, notes: 'Cambio no autorizado' }),
        { code: 'FORBIDDEN' }
      )
    } finally {
      await prisma.user.delete({ where: { id: outsider.id } })
    }
    assert.ok(!(VALID_ACTIVITY_TYPES as readonly string[]).includes('replanting'), 'Replante debe permanecer retirado del backend')

    // 1. Crear actividad de nivel huerto: preparación de terreno (preparation)
    const prepResult = await createGardenActivity({
      gardenId: garden.id,
      actorUserId: user.id,
      type: 'preparation',
      performedDate: '2026-11-01',
      targetKind: 'garden',
      notes: 'Descompactación y volteo de suelo según práctica andina',
      autoApprove: true,
    })

    assert.ok(prepResult.activity)
    const prepAct = prepResult.activity!
    assert.equal(prepResult.isDuplicate, false)
    assert.equal(prepAct.type, 'preparation')
    assert.equal(prepResult.reward?.pointsAwarded, 10)

    // 2. Crear actividad sobre planta con evidencia fotográfica: Riego (watering)
    const clientOpId = `op-water-${Date.now()}`
    const waterResult = await createGardenActivity({
      gardenId: garden.id,
      actorUserId: user.id,
      type: 'watering',
      performedDate: '2026-11-02',
      targetKind: 'plant',
      plantId: plant.id,
      notes: 'Riego matutino por infusión al suelo sin aspersión',
      details: { quantity: 2, unit: 'L', method: 'regadera manual' },
      clientActivityId: clientOpId,
      evidenceFile: {
        filename: 'water-evidence.jpg',
        path: '/tmp/water-evidence.jpg',
        mimetype: 'image/jpeg',
        size: 15420,
      },
    })

    assert.ok(waterResult.activity)
    const waterAct = waterResult.activity!
    assert.equal(waterResult.isDuplicate, false)
    assert.equal(waterAct.type, 'watering')
    assert.equal(waterAct.evidences.length, 1)
    assert.ok(waterAct.careLogId, 'Debe enlazar un CareLog para actualizar la salud del huerto')

    // Verificar que el CareLog en efecto existe en la base de datos
    const careLog = await prisma.careLog.findUnique({
      where: { id: waterAct.careLogId! },
    })
    assert.ok(careLog)
    assert.equal(careLog.actionType, 'WATERING')

    // 3. Idempotencia: reenviar con el mismo clientActivityId
    const retryResult = await createGardenActivity({
      gardenId: garden.id,
      actorUserId: user.id,
      type: 'watering',
      performedDate: '2026-11-02',
      targetKind: 'plant',
      plantId: plant.id,
      clientActivityId: clientOpId,
    })
    assert.equal(retryResult.isDuplicate, true)
    assert.ok(retryResult.activity)
    assert.equal(retryResult.activity!.id, waterAct.id)

    // El mismo ID enviado desde otro huerto no debe devolver una actividad
    // (ni fotografías) del primer huerto, aunque sea la misma cuenta.
    const otherGarden = await prisma.realGarden.create({
      data: { name: 'Segundo huerto de prueba', kind: 'ground', areaM2: 20,
        province: 'Imbabura', provinceCode: '10', createdById: user.id },
    })
    await assert.rejects(
      () => createGardenActivity({
        gardenId: otherGarden.id, actorUserId: user.id, type: 'preparation',
        performedDate: '2026-11-02', targetKind: 'garden', clientActivityId: clientOpId,
      }),
      { code: 'ACTIVITY_ID_CONFLICT' }
    )

    // 4. Listar actividades del huerto en orden descendente
    const list = await listGardenActivities(garden.id, user.id, {})
    assert.ok(list.length >= 2)
    assert.ok(list[0].performedDate >= list[1].performedDate, 'Debe estar ordenado cronológicamente descendente')

    // 5. Filtro por tipo
    const prepOnly = await listGardenActivities(garden.id, user.id, { type: 'preparation' })
    assert.ok(prepOnly.every(a => a.type === 'preparation'))

    // 6. Detalle de actividad
    const detail = await getGardenActivityDetail(waterAct.id, user.id)
    assert.equal(detail.id, waterAct.id)
    assert.equal(detail.plant?.id, plant.id)

    // 7. Anulación de actividad
    const voidResult = await voidGardenActivity(
      prepAct.id,
      user.id,
      'Se registró en el huerto equivocado'
    )
    assert.ok(voidResult.activity.voidedAt)
    assert.equal(voidResult.activity.voidReason, 'Se registró en el huerto equivocado')

    // Comprobar que en listado normal ya no aparece la anulada
    const listWithoutVoided = await listGardenActivities(garden.id, user.id, { includeVoided: false })
    assert.ok(listWithoutVoided.every(a => a.id !== prepAct.id))

    // Comprobar que con includeVoided sí aparece
    const listWithVoided = await listGardenActivities(garden.id, user.id, { includeVoided: true })
    assert.ok(listWithVoided.some(a => a.id === prepAct.id))

    console.log('Pruebas de Bitácora Viva y Actividades Agrícolas superadas con éxito.')
  } finally {
    await prisma.rewardLedger.deleteMany({ where: { userId: user.id } }).catch(() => { })
    await prisma.userBadge.deleteMany({ where: { userId: user.id } }).catch(() => { })
    await prisma.userMissionProgress.deleteMany({ where: { userId: user.id } }).catch(() => { })
    await prisma.gardenActivity.deleteMany({ where: { actorUserId: user.id } }).catch(() => { })
    await prisma.careLog.deleteMany({ where: { userId: user.id } }).catch(() => { })
    await prisma.cultivatedPlant.deleteMany({ where: { registeredById: user.id } }).catch(() => { })
    await prisma.realGarden.deleteMany({ where: { createdById: user.id } }).catch(() => { })
    await prisma.user.delete({ where: { id: user.id } }).catch(() => { })
  }
}
