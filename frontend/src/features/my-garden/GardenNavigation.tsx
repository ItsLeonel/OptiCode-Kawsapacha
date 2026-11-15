import GardenIcon from './GardenIcon'
import type { GardenDestination } from './garden'
import GameDecoration from '../../shared/ui/game-ui/GameDecoration'
import { useEffect, useRef, useState } from 'react'
import './garden-navigation-v3.css'

type PrimaryDestination = 'garden' | 'community' | 'progress'
const ITEMS: { destination: GardenDestination; label: string; icon: 'garden' | 'community' | 'target' }[] = [
  { destination: 'garden', label: 'Mi Huerto', icon: 'garden' },
  { destination: 'community', label: 'Comunidad', icon: 'community' },
  { destination: 'progress', label: 'Mi Camino Verde', icon: 'target' },
]

export default function GardenNavigation({
  active,
  onNavigate,
  onWelcome,
  demo = true,
  user,
  onLogout,
  pendingInvitationsCount = 0,
  onOpenNotifications,
  region: _region,
  overlayMode = false,
}: {
  active: GardenDestination | PrimaryDestination
  onNavigate: (destination: GardenDestination) => void
  onWelcome: () => void
  demo?: boolean
  user?: { name: string; role: string } | null
  onLogout?: () => void
  pendingInvitationsCount?: number
  onOpenNotifications?: () => void
  region?: string
  overlayMode?: boolean
}) {
  const [open, setOpen] = useState(false)
  const sidebarRef = useRef<HTMLElement>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)
  const pointerEnteredSidebar = useRef(false)

  useEffect(() => {
    if (!overlayMode) return
    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType === 'mouse' && event.clientX <= 12) setOpen(true)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target
      const isEditing = target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))
      const inDialog = target instanceof HTMLElement && Boolean(target.closest('[role="dialog"]'))
      if (inDialog) return
      if (event.key === 'Escape' && open) {
        event.preventDefault()
        setOpen(false)
        toggleRef.current?.focus({ preventScroll: true })
      } else if ((event.altKey && event.key.toLowerCase() === 'm') && !isEditing) {
        event.preventDefault()
        setOpen(value => !value)
        if (!open) requestAnimationFrame(() => sidebarRef.current?.querySelector<HTMLElement>('button')?.focus({ preventScroll: true }))
        else toggleRef.current?.focus({ preventScroll: true })
      }
    }
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [overlayMode, open])

  useEffect(() => {
    if (!overlayMode) {
      setOpen(false)
      pointerEnteredSidebar.current = false
    }
  }, [overlayMode])

  const closeOnPointerLeave = () => {
    if (!overlayMode) return
    const hadPointerEntered = pointerEnteredSidebar.current
    pointerEnteredSidebar.current = false
    // The edge-triggered panel is still moving under the cursor. Ignore the
    // synthetic leave that can fire before the opening transition completes.
    if (!hadPointerEntered) return
    if (!sidebarRef.current?.contains(document.activeElement)) setOpen(false)
  }


  return (
    <>
    <aside id="garden-main-navigation" ref={sidebarRef} className={`garden-sidebar game-v3${overlayMode ? ` garden-sidebar--overlay${open ? ' is-open' : ''}` : ''}`} aria-hidden={overlayMode && !open} onMouseEnter={() => { pointerEnteredSidebar.current = true }} onMouseLeave={closeOnPointerLeave} onFocusCapture={() => overlayMode && setOpen(true)} onBlurCapture={event => {
      if (!overlayMode) return
      const next = event.relatedTarget
      if (!(next instanceof Node) || (!sidebarRef.current?.contains(next) && next !== toggleRef.current)) {
        if (!sidebarRef.current?.matches(':hover')) setOpen(false)
      }
    }}>
      <button
        className="garden-brand"
        type="button"
        onClick={() => onNavigate('garden')}
        aria-label="Kawsapacha, ir a Mi Huerto Vivo"
      >
        <GameDecoration kind="plank" className="garden-brand-plank" />
        <span className="garden-brand-leaf">
          <GardenIcon name="leaf" />
        </span>
        <span>
          <strong>Kawsapacha</strong>
          <small>MI HUERTO VIVO</small>
        </span>
      </button>

      <nav className="garden-nav" aria-label="Módulos principales">
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
            <span className="garden-nav-bell-wrap">
              <GardenIcon name="bell" />
              {pendingInvitationsCount > 0 && <span className="garden-notif-red-dot" aria-hidden="true" />}
            </span>
            <span>Notificaciones</span>
            {pendingInvitationsCount > 0 && (
              <span className="garden-nav-badge">{pendingInvitationsCount}</span>
            )}
          </button>
        )}
      </nav>

      {/* El progreso y las insignias se consultan dentro de Mi Camino Verde. */}
      <div className="garden-sidebar-footer">
        {user ? (
          <>
            <div className="garden-user-card" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0' }}>
              <div
                className="garden-user-avatar"
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: '#b17a35',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                }}
              >
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="garden-user-info" style={{ textAlign: 'left', lineHeight: '1.2' }}>
                <div style={{ fontWeight: 'bold', color: '#fff8dc' }}>{user.name}</div>
                <div style={{ fontSize: '11px', color: '#f5eb8a' }}>● {user.role}</div>
              </div>
            </div>
            <button type="button" onClick={onLogout} title="Cerrar sesión">
              <GardenIcon name="logout" /> Cerrar sesión
            </button>
          </>
        ) : (
          <>
            <span>{demo ? 'Visitante · Sin sesión' : 'Sesión confirmada'}</span>
            <button type="button" onClick={onWelcome}>
              <GardenIcon name="back" /> Volver a bienvenida
            </button>
          </>
        )}
      </div>
    </aside>
  {overlayMode && <button ref={toggleRef} className={`garden-sidebar-tab${open ? ' is-open' : ''}`} type="button" aria-label={open ? 'Cerrar menú de navegación' : 'Abrir menú de navegación'} aria-expanded={open} aria-controls="garden-main-navigation" title="Menú · Alt+M" onClick={() => setOpen(value => !value)}><span aria-hidden="true">{open ? '×' : '☰'}</span><small>Menú</small></button>}
    </>
  )
}
