import type { GardenJournal } from './journal/journal'
import type { GardenRegion } from '../real-gardens/garden-region'
import RewardsDashboard from './rewards/RewardsDashboard'
import RewardReviewPanel from './rewards/RewardReviewPanel'
import type { AuthoritativeRewards } from './rewards/rewards-types'
import type { AuthoritativeRewardReview } from './rewards/reward-review'

/**
 * Mi camino verde: la bitácora local conserva sus reglas V1.
 * Los puntos oficiales y las decisiones de moderación se reciben por props,
 * exclusivamente después de obtenerlos del backend autenticado.
 */
export default function GardenProgress({ journal, region = 'sierra', authenticated = false, official, review }: {
  journal: GardenJournal
  region?: GardenRegion
  authenticated?: boolean
  official?: AuthoritativeRewards | null
  review?: AuthoritativeRewardReview | null
}) {
  return <div className="kaws-progress-phase45">
    <RewardsDashboard journal={journal} region={region} authenticated={authenticated} official={official}/>
    <RewardReviewPanel authenticated={authenticated} review={review}/>
  </div>
}
