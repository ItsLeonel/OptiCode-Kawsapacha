import type { ReactNode } from 'react'
import type { RealGarden } from '../real-gardens/real-garden'
import type { GardenPlant } from './garden'
import type { GardenActivity, ActivityType } from './journal/activities'

/** Optional presentation seam. The normal application keeps GardenScene. */
export type GardenSceneRendererProps = {
  realGarden: RealGarden
  plants: GardenPlant[]
  selectedPlot: number | null
  interactionBlocked: boolean
  onRegister: (plot: number) => void
  onSelect: (plant: GardenPlant) => void
  activities?: GardenActivity[]
  feedback?: { id: string; type: ActivityType; plot: number | null } | null
  progress?: { points: number; level: string; responsible?: string }
}

export type GardenSceneRenderer = (props: GardenSceneRendererProps) => ReactNode
