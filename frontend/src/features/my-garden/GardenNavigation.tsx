import GardenIcon from './GardenIcon'
import type { GardenDestination } from './garden'

const ITEMS = [
  { destination: 'garden', label: 'Mi jardín', icon: 'garden' },
  { destination: 'community', label: 'Comunidad', icon: 'community' },
  { destination: 'real-garden', label: 'Mi Huerto', icon: 'seed' },
  { destination: 'plants', label: 'Descubrir plantas', icon: 'leaf' },
  { destination: 'history', label: 'Mi historia', icon: 'history' },
] as const

export default function GardenNavigation({
  active,
  onNavigate,
  onWelcome,
  user,
  onLogout,
  pendingInvitationsCount = 0,
  onOpenNotifications,
}: {
  active: GardenDestination
  onNavigate: (destination: GardenDestination) => void
  onWelcome: () => void
  user?: { name: string; role: string } | null
  onLogout?: () => void
  pendingInvitationsCount?: number
  onOpenNotifications?: () => void
}) {
  return (
    <aside className="garden-sidebar">
      <div className="garden-sidebar-header">
        <button
          className="garden-brand"
          type="button"
          onClick={() => onNavigate('garden')}
          aria-label="Kawsapacha, ir a Mi jardín"
        >
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
