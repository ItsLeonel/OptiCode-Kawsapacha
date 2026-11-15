import { prisma } from '../../../infrastructure/database/prisma'
import { logAudit } from '../audit.module'
import { createNotification } from '../../notifications/notification.module'
import { evaluateActivityReward, getUserRewardsSummary, revertActivityReward } from '../../rewards/rewards.module'
import { syncUserMissionsAndBadges } from '../../rewards/missions.module'
import { calculateGrowth } from '../../activities/application/care.service'

// ─── SUPERVISIÓN DE ACTIVIDADES Y EVIDENCIAS (MSP) ─────────────────────────────

export async function listActivitiesForMsp(options?: {
  page?: number
  limit?: number
  status?: string
  gardenId?: string
  type?: string
}) {
  const page = Math.max(1, options?.page ?? 1)
  const limit = Math.min(100, Math.max(1, options?.limit ?? 20))
  const skip = (page - 1) * limit

  const where: Record<string, unknown> = {
    voidedAt: null,
  }
  if (options?.status) where['reviewStatus'] = options.status
  if (options?.gardenId) where['gardenId'] = options.gardenId
  if (options?.type) where['type'] = options.type

  const [total, activities] = await Promise.all([
    prisma.gardenActivity.count({ where }),
    prisma.gardenActivity.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        actorUser: {
          select: { id: true, name: true, email: true },
        },
        garden: {
          select: { id: true, name: true, province: true, canton: true, communityId: true },
        },
        plant: {
          include: { species: true },
        },
        evidences: true,
      },
    }),
  ])

  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    activities,
  }
}

const ACTIVITY_NAMES_ES: Record<string, string> = {
  preparation: 'Preparación del terreno',
  watering: 'Riego',
  fertilizing: 'Abonado orgánico',
  weeding: 'Limpieza y mantenimiento',
  hilling: 'Aporque',
  harvest: 'Cosecha',
  sowing: 'Siembra',
  replanting: 'Trasplante o resiembra',
  observation: 'Observación botánica',
  sowing_ritual: 'Ritual de siembra',
  gratitude_ritual: 'Ritual de gratitud',
  signage: 'Señalética medicinal',
  postharvest: 'Poscosecha y conservación',
}

