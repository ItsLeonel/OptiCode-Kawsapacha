/** Políticas de recompensas: no dependen de Prisma, HTTP ni del sistema de archivos. */
export type ActivityType =
  | 'preparation'
  | 'weeding'
  | 'sowing'
  | 'watering'
  | 'fertilizing'
  | 'hilling'
  | 'replanting'
  | 'observation'
  | 'harvest'
  | 'sowing_ritual'
  | 'gratitude_ritual'
  | 'signage'
  | 'postharvest'

export const BASE_POINTS: Record<ActivityType, number> = {
  watering: 5,
  sowing: 20,
  harvest: 20,
  fertilizing: 8,
  preparation: 10,
  weeding: 8,
  hilling: 8,
  replanting: 10,
  observation: 12,
  sowing_ritual: 0,
  gratitude_ritual: 0,
  signage: 0,
  postharvest: 0,
}

export const USER_LEVELS = [
  { name: 'Aprendiz', threshold: 0 },
  { name: 'Oficial', threshold: 100 },
  { name: 'Maestro', threshold: 300 },
] as const

