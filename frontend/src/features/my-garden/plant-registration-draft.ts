import type { GrowthStage } from './growth-stages'
import type { PlantVisualProfile } from './plant-visual-profile'

// Held only in App memory while the visitor sets up their real garden.
export type PlantRegistrationDraft = {
  plot: number | null
  species: string
  photo: Blob | null
  plantedOn: string
  notice?: string
  requestId?: string
  recordSowing?: boolean
  growthStage?: GrowthStage
  visualProfile?: PlantVisualProfile
  responsible?: string
}
