import type { ActivityType } from './activities'
import wateringArt from './activity-art/watering.png'
import sowingArt from './activity-art/sowing.png'
import fertilizingArt from './activity-art/fertilizing.png'
import harvestArt from './activity-art/harvest.png'

/** Catálogo de actividades reutilizable, independiente del estado del formulario. */
export type Category = 'all' | 'cultivo' | 'cuidado' | 'seguimiento' | 'cosecha'

export type ActivityCard = {
  short: string
  emoji: string
  art?: string
  category: Exclude<Category, 'all'>
}

export const ACTIVITY_CARDS: Record<ActivityType, ActivityCard> = {
  watering: { emoji: '💧', art: wateringArt, short: 'Riego', category: 'cuidado' },
  sowing: { emoji: '🌱', art: sowingArt, short: 'Siembra', category: 'cultivo' },
  fertilizing: { emoji: '🪴', art: fertilizingArt, short: 'Abonado', category: 'cuidado' },
  observation: { emoji: '🔎', short: 'Seguimiento', category: 'seguimiento' },
  harvest: { emoji: '🧺', art: harvestArt, short: 'Cosecha', category: 'cosecha' },
  preparation: { emoji: '🌾', short: 'Preparación', category: 'cultivo' },
  weeding: { emoji: '🌿', short: 'Deshierbe', category: 'cuidado' },
  hilling: { emoji: '⛰️', short: 'Aporque', category: 'cultivo' },
  sowing_ritual: { emoji: '🌅', short: 'Ritual de siembra', category: 'cultivo' },
  gratitude_ritual: { emoji: '🌞', short: 'Ritual de gratitud', category: 'cosecha' },
  signage: { emoji: '🏷️', short: 'Señalética', category: 'cultivo' },
  postharvest: { emoji: '📦', short: 'Poscosecha', category: 'cosecha' },
}

export const FEATURED: ActivityType[] = ['watering', 'sowing', 'fertilizing', 'observation', 'harvest']

export const CATEGORIES: { id: Category; label: string; symbol: string }[] = [
  { id: 'all', label: 'Todas', symbol: '✦' },
  { id: 'cultivo', label: 'Cultivo', symbol: '🌱' },
  { id: 'cuidado', label: 'Cuidados', symbol: '🍃' },
  { id: 'seguimiento', label: 'Crecimiento', symbol: '🌿' },
  { id: 'cosecha', label: 'Cosecha', symbol: '🧺' },
]

