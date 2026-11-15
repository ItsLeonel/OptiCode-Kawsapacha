// backend/src/modules/administration/application/audit.service.ts
import { prisma } from '../../../infrastructure/database/prisma'

export interface LogAuditInput {
  actorId: string
  action: string
  targetResource: string
  targetId: string
  details?: Record<string, unknown>
  ipAddress?: string | null
}

export async function logAudit(input: LogAuditInput) {
  try {
    return await prisma.auditLog.create({
      data: {
        actorId: input.actorId,
        action: input.action,
        targetResource: input.targetResource,
        targetId: input.targetId,
        details: JSON.stringify(input.details ?? {}),
        ipAddress: input.ipAddress ?? null,
      },
    })
  } catch (error) {
    // La auditoría nunca debe quebrar la operación principal si falla el log
    console.error('Error al registrar log de auditoría:', error)
    return null
  }
}

export async function listAuditLogs(options?: {
  page?: number
  limit?: number
  actorId?: string
  targetResource?: string
  action?: string
}) {
  const page = Math.max(1, options?.page ?? 1)
  const limit = Math.min(100, Math.max(1, options?.limit ?? 20))
  const skip = (page - 1) * limit

  const where: Record<string, unknown> = {}
  if (options?.actorId) where['actorId'] = options.actorId
  if (options?.targetResource) where['targetResource'] = options.targetResource
  if (options?.action) where['action'] = options.action

  const [total, logs] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      skip,
      take: limit,
      include: {
        actor: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    }),
  ])

  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    logs: logs.map(l => ({
      ...l,
      details: (() => {
        try {
          return JSON.parse(l.details)
        } catch {
          return {}
        }
      })(),
    })),
  }
}
