import GardenIcon from './GardenIcon'
import GardenScene from './GardenScene'
import GreenChallenges from './GreenChallenges'
import { GardenRegionalBackground } from './GardenRegionalScenery'
import { regionForProvince } from '../real-gardens/garden-region'
import type { GardenAction, GardenDestination, GardenPlant } from './garden'
import { GARDEN_KINDS, formatGardenArea, type RealGarden } from '../real-gardens/real-garden'
import type { UserSession } from '../../services/api'
import './my-garden.css'
import './my-garden-v2.css'
import './garden-scene.css'

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
  pendingInvitationsCount = 0,
  onOpenNotifications,
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
  pendingInvitationsCount?: number
  onOpenNotifications?: () => void
}) {
  const currentKind = realGarden?.kind ?? 'ground'
  const region = regionForProvince(realGarden?.location?.province ?? province ?? '')
  const hasLinkedGardenAndCommunity = Boolean(community && realGarden)
  const isNewUser = Boolean(user) && !hasLinkedGardenAndCommunity

  return (
    <main className="my-garden-page" data-region={region} data-garden-kind={realGarden?.kind ?? 'unregistered'}>
      <GardenRegionalBackground region={region} />
      {user ? (
        <div className="garden-visitor-notice" style={{ background: 'rgba(56, 161, 105, 0.15)', color: '#276749' }}>
          <span className="garden-visitor-dot" style={{ background: '#38a169' }} />
          Sesión activa: <strong>{user.name}</strong> ({user.role}) ·
          <span> Tus plantas, bitácoras y cosechas se guardan en la base de datos.</span>
          {onOpenNotifications && (
            <button
              type="button"
              onClick={onOpenNotifications}
              className={`garden-header-bell-btn ${pendingInvitationsCount > 0 ? 'has-pending' : ''}`}
              title={pendingInvitationsCount > 0 ? `${pendingInvitationsCount} invitaciones pendientes` : 'Notificaciones'}
            >
              <GardenIcon name="bell" />
              {pendingInvitationsCount > 0 && <span className="garden-header-bell-count">{pendingInvitationsCount}</span>}
            </button>
          )}
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
        <span className="garden-territory" aria-label="Ubicación de tu huerto">
          <GardenIcon name="map" />
          <strong>{province || 'Raíces ecuatorianas'}</strong>
          <small className="garden-territory-name">{garden || 'Tu próximo huerto empieza aquí'}</small>
          {realGarden && (
            <small>
              {GARDEN_KINDS[realGarden.kind]?.label ?? 'En tierra'} · {formatGardenArea(realGarden.areaM2)}
              {realGarden.location?.canton && ` · ${realGarden.location.canton}`}
            </small>
          )}
        </span>
      </header>

      {/* Estado limpio y acogedor para usuario sin comunidad ni huerto */}
      {isNewUser && (
        <div
          style={{
            margin: '20px auto',
            maxWidth: '680px',
            background: 'rgba(255,255,255,0.95)',
            border: '2px dashed #48bb78',
            borderRadius: '16px',
            padding: '24px 28px',
            textAlign: 'center',
            boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
          }}
        >
          <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🌱</div>
          <h2 style={{ margin: '0 0 8px', fontSize: '1.2rem', color: '#22543d' }}>
            Bienvenido/a a Kawsapacha
          </h2>
          <p style={{ margin: '0 0 16px', fontSize: '0.92rem', color: '#2d3748', lineHeight: 1.5 }}>
            Aún no tienes un huerto ni una comunidad asignada. Crea una comunidad como <strong>Responsable</strong> o acepta una invitación en <strong>Notificaciones 🔔</strong> para comenzar.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="is-primary"
              onClick={() => onNavigate('community')}
              style={{ padding: '10px 20px', borderRadius: '10px', fontWeight: 700 }}
            >
              <GardenIcon name="community" /> Crear mi comunidad
            </button>
            {onOpenNotifications && (
              <button
                type="button"
                onClick={onOpenNotifications}
                style={{
                  padding: '10px 20px',
                  borderRadius: '10px',
                  fontWeight: 700,
                  background: pendingInvitationsCount > 0 ? '#feebc8' : '#edf2f7',
                  color: pendingInvitationsCount > 0 ? '#744210' : '#4a5568',
                  border: pendingInvitationsCount > 0 ? '1px solid #fbd38d' : '1px solid #cbd5e0',
                }}
              >
                🔔 {pendingInvitationsCount > 0 ? `Ver invitaciones (${pendingInvitationsCount})` : 'Bandeja de Notificaciones'}
              </button>
            )}
          </div>
        </div>
      )}

      <div className="garden-world-content">
        {realGarden ? (
          <GardenScene
            kind={realGarden.kind}
            region={region}
            plants={plants}
            selectedPlot={selectedPlot}
            onRegister={onRegister}
            onSelect={onSelect}
            disabled={Boolean(user && !hasLinkedGardenAndCommunity)}
          />
        ) : !user ? (
          <section className="garden-start" aria-labelledby="garden-start-title">
            <div className="garden-start-emblem" aria-hidden="true">
              <GardenIcon name="seed" />
            </div>
            <span className="garden-eyebrow">RAÍCES REALES, UN JARDÍN POR DESCUBRIR</span>
            <h2 id="garden-start-title">
              Tu jardín comienza
              <br />
              con un huerto real
            </h2>
            <p>Registra dónde cultivas y dale un lugar a cada planta.</p>
            <button type="button" className="garden-start-button" onClick={() => onAction('real-garden')}>
              <GardenIcon name="map" />
              Registrar mi huerto
              <GardenIcon name="arrow" />
            </button>
          </section>
        ) : (
          <GardenScene
            kind={currentKind}
            region={region}
            plants={plants}
            selectedPlot={selectedPlot}
            onRegister={onRegister}
            onSelect={onSelect}
            disabled={true}
          />
        )}
        <GreenChallenges onNavigate={onNavigate} onAction={onAction} />
      </div>

      <nav className="garden-quick-actions" aria-label="Acciones de tu jardín">
        {ACTIONS.map(item => (
          <button
            key={item.action}
            type="button"
            data-action={item.action}
            className={item.action === 'register' ? 'is-primary' : ''}
            onClick={() => onAction(item.action)}
            disabled={item.action === 'register' && Boolean(user && !hasLinkedGardenAndCommunity)}
            style={
              item.action === 'register' && Boolean(user && !hasLinkedGardenAndCommunity)
                ? { opacity: 0.6, cursor: 'not-allowed' }
                : undefined
            }
          >
            <span>
              <GardenIcon name={item.icon as any} />
            </span>
            {item.label}
          </button>
        ))}
      </nav>

      <p className="garden-world-footer">
        <GardenIcon name="mountain" />
        {user
          ? community
            ? `${community} · ${garden || 'Huerto por vincular'}`
            : 'Un jardín para aprender, compartir y cuidar nuestra tierra.'
          : community
          ? `${community} · `
          : 'Registros temporales. Se pierden al recargar.'}
      </p>
    </main>
  )
}
