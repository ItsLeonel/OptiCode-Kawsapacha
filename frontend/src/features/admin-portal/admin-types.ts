/** Contratos visuales de Fase 4.5. Los endpoints definitivos los define el backend (#45).
 * Nunca sustituir datos sin API con valores inventados en producción. */
export type AdminPanelKind = 'msp' | 'tecnico'
export type AdminNavKey = 'inicio' | 'comunidades' | 'eventos' | 'recursos' | 'moderacion' | 'reportes' | 'usuarios' | 'configuracion' | 'auditoria'

export type SystemHealth = { api: 'online' | 'offline' | 'unknown'; database: 'online' | 'offline' | 'unknown' }
export type CommunityRow = { id: string; name: string; province: string; state: 'PENDING' | 'APPROVED' | 'NEEDS_CHANGES' | 'REJECTED' }
export type EventRow = { id: string; name: string; date: string; province: string; scope: string }
export type ResourceRow = { id: string; title: string; kind: string; published: boolean }
export type ModerationRow = { id: string; type: string; title: string; status: string }
export type AdminUserRow = { id: string; name: string; email: string; role: string; active: boolean; lastSeen?: string }
export type AuditRow = { id: string; date: string; actor: string; action: string; detail: string }

export type MspDashboardData = {
  communitiesTotal?: number
  communitiesApproved?: number
  activeEvents?: number
  educationalResources?: number
  moderationPending?: number
  communities?: CommunityRow[]
  events?: EventRow[]
  resources?: ResourceRow[]
  moderation?: ModerationRow[]
}
export type TechDashboardData = {
  accountsTotal?: number
  rolesTotal?: number
  pendingRequests?: number
  auditEvents?: number
  availabilityPercent?: number
  users?: AdminUserRow[]
  audit?: AuditRow[]
}
