// backend/src/services/rewards.service.ts
// Responsable: Ronny Veloz (Rodni15)
// Motor de recompensas centralizado "Semillas de vida" con Ledger inmutable

import { prisma } from '../config/prisma'
import { Prisma } from '@prisma/client'

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
  | 'sowing_ritual'
  | 'gratitude_ritual'
  | 'signage'
  | 'postharvest'

export const BASE_POINTS: Record<ActivityType, number> = {
  watering: 5,
  sowing: 20,
  harvest: 20,
  fertilizing: 8,
  preparation: 10,
  weeding: 8,
  hilling: 8,
  replanting: 10,
  observation: 12,
  sowing_ritual: 0,
  gratitude_ritual: 0,
  signage: 0,
  postharvest: 0,
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

const ACTIVITY_LABELS_ES: Record<string, string> = {
  preparation: 'Preparación del terreno',
  weeding: 'Limpieza y mantenimiento',
  sowing: 'Siembra',
  watering: 'Riego',
  fertilizing: 'Abonado orgánico',
  hilling: 'Aporque',
  observation: 'Observación botánica',
  harvest: 'Cosecha',
  sowing_ritual: 'Ritual de siembra',
  gratitude_ritual: 'Ritual de gratitud',
  signage: 'Señalética medicinal',
  postharvest: 'Poscosecha y conservación',
}

/**
 * Calcula el balance, historial de moderación y nivel de un usuario a partir del ledger y actividades.
 */
export async function getUserRewardsSummary(userId: string) {
  const [ledgerEntries, badges, missions, userActivities] = await Promise.all([
    prisma.rewardLedger.findMany({
      where: { userId },
      orderBy: { awardedAt: 'desc' },
    }),
    prisma.userBadge.findMany({
      where: { userId },
      orderBy: { earnedAt: 'asc' },
    }),
    prisma.userMissionProgress.findMany({
      where: { userId },
    }),
    prisma.gardenActivity.findMany({
      where: { actorUserId: userId, voidedAt: null },
      include: {
        plant: { include: { species: true } },
        garden: { select: { name: true } },
        evidences: { orderBy: { createdAt: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
  ])

  const totalPoints = Math.max(0, ledgerEntries.reduce((sum, entry) => sum + entry.pointsDelta, 0))

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

  // Los puntos del ledger son definitivos al registrarse.
  // El MSP solo puede descontarlos mediante movimientos negativos auditados.
  const confirmedPoints = totalPoints
  const provisionalPoints = 0 // Campo heredado del contrato API: ya no se generan puntos provisionales.
  const revertedPoints = ledgerEntries
    .filter(e => e.pointsDelta < 0)
    .reduce((sum, e) => sum + Math.abs(e.pointsDelta), 0)

  const reviewEntries = userActivities.map(act => {
    const status = (['PENDING', 'NEEDS_CHANGES', 'APPROVED', 'REJECTED'].includes(act.reviewStatus)
      ? act.reviewStatus
      : 'PENDING') as 'PENDING' | 'NEEDS_CHANGES' | 'APPROVED' | 'REJECTED'

    const actPositive = ledgerEntries
      .filter(e => e.sourceId === act.id && e.pointsDelta > 0)
      .reduce((s, e) => s + e.pointsDelta, 0)
    const actReverted = ledgerEntries
      .filter(e => e.sourceId === act.id && e.pointsDelta < 0)
      .reduce((s, e) => s + Math.abs(e.pointsDelta), 0)

    let effect: 'provisional' | 'confirmed' | 'reverted' | 'none' = 'none'
    let entryPoints: number | null = 0

    const net = Math.max(0, actPositive - actReverted)
    if (actReverted > 0 && net === 0) {
      effect = 'reverted'
      entryPoints = actReverted
    } else {
      // Incluso las actividades heredadas sin auditoría conservan los puntos ya ganados.
      effect = net > 0 ? 'confirmed' : 'none'
      entryPoints = net
    }

    return {
      id: act.id,
      evidenceId: act.evidences[0]?.id || act.id,
      activityName: ACTIVITY_LABELS_ES[act.type] || act.type,
      status,
      submittedAt: act.createdAt.toISOString(),
      reviewedAt: act.reviewedAt ? act.reviewedAt.toISOString() : null,
      plantName: act.plant?.customName || act.plant?.species?.name || null,
      gardenName: act.garden?.name || null,
      reviewerNote: act.reviewReason || null,
      effect,
      points: entryPoints,
    }
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
      rewardPoints: 20,
    })),
    review: {
      source: 'server' as const,
      updatedAt: new Date().toISOString(),
      totals: {
        provisional: provisionalPoints,
        confirmed: confirmedPoints,
        reverted: revertedPoints,
      },
      entries: reviewEntries,
    },
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

  // La aprobación MSP de una actividad ya registrada confirma puntos existentes;
  // no debe intentar insertar el mismo asiento y provocar errores de unicidad.
  const existingAward = await prisma.rewardLedger.findUnique({
    where: {
      userId_eventType_sourceId: { userId, eventType: `activity.${type}`, sourceId: activityId },
    },
  })
  if (existingAward) {
    const summary = await getUserRewardsSummary(userId)
    return {
      awarded: false, pointsAwarded: 0, totalPoints: summary.points,
      level: summary.level, reason: 'Recompensa ya registrada para esta actividad.',
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
  const reversed = await prisma.rewardLedger.findMany({
    where: { userId, reversalOfLedgerId: { not: null } },
    select: { reversalOfLedgerId: true },
  })
  const reversedIds = new Set(reversed.map(item => item.reversalOfLedgerId))
  const alreadyRewarded = existingActivitiesSameDay.some(act => {
    const actTarget = act.targetKind === 'plant' && act.plantId
      ? `plant:${act.plantId}`
      : act.targetKind === 'plot' && act.plotIndex !== null && act.plotIndex !== undefined
      ? `plot:${act.plotIndex}`
      : 'garden'
    if (actTarget !== targetKey) return false
    // Verificar si tiene ledger de puntos positivo
    return act.actorUser.rewardLedgers.some(ledger => ledger.sourceId === act.id && !reversedIds.has(ledger.id))
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
    // Un error de base de datos no se interpreta falsamente como duplicidad.
    if (!(err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002')) throw err
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
export async function revertActivityReward(activityId: string, voidReason: string, tx?: Prisma.TransactionClient): Promise<number> {
  const db = tx ?? prisma
  const originalLedger = await db.rewardLedger.findFirst({
    where: {
      sourceId: activityId,
      pointsDelta: { gt: 0 },
    },
  })

  if (!originalLedger) {
    return 0
  }

  // Verificar si ya fue revertido
  const existingReversal = await db.rewardLedger.findFirst({
    where: {
      reversalOfLedgerId: originalLedger.id,
    },
  })

  if (existingReversal) {
    return 0
  }

  const pointsToDeduct = -Math.abs(originalLedger.pointsDelta)

  await db.rewardLedger.create({
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

