import { prisma } from '../../../infrastructure/database/prisma'
import type { AuditRepository } from '../application/ports/audit.repository'

/** Prisma vive únicamente en el adaptador. Se preserva el orden por timestamp. */
export const prismaAuditRepository: AuditRepository = {
  create(data) {
    return prisma.auditLog.create({ data })
  },
  count(where) {
    return prisma.auditLog.count({ where })
  },
  findMany(where, skip, take) {
    return prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      skip,
      take,
      include: { actor: { select: { id: true, name: true, email: true, role: true } } },
    })
  },
}
