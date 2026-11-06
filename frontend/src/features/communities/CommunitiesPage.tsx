import { useState } from 'react'
import GardenIcon from '../my-garden/GardenIcon'
import CommunityDialog from './CommunityDialog'
import CommunityForm from './CommunityForm'
import CommunityIcon from './CommunityIcon'
import CommunityOverview from './CommunityOverview'
import CommunityShortcutIcon from './CommunityShortcutIcon'
import CommunityActions from './CommunityActions'
import CommunityMembersPanel from './CommunityMembersPanel'
import CommunityWarehouse from './CommunityWarehouse'
import { COMMUNITY_SPACES, type Community, type CommunitySpace } from './communities'
import type { UserSession } from '../../services/api'
import './communities.css'

const UPDATES = [
  { space: 'wisdom', title: 'Saberes por compartir', subtitle: 'Aún no hay relatos publicados.', icon: 'history' },
  { space: 'experience', title: 'Experiencias por contar', subtitle: 'Aún no hay experiencias publicadas.', icon: 'seed' },
  { space: 'activities', title: 'Próximas actividades', subtitle: 'Aún no hay encuentros programados.', icon: 'calendar' },
] as const

export default function CommunitiesPage({
  community,
  communityId,
  garden,
  user,
  currentCommunityRole,
  userCommunities = [],
  onSelectCommunity,
  hasCreatedOwnCommunity = false,
  onSave,
  onGarden,
  onHome,
}: {
  community: Community | null
  communityId?: string | null
  garden: string
  user?: UserSession | null
  currentCommunityRole?: 'RESPONSABLE' | 'PARTICIPANTE' | null
  userCommunities?: Community[]
  onSelectCommunity?: (community: Community) => void
  hasCreatedOwnCommunity?: boolean
  onSave: (community: Community) => void
  onGarden: () => void
  onHome: () => void
}) {
  const [isFormOpen, setFormOpen] = useState(false)
  const [isMembersOpen, setMembersOpen] = useState(false)
  const [isWarehouseOpen, setWarehouseOpen] = useState(false)
  const [space, setSpace] = useState<CommunitySpace | null>(null)
  const [notice, setNotice] = useState('')
  const activeSpace = space ? COMMUNITY_SPACES[space] : null

  // Es responsable si no hay comunidad (modo creación) o si su rol en ella es RESPONSABLE o es el creador
  const isResponsable =
    !community ||
    currentCommunityRole === 'RESPONSABLE' ||
    (community as any)?.creatorId === user?.id

  function editCommunity() {
    if (community && !isResponsable) return
    document.querySelector<HTMLDialogElement>('.community-dialog[open]')?.close()
    setSpace(null)
    setFormOpen(true)
  }

  function saveCommunity(values: Community) {
    onSave(values)
    setFormOpen(false)
    setNotice(
      community
        ? 'Cambios guardados en la comunidad.'
        : 'Comunidad creada. Ya puedes consultar sus datos, invitar miembros y registrar su huerto compartido.'
    )
  }

  return (
    <main className="communities-page">
      <div className="community-world-background" aria-hidden="true" />
      <div className="community-page-content">
        <header className="community-topbar">
          <nav className="community-breadcrumbs" aria-label="Ruta de navegación">
            <button type="button" onClick={onHome}>
              <GardenIcon name="seed" /> Kawsapacha
            </button>
            <span aria-hidden="true">/</span>
            <span aria-current="page">Comunidad</span>
          </nav>
          {user ? (
            <span className="community-visitor" style={{ background: 'rgba(56, 161, 105, 0.15)', color: '#2f855a' }}>
              <span aria-hidden="true">●</span> {user.name} · {user.role}
              {currentCommunityRole && (
                <strong style={{ marginLeft: '6px' }}>
                  ({currentCommunityRole === 'RESPONSABLE' ? 'Responsable 👑' : 'Participante 🌱'})
                </strong>
              )}
            </span>
          ) : (
            <span className="community-visitor">
              <span aria-hidden="true">V</span> Modo visitante · Sin sesión
            </span>
          )}
        </header>

        <section className="community-hero" aria-labelledby="community-title">
          <div className="community-hero-copy">
            <h1 id="community-title" data-screen-heading tabIndex={-1}>
              Comunidad <GardenIcon name="leaf" />
            </h1>
            <p className="community-subtitle">Historias de la Tierra</p>
            <p className="community-intro">
              Un espacio para compartir saberes, experiencias
              <br className="community-desktop-break" /> y la relación con nuestra tierra.
            </p>

            {/* Selector de comunidad activa si el usuario pertenece a más de una */}
            {userCommunities.length > 1 && (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '10px',
                  background: 'rgba(9, 44, 32, 0.75)',
                  padding: '8px 16px',
                  borderRadius: '14px',
                  margin: '12px 0 16px',
                  border: '1px solid rgba(216, 236, 173, 0.3)',
                  backdropFilter: 'blur(8px)',
                }}
              >
                <span style={{ fontSize: '0.85rem', color: '#eef4dd', fontWeight: 600 }}>
                  Cambiar comunidad activa:
                </span>
                <select
                  value={communityId || ''}
                  onChange={e => {
                    const match = userCommunities.find(c => (c as any).id === e.target.value)
                    if (match && onSelectCommunity) onSelectCommunity(match)
                  }}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cce197',
                    background: '#123e28',
                    color: '#fff',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                  }}
                >
                  {userCommunities.map(c => {
                    const isOwn = (c as any).creatorId === user?.id
                    return (
                      <option key={(c as any).id} value={(c as any).id}>
                        {c.name} {isOwn ? '👑 (Mi comunidad)' : '🌱 (Participante)'}
                      </option>
                    )
                  })}
                </select>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            {(!community || isResponsable) && (
              <button className="community-primary-button community-create" type="button" onClick={editCommunity}>
                <GardenIcon name="community" />
                <span>{community ? 'Editar comunidad' : 'Crear mi comunidad'}</span>
                <GardenIcon name="arrow" />
              </button>
            )}

            {/* Si es participante en una comunidad ajena pero aún no ha creado la suya propia */}
            {community && !isResponsable && !hasCreatedOwnCommunity && (
              <button
                type="button"
                onClick={() => {
                  setSpace(null)
                  setFormOpen(true)
                }}
                style={{
                  background: '#2b6cb0',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '12px 18px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '0.95rem',
                }}
              >
                <GardenIcon name="plus" /> Crear mi comunidad propia
              </button>
            )}

            {community && (
              <>
                <button
                  type="button"
                  onClick={() => setMembersOpen(true)}
                  style={{
                    background: '#2f855a',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '12px 18px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.95rem',
                  }}
                >
                  👥 Integrantes {isResponsable ? '& Roles' : ''}
                </button>
                <button
                  type="button"
                  onClick={() => setWarehouseOpen(true)}
                  style={{
                    background: '#2b6cb0',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '12px 18px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.95rem',
                  }}
                >
                  🌾 Almacén & Cosechas
                </button>
              </>
            )}
          </div>
        </section>

        <p className="community-save-status" role="status" aria-live="polite" aria-atomic="true">
          {notice}
        </p>

        {community && (
          <CommunityOverview
            community={community}
            garden={garden}
            onEdit={isResponsable ? editCommunity : undefined}
            onGarden={onGarden}
          />
        )}

        <div className="community-stories-grid">
          <CommunityActions onOpen={setSpace} />

          <section className="community-panel community-recent" aria-labelledby="community-recent-title">
            <h2 id="community-recent-title">
              <GardenIcon name="leaf" /> Lo más reciente en la comunidad
            </h2>
            <p className="community-section-note">Un espacio que empieza contigo.</p>
            <ul>
              {UPDATES.map(update => (
                <li key={update.space}>
                  <button type="button" onClick={() => setSpace(update.space)}>
                    <span className="community-update-icon">
                      {update.icon === 'calendar' ? <CommunityIcon name="calendar" /> : <GardenIcon name={update.icon} />}
                    </span>
                    <span>
                      <strong>{update.title}</strong>
                      <small>{update.subtitle}</small>
                    </span>
                    <CommunityIcon name="chevron" />
                  </button>
                </li>
              ))}
            </ul>
            <span className="community-empty-label">Sin publicaciones adicionales</span>
          </section>
        </div>
      </div>

      <footer className="community-footer">
        <CommunityShortcutIcon name="communities" />
        <span>Kawsapacha · Saberes ancestrales, territorio y comunidad</span>
      </footer>

      {isFormOpen && (
        <CommunityForm
          community={isResponsable ? community : null}
          onSave={saveCommunity}
          onClose={() => setFormOpen(false)}
        />
      )}

      {isMembersOpen && community && (
        <CommunityMembersPanel
          communityId={communityId ?? (community as any)?.id ?? null}
          communityName={community.name}
          currentUser={user ?? null}
          onClose={() => setMembersOpen(false)}
        />
      )}

      {isWarehouseOpen && community && (
        <CommunityWarehouse
          communityId={communityId ?? (community as any)?.id ?? null}
          communityName={community.name}
          onClose={() => setWarehouseOpen(false)}
        />
      )}

      {activeSpace && (
        <CommunityDialog
          title={activeSpace.title}
          description={activeSpace.description}
          onClose={() => setSpace(null)}
        >
          {space === 'communities' && community ? (
            <CommunityOverview community={community} garden={garden} onEdit={isResponsable ? editCommunity : undefined} onGarden={onGarden} />
          ) : (
            <div className="community-space-empty">
              <span className="community-space-symbol">
                {space === 'experience' || space === 'conversations' || space === 'activities' ? (
                  <CommunityIcon name={space === 'experience' ? 'camera' : space === 'conversations' ? 'chat' : 'calendar'} />
                ) : (
                  <GardenIcon name={space === 'garden' ? 'seed' : space === 'communities' ? 'community' : 'history'} />
                )}
              </span>
              <h3>Pronto podrás compartir en este espacio</h3>
              <p>Estamos preparando las herramientas para registrar saberes, relatos fotográficos y asambleas.</p>
            </div>
          )}
        </CommunityDialog>
      )}
    </main>
  )
}
