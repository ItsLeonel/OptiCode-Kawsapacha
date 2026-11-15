// backend/tests/rewards-missions.test.ts
import assert from 'assert'
import { prisma } from '../src/infrastructure/database/prisma'
import {
  BASE_POINTS,
  evaluateActivityReward,
  getUserRewardsSummary,
  revertActivityReward,
} from '../src/modules/rewards/rewards.module'
import { syncUserMissionsAndBadges } from '../src/modules/rewards/missions.module'
import { calculateDayLunarInfo } from '../src/modules/lunar-calendar/application/lunar-calendar.service'

export async function runRewardsAndMissionsTests() {
  console.log('🧪 Iniciando pruebas de Motor de Recompensas (Semillas de vida) y Misiones...')

  // 1. Tabla de puntos base
  assert.equal(BASE_POINTS.watering, 5)
  assert.equal(BASE_POINTS.sowing, 20)
  assert.equal(BASE_POINTS.harvest, 20)
  assert.equal(BASE_POINTS.fertilizing, 8)
  assert.equal(BASE_POINTS.preparation, 10)
  assert.equal(BASE_POINTS.weeding, 8)
  assert.equal(BASE_POINTS.hilling, 8)
  assert.equal(BASE_POINTS.replanting, 10)
  assert.equal(BASE_POINTS.observation, 12)

  // Crear usuario y huerto de prueba
  const testEmail = `test-rewards-${Date.now()}@kawsapacha.org`
  const user = await prisma.user.create({
    data: {
      name: 'Usuario Test Recompensas',
      email: testEmail,
      passwordHash: 'dummyhash',
      role: 'PARTICIPANTE',
    },
  })

  const garden = await prisma.realGarden.create({
    data: {
      name: 'Huerto Experimental de Pruebas',
      kind: 'ground',
      areaM2: 25,
      province: 'Pichincha',
      provinceCode: '17',
      createdById: user.id,
    },
  })

  // Obtener especie del catálogo o crear una si no hay
  let species = await prisma.medicinalCatalog.findFirst()
  if (!species) {
    species = await prisma.medicinalCatalog.create({
      data: {
        name: 'Menta Andina',
        latinName: 'Mentha sp.',
        icon: '🌱',
      },
    })
  }

  const plant = await prisma.cultivatedPlant.create({
    data: {
      realGardenId: garden.id,
      speciesId: species.id,
      plotIndex: 0,
      customName: 'Menta Parcela 0',
      registeredById: user.id,
    },
  })

  try {
    // 2. Primera actividad: Riego (watering) -> debe otorgar 5 puntos
    const act1 = await prisma.gardenActivity.create({
      data: {
        gardenId: garden.id,
        actorUserId: user.id,
        type: 'watering',
        performedDate: '2026-11-01',
        targetKind: 'plant',
        plantId: plant.id,
        plotIndex: 0,
      },
    })

    const reward1 = await evaluateActivityReward({
      id: act1.id,
      actorUserId: user.id,
      type: 'watering',
      performedDate: '2026-11-01',
      targetKind: 'plant',
      plantId: plant.id,
      plotIndex: 0,
    })

    assert.equal(reward1.awarded, true)
    assert.equal(reward1.pointsAwarded, 5)
    assert.equal(reward1.totalPoints, 5)
    assert.equal(reward1.level, 'Aprendiz')

    // 3. Regla anti-abuso: segundo riego para el mismo objetivo en la MISMA fecha -> 0 puntos
    const act2 = await prisma.gardenActivity.create({
      data: {
        gardenId: garden.id,
        actorUserId: user.id,
        type: 'watering',
        performedDate: '2026-11-01',
        targetKind: 'plant',
        plantId: plant.id,
        plotIndex: 0,
      },
    })

    const reward2 = await evaluateActivityReward({
      id: act2.id,
      actorUserId: user.id,
      type: 'watering',
      performedDate: '2026-11-01',
      targetKind: 'plant',
      plantId: plant.id,
      plotIndex: 0,
    })

    assert.equal(reward2.awarded, false)
    assert.equal(reward2.pointsAwarded, 0)
    assert.equal(reward2.totalPoints, 5, 'El total no debe incrementarse por riego redundante')

    // 4. Misiones: Progresión de «Raíces cuidadas» (3 riegos en fechas diferentes)
    // Crear riegos en 2 fechas adicionales
    const act3 = await prisma.gardenActivity.create({
      data: {
        gardenId: garden.id,
        actorUserId: user.id,
        type: 'watering',
        performedDate: '2026-11-03',
        targetKind: 'plant',
        plantId: plant.id,
        plotIndex: 0,
      },
    })
    await evaluateActivityReward({
      id: act3.id,
      actorUserId: user.id,
      type: 'watering',
      performedDate: '2026-11-03',
      targetKind: 'plant',
      plantId: plant.id,
      plotIndex: 0,
    })

    // Verificar que mientras act1 siga en PENDING no otorga misiones ni insignias
    let pendingMissionState = await syncUserMissionsAndBadges(user.id)
    assert.equal(pendingMissionState.missions.find(m => m.missionId === 'care')?.currentValue, 0)
    assert.equal(pendingMissionState.badges.length, 0, 'Actividades PENDING no deben otorgar insignias')

    // Marcar act1 y act3 como APPROVED para que el motor de misiones/insignias los compute
    await prisma.gardenActivity.updateMany({
      where: { id: { in: [act1.id, act3.id] } },
      data: { reviewStatus: 'APPROVED' },
    })

    // Sincronizar misiones con 2 riegos aprobados en fechas distintas -> progreso 2/3
    let missionState = await syncUserMissionsAndBadges(user.id)
    const careMission2 = missionState.missions.find(m => m.missionId === 'care')
    assert.ok(careMission2)
    assert.equal(careMission2!.currentValue, 2)
    assert.equal(careMission2!.targetValue, 3)
    assert.equal(careMission2!.completed, false)

    // Tercer riego en otra fecha distinta (aprobado)
    const act4 = await prisma.gardenActivity.create({
      data: {
        gardenId: garden.id,
        actorUserId: user.id,
        type: 'watering',
        performedDate: '2026-11-05',
        targetKind: 'plant',
        plantId: plant.id,
        plotIndex: 0,
        reviewStatus: 'APPROVED',
      },
    })
    await evaluateActivityReward({
      id: act4.id,
      actorUserId: user.id,
      type: 'watering',
      performedDate: '2026-11-05',
      targetKind: 'plant',
      plantId: plant.id,
      plotIndex: 0,
    })

    // Sincronizar misiones con 3 riegos aprobados en fechas distintas -> progreso 3/3 y medalla 'care'
    missionState = await syncUserMissionsAndBadges(user.id)
    const careMission3 = missionState.missions.find(m => m.missionId === 'care')
    assert.ok(careMission3)
    assert.equal(careMission3!.currentValue, 3)
    assert.equal(careMission3!.completed, true)
    assert.ok(missionState.badges.some(b => b.badgeId === 'care'))

    // 5. Misión «Mirada atenta» (3 observaciones aprobadas con fotografía en fechas diferentes)
    for (const obsDate of ['2026-11-02', '2026-11-04', '2026-11-06']) {
      const obsAct = await prisma.gardenActivity.create({
        data: {
          gardenId: garden.id,
          actorUserId: user.id,
          type: 'observation',
          performedDate: obsDate,
          targetKind: 'plant',
          plantId: plant.id,
          reviewStatus: 'APPROVED',
        },
      })
      await prisma.activityEvidence.create({
        data: {
          activityId: obsAct.id,
          filePath: '/mock/path/photo.jpg',
          fileUrl: '/uploads/activities/photo.jpg',
          mimeType: 'image/jpeg',
          fileSize: 1024,
        },
      })
    }

    missionState = await syncUserMissionsAndBadges(user.id)
    const observerMission = missionState.missions.find(m => m.missionId === 'observer')
    assert.ok(observerMission)
    assert.equal(observerMission!.currentValue, 3)
    assert.equal(observerMission!.completed, true)
    assert.ok(missionState.badges.some(b => b.badgeId === 'observer'))

    // 6. Insignia «La primera semilla» (siembra aprobada con foto)
    const sowingAct = await prisma.gardenActivity.create({
      data: {
        gardenId: garden.id,
        actorUserId: user.id,
        type: 'sowing',
        performedDate: '2026-11-07',
        targetKind: 'plant',
        plantId: plant.id,
        reviewStatus: 'APPROVED',
      },
    })
    await prisma.activityEvidence.create({
      data: {
        activityId: sowingAct.id,
        filePath: '/mock/sowing.jpg',
        fileUrl: '/uploads/activities/sowing.jpg',
        mimeType: 'image/jpeg',
        fileSize: 2048,
      },
    })
    await evaluateActivityReward({
      id: sowingAct.id,
      actorUserId: user.id,
      type: 'sowing',
      performedDate: '2026-11-07',
      targetKind: 'plant',
      plantId: plant.id,
    })

    missionState = await syncUserMissionsAndBadges(user.id)
    assert.ok(missionState.badges.some(b => b.badgeId === 'first-sowing'))

    // 6b. Misión «Ciclo lunar consciente» (3 actividades alineadas al calendario lunar aprobadas)
    for (const lunarDate of ['2026-10-10', '2026-10-18', '2026-10-25']) {
      const lunarInfo = calculateDayLunarInfo(lunarDate)
      const rec = lunarInfo.recommendations[0]
      assert.ok(rec && rec.activityType !== 'replanting', 'No debe recomendar replanting')
      await prisma.gardenActivity.create({
        data: {
          gardenId: garden.id,
          actorUserId: user.id,
          type: rec.activityType,
          performedDate: lunarDate,
          targetKind: 'garden',
          reviewStatus: 'APPROVED',
        },
      })
    }
    missionState = await syncUserMissionsAndBadges(user.id)
    const lunarMission = missionState.missions.find(m => m.missionId === 'lunar-cycle')
    assert.ok(lunarMission)
    assert.equal(lunarMission!.targetValue, 3)
    assert.ok(lunarMission!.currentValue >= 3)
    assert.equal(lunarMission!.completed, true)

    // 7. Prueba de anulación (void) y reversión de puntos + resumen oficial de revisión
    const pointsDeducted = await revertActivityReward(sowingAct.id, 'Error de registro por el usuario')
    assert.equal(pointsDeducted, -20, 'Debe descontar exactamente 20 puntos por reversión de siembra')

    const summaryAfterVoid = await getUserRewardsSummary(user.id)
    // El ledger debe reflejar la entrada original (+20) y la reversión (-20)
    assert.ok(summaryAfterVoid.ledger.some(l => l.sourceId === sowingAct.id && l.pointsDelta === -20))
    assert.equal(summaryAfterVoid.review.source, 'server')
    assert.ok(summaryAfterVoid.review.totals.reverted >= 1)

    console.log('✅ Pruebas de Recompensas y Misiones superadas con éxito.')
  } finally {
    // Limpieza de datos de prueba
    await prisma.rewardLedger.deleteMany({ where: { userId: user.id } }).catch(() => {})
    await prisma.userBadge.deleteMany({ where: { userId: user.id } }).catch(() => {})
    await prisma.userMissionProgress.deleteMany({ where: { userId: user.id } }).catch(() => {})
    await prisma.gardenActivity.deleteMany({ where: { actorUserId: user.id } }).catch(() => {})
    await prisma.cultivatedPlant.deleteMany({ where: { registeredById: user.id } }).catch(() => {})
    await prisma.realGarden.deleteMany({ where: { createdById: user.id } }).catch(() => {})
    await prisma.user.delete({ where: { id: user.id } }).catch(() => {})
  }
}
