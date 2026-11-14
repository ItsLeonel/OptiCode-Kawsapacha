// backend/src/services/admin-msp.service.ts
import { prisma } from '../config/prisma'
import { logAudit } from './audit.service'
import { createNotification } from './notification.service'
import { evaluateActivityReward } from './rewards.service'
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

  if (action !== 'APPROVED' && (!reason || reason.trim().length < 5)) {
    throw Object.assign(
      new Error('Es obligatorio indicar un motivo detallado (mínimo 5 caracteres) para rechazar o solicitar correcciones.'),
      { code: 'VALIDATION_ERROR' }
    )
  }

  if (action === 'APPROVED') {
    if (activity.garden?.community && activity.garden.community.status !== 'APPROVED') {
      throw Object.assign(
        new Error(`No se puede aprobar una actividad de la comunidad «${activity.garden.community.name}» porque su estado actual es "${activity.garden.community.status}". Primero debe aprobar la comunidad antes de evaluar sus actividades.`),
        { code: 'COMMUNITY_NOT_APPROVED' }
      )
    }

    // 1. Actualizar actividad a APPROVED
    const updated = await prisma.gardenActivity.update({
      where: { id: activityId },
      data: {
        reviewStatus: 'APPROVED',
        reviewedById: reviewerId,
        reviewReason: reason || null,
        reviewedAt: new Date(),
      },
    })

    // 1b. Si es actividad de siembra y tiene planta vinculada, aprobar también la planta
    if (activity.type === 'sowing' && activity.plantId) {
      await prisma.cultivatedPlant.update({
        where: { id: activity.plantId },
        data: { reviewStatus: 'APPROVED' },
      })
    }

    // 2. Acreditar formalmente los puntos al usuario (Flujo auditado)
    const rewardResult = await evaluateActivityReward({
      id: activity.id,
      actorUserId: activity.actorUserId,
      type: activity.type,
      performedDate: activity.performedDate,
      targetKind: activity.targetKind,
      plantId: activity.plantId,
      plotIndex: activity.plotIndex,
    })

    // 3. Sincronizar misiones e insignias del usuario tras ganar los puntos oficiales
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
        level: rewardResult.level,
      },
    })

    // 5. Notificación al usuario
    const actNameEs = ACTIVITY_NAMES_ES[activity.type] || activity.type
    await createNotification({
      userId: activity.actorUserId,
      type: 'ACTIVITY_APPROVED',
      title: '🌟 ¡Evidencia de actividad aprobada por el MSP!',
      message: `Tu actividad de «${actNameEs}» del ${activity.performedDate} fue aprobada. +${rewardResult.pointsAwarded} Semillas de vida acreditadas oficialmente a tu cuenta.`,
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

    // Si es siembra, mantener la planta en PENDING para que el usuario corrija y reenvíe
    // (no cambiamos el reviewStatus de la planta, se queda PENDING hasta que el MSP la apruebe)

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
      message: `En tu actividad de «${actNameEs}»: ${reason}. Por favor sube una fotografía más clara para validar tus puntos.`,
      resourceId: activityId,
    })

    return { activity: updated, reward: null }
  }

  // action === 'REJECTED'
  const updated = await prisma.gardenActivity.update({
    where: { id: activityId },
    data: {
      reviewStatus: 'REJECTED',
      reviewedById: reviewerId,
      reviewReason: reason || null,
      reviewedAt: new Date(),
    },
  })

  // Si es siembra rechazada, marcar la planta también como REJECTED (bloqueada permanentemente)
  if (activity.type === 'sowing' && activity.plantId) {
    await prisma.cultivatedPlant.update({
      where: { id: activity.plantId },
      data: { reviewStatus: 'REJECTED' },
    })
  }

  await logAudit({
    actorId: reviewerId,
    action: 'ACTIVITY_REJECTED',
    targetResource: 'activity',
    targetId: activityId,
    details: { reason },
  })

  const actNameEs = ACTIVITY_NAMES_ES[activity.type] || activity.type
  await createNotification({
    userId: activity.actorUserId,
    type: 'ACTIVITY_REJECTED',
    title: '⚠️ Actividad no aprobada por el MSP',
    message: `Tu actividad de «${actNameEs}» no fue aprobada por el siguiente motivo: ${reason}.`,
    resourceId: activityId,
  })

  return { activity: updated, reward: null }
}