export async function reviewActivity(
  activityId: string,
  action: 'APPROVED' | 'NEEDS_CHANGES' | 'REJECTED',
  reviewerId: string,
  reason?: string
) {
  const activity = await prisma.gardenActivity.findUnique({
    where: { id: activityId },
    include: {
      actorUser: true,
      evidences: true,
      garden: {
        include: {
          community: {
            select: { id: true, name: true, status: true },
          },
        },
      },
    },
  })

  if (!activity) {
    throw Object.assign(new Error('Actividad no encontrada.'), { code: 'NOT_FOUND' })
  }

  if (activity.voidedAt) {
    throw Object.assign(new Error('No se puede revisar una actividad anulada.'), { code: 'ACTIVITY_VOIDED' })
  }

  // Una actividad es válida desde el registro. Su auditoría humana se distingue
  // por reviewedById/reviewedAt. Una actividad rechazada no se reabre sin apelación.
  if (activity.reviewStatus === 'REJECTED' && action !== 'REJECTED') {
    throw Object.assign(
      new Error('Transición no permitida sin proceso de corrección o apelación.'),
      { code: 'REVIEW_FINALIZED' }
    )
  }

  if (action !== 'APPROVED' && (!reason || reason.trim().length < 5)) {
    throw Object.assign(
      new Error('Es obligatorio indicar un motivo detallado (mínimo 5 caracteres) para rechazar o solicitar correcciones.'),
      { code: 'VALIDATION_ERROR' }
    )
  }

  // Reintentos idempotentes: no generar otra notificación ni auditoría por la misma resolución.
  if (activity.reviewStatus === action && action === 'APPROVED' && activity.reviewedAt) {
    const current = await getUserRewardsSummary(activity.actorUserId)
    return {
      activity,
      reward: {
        awarded: false,
        pointsAwarded: 0,
        totalPoints: current.points,
        level: current.level,
        reason: 'La actividad ya estaba aprobada.',
      },
    }
  }
  if (activity.reviewStatus === action && (action === 'REJECTED' || action === 'NEEDS_CHANGES')) {
    return { activity, reward: null }
  }

  if (action === 'APPROVED') {
    // La verificación de evidencias no depende de que la comunidad PENDING esté aprobada.

    // 1. Actualizar actividad a APPROVED
    const changed = await prisma.gardenActivity.updateMany({
      where: { id: activityId, reviewStatus: activity.reviewStatus, reviewedAt: activity.reviewedAt },
      data: {
        reviewStatus: 'APPROVED',
        reviewedById: reviewerId,
        reviewReason: reason || null,
        reviewedAt: new Date(),
      },
    })
    if (changed.count !== 1) {
      throw Object.assign(new Error('La actividad ya fue revisada por otra persona.'), { code: 'REVIEW_FINALIZED' })
    }
    const updated = await prisma.gardenActivity.findUniqueOrThrow({ where: { id: activityId } })

    // 1b. Si es actividad de siembra y tiene planta vinculada, aprobar también la planta
    if (activity.type === 'sowing' && activity.plantId) {
      await prisma.cultivatedPlant.update({
        where: { id: activity.plantId },
        data: { reviewStatus: 'APPROVED' },
      })
    }

    // 2. No crear nuevos puntos si ya fueron acreditados al registrar.
    const rewardResult = await evaluateActivityReward({
      id: activity.id,
      actorUserId: activity.actorUserId,
      type: activity.type,
      performedDate: activity.performedDate,
      targetKind: activity.targetKind,
      plantId: activity.plantId,
      plotIndex: activity.plotIndex,
    })

    // 3. Sincronizar misiones e insignias verificadas.
    await syncUserMissionsAndBadges(activity.actorUserId)

    // 3b. Si la actividad está ligada a una planta, recalcular su crecimiento y ciclo de vida
    if (activity.plantId) {
      try {
        await calculateGrowth(activity.plantId)
      } catch (growthErr) {
        console.warn('Error al recalcular crecimiento tras aprobación:', growthErr)
      }
    }

    // 4. Log de auditoría
    await logAudit({
      actorId: reviewerId,
      action: 'ACTIVITY_APPROVED',
      targetResource: 'activity',
      targetId: activityId,
      details: {
        pointsAwarded: rewardResult.pointsAwarded,
        totalPoints: rewardResult.totalPoints,
        previousStatus: activity.reviewStatus,
        level: rewardResult.level,
      },
    })

    // 5. Notificación al usuario
    const actNameEs = ACTIVITY_NAMES_ES[activity.type] || activity.type
    await createNotification({
      userId: activity.actorUserId,
      type: 'ACTIVITY_APPROVED',
      title: '🌟 Actividad comprobada por el MSP',
      message: `Tu actividad de «${actNameEs}» del ${activity.performedDate} fue comprobada por el MSP. No se duplicaron sus puntos.`,
      resourceId: activityId,
    })

    return { activity: updated, reward: rewardResult }
  }

  if (action === 'NEEDS_CHANGES') {
    const updated = await prisma.gardenActivity.update({
      where: { id: activityId },
      data: {
        reviewStatus: 'NEEDS_CHANGES',
        reviewedById: reviewerId,
        reviewReason: reason || null,
        reviewedAt: new Date(),
      },
    })

    // Solicitar corrección no elimina la planta ni revierte puntos: solo el rechazo invalida.

    await logAudit({
      actorId: reviewerId,
      action: 'ACTIVITY_NEEDS_CHANGES',
      targetResource: 'activity',
      targetId: activityId,
      details: { reason },
    })

    const actNameEs = ACTIVITY_NAMES_ES[activity.type] || activity.type
    await createNotification({
      userId: activity.actorUserId,
      type: 'ACTIVITY_NEEDS_CHANGES',
      title: '📷 El MSP solicita mejorar la evidencia fotográfica',
      message: `En tu actividad de «${actNameEs}»: ${reason}. Corrige o complementa la evidencia. Los puntos se mantienen salvo invalidación explícita.`,
      resourceId: activityId,
    })

    return { activity: updated, reward: null }
  }

  // action === 'REJECTED': estado y reversión deben confirmarse juntos.
  const { updated, pointsReverted } = await prisma.$transaction(async tx => {
    const changed = await tx.gardenActivity.updateMany({
      where: { id: activityId, reviewStatus: activity.reviewStatus, voidedAt: null },
      data: {
        reviewStatus: 'REJECTED',
        reviewedById: reviewerId,
        reviewReason: reason || null,
        reviewedAt: new Date(),
      },
    })
    if (changed.count !== 1) {
      throw Object.assign(new Error('La actividad fue revisada por otra persona. Actualiza la bandeja.'), { code: 'REVIEW_FINALIZED' })
    }
    if (activity.type === 'sowing' && activity.plantId) {
      await tx.cultivatedPlant.update({
        where: { id: activity.plantId },
        data: { reviewStatus: 'REJECTED' },
      })
    }
    const pointsReverted = await revertActivityReward(activityId, `Invalidación MSP: ${reason}`, tx)
    const updated = await tx.gardenActivity.findUniqueOrThrow({ where: { id: activityId } })
    return { updated, pointsReverted }
  })
  await syncUserMissionsAndBadges(activity.actorUserId)

  await logAudit({
    actorId: reviewerId,
    action: 'ACTIVITY_REJECTED',
    targetResource: 'activity',
    targetId: activityId,
    details: { reason, previousStatus: activity.reviewStatus, pointsReverted },
  })
  const actNameEs = ACTIVITY_NAMES_ES[activity.type] || activity.type
  await createNotification({
    userId: activity.actorUserId,
    type: 'ACTIVITY_REJECTED',
    title: '⚠️ Actividad invalidada por el MSP',
    message: `Tu actividad de «${actNameEs}» fue invalidada: ${reason}. Ajuste de puntos: ${pointsReverted} Semillas.`,
    resourceId: activityId,
  })
  return { activity: updated, reward: null, pointsReverted }
}
