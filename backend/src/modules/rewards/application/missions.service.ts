// backend/src/modules/rewards/application/missions.service.ts
// Responsable: Ronny Veloz (Rodni15)
// Sistema de misiones e insignias funcionales con seguimiento de progreso real

import type { MissionRepository, MissionLunarAdvisor } from './ports/mission.repository'

import { BADGE_DEFINITIONS, MISSION_TITLES } from '../domain/mission-rules'
export { BADGE_DEFINITIONS } from '../domain/mission-rules'
export type { BadgeDefinition } from '../domain/mission-rules'

/**
 * Evalúa y actualiza de manera idempotente todas las misiones e insignias para un usuario
 * basándose exclusivamente en actividades aprobadas por el MSP (reviewStatus: 'APPROVED', no anuladas).
 */
export function createMissionService(repository: MissionRepository, calculateDayLunarInfo: MissionLunarAdvisor) {
async function syncUserMissionsAndBadges(userId: string) {
  // Obtener únicamente actividades aprobadas por el MSP y no anuladas
  const activities = await repository.listApprovedActivities(userId)

  const desiredBadges = new Set<string>()

  // 1. Misión «Raíces cuidadas» (care): 3 riegos aprobados en fechas distintas
  const wateringActivities = activities.filter(a => a.type === 'watering')
  const distinctWateringDates = new Set(wateringActivities.map(a => a.performedDate))
  const wateringCount = distinctWateringDates.size
  await updateMissionProgress(userId, 'care', wateringCount, 3)
  if (wateringCount >= 3) {
    desiredBadges.add('care')
    await awardMissionBonusIfMissing(userId, 'care')
  }

  // 2. Misión «Mirada atenta» (observer): 3 observaciones aprobadas con foto en fechas distintas
  const observationWithPhoto = activities.filter(a => a.type === 'observation' && a.evidences.length > 0)
  const distinctObservationDates = new Set(observationWithPhoto.map(a => a.performedDate))
  const observerCount = distinctObservationDates.size
  await updateMissionProgress(userId, 'observer', observerCount, 3)
  if (observerCount >= 3) {
    desiredBadges.add('observer')
    await awardMissionBonusIfMissing(userId, 'observer')
  }

  // 3. Misión «Ciclo lunar consciente» (lunar-cycle):
  // Documentar 3 actividades aprobadas guiadas por las recomendaciones lunares del día (excluyendo replante).
  const lunarAdvisedKeys = new Set<string>()
  for (const act of activities) {
    if (act.type === 'replanting') continue
    try {
      const lunarInfo = calculateDayLunarInfo(act.performedDate, 'America/Guayaquil')
      const isAdvised = lunarInfo.recommendations.some(rec => rec.activityType === act.type)
      if (isAdvised) {
        lunarAdvisedKeys.add(`${act.performedDate}|${act.type}`)
      }
    } catch {
      // Ignorar si la fecha no es parseable
    }
  }

  const lunarCount = lunarAdvisedKeys.size
  await updateMissionProgress(userId, 'lunar-cycle', lunarCount, 3)
  if (lunarCount >= 3) {
    desiredBadges.add('lunar-cycle')
    await awardMissionBonusIfMissing(userId, 'lunar-cycle')
  }

  // 4. Insignia «La primera semilla» (first-sowing): primera siembra aprobada con foto
  const hasSowingWithPhoto = activities.some(a => a.type === 'sowing' && a.evidences.length > 0)
  if (hasSowingWithPhoto) {
    desiredBadges.add('first-sowing')
  }

  // 5. Insignia «Cosecha con memoria» (harvest): primera cosecha aprobada con foto
  const hasHarvestWithPhoto = activities.some(a => a.type === 'harvest' && a.evidences.length > 0)
  if (hasHarvestWithPhoto) {
    desiredBadges.add('harvest')
  }

  // Sincronizar estrictamente insignias reales según actividades aprobadas
  for (const badgeId of Object.keys(BADGE_DEFINITIONS)) {
    if (desiredBadges.has(badgeId)) {
      await awardBadgeIfMissing(userId, badgeId)
    } else {
      await repository.deleteBadge(userId, badgeId)
    }
  }

  // Una invalidación posterior puede deshacer misiones ya acreditadas.
  for (const missionId of ['care', 'observer', 'lunar-cycle']) {
    await reconcileMissionBonus(userId, missionId, desiredBadges.has(missionId))
  }

  // Obtener estado final
  const badges = await repository.listBadges(userId)

  const missions = await repository.listMissions(userId)

  return {
    badges: badges.map(b => ({
      badgeId: b.badgeId,
      ...BADGE_DEFINITIONS[b.badgeId],
      earnedAt: b.earnedAt,
    })),
    missions: missions.map(m => ({
      missionId: m.missionId,
      currentValue: m.currentValue,
      targetValue: m.targetValue,
      completed: m.completed,
      completedAt: m.completedAt,
    })),
  }
}

async function updateMissionProgress(
  userId: string,
  missionId: string,
  currentVal: number,
  targetVal: number
) {
  const boundedVal = Math.min(targetVal, currentVal)
  const isCompleted = boundedVal >= targetVal

  const existing = await repository.findMission(userId,missionId)

  if (!existing) {
    await repository.createMission({userId,missionId,currentValue:boundedVal,targetValue:targetVal,completed:isCompleted,completedAt:isCompleted?new Date():null})
  } else {
    // Si ya estaba completado, mantener completedAt salvo si baja por anulación
    let completedAt = existing.completedAt
    if (!existing.completed && isCompleted) {
      completedAt = new Date()
    } else if (!isCompleted) {
      completedAt = null
    }

    await repository.updateMission(existing.id,{currentValue:boundedVal,targetValue:targetVal,completed:isCompleted,completedAt})
  }
}

async function awardMissionBonusIfMissing(userId: string, missionId: string) {
  await reconcileMissionBonus(userId, missionId, true)
}

async function reconcileMissionBonus(userId: string, missionId: string, completed: boolean) {
  const entries = await repository.getMissionLedger(userId,missionId)

  const reversedIds = new Set(entries.filter(e => e.reversalOfLedgerId).map(e => e.reversalOfLedgerId))
  const current = entries.filter(e => e.pointsDelta > 0 && !reversedIds.has(e.id)).at(-1)
  if (!completed && current) {
    await repository.createLedger({userId,eventType:`${current.eventType}.reversal`,ruleKey:`mission.${missionId}.reversal`,sourceId:missionId,pointsDelta:-current.pointsDelta,reversalOfLedgerId:current.id,reason:'Misión revertida tras invalidación de evidencia'})
  } else if (completed && !current) {
    const title = MISSION_TITLES[missionId] || missionId
    const awardedCount = entries.filter(e => e.pointsDelta > 0).length
    await repository.createLedger({userId,eventType:awardedCount===0?'mission.completed':`mission.completed.reactivated.${awardedCount}`,ruleKey:`mission.${missionId}.completed`,sourceId:missionId,pointsDelta:20,reason:`Misión completada: «${title}» (+20 Semillas de vida)`})
  }
}

async function awardBadgeIfMissing(userId: string, badgeId: string) {
  const existing = await repository.findBadge(userId,badgeId)

  if (!existing) {
    await repository.createBadge(userId,badgeId)
  }
}


return {syncUserMissionsAndBadges}
}
