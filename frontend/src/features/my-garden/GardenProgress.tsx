import type { GardenJournal } from './journal/journal'
import type { GardenRegion } from '../real-gardens/garden-region'
import RewardsDashboard from './rewards/RewardsDashboard'

/** Fase 4: la interfaz no inventa un saldo oficial; el servidor será la fuente autorizada. */
export default function GardenProgress({ journal, region = 'sierra', authenticated = false }: {
  journal: GardenJournal
  region?: GardenRegion
  authenticated?: boolean
}) {
  return <RewardsDashboard journal={journal} region={region} authenticated={authenticated} />
}
