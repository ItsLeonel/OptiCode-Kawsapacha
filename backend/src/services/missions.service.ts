// backend/src/services/missions.service.ts
// Responsable: Ronny Veloz (Rodni15)
// Sistema de misiones e insignias funcionales con seguimiento de progreso real

import { prisma } from '../config/prisma'
import { calculateDayLunarInfo } from './lunar-calendar.service'

export interface BadgeDefinition {
  id: string
  title: string
  description: string
  icon: string
}

export const BADGE_DEFINITIONS: Record<string, BadgeDefinition> = {
  'first-sowing': {
    id: 'first-sowing',
    title: 'La primera semilla',
    description: 'Una siembra registrada con evidencia fotográfica',
    icon: '🌱',
  },
  'care': {
    id: 'care',
    title: 'Raíces cuidadas',
    description: 'Riego documentado en tres fechas distintas',
    icon: '💧',
  },
  'observer': {
    id: 'observer',
    title: 'Mirada atenta',
    description: 'Seguimiento con fotografía en tres fechas distintas',
    icon: '🔍',
  },
  'harvest': {
    id: 'harvest',
    title: 'Cosecha con memoria',
    description: 'Una cosecha registrada con evidencia fotográfica',
    icon: '🌾',
  },
  'lunar-cycle': {
    id: 'lunar-cycle',
    title: 'Ciclo lunar consciente',
    description: 'Al menos dos actividades aconsejadas en dos etapas lunares diferentes',
    icon: '🌙',
  },
}

/**
 * Evalúa y actualiza de manera idempotente todas las misiones e insignias para un usuario
 * basándose en sus actividades válidas (no anuladas) y evidencias registradas.
 */
export async function syncUserMissionsAndBadges(userId: string) {
  // Obtener todas las actividades válidas del usuario con sus evidencias
  const activities = await prisma.gardenActivity.findMany({
    where: {
      actorUserId: userId,
      voidedAt: null,
    },
    include: {
      evidences: true,
    },
    orderBy: { performedDate: 'asc' },
  })

  // 1. Misión «Raíces cuidadas» (care): 3 riegos en fechas distintas
  const wateringActivities = activities.filter(a => a.type === 'watering')
  const distinctWateringDates = new Set(wateringActivities.map(a => a.performedDate))
  const wateringCount = distinctWateringDates.size
  await updateMissionProgress(userId, 'care', wateringCount, 3)
  if (wateringCount >= 3) {
    await awardBadgeIfMissing(userId, 'care')
  }

  // 2. Misión «Mirada atenta» (observer): 3 observaciones con foto en fechas distintas
  const observationWithPhoto = activities.filter(a => a.type === 'observation' && a.evidences.length > 0)
  const distinctObservationDates = new Set(observationWithPhoto.map(a => a.performedDate))
  const observerCount = distinctObservationDates.size
  await updateMissionProgress(userId, 'observer', observerCount, 3)
  if (observerCount >= 3) {
    await awardBadgeIfMissing(userId, 'observer')
  }

  // 3. Misión «Ciclo lunar consciente» (lunar-cycle):
  // Al menos 2 actividades diferentes aconsejadas por MSP en 2 etapas lunares diferentes
  const phasesWithAdvisedActivities = new Map<string, Set<string>>() // fase -> Set<activityType>
  for (const act of activities) {
    try {
      const lunarInfo = calculateDayLunarInfo(act.performedDate, 'America/Guayaquil')
      const isAdvised = lunarInfo.recommendations.some(rec => rec.activityType === act.type)
      if (isAdvised) {
        if (!phasesWithAdvisedActivities.has(lunarInfo.phase)) {
          phasesWithAdvisedActivities.set(lunarInfo.phase, new Set())
        }
        phasesWithAdvisedActivities.get(lunarInfo.phase)!.add(act.type)
      }
    } catch {
      // Ignorar si la fecha no es parseable
    }
  }

  // Contar cuántas fases distintas tienen actividades aconsejadas
  const distinctPhasesCount = phasesWithAdvisedActivities.size
  const totalDistinctActivitiesInPhases = new Set(
    Array.from(phasesWithAdvisedActivities.values()).flatMap(s => Array.from(s))
  ).size

  const lunarEligible = distinctPhasesCount >= 2 && totalDistinctActivitiesInPhases >= 2
  const lunarProgress = Math.min(2, distinctPhasesCount)
  await updateMissionProgress(userId, 'lunar-cycle', lunarProgress, 2)
  if (lunarEligible) {
    await awardBadgeIfMissing(userId, 'lunar-cycle')
  }

  // 4. Insignia «La primera semilla» (first-sowing): primera siembra con foto
  const hasSowingWithPhoto = activities.some(a => a.type === 'sowing' && a.evidences.length > 0)
  if (hasSowingWithPhoto) {
    await awardBadgeIfMissing(userId, 'first-sowing')
  }

  // 5. Insignia «Cosecha con memoria» (harvest): primera cosecha con foto
  const hasHarvestWithPhoto = activities.some(a => a.type === 'harvest' && a.evidences.length > 0)
  if (hasHarvestWithPhoto) {
    await awardBadgeIfMissing(userId, 'harvest')
  }

  // Obtener estado final
  const badges = await prisma.userBadge.findMany({
    where: { userId },
    orderBy: { earnedAt: 'asc' },
  })

  const missions = await prisma.userMissionProgress.findMany({
    where: { userId },
  })

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

  const existing = await prisma.userMissionProgress.findUnique({
    where: { userId_missionId: { userId, missionId } },
  })

  if (!existing) {
    await prisma.userMissionProgress.create({
      data: {
        userId,
        missionId,
        currentValue: boundedVal,
        targetValue: targetVal,
        completed: isCompleted,
        completedAt: isCompleted ? new Date() : null,
      },
    })
  } else {
    // Si ya estaba completado, mantener completedAt salvo si baja por anulación
    let completedAt = existing.completedAt
    if (!existing.completed && isCompleted) {
      completedAt = new Date()
    } else if (!isCompleted) {
      completedAt = null
    }

    await prisma.userMissionProgress.update({
      where: { id: existing.id },
      data: {
        currentValue: boundedVal,
        completed: isCompleted,
        completedAt,
      },
    })
  }
}

async function awardBadgeIfMissing(userId: string, badgeId: string) {
  const existing = await prisma.userBadge.findUnique({
    where: { userId_badgeId: { userId, badgeId } },
  })
  if (!existing) {
    await prisma.userBadge.create({
      data: {
        userId,
        badgeId,
      },
    })
  }
}

