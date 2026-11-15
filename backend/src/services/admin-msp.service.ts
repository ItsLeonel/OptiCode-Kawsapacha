// backend/src/services/admin-msp.service.ts
import { prisma } from '../config/prisma'
import { logAudit } from './audit.service'
import { createNotification } from './notification.service'
import { evaluateActivityReward, getUserRewardsSummary, revertActivityReward } from './rewards.service'
import { syncUserMissionsAndBadges } from './missions.service'
import { calculateGrowth } from './care.service'

// ─── SUPERVISIÓN DE COMUNIDADES (MSP) ─────────────────────────────────────────

export async function listCommunitiesForMsp(options?: {
  page?: number
  limit?: number
  province?: string
  status?: string
  search?: string
}) {
  const page = Math.max(1, options?.page ?? 1)
  const limit = Math.min(100, Math.max(1, options?.limit ?? 20))
  const skip = (page - 1) * limit

  const where: Record<string, unknown> = {}
  if (options?.province) where['province'] = options.province
  if (options?.status) where['status'] = options.status
  if (options?.search) {
    where['OR'] = [
      { name: { contains: options.search } },
      { responsible: { contains: options.search } },
      { location: { contains: options.search } },
    ]
  }

  const [total, communities] = await Promise.all([
    prisma.community.count({ where }),
    prisma.community.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        creator: {
          select: { id: true, name: true, email: true },
        },
        gardens: {
          select: {
            id: true,
            name: true,
            province: true,
            canton: true,
            parish: true,
            latitude: true,
            longitude: true,
            kind: true,
            areaM2: true,
          },
        },
        _count: {
          select: {
            members: { where: { status: 'ACCEPTED' } },
            gardens: true,
          },
        },
      },
    }),
  ])

  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    communities,
  }
}

export async function reviewCommunity(
  communityId: string,
  action: 'APPROVED' | 'NEEDS_CHANGES' | 'REJECTED' | 'SUSPENDED',
  reviewerId: string,
  reason?: string
) {
  const community = await prisma.community.findUnique({
    where: { id: communityId },
    include: { creator: true },
  })

  if (!community) {
    throw Object.assign(new Error('Comunidad no encontrada.'), { code: 'NOT_FOUND' })
  }

  if (action !== 'APPROVED' && (!reason || reason.trim().length < 5)) {
    throw Object.assign(
      new Error('Es obligatorio indicar un motivo detallado (mínimo 5 caracteres) para rechazar o solicitar cambios.'),
      { code: 'VALIDATION_ERROR' }
    )
  }

  const updated = await prisma.community.update({
    where: { id: communityId },
    data: {
      status: action,
      reviewedById: reviewerId,
      reviewReason: reason || null,
      reviewedAt: new Date(),
    },
    include: {
      creator: { select: { id: true, name: true, email: true } },
    },
  })

  await logAudit({
    actorId: reviewerId,
    action: `COMMUNITY_${action}`,
    targetResource: 'community',
    targetId: communityId,
    details: {
      previousStatus: community.status,
      newStatus: action,
      reason: reason || null,
      communityName: community.name,
    },
  })

  // Notificar al creador/responsable
  const titleMap: Record<string, string> = {
    APPROVED: '✨ Tu comunidad ha sido verificada y aprobada por el MSP',
    NEEDS_CHANGES: '⚠️ El MSP ha solicitado correcciones para tu comunidad',
    REJECTED: '❌ Tu solicitud de comunidad fue rechazada por el MSP',
    SUSPENDED: '⏸️ Tu comunidad ha sido suspendida temporalmente por el MSP',
  }
  const messageMap: Record<string, string> = {
    APPROVED: `¡Felicidades! La comunidad "${community.name}" ha sido aprobada oficialmente por la supervisión del MSP.`,
    NEEDS_CHANGES: `La supervisión del MSP revisó "${community.name}" y solicita correcciones: ${reason}`,
    REJECTED: `La comunidad "${community.name}" no fue aprobada por el siguiente motivo: ${reason}`,
    SUSPENDED: `La comunidad "${community.name}" fue suspendida: ${reason}`,
  }

  await createNotification({
    userId: community.creatorId,
    type: `COMMUNITY_${action}`,
    title: titleMap[action] || 'Actualización de estado de comunidad',
    message: messageMap[action] || `Estado actualizado a ${action}.`,
    resourceId: communityId,
  })

  return updated
}

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

// ─── EVENTOS INSTITUCIONALES DEL MSP ──────────────────────────────────────────

export async function listInstitutionalEvents() {
  // No generar eventos ficticios al leer una lista vacía.
  return prisma.mspInstitutionalEvent.findMany({
    orderBy: { date: 'asc' },
  })
}

export async function createInstitutionalEvent(input: {
  name: string
  date: string
  province?: string
  canton?: string
  scope?: string
  description?: string
  createdById?: string
}) {
  if (!input.name?.trim()) throw new Error('El nombre del evento es obligatorio.')
  if (!input.date?.trim()) throw new Error('La fecha del evento es obligatoria.')

  return prisma.mspInstitutionalEvent.create({
    data: {
      name: input.name.trim(),
      date: input.date.trim(),
      province: input.province?.trim() || 'Pichincha',
      canton: input.canton?.trim() || null,
      scope: input.scope?.trim() || 'NACIONAL',
      description: input.description?.trim() || '',
      createdById: input.createdById || null,
    },
  })
}

export async function deleteInstitutionalEvent(id: string) {
  return prisma.mspInstitutionalEvent.delete({ where: { id } })
}

// ─── RECURSOS EDUCATIVOS DEL MSP ──────────────────────────────────────────────

export async function listEducationalResources() {
  // Leer no debe insertar demos ni cambiar URLs legítimas de PDF.
  return prisma.mspEducationalResource.findMany({
    orderBy: { createdAt: 'desc' },
  })
}

export async function createEducationalResource(input: {
  title: string
  kind?: string
  description?: string
  fileUrl?: string
  published?: boolean
  createdById?: string
}) {
  if (!input.title?.trim()) throw new Error('El título del recurso es obligatorio.')
  const fileUrl = input.fileUrl?.trim()
  if (fileUrl) {
    const internalDoc = /^\/docs\/[a-zA-Z0-9/_-]+\.html$/.test(fileUrl) && !fileUrl.includes('..')
    let externalLink = false
    try {
      const parsed = new URL(fileUrl)
      externalLink = (parsed.protocol === 'https:' || parsed.protocol === 'http:') && !parsed.username && !parsed.password
    } catch { /* Ruta relativa: solo permitir documentos internos conocidos. */ }
    if (!internalDoc && !externalLink) {
      throw new Error('El enlace debe utilizar HTTPS/HTTP o apuntar a un documento interno /docs/*.html.')
    }
  }

  return prisma.mspEducationalResource.create({
    data: {
      title: input.title.trim(),
      kind: input.kind?.trim() || 'GUIA',
      description: input.description?.trim() || '',
      fileUrl: fileUrl || null,
      published: input.published ?? true,
      createdById: input.createdById || null,
    },
  })
}

export async function deleteEducationalResource(id: string) {
  return prisma.mspEducationalResource.delete({ where: { id } })
}

