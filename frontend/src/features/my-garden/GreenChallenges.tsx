import GardenIcon from './GardenIcon'
import type { GardenAction, GardenDestination } from './garden'

export default function GreenChallenges({ onNavigate, onAction }: {
  onNavigate: (destination: GardenDestination) => void
  onAction: (action: GardenAction) => void
}) {
  return <aside className="garden-challenges" aria-labelledby="green-challenges-title">
    <div className="garden-challenges-heading"><GardenIcon name="target"/><h2 id="green-challenges-title">Retos verdes</h2></div>
    <span className="garden-proposal-tag">Propuestas V1 · Por validar</span>
    <ol>
      <li><button type="button" onClick={() => onNavigate('community')}><GardenIcon name="community"/><span><strong>Nuestra primera comunidad</strong><small>Cultivar empieza por encontrarnos.</small></span><GardenIcon name="arrow"/></button></li>
      <li><button type="button" onClick={() => onAction('register')}><GardenIcon name="seed"/><span><strong>La primera semilla</strong><small>Registra una planta de tu huerto.</small></span><GardenIcon name="arrow"/></button></li>
      <li><button type="button" onClick={() => onAction('logbook')}><GardenIcon name="book"/><span><strong>Raíces que crecen</strong><small>Conoce tu bitácora de cultivo.</small></span><GardenIcon name="arrow"/></button></li>
    </ol>
    <div className="garden-seeds-note"><GardenIcon name="seed"/><div><strong>Semillas de vida</strong><p>Reconocimientos por actividades verificadas. Aún sin asignar.</p></div></div>
    <p className="garden-challenges-note">Los retos y las recompensas se validarán al conectar el servidor.</p>
  </aside>
}
