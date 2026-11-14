/** Contratos visuales de Fase 4.5. Los endpoints definitivos los define el backend (#45).
 * Nunca sustituir datos sin API con valores inventados en producción. */
export type AdminPanelKind = 'msp' | 'tecnico'
export type AdminNavKey = 'inicio' | 'comunidades' | 'eventos' | 'recursos' | 'moderacion' | 'reportes' | 'usuarios' | 'configuracion' | 'auditoria'

export type SystemHealth = { api: 'online' | 'offline' | 'unknown'; database: 'online' | 'offline' | 'unknown' }
export type CommunityReviewDecision = 'APPROVED' | 'NEEDS_CHANGES' | 'REJECTED'
/** Solo puede ejecutarse tras la autorización ADMIN_MSP en el backend. */
export type CommunityReviewHandler = (communityId: string, decision: { state: CommunityReviewDecision; reason: string }) => Promise<void>
export type CommunityRow = {
  id: string
  name: string
  province: string
  state: 'PENDING' | 'APPROVED' | 'NEEDS_CHANGES' | 'REJECTED' | 'SUSPENDED'
  canton?: string
  responsibleName?: string
  description?: string
  createdAt?: string
  photoUrl?: string | null
  gardensCount?: number
  memberCount?: number
  reviewReason?: string
  /** Coordenadas reales autorizadas por el backend, nunca inventarlas. */
  latitude?: number | null
  longitude?: number | null
  coordinates?: { latitude: number; longitude: number } | null
}
/** Estados de las evidencias según #45; no equivalen al estado de una comunidad. */
export type EvidenceReviewState = 'PENDING' | 'APPROVED' | 'NEEDS_CHANGES' | 'REJECTED'
export type EvidenceDecision = Exclude<EvidenceReviewState, 'PENDING'>
export type EvidencePhoto = {
  id: string
  /** URL temporal/autorizada suministrada por backend; nunca exponer archivos privados públicos. */
  url: string
  description?: string
}
export type EvidenceReward = {
  state: 'PROVISIONAL' | 'CONFIRMED' | 'REVERSED' | 'NOT_ELIGIBLE'
  /** Valor oficial del backend. La interfaz no lo calcula ni modifica. */
  points?: number
}
export type EvidenceReviewHistoryRow = {
  id?: string
  state: EvidenceReviewState
  reason?: string
  reviewerName?: string
  reviewedAt?: string
}
/** Registro exclusivamente filtrado y autorizado para ADMIN_MSP por el backend. */
export type EvidenceReviewRow = {
  id: string
  state: EvidenceReviewState
  activityType: string
  activityDate: string
  createdAt?: string
  plantName?: string
  gardenName?: string
  communityName?: string
  province?: string
  authorName?: string
  observation?: string
  photos?: EvidencePhoto[]
  photoUrl?: string | null
  reviewReason?: string
  reviewHistory?: EvidenceReviewHistoryRow[]
  reward?: EvidenceReward
  /** Número de versión para evitar decisiones concurrentes, si la API lo ofrece. */
  version?: number
}
/** Se invoca solo tras validar rol y permisos en el servidor; error HTTP propaga al formulario. */
export type EvidenceReviewHandler = (evidenceId: string, decision: {
  state: EvidenceDecision
  reason: string
  expectedVersion?: number
}) => Promise<void>

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
  evidences?: EvidenceReviewRow[]
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
