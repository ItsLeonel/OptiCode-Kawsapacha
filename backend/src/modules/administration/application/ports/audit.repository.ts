import type { AuditLogFilter, AuditLogWithActor, AuditRecord } from '../../domain/audit'

export interface AuditRepository {
  create(data: {
    actorId: string
    action: string
    targetResource: string
    targetId: string
    details: string
    ipAddress: string | null
  }): Promise<AuditRecord>
  count(where: AuditLogFilter): Promise<number>
  findMany(where: AuditLogFilter, skip: number, take: number): Promise<AuditLogWithActor[]>
}
