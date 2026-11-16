import type { GardenJournal } from './journal/journal'
import type { GardenRegion } from '../../shared/geo/region'
import RewardsDashboard from './rewards/RewardsDashboard'
import RewardReviewPanel from './rewards/RewardReviewPanel'
import type { AuthoritativeRewards } from './rewards/rewards-types'
import type { AuthoritativeRewardReview } from './rewards/reward-review'

/**
 * Mi camino verde: la bitácora local conserva sus reglas V1.
 * Los puntos oficiales y las decisiones de moderación se reciben por props,
 * exclusivamente después de obtenerlos del backend autenticado.
 */
export default function GardenProgress({ journal, region = 'sierra', authenticated = false, official, review, currentUser: _currentUser, onRetryRewards }: {
  journal: GardenJournal
  region?: GardenRegion
  authenticated?: boolean
  official?: AuthoritativeRewards | null
  review?: AuthoritativeRewardReview | null
  currentUser?: string
  onRetryRewards?: () => void
}) {
  return <div className="kaws-progress-phase45">
    <RewardsDashboard journal={journal} region={region} authenticated={authenticated} official={official}/>
    <RewardReviewPanel authenticated={authenticated} review={review}/>
    {authenticated && !official && onRetryRewards && (
      <button type="button" className="cta small" onClick={onRetryRewards}>
        Reintentar sincronización de recompensas
      </button>
    )}
  </div>
}
