import type { ReactNode } from 'react'
import type { RealGarden } from '../real-gardens/real-garden'
import type { GardenPlant } from './garden'
import type { GardenActivity, ActivityType } from './journal/activities'

/** Optional presentation seam for tests; the normal application loads PhaserGardenPoc lazily. */
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
