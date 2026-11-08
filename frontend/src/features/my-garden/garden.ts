export const PLOT_COUNT = 6

export const PLANT_STATES = {
  'not-documented': 'Sin estado documentado', observed: 'Estado observado', attention: 'Requiere atención', harvested: 'Cosechada',
} as const
export type PlantState = keyof typeof PLANT_STATES
export type PlantEvidence = {
  id: string; date: string; notes: string; photo?: string; photoId?: string
  state?: PlantState; heightCm?: number
}

export type GardenPlant = {
  id: string
  name: string
  latin: string
  photo: string
  date: string
  plot: number
  plantedOn?: string
  createdAt?: string
  updatedAt?: string
  photoId?: string
  observations?: string
  state?: PlantState
  evidences?: PlantEvidence[]
  archivedAt?: string
}

export type GardenDestination = 'garden' | 'community' | 'real-garden' | 'plants' | 'my-plants' | 'history' | 'progress'
export type GardenAction = 'register' | 'logbook' | 'real-garden' | 'passport' | 'my-plants' | 'activity' | 'progress'