// ─── EVENTOS INSTITUCIONALES DEL MSP ──────────────────────────────────────────

const DEFAULT_MSP_EVENTS = [
  {
    name: 'Minga Nacional Agroecológica Kawsapacha',
    province: 'Pichincha',
    canton: 'Quito',
    scope: 'NACIONAL',
    date: '2026-11-28',
    description: 'Jornada comunitaria de siembra, intercambio de semillas y capacitaciones en agroecología.',
  },
  {
    name: 'Feria de Semillas Nativas y Salud Comunitaria',
    province: 'Chimborazo',
    canton: 'Riobamba',
    scope: 'PROVINCIAL',
    date: '2026-12-05',
    description: 'Exposición de variedades ancestrales y talleres de medicina tradicional avalados por el MSP.',
  },
  {
    name: 'Taller Provincial de Compostaje y Riego Eficiente',
    province: 'Azuay',
    canton: 'Cuenca',
    scope: 'PROVINCIAL',
    date: '2026-12-12',
    description: 'Capacitación práctica para promotores y responsables de huertos comunitarios.',
  },
]

export async function listInstitutionalEvents() {
  const count = await prisma.mspInstitutionalEvent.count()
  if (count === 0) {
    for (const ev of DEFAULT_MSP_EVENTS) {
      await prisma.mspInstitutionalEvent.create({ data: ev })
    }
  }
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

const DEFAULT_MSP_RESOURCES = [
  {
    title: 'Guía Oficial de Cultivo y Propiedades de Plantas Medicinales Andinas',
    kind: 'GUIA',
    description: 'Documento técnico del MSP con fichas agroecológicas, propiedades terapéuticas y dosificación tradicional.',
    fileUrl: '/docs/guia-plantas-medicinales-msp.html',
    published: true,
  },
  {
    title: 'Manual de Manejo Agroecológico de Suelos y Compostaje Comunitario',
    kind: 'MANUAL',
    description: 'Técnicas orgánicas para regeneración del suelo, lombricultura y biofertilizantes locales.',
    fileUrl: '/docs/manual-compostaje-suelos-msp.html',
    published: true,
  },
  {
    title: 'Ficha Técnica: Calendario Agroecológico Lunar Kawsapacha',
    kind: 'FICHA',
    description: 'Recomendaciones del MSP sobre fases lunares, siembra, labores de cultivo y cosecha oportuna.',
    fileUrl: '/docs/ficha-calendario-lunar-msp.html',
    published: true,
  },
  {
    title: 'Protocolo de Seguridad Alimentaria en Huertos Comunitarios',
    kind: 'GUIA',
    description: 'Normativa sanitaria básica para la manipulación, lavado y consumo seguro de hortalizas.',
    fileUrl: '/docs/protocolo-seguridad-alimentaria.html',
    published: true,
  },
]

export async function listEducationalResources() {
  const count = await prisma.mspEducationalResource.count()
  if (count === 0) {
    for (const res of DEFAULT_MSP_RESOURCES) {
      await prisma.mspEducationalResource.create({ data: res })
    }
  } else {
    // Migración automática: sincronizar URLs previas con extensión .pdf a .html
    const pdfResources = await prisma.mspEducationalResource.findMany({
      where: { fileUrl: { contains: '.pdf' } },
    })
    for (const item of pdfResources) {
      if (item.fileUrl) {
        await prisma.mspEducationalResource.update({
          where: { id: item.id },
          data: { fileUrl: item.fileUrl.replace(/\.pdf$/i, '.html') },
        })
      }
    }
  }
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

  return prisma.mspEducationalResource.create({
    data: {
      title: input.title.trim(),
      kind: input.kind?.trim() || 'GUIA',
      description: input.description?.trim() || '',
      fileUrl: input.fileUrl?.trim() || null,
      published: input.published ?? true,
      createdById: input.createdById || null,
    },
  })
}

export async function deleteEducationalResource(id: string) {
  return prisma.mspEducationalResource.delete({ where: { id } })
}
