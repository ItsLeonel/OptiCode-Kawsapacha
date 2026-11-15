import { decodeAuditDetails, type AuditLogFilter, type LogAuditInput } from '../domain/audit'
import type { AuditRepository } from './ports/audit.repository'

export type { LogAuditInput } from '../domain/audit'

/** La aplicación es independiente de las consultas y de la BD. */
export function createAuditService(repository: AuditRepository) {
  return {
    async logAudit(input: LogAuditInput) {
      try {
        return await repository.create({
          actorId: input.actorId,
          action: input.action,
          targetResource: input.targetResource,
          targetId: input.targetId,
          details: JSON.stringify(input.details ?? {}),
          ipAddress: input.ipAddress ?? null,
        })
      } catch (error) {
        // La auditoría nunca debe quebrar la operación principal si falla el log.
        console.error('Error al registrar log de auditoría:', error)
        return null
      }
    },

    async listAuditLogs(options?: {
      page?: number
      limit?: number
      actorId?: string
      targetResource?: string
      action?: string
    }) {
      const page = Math.max(1, options?.page ?? 1)
      const limit = Math.min(100, Math.max(1, options?.limit ?? 20))
      const skip = (page - 1) * limit

      const where: AuditLogFilter = {}
      if (options?.actorId) where.actorId = options.actorId
      if (options?.targetResource) where.targetResource = options.targetResource
      if (options?.action) where.action = options.action

      const [total, logs] = await Promise.all([
        repository.count(where),
        repository.findMany(where, skip, limit),
      ])

      return {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        logs: logs.map(l => ({ ...l, details: decodeAuditDetails(l.details) })),
      }
    },
  }
}
