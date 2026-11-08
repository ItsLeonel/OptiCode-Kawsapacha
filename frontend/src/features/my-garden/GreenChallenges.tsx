import GardenIcon from './GardenIcon'
import type { GardenAction, GardenDestination } from './garden'

export default function GreenChallenges({ onNavigate, onAction }: {
  onNavigate: (destination: GardenDestination) => void
  onAction: (action: GardenAction) => void
}) {
  return <aside className="garden-challenges" aria-labelledby="green-challenges-title">
    <div className="garden-challenges-heading"><GardenIcon name="target"/><h2 id="green-challenges-title">Retos verdes</h2></div>
    <ol>
      <li><button type="button" onClick={() => onNavigate('community')}><GardenIcon name="community"/><span><strong>Nuestra primera comunidad</strong><small>Cultivar empieza por encontrarnos.</small></span><GardenIcon name="arrow"/></button></li>
      <li><button type="button" onClick={() => onAction('register')}><GardenIcon name="seed"/><span><strong>La primera semilla</strong><small>Registra una planta de tu huerto.</small></span><GardenIcon name="arrow"/></button></li>
      <li><button type="button" onClick={() => onAction('logbook')}><GardenIcon name="book"/><span><strong>Raíces que crecen</strong><small>Conoce tu bitácora de cultivo.</small></span><GardenIcon name="arrow"/></button></li>
    </ol>
  </aside>
}
