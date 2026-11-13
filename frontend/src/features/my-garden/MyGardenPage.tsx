import { lazy, Suspense, type ReactNode } from 'react'
import GardenIcon from './GardenIcon'
import GardenOnboarding from './GardenOnboarding'
import type { Community } from '../communities/communities'
import { GardenRegionalBackground } from './GardenRegionalScenery'
import { regionForProvince } from '../real-gardens/garden-region'
import { provinceForName } from '../real-gardens/territory'
import { communityProvince } from '../communities/community-territory'
import { regionalLandscapes } from '../../shared/regional-landscapes'
import GameTitle from '../../shared/ui/game-ui/GameTitle'
import GameDecoration from '../../shared/ui/game-ui/GameDecoration'
import type { GardenAction, GardenDestination, GardenPlant } from './garden'
import type { GardenSceneRenderer } from './garden-scene-renderer'
import type { GardenSceneRendererProps } from './garden-scene-renderer'
import { GARDEN_KINDS, formatGardenArea, type RealGarden } from '../real-gardens/real-garden'
import GreenChallenges from './GreenChallenges'
import LunarCalendarWidget from './lunar/LunarCalendarWidget'
import type { UserSession } from '../../services/api'
import './my-garden.css'
import './my-garden-v2.css'
import './garden-scene.css'
import './my-garden-v3.css'

