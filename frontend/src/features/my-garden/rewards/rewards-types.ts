/** Contrato visual para conectar con el endpoint de gamificación cuando Ronny lo publique.
 * NO constituye una API existente ni se deben calcular estos valores desde el navegador. */
export type RewardBadgeId = 'first-sowing' | 'care' | 'observer' | 'harvest'
export type RewardMissionId = 'care' | 'observer' | 'lunar'
export type RewardLevel = 'Aprendiz' | 'Oficial' | 'Maestro'

export type AuthoritativeRewards = {
  source: 'server'
  seeds: number
  level: RewardLevel
  nextLevel?: RewardLevel
  progressPercent: number
  remaining: number
  badges: Array<{ id: RewardBadgeId; earned: boolean; earnedAt?: string }>
  missions: Array<{ id: RewardMissionId; current: number; target: number; completed: boolean; rewardSeeds?: number }>
}

/** Solo para explicar el estado local de prueba. El backend decidirá umbrales definitivos. */
export const DOCUMENTED_LEVELS = [
  { id: 'Aprendiz', threshold: 0 },
  { id: 'Oficial', threshold: 100 },
  { id: 'Maestro', threshold: 300 },
] as const

export const BADGE_DEFINITIONS: ReadonlyArray<{ id: RewardBadgeId; label: string; criterion: string; image: string }> = [
  { id: 'first-sowing', label: 'La primera semilla', criterion: 'Documenta una siembra con fotografía.', image: 'badge-seed' },
  { id: 'care', label: 'Raíces cuidadas', criterion: 'Registra riegos en tres fechas distintas.', image: 'badge-water' },
  { id: 'observer', label: 'Mirada atenta', criterion: 'Registra tres seguimientos fotográficos en distintas fechas.', image: 'badge-observe' },
  { id: 'harvest', label: 'Cosecha con memoria', criterion: 'Documenta una cosecha con fotografía.', image: 'badge-harvest' },
] as const

export const MISSION_DEFINITIONS: ReadonlyArray<{ id: RewardMissionId; label: string; criterion: string; image: string; target: number }> = [
  { id: 'care', label: 'Raíces cuidadas', criterion: 'Registra tres riegos necesarios en fechas distintas.', image: 'mission-water', target: 3 },
  { id: 'observer', label: 'Mirada atenta', criterion: 'Documenta tres observaciones con fotografía.', image: 'mission-camera', target: 3 },
  { id: 'lunar', label: 'Ciclo lunar consciente', criterion: 'Documenta actividades guiadas por las recomendaciones lunares.', image: 'mission-moon', target: 3 },
] as const
