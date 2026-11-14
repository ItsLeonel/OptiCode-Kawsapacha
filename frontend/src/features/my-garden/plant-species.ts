import type { GrowthStage } from './growth-stages'

// Existing demonstration catalogue. Selection is supplied by the user, never inferred from a photo.
export const PLANT_SPECIES = [
  { name: 'Romero', latin: 'Salvia rosmarinus', icon: '🌿' },
  { name: 'Manzanilla', latin: 'Matricaria chamomilla', icon: '🌼' },
  { name: 'Menta', latin: 'Mentha sp.', icon: '🌱' },
  { name: 'Toronjil', latin: 'Melissa officinalis', icon: '🍃' },
  { name: 'Hierbabuena', latin: 'Mentha spicata', icon: '🌿' },
  { name: 'Lavanda', latin: 'Lavandula sp.', icon: '💜' },
  { name: 'Orégano', latin: 'Origanum vulgare', icon: '🌱' },
  { name: 'Llantén', latin: 'Plantago major', icon: '🌾' },
] as const

export type PlantSpecies = { id?: string; name: string; latin: string; icon: string }

export type PlantRegistration = {
  photo: Blob
  species: PlantSpecies
  plot: number
  plantedOn?: string
  requestId?: string
  recordSowing?: boolean
  growthStage?: GrowthStage
  responsible?: string
}

export type PlantRegistrationResult = { ok: true } | { ok: false; error: string }