const ACTIONS = [
  { action: 'activity', label: 'Registrar actividad', icon: 'book' },
  { action: 'register', label: 'Registrar planta', icon: 'seed' },
  { destination: 'history', label: 'Bitácora', icon: 'book' },
  { destination: 'plants', label: 'Catálogo medicinal', icon: 'leaf' },
  { destination: 'my-plants', label: 'Mis plantas', icon: 'pot' },
  { action: 'real-garden', label: 'Editar terreno', icon: 'map' },
] as const
const PhaserGarden = lazy(() => import('./phaser-poc/PhaserGardenPoc'))

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
  onCreateCommunity,
  onJoinCommunity,
  terrainView,
  terrainProvince,
  renderGardenScene,
  activities,
  feedback,
  progress,
  interactionBlocked = false,
  demo = true,
  fullScreenGarden = false,
}: {
  plants: GardenPlant[]
  community: Community | null
  garden?: string
  province?: string
  realGarden: RealGarden | null
  selectedPlot: number | null
  terrainView?: ReactNode
  terrainProvince?: string
  renderGardenScene?: GardenSceneRenderer
  activities?: GardenSceneRendererProps['activities']
  feedback?: GardenSceneRendererProps['feedback']
  progress?: GardenSceneRendererProps['progress']
  interactionBlocked?: boolean
  onCreateCommunity?: () => void
  onJoinCommunity?: () => void
  demo?: boolean
  fullScreenGarden?: boolean
  onSelect: (plant: GardenPlant) => void
  onRegister: (plot: number) => void
  onAction: (action: GardenAction) => void
  onNavigate: (destination: GardenDestination) => void
  user?: UserSession | null
  pendingInvitationsCount?: number
  onOpenNotifications?: () => void
}) {
  const territory = terrainView
    ? (provinceForName(terrainProvince ?? '') ? terrainProvince : communityProvince(community) || realGarden?.communityProvince || '')
    : realGarden?.location?.province || community?.province || province || ''
  const region = regionForProvince(territory ?? '')

  return (
    <main
      className="my-garden-page game-v3"
      data-view={terrainView ? 'terrain' : 'garden'}
      data-fullscreen-garden={fullScreenGarden && !terrainView ? 'true' : undefined}
      data-region={region}
      data-garden-kind={realGarden?.kind ?? 'unregistered'}
      data-onboarding={community && realGarden ? 'complete' : community ? 'real-garden' : 'community'}
    >
      <GardenRegionalBackground region={region} variant={realGarden && !terrainView ? 'garden' : 'welcome'} background={terrainView ? regionalLandscapes[region] : undefined} />
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
          <span className="garden-visitor-dot" /> {demo ? 'Demostración pública · Visitante sin sesión' : 'Sesión confirmada · Guardado local'}
        </div>
      )}

      <header className="garden-welcome">
        <div className="garden-welcome-sign">
          <GameDecoration kind="plank" className="garden-welcome-wood" />
          <GameTitle as="h1" screenHeading tabIndex={-1} icon={<GardenIcon name="leaf" />}>
            {terrainView ? 'Mi terreno' : '¡Bienvenido a tu Jardín!'}
          </GameTitle>
          <p>
            {terrainView
              ? realGarden
                ? 'La ubicación y las características de tu espacio de cultivo.'
                : 'Registra y describe tu espacio de cultivo real.'
              : 'Tu huerto real y tu jardín digital crecen juntos.'}
          </p>
        </div>
        {realGarden && !terrainView && (
          <span className="garden-territory" aria-label="Ubicación de tu huerto">
            <GardenIcon name="map" />
            <strong>{realGarden.location?.province || province || 'Raíces ecuatorianas'}</strong>
            <small className="garden-territory-name">{realGarden.name || garden || 'Tu huerto'}</small>
            <small>
              {GARDEN_KINDS[realGarden.kind]?.label ?? 'En tierra'} · {formatGardenArea(realGarden.areaM2)}
              {realGarden.location?.canton && ` · ${realGarden.location.canton}`}
            </small>
          </span>
        )}
      </header>

      <nav className="garden-view-navigation" aria-label="Vistas de Mi Jardín">
        <button type="button" aria-current={!terrainView ? 'page' : undefined} onClick={() => onNavigate('garden')}>
          <GardenIcon name="garden" />
          Mi Jardín
        </button>
        <button type="button" aria-current={terrainView ? 'page' : undefined} onClick={() => onAction('real-garden')}>
          <GardenIcon name="map" />
          Mi terreno
        </button>
      </nav>

      <div className={`garden-world-content${terrainView ? ' garden-world-content--terrain' : ''}`}>
        {terrainView ||
          (community && realGarden ? (
            renderGardenScene ? (
              renderGardenScene({
                realGarden,
                plants,
                selectedPlot,
                interactionBlocked,
                onRegister,
                onSelect,
                activities,
                feedback,
                progress,
              })
            ) : (
              <Suspense fallback={<p role="status">Preparando Mi Jardín Vivo…</p>}>
                <PhaserGarden
                  realGarden={realGarden}
                  plants={plants}
                  selectedPlot={selectedPlot}
                  interactionBlocked={interactionBlocked}
                  onRegister={onRegister}
                  onSelect={onSelect}
                  activities={activities}
                  feedback={feedback}
                  progress={progress}
                />
              </Suspense>
            )
          ) : (
            <GardenOnboarding
              community={community}
              region={region}
              onCreateCommunity={onCreateCommunity ?? (() => onNavigate('community'))}
              onJoinCommunity={onJoinCommunity ?? (() => onNavigate('community'))}
              onCommunity={() => onNavigate('community')}
              onRegisterGarden={() => onAction('real-garden')}
              onOpenNotifications={onOpenNotifications}
              pendingInvitationsCount={pendingInvitationsCount}
            />
          ))}
        {!terrainView && <GreenChallenges onNavigate={onNavigate} activities={activities} authenticated={Boolean(user)} />}
      </div>

      {/* Módulo lunar de React: se superpone a Phaser sin modificar fondos, cámara ni parcelas. */}
      {!terrainView && <LunarCalendarWidget region={region} onActivity={() => onAction('activity')} />}

      <nav className="garden-quick-actions" aria-label="Acciones de tu jardín">
        {ACTIONS.map(item => (
          <button
            key={'action' in item ? item.action : item.destination}
            type="button"
            data-action={'action' in item ? item.action : item.destination}
            onClick={() => ('action' in item ? onAction(item.action as any) : onNavigate(item.destination as any))}
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
            ? `${community.name} · ${realGarden?.name || garden || 'Huerto por vincular'}`
            : 'Un jardín para aprender, compartir y cuidar nuestra tierra.'
          : community
          ? `${community.name} · `
          : 'Registros y fotografías guardados en este navegador.'}
      </p>
    </main>
  )
}
