import type { CommunityRow } from './admin-types'

/** Presentación de estados y datos de auditoría sin dependencias React. */
export function stateLabel(c: CommunityRow) {
  const map: Record<CommunityRow['state'], string> = {
    PENDING: 'Pendiente',
    APPROVED: 'Verificada',
    NEEDS_CHANGES: 'Requiere correcciones',
    REJECTED: 'Rechazada',
    SUSPENDED: 'Suspendida',
  }
  return map[c.state] || c.state
}

export const ACTIVITY_TYPE_MAP: Record<string, { label: string; icon: string }> = {
  preparation: { label: 'Preparación del terreno', icon: '🪵' },
  watering: { label: 'Riego', icon: '💧' },
  fertilizing: { label: 'Abonado orgánico', icon: '🌾' },
  weeding: { label: 'Limpieza y mantenimiento', icon: '🍃' },
  hilling: { label: 'Aporque', icon: '🪴' },
  harvest: { label: 'Cosecha', icon: '🌿' },
  sowing: { label: 'Siembra', icon: '🌱' },
  replanting: { label: 'Trasplante o resiembra', icon: '🔄' },
  observation: { label: 'Observación botánica', icon: '📷' },
}

export function formatActivityType(type: string): string {
  const item = ACTIVITY_TYPE_MAP[type]
  return item ? `${item.icon} ${item.label}` : type
}

const AUDIT_ACTION_MAP: Record<string, { label: string; tone: 'green' | 'red' | 'gold' | 'blue' | 'purple' | 'gray' }> = {
  ACTIVITY_APPROVED: { label: 'Aprobación de actividad', tone: 'green' },
  ACTIVITY_REJECTED: { label: 'Rechazo de actividad', tone: 'red' },
  ACTIVITY_NEEDS_CHANGES: { label: 'Corrección de actividad solicitada', tone: 'gold' },
  COMMUNITY_APPROVED: { label: 'Aprobación de comunidad', tone: 'green' },
  COMMUNITY_REJECTED: { label: 'Rechazo de comunidad', tone: 'red' },
  COMMUNITY_NEEDS_CHANGES: { label: 'Corrección de comunidad solicitada', tone: 'gold' },
  PROVISION_MSP: { label: 'Creación de funcionario MSP', tone: 'blue' },
  USER_STATUS_CHANGE: { label: 'Cambio de estado de usuario', tone: 'purple' },
  LOGIN: { label: 'Inicio de sesión', tone: 'blue' },
  LOGOUT: { label: 'Cierre de sesión', tone: 'gray' },
}

export function formatAuditAction(action: string): { label: string; tone?: 'green' | 'red' | 'gold' | 'blue' | 'purple' | 'gray' } {
  if (AUDIT_ACTION_MAP[action]) {
    return AUDIT_ACTION_MAP[action]
  }
  const clean = action.replace(/_/g, ' ').toLowerCase()
  return {
    label: clean.charAt(0).toUpperCase() + clean.slice(1),
    tone: 'gray',
  }
}

export function roleLabel(role: string): string {
  const map: Record<string, string> = {
    ADMIN_TECNICO: 'Admin Técnico',
    ADMIN_MSP: 'Funcionario MSP',
    USUARIO: 'Agricultor / Usuario',
    PARTICIPANTE: 'Participante',
    RESPONSABLE: 'Responsable',
  }
  return map[role] || role
}

const DETAIL_KEY_MAP: Record<string, string> = {
  reason: 'Motivo',
  pointsAwarded: 'Puntos otorgados',
  totalPoints: 'Puntos totales',
  level: 'Nivel',
  userEmail: 'Correo',
  email: 'Correo',
  userName: 'Nombre',
  name: 'Nombre',
  role: 'Rol',
  previousStatus: 'Estado previo',
  newStatus: 'Nuevo estado',
  creator: 'Creador',
  action: 'Acción',
  scope: 'Alcance',
  date: 'Fecha',
  status: 'Estado',
}

const DETAIL_VAL_MAP: Record<string, string> = {
  ACTIVE: 'Activo',
  INACTIVE: 'Inactivo',
  APPROVED: 'Aprobado',
  REJECTED: 'Rechazado',
  NEEDS_CHANGES: 'Requiere correcciones',
  PENDING: 'Pendiente',
  ADMIN_TECNICO: 'Admin Técnico',
  ADMIN_MSP: 'Funcionario MSP',
  USUARIO: 'Agricultor / Usuario',
  RESPONSABLE: 'Responsable',
  PARTICIPANTE: 'Participante',
}

const RESOURCE_MAP: Record<string, string> = {
  activity: 'Actividad',
  community: 'Comunidad',
  user: 'Usuario',
  garden: 'Huerto',
  plant: 'Planta',
}

function translateValue(val: unknown): string {
  if (val === null || val === undefined) return '—'
  if (typeof val === 'boolean') return val ? 'Sí' : 'No'
  if (typeof val === 'string' && DETAIL_VAL_MAP[val]) return DETAIL_VAL_MAP[val]
  if (typeof val === 'object') return JSON.stringify(val)
  return String(val)
}

export function formatAuditDetail(detail: unknown, resource?: string, targetId?: string): string {
  const resourceLabel = resource && RESOURCE_MAP[resource.toLowerCase()] ? RESOURCE_MAP[resource.toLowerCase()] : resource
  if (!detail) return `${resourceLabel || ''} ${targetId || ''}`.trim() || '—'

  let parsed: unknown = detail
  if (typeof detail === 'string') {
    try {
      parsed = JSON.parse(detail)
    } catch {
      return detail
    }
  }

  if (typeof parsed === 'object' && parsed !== null) {
    const entries = Object.entries(parsed as Record<string, unknown>)
      .map(([k, v]) => {
        const keyLabel = DETAIL_KEY_MAP[k] || k
        const valLabel = translateValue(v)
        return `${keyLabel}: ${valLabel}`
      })
    return entries.join(' · ')
  }

  return translateValue(detail)
}
