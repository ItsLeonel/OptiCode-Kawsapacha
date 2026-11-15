/** Datos de auditoría, independientes de Prisma y Express. */
export interface LogAuditInput {
  actorId: string
  action: string
  targetResource: string
  targetId: string
  details?: Record<string, unknown>
  ipAddress?: string | null
}

export interface AuditLogFilter {
  actorId?: string
  targetResource?: string
  action?: string
}

export interface AuditRecord {
  id: string
  actorId: string
  action: string
  targetResource: string
  targetId: string
  details: string
  ipAddress: string | null
  timestamp: Date
}

export interface AuditLogWithActor extends AuditRecord {
  actor: { id: string; name: string; email: string; role: string }
}

export function decodeAuditDetails(details: string): unknown {
  try {
    return JSON.parse(details)
  } catch {
    return {}
  }
}
