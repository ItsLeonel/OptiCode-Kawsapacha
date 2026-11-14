/**
 * Contrato preparado para la API de notificaciones de Kawsapacha.
 * El backend determina los estados de moderación y cualquier ajuste de Semillas de vida.
 * Este módulo NO llama endpoints no implementados ni calcula puntos en el navegador.
 */
export type AdministrativeNoticeKind =
  | 'COMMUNITY_APPROVED'
  | 'COMMUNITY_NEEDS_CHANGES'
  | 'COMMUNITY_REJECTED'
  | 'EVIDENCE_APPROVED'
  | 'EVIDENCE_NEEDS_CHANGES'
  | 'EVIDENCE_REJECTED'
  | 'POINTS_ADJUSTED'

export type PointsState = 'PROVISIONAL' | 'CONFIRMED' | 'REVERTED'

export type AdministrativeNotice = Readonly<{
  id: string
  kind: AdministrativeNoticeKind
  title: string
  description: string
  createdAt: string
  readAt: string | null
  actorName?: string
  communityName?: string
  subjectName?: string
  reason?: string
  /** Solo valores devueltos por el servidor. Nunca recalcular puntos aquí. */
  points?: Readonly<{
    state: PointsState
    amount?: number
  }>
  /** Navegación opcional controlada por la aplicación, no por URLs de terceros. */
  actionLabel?: string
}>

/**
 * El adaptador que implemente Ronny se inyectará desde App.tsx cuando exista
 * un contrato HTTP confirmado. No se adivinan rutas ni se persisten lecturas localmente.
 */
export type AdministrativeNoticeSource = Readonly<{
  list: () => Promise<readonly AdministrativeNotice[]>
  markRead: (id: string) => Promise<AdministrativeNotice>
}>

const TITLES: Record<AdministrativeNoticeKind, string> = {
  COMMUNITY_APPROVED: 'Comunidad verificada',
  COMMUNITY_NEEDS_CHANGES: 'Correcciones solicitadas',
  COMMUNITY_REJECTED: 'Comunidad rechazada',
  EVIDENCE_APPROVED: 'Evidencia aprobada',
  EVIDENCE_NEEDS_CHANGES: 'Correcciones de evidencia',
  EVIDENCE_REJECTED: 'Evidencia rechazada',
  POINTS_ADJUSTED: 'Actualización de Semillas de vida',
}

export function noticeKindLabel(kind: AdministrativeNoticeKind): string {
  return TITLES[kind]
}

export function noticePointsLabel(state: PointsState): string {
  switch (state) {
    case 'PROVISIONAL': return 'Semillas provisionales'
    case 'CONFIRMED': return 'Semillas confirmadas'
    case 'REVERTED': return 'Semillas revertidas'
  }
}

export function isAdministrativeNotice(value: unknown): value is AdministrativeNotice {
  if (!value || typeof value !== 'object') return false
  const notice = value as Partial<AdministrativeNotice>
  return (
    typeof notice.id === 'string' && notice.id.length > 0 &&
    typeof notice.title === 'string' &&
    typeof notice.description === 'string' &&
    typeof notice.createdAt === 'string' &&
    (typeof notice.readAt === 'string' || notice.readAt === null) &&
    typeof notice.kind === 'string' && Object.prototype.hasOwnProperty.call(TITLES, notice.kind)
  )
}

/** Fecha segura: un servidor con una fecha inválida no rompe toda la bandeja. */
export function noticeDate(value: string): string {
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return 'Fecha no disponible'
  return date.toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' })
}
