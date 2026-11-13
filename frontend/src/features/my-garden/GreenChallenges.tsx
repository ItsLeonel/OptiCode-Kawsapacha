import GardenIcon from './GardenIcon'
import type { GardenDestination } from './garden'
import type { GardenActivity } from './journal/activities'
import { MISSION_DEFINITIONS } from './rewards/rewards-types'

const ART = {
  care: new URL('./rewards/art/mission-water.webp', import.meta.url).href,
  observer: new URL('./rewards/art/mission-camera.webp', import.meta.url).href,
  lunar: new URL('./rewards/art/mission-moon.webp', import.meta.url).href,
}

/** Vista rápida dentro de Mi Jardín. Todas las misiones se consultan en Mi camino verde. */
export default function GreenChallenges({ onNavigate, activities = [], authenticated = false }: {
  onNavigate: (destination: GardenDestination) => void
  activities?: GardenActivity[]
  authenticated?: boolean
}) {
  const valid = authenticated ? [] : activities.filter(item => !item.voidedAt && item.validation === 'local-v1')
  const care = new Set(valid.filter(item => item.type === 'watering').map(item => item.date)).size
  const observer = new Set(valid.filter(item => item.type === 'observation' && item.photoIds.length > 0).map(item => item.date)).size
  return <aside className="garden-challenges rv-garden-preview" aria-labelledby="green-challenges-title">
    <div className="garden-challenges-heading"><GardenIcon name="target"/><h2 id="green-challenges-title">Misiones verdes</h2></div>
    {MISSION_DEFINITIONS.map(mission => <div className="rv-preview-row" key={mission.id}>
      <img src={ART[mission.id]} alt="" aria-hidden="true"/>
      <span><strong>{mission.label}</strong><small>{authenticated || mission.id === 'lunar' ? 'Pendiente de validación' : `${Math.min(mission.id === 'care' ? care : observer, 3)} / 3 · avance local`}</small></span>
    </div>)}
    <button className="rv-preview-link" type="button" onClick={() => onNavigate('progress')}>Ver misiones y recompensas <GardenIcon name="arrow"/></button>
  </aside>
}
