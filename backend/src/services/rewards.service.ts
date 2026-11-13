// backend/src/services/rewards.service.ts
// Responsable: Ronny Veloz (Rodni15)
// Motor de recompensas centralizado "Semillas de vida" con Ledger inmutable

import { prisma } from '../config/prisma'

export type ActivityType =
  | 'preparation'
  | 'weeding'
  | 'sowing'
  | 'watering'
  | 'fertilizing'
  | 'hilling'
  | 'replanting'
  | 'observation'
  | 'harvest'

export const BASE_POINTS: Record<ActivityType, number> = {
  preparation: 10,
  weeding: 8,
  sowing: 20,
  watering: 5,
  fertilizing: 8,
  hilling: 8,
  replanting: 10,
  observation: 12,
  harvest: 20,
}

export const USER_LEVELS = [
  { name: 'Aprendiz', threshold: 0 },
  { name: 'Oficial', threshold: 100 },
  { name: 'Maestro', threshold: 300 },
] as const

export interface AwardResult {
  awarded: boolean
  pointsAwarded: number
  totalPoints: number
  level: string
  reason: string
}

/**
 * Calcula el balance y nivel de un usuario a partir de la suma de su ledger inmutable.
 */
export async function getUserRewardsSummary(userId: string) {
  const ledgerEntries = await prisma.rewardLedger.findMany({
    where: { userId },
    orderBy: { awardedAt: 'desc' },
  })

  const totalPoints = ledgerEntries.reduce((sum, entry) => sum + entry.pointsDelta, 0)

  let levelName = 'Aprendiz'
  let nextLevel: string | null = 'Oficial'
  let remaining = 100 - totalPoints
  let progressPercent = Math.min(100, Math.max(0, Math.round((totalPoints / 100) * 100)))

  if (totalPoints >= 300) {
    levelName = 'Maestro'
    nextLevel = null
    remaining = 0
    progressPercent = 100
  } else if (totalPoints >= 100) {
    levelName = 'Oficial'
    nextLevel = 'Maestro'
    remaining = 300 - totalPoints
    progressPercent = Math.min(100, Math.max(0, Math.round(((totalPoints - 100) / 200) * 100)))
  } else {
    levelName = 'Aprendiz'
    nextLevel = 'Oficial'
    remaining = Math.max(0, 100 - totalPoints)
    progressPercent = Math.min(100, Math.max(0, Math.round((totalPoints / 100) * 100)))
  }

  // Insignias desbloqueadas
  const badges = await prisma.userBadge.findMany({
    where: { userId },
    orderBy: { earnedAt: 'asc' },
  })

  // Progreso de misiones
  const missions = await prisma.userMissionProgress.findMany({
    where: { userId },
  })

  return {
    userId,
    points: totalPoints,
    level: levelName,
    nextLevel,
    remaining,
    progressPercent,
    ledger: ledgerEntries.map(e => ({
      id: e.id,
      eventType: e.eventType,
      sourceId: e.sourceId,
      pointsDelta: e.pointsDelta,
      reason: e.reason,
      awardedAt: e.awardedAt,
    })),
    badges: badges.map(b => ({
      badgeId: b.badgeId,
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

/**
 * Evalúa y otorga recompensas por una actividad agrícola.
 * Regla anti-abuso: Máximo 1 recompensa por (tipo + performedDate + usuario + objetivo).
 */
export async function evaluateActivityReward(activity: {
  id: string
  actorUserId: string
  type: string
  performedDate: string
  targetKind: string
  plantId?: string | null
  plotIndex?: number | null
}): Promise<AwardResult> {
  const { id: activityId, actorUserId: userId, type, performedDate, targetKind, plantId, plotIndex } = activity

  const basePoints = BASE_POINTS[type as ActivityType] ?? 0
  if (basePoints <= 0) {
    const summary = await getUserRewardsSummary(userId)
    return {
      awarded: false,
      pointsAwarded: 0,
      totalPoints: summary.points,
      level: summary.level,
      reason: `Actividad tipo "${type}" no contempla puntos configurados.`,
    }
  }

  // Objetivo identificable: huerto general, parcela específica o planta específica
  const targetKey = targetKind === 'plant' && plantId
    ? `plant:${plantId}`
    : targetKind === 'plot' && plotIndex !== null && plotIndex !== undefined
    ? `plot:${plotIndex}`
    : 'garden'

  // Verificar si ya existe una actividad del mismo tipo, en la misma fecha y mismo objetivo que ya haya recibido puntos
  const existingActivitiesSameDay = await prisma.gardenActivity.findMany({
    where: {
      actorUserId: userId,
      type,
      performedDate,
      voidedAt: null,
      id: { not: activityId },
    },
    include: {
      actorUser: {
        include: {
          rewardLedgers: {
            where: {
              sourceId: { not: activityId },
              pointsDelta: { gt: 0 },
            },
          },
        },
      },
    },
  })

  // Filtrar si alguna de esas actividades ya se premió para el mismo target
  const alreadyRewarded = existingActivitiesSameDay.some(act => {
    const actTarget = act.targetKind === 'plant' && act.plantId
      ? `plant:${act.plantId}`
      : act.targetKind === 'plot' && act.plotIndex !== null && act.plotIndex !== undefined
      ? `plot:${act.plotIndex}`
      : 'garden'
    if (actTarget !== targetKey) return false
    // Verificar si tiene ledger de puntos positivo
    return act.actorUser.rewardLedgers.some(ledger => ledger.sourceId === act.id)
  })

  if (alreadyRewarded) {
    const summary = await getUserRewardsSummary(userId)
    return {
      awarded: false,
      pointsAwarded: 0,
      totalPoints: summary.points,
      level: summary.level,
      reason: `Límite diario alcanzado: ya se premió una actividad de "${type}" para este objetivo en la fecha ${performedDate}.`,
    }
  }

  // Otorgar puntos en el libro mayor de manera atómica
  try {
    await prisma.rewardLedger.create({
      data: {
        userId,
        eventType: `activity.${type}`,
        ruleKey: `activity.${type}.daily_target`,
        sourceId: activityId,
        pointsDelta: basePoints,
        reason: `Recompensa por ${type} realizada el ${performedDate} (${targetKey})`,
      },
    })
  } catch (err: unknown) {
    // Si ya existía el registro único (reintento idempotente)
    const summary = await getUserRewardsSummary(userId)
    return {
      awarded: false,
      pointsAwarded: 0,
      totalPoints: summary.points,
      level: summary.level,
      reason: 'Recompensa ya otorgada previamente para esta actividad.',
    }
  }

  const summary = await getUserRewardsSummary(userId)
  return {
    awarded: true,
    pointsAwarded: basePoints,
    totalPoints: summary.points,
    level: summary.level,
    reason: `+${basePoints} Semillas de vida otorgadas exitosamente.`,
  }
}

/**
 * Revierte la recompensa asociada a una actividad cuando esta es anulada.
 */
export async function revertActivityReward(activityId: string, voidReason: string): Promise<number> {
  const originalLedger = await prisma.rewardLedger.findFirst({
    where: {
      sourceId: activityId,
      pointsDelta: { gt: 0 },
    },
  })

  if (!originalLedger) {
    return 0
  }

  // Verificar si ya fue revertido
  const existingReversal = await prisma.rewardLedger.findFirst({
    where: {
      reversalOfLedgerId: originalLedger.id,
    },
  })

  if (existingReversal) {
    return 0
  }

  const pointsToDeduct = -Math.abs(originalLedger.pointsDelta)

  await prisma.rewardLedger.create({
    data: {
      userId: originalLedger.userId,
      eventType: `${originalLedger.eventType}.reversal`,
      ruleKey: 'activity.void.reversal',
      sourceId: activityId,
      pointsDelta: pointsToDeduct,
      reason: `Reversión por anulación de actividad: ${voidReason}`,
      reversalOfLedgerId: originalLedger.id,
    },
  })

  return pointsToDeduct
}

