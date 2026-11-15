import { prisma } from '../../../infrastructure/database/prisma'
import { logAudit } from '../audit.module'
import { createNotification } from '../../notifications/notification.module'

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
