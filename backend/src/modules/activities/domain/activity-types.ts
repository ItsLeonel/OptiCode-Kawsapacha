/** Tipos agrícolas permitidos, compartidos por aplicación y dominio. */
export const VALID_ACTIVITY_TYPES = [
  'preparation',
  'weeding',
  'sowing',
  'watering',
  'fertilizing',
  'hilling',
  'observation',
  'harvest',
  'sowing_ritual',
  'gratitude_ritual',
  'signage',
  'postharvest',
] as const

export type ActivityType = typeof VALID_ACTIVITY_TYPES[number]

