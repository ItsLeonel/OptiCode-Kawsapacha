// backend/src/modules/rewards/application/rewards.service.ts
// Responsable: Ronny Veloz (Rodni15)
// Motor de recompensas centralizado "Semillas de vida" con Ledger inmutable

import type { RewardRepository } from './ports/reward.repository'

import { BASE_POINTS, type ActivityType } from '../domain/reward-rules'
export { BASE_POINTS, USER_LEVELS } from '../domain/reward-rules'
export type { ActivityType } from '../domain/reward-rules'

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
export function createRewardService(repository: RewardRepository) {
  async function getUserRewardsSummary(userId: string) {
  const [ledgerEntries, badges, missions, userActivities] = await Promise.all([
    repository.getLedger(userId),
    repository.getBadges(userId),
    repository.getMissions(userId),
    repository.getActivities(userId),
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
async function evaluateActivityReward(activity: {
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
  const existingAward = await repository.findAward(userId, `activity.${type}`, activityId)

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
  const existingActivitiesSameDay = await repository.findSameDayActivities(userId, type, performedDate, activityId)

  // Filtrar si alguna de esas actividades ya se premió para el mismo target
  const reversed = await repository.findReversalIds(userId)

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
    await repository.createAward({
      userId,
      eventType: `activity.${type}`,
      ruleKey: `activity.${type}.daily_target`,
      sourceId: activityId,
      pointsDelta: basePoints,
      reason: `Recompensa por ${type} realizada el ${performedDate} (${targetKey})`,
    })
  } catch (err: unknown) {
    if (!(err instanceof Error && 'code' in err && err.code === 'REWARD_DUPLICATE')) throw err
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


  return { getUserRewardsSummary, evaluateActivityReward }
}
