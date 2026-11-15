import { createAuditService } from './application/audit.service'
import { prismaAuditRepository } from './infrastructure/prisma-audit.repository'

export const { logAudit, listAuditLogs } = createAuditService(prismaAuditRepository)
