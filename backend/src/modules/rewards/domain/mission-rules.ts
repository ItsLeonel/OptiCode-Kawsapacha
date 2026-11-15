export interface BadgeDefinition {
  id: string
  title: string
  description: string
  icon: string
}

export const BADGE_DEFINITIONS: Record<string, BadgeDefinition> = {
  'first-sowing': {
    id: 'first-sowing',
    title: 'La primera semilla',
    description: 'Una siembra registrada con evidencia fotográfica',
    icon: '🌱',
  },
  'care': {
    id: 'care',
    title: 'Raíces cuidadas',
    description: 'Riego documentado en tres fechas distintas',
    icon: '💧',
  },
  'observer': {
    id: 'observer',
    title: 'Mirada atenta',
    description: 'Seguimiento con fotografía en tres fechas distintas',
    icon: '🔍',
  },
  'harvest': {
    id: 'harvest',
    title: 'Cosecha con memoria',
    description: 'Una cosecha registrada con evidencia fotográfica',
    icon: '🌾',
  },
  'lunar-cycle': {
    id: 'lunar-cycle',
    title: 'Ciclo lunar consciente',
    description: 'Documenta tres actividades guiadas por las recomendaciones lunares.',
    icon: '🌙',
  },
}

export const MISSION_TITLES: Record<string, string> = {
  care: 'Raíces cuidadas',
  observer: 'Mirada atenta',
  'lunar-cycle': 'Ciclo lunar consciente',
}

