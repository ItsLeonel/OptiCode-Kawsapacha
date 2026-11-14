/**
 * Fase 4.5 — Contrato de lectura para «Mi camino verde».
 * NO declara endpoints: los definirán los responsables del backend.
 * No se deben inferir estados MSP ni modificar semillas desde React.
 */
export type RewardReviewStatus = 'PENDING' | 'NEEDS_CHANGES' | 'APPROVED' | 'REJECTED'
export type RewardEffect = 'provisional' | 'confirmed' | 'reverted' | 'none'

export type AuthoritativeRewardReviewEntry = Readonly<{
  id: string
  evidenceId: string
  activityName: string
  status: RewardReviewStatus
  submittedAt: string
  reviewedAt?: string | null
  plantName?: string | null
  gardenName?: string | null
  reviewerNote?: string | null
  /** Efecto oficial de esta decisión, calculado por el backend, no por la interfaz. */
  effect: RewardEffect
  /** Magnitud absoluta informativa; puede ser cero y nunca se acumula en el navegador. */
  points?: number | null
}>

export type AuthoritativeRewardReview = Readonly<{
  source: 'server'
  updatedAt: string
  /** Saldos proporcionados directamente por la API autorizada. No son calculados con entries. */
  totals: Readonly<{
    provisional: number
    confirmed: number
    reverted: number
  }>
  entries: readonly AuthoritativeRewardReviewEntry[]
}>

export type RewardReviewFilter = 'ALL' | RewardReviewStatus

export const REWARD_REVIEW_STATUS_LABELS: Record<RewardReviewStatus, string> = {
  PENDING: 'Pendiente de revisión',
  NEEDS_CHANGES: 'Solicita correcciones',
  APPROVED: 'Aprobada',
  REJECTED: 'Rechazada',
}

export const REWARD_REVIEW_EFFECT_LABELS: Record<RewardEffect, string> = {
  provisional: 'Semillas provisionales',
  confirmed: 'Semillas confirmadas',
  reverted: 'Semillas revertidas',
  none: 'Sin movimiento de semillas',
}

const STATUSES: readonly RewardReviewStatus[] = ['PENDING', 'NEEDS_CHANGES', 'APPROVED', 'REJECTED']
const EFFECTS: readonly RewardEffect[] = ['provisional', 'confirmed', 'reverted', 'none']
const validCount = (value: unknown): value is number => Number.isSafeInteger(value) && (value as number) >= 0
const validDate = (value: unknown): value is string => typeof value === 'string' && !Number.isNaN(Date.parse(value))
const optionalText = (value: unknown) => value == null || typeof value === 'string'

/** Descarta snapshots incompletos o mal formados; nunca rellena balances supuestos. */
export function isAuthoritativeRewardReview(value: unknown): value is AuthoritativeRewardReview {
  if (!value || typeof value !== 'object') return false
  const data = value as Record<string, unknown>
  if (data.source !== 'server' || !validDate(data.updatedAt)) return false
  const totals = data.totals as Record<string, unknown> | null
  if (!totals || typeof totals !== 'object' || !validCount(totals.provisional) || !validCount(totals.confirmed) || !validCount(totals.reverted)) return false
  if (!Array.isArray(data.entries)) return false
  const ids = new Set<string>()
  return data.entries.every((item: unknown) => {
    if (!item || typeof item !== 'object') return false
    const row = item as Record<string, unknown>
    if (typeof row.id !== 'string' || !row.id || ids.has(row.id) ||
      typeof row.evidenceId !== 'string' || !row.evidenceId ||
      typeof row.activityName !== 'string' || !row.activityName.trim() ||
      !STATUSES.includes(row.status as RewardReviewStatus) ||
      !EFFECTS.includes(row.effect as RewardEffect) ||
      !validDate(row.submittedAt) ||
      (row.reviewedAt != null && !validDate(row.reviewedAt)) ||
      !optionalText(row.plantName) || !optionalText(row.gardenName) || !optionalText(row.reviewerNote) ||
      (row.points != null && !validCount(row.points))) return false
    ids.add(row.id)
    return true
  })
}

export function filterRewardReviews(entries: readonly AuthoritativeRewardReviewEntry[], filter: RewardReviewFilter) {
  return filter === 'ALL' ? entries : entries.filter(item => item.status === filter)
}
