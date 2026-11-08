import GardenIcon from './GardenIcon'
import type { GardenDestination } from './garden'
import GameDecoration from '../../shared/ui/game-ui/GameDecoration'
import { gameRegionAssets, type GameRegion } from '../../shared/ui/game-ui/game-region-assets'
import './garden-navigation-v3.css'

const ITEMS = [
  { destination: 'garden', label: 'Mi Jardín', icon: 'garden' },
  { destination: 'real-garden', label: 'Mi terreno', icon: 'map' },
  { destination: 'community', label: 'Comunidad', icon: 'community' },
  { destination: 'plants', label: 'Descubrir plantas', icon: 'leaf' },
  { destination: 'my-plants', label: 'Mis plantas', icon: 'pot' },
  { destination: 'history', label: 'Mi historia', icon: 'history' },
  { destination: 'progress', label: 'Mi camino verde', icon: 'target' },
] as const

export default function GardenNavigation({
  active,
  onNavigate,
  onWelcome,
  user,
  onLogout,
  pendingInvitationsCount = 0,
  onOpenNotifications,
  region = 'sierra',
}: {
  active: GardenDestination
  onNavigate: (destination: GardenDestination) => void
  onWelcome: () => void
  user?: { name: string; role: string } | null
  onLogout?: () => void
  pendingInvitationsCount?: number
  onOpenNotifications?: () => void
  region?: GameRegion
}) {
  return (
    <aside className="garden-sidebar" data-navigation={active}>
      <div className="garden-sidebar-header">
        <button
          className="garden-brand"
          type="button"
          onClick={() => onNavigate('garden')}
          aria-label="Kawsapacha, ir a Mi jardín"
        >
          <GameDecoration kind="plank" className="garden-brand-plank"/>
          <span className="garden-brand-leaf">
            <GardenIcon name="leaf" />
          </span>
          <span>
            <strong>Kawsapacha</strong>
            <small>MI HUERTO VIVO</small>
          </span>
        </button>

        <nav className="garden-nav" aria-label="Navegación principal">
          {ITEMS.map(item => (
            <button
              type="button"
              key={item.destination}
              aria-current={active === item.destination ? 'page' : undefined}
              onClick={() => onNavigate(item.destination)}
            >
              <GardenIcon name={item.icon} />
              <span>{item.label}</span>
            </button>
          ))}

          {user && onOpenNotifications && (
            <button
              type="button"
              onClick={onOpenNotifications}
              className={`garden-nav-notif-btn ${pendingInvitationsCount > 0 ? 'is-pending' : ''}`}
              aria-label={`Notificaciones ${pendingInvitationsCount > 0 ? `(${pendingInvitationsCount} pendientes)` : ''}`}
            >
              <GardenIcon name="bell" />
              <span>Notificaciones</span>
              {pendingInvitationsCount > 0 && (
                <span className="garden-nav-badge">{pendingInvitationsCount}</span>
              )}
            </button>
          )}
        </nav>
      </div>

      <div className="garden-sidebar-territory" aria-hidden="true"><GardenIcon name="mountain"/></div>
      {active !== 'community' && <div className="garden-path-preview">
        <GardenIcon name="seed"/><strong>Mi camino verde</strong>
        <p>Aprende · Cultiva · Comparte</p>
        <button type="button" onClick={() => onNavigate('progress')}>Conocer mi camino <GardenIcon name="arrow"/></button>
      </div>}
      {active === 'community' && <img className="garden-sidebar-character" src={gameRegionAssets[region].guide} alt="" aria-hidden="true"/>}

      {/* Footer fijo e inamovible en la parte inferior izquierda */}
      <div className="garden-sidebar-footer">
        <div className="garden-user-card">
          <div className="garden-user-avatar">
            {user ? user.name.charAt(0).toUpperCase() : 'V'}
          </div>
          <div className="garden-user-info">
            <span className="garden-user-name">
              {user ? user.name : 'Visitante'}
            </span>
            <span className="garden-user-role">
              <span className="garden-user-status-dot" />
              {user ? user.role : 'Sin sesión'}
            </span>
          </div>
        </div>

        {user ? (
          <button
            type="button"
            className="garden-sidebar-logout-btn"
            onClick={onLogout}
            title="Cerrar sesión"
          >
            <GardenIcon name="logout" />
            <span>Cerrar sesión</span>
          </button>
        ) : (
          <button
            type="button"
            className="garden-sidebar-back-btn"
            onClick={onWelcome}
            title="Volver a bienvenida"
          >
            <GardenIcon name="back" />
            <span>Iniciar sesión</span>
          </button>
        )}
      </div>
    </aside>
  )
}
