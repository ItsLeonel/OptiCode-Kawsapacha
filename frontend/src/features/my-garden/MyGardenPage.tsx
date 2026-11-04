import GardenIcon from './GardenIcon'
import GardenScene from './GardenScene'
import GreenChallenges from './GreenChallenges'
import type { GardenAction, GardenDestination, GardenPlant } from './garden'
import { GARDEN_KINDS, formatGardenArea, type RealGarden } from '../real-gardens/real-garden'
import type { UserSession } from '../../services/api'
import './my-garden.css'

const ACTIONS = [
  { action: 'register', label: 'Registrar planta', icon: 'seed' },
  { action: 'logbook', label: 'Bitácora', icon: 'book' },
  { action: 'real-garden', label: 'Mi huerto real', icon: 'map' },
  { action: 'passport', label: 'Pasaporte Vivo', icon: 'history' },
] as const

export default function MyGardenPage({
  plants,
  community,
  garden,
  province,
  realGarden,
  selectedPlot,
  onSelect,
  onRegister,
  onAction,
  onNavigate,
  user,
}: {
  plants: GardenPlant[]
  community: string
  garden: string
  province: string
  realGarden: RealGarden | null
  selectedPlot: number | null
  onSelect: (plant: GardenPlant) => void
  onRegister: (plot: number) => void
  onAction: (action: GardenAction) => void
  onNavigate: (destination: GardenDestination) => void
  user?: UserSession | null
}) {
  return (
    <main className="my-garden-page">
      <div className="garden-world-background" aria-hidden="true" />
      {user ? (
        <div className="garden-visitor-notice" style={{ background: 'rgba(56, 161, 105, 0.15)', color: '#276749' }}>
          <span className="garden-visitor-dot" style={{ background: '#38a169' }} />
          Sesión activa: <strong>{user.name}</strong> ({user.role}) ·
          <span> Tus plantas, bitácoras y cosechas se guardan en la base de datos.</span>
        </div>
      ) : (
        <div className="garden-visitor-notice">
          <span className="garden-visitor-dot" /> Demostración pública · Visitante sin sesión{' '}
          <span>Registros temporales, solo en esta visita.</span>
        </div>
      )}
      <header className="garden-welcome">
        <div>
          <span className="garden-eyebrow">MI JARDÍN · KAWSAPACHA</span>
          <h1 tabIndex={-1} data-screen-heading>
            ¡Bienvenido a <span>tu Jardín!</span> <GardenIcon name="leaf" />
          </h1>
          <p>
            Aquí tu huerto real y tu huerto digital
            <br className="garden-desktop-break" /> crecen juntos.
          </p>
        </div>
        <span className="garden-territory">
          <GardenIcon name="map" />
          {province || 'Raíces ecuatorianas'}
          <small>{garden || 'Tu próximo huerto empieza aquí'}</small>
          {realGarden && (
            <small>
              {GARDEN_KINDS[realGarden.kind].label} · {formatGardenArea(realGarden.areaM2)}
              {realGarden.location.canton && ` · ${realGarden.location.canton}`}
            </small>
          )}
        </span>
      </header>
      <div className="garden-world-content">
        <GardenScene plants={plants} selectedPlot={selectedPlot} onRegister={onRegister} onSelect={onSelect} />
        <GreenChallenges onNavigate={onNavigate} onAction={onAction} />
      </div>
      <nav className="garden-quick-actions" aria-label="Acciones de tu jardín">
        {ACTIONS.map(item => (
          <button
            key={item.action}
            type="button"
            className={item.action === 'register' ? 'is-primary' : ''}
            onClick={() => onAction(item.action)}
          >
            <span>
              <GardenIcon name={item.icon} />
            </span>
            {item.label}
          </button>
        ))}
      </nav>
      <p className="garden-world-footer">
        <GardenIcon name="mountain" />
        {community
          ? `${community} · ${garden || 'Huerto por vincular'}`
          : 'Un jardín para aprender, compartir y cuidar nuestra tierra.'}
      </p>
    </main>
  )
}
