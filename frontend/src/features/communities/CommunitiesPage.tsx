import { useEffect, useState } from 'react'
import GardenIcon from '../my-garden/GardenIcon'
import CommunityDialog from './CommunityDialog'
import CommunityForm from './CommunityForm'
import CommunityIcon from './CommunityIcon'
import CommunityOverview from './CommunityOverview'
import CommunityShortcutIcon from './CommunityShortcutIcon'
import CommunityActions from './CommunityActions'
import CommunityMembersPanel from './CommunityMembersPanel'
import CommunityWarehouse from './CommunityWarehouse'
import CommunityJoinDialog from './CommunityJoinDialog'
import { COMMUNITY_SPACES, type Community, type CommunitySave, type CommunitySpace } from './communities'
import type { UserSession } from '../../services/api'
import './communities.css'
import './community-v3.css'
import './community-page-v3.css'
import GameTitle from '../../shared/ui/game-ui/GameTitle'
import GameDecoration from '../../shared/ui/game-ui/GameDecoration'
import { GameWorld } from '../../shared/ui/game-ui/GameUI'
import { regionForProvince } from '../real-gardens/garden-region'
import { communityProvince } from './community-territory'
import { regionalLandscapes } from '../../shared/regional-landscapes'

const UPDATES = [
  { space: 'wisdom', title: 'Saberes por compartir', subtitle: 'Aún no hay relatos publicados.', icon: 'history' },
  { space: 'experience', title: 'Experiencias por contar', subtitle: 'Aún no hay experiencias publicadas.', icon: 'seed' },
  { space: 'activities', title: 'Próximas actividades', subtitle: 'Aún no hay encuentros programados.', icon: 'calendar' },
] as const

export type CommunityEntryAction = 'create' | 'join'

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
  entryAction,
  acceptedMembersCount,
  pendingCommunityInvitationsCount,
  onMembersUpdated,
}: {
  community: Community | null
  communityId?: string | null
  garden: string
  user?: UserSession | null
  currentCommunityRole?: 'RESPONSABLE' | 'PARTICIPANTE' | null
  userCommunities?: Community[]
  onSelectCommunity?: (community: Community) => void
  hasCreatedOwnCommunity?: boolean
  onSave: CommunitySave
  onGarden: () => void
  onHome: () => void
  entryAction?: CommunityEntryAction | null
  acceptedMembersCount?: number
  pendingCommunityInvitationsCount?: number
  onMembersUpdated?: () => void
}) {
  const [isFormOpen, setFormOpen] = useState(entryAction === 'create')
  const [isJoinOpen, setJoinOpen] = useState(entryAction === 'join')
  const [isMembersOpen, setMembersOpen] = useState(false)
  const [isWarehouseOpen, setWarehouseOpen] = useState(false)
  const [space, setSpace] = useState<CommunitySpace | null>(null)
  const [notice, setNotice] = useState('')
  const activeSpace = space ? COMMUNITY_SPACES[space] : null

  // Sincronizar miembros cada vez que se ingresa a la página de comunidades
  useEffect(() => {
    onMembersUpdated?.()
  }, [onMembersUpdated])

  // Es responsable si no hay comunidad (modo creación) o si su rol en ella es RESPONSABLE o es el creador
  const isResponsable =
    !community ||
    currentCommunityRole === 'RESPONSABLE' ||
    (community as any)?.creatorId === user?.id

  function editCommunity() {
    if (community && !isResponsable) return
    document.querySelector<HTMLDialogElement>('.community-dialog[open]')?.close()
    setSpace(null)
    setJoinOpen(false)
    setFormOpen(true)
  }

  async function saveCommunity(values: Community) {
    await onSave(values)
    setFormOpen(false)
    setNotice(
      community
        ? 'Cambios guardados en la comunidad.'
        : 'Comunidad creada. Ya puedes consultar sus datos, invitar miembros y registrar su huerto compartido.'
    )
  }

  const region = regionForProvince(communityProvince(community))
  return <main className="communities-page game-v3" data-region={region}>
    <GameWorld region={region} background={regionalLandscapes[region]} className="community-world-background">{null}</GameWorld>
    <div className="community-page-content">
      <header className="community-topbar">
        <nav className="community-breadcrumbs" aria-label="Ruta de navegación">
          <button type="button" onClick={onHome}><GardenIcon name="seed"/> Kawsapacha</button>
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
          <GameTitle as="h1" id="community-title" screenHeading tabIndex={-1} subtitle="Historias de la Tierra" icon={<GardenIcon name="community"/>}>Comunidad</GameTitle>
          <p className="community-intro">Compartimos saberes, experiencias y raíces.</p>

          {/* Selector de comunidad activa si el usuario pertenece a más de una */}
          {userCommunities.length > 1 && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', background: 'rgba(9, 44, 32, 0.75)', padding: '8px 16px', borderRadius: '14px', margin: '12px 0 16px', border: '1px solid rgba(216, 236, 173, 0.3)', backdropFilter: 'blur(8px)' }}>
              <span style={{ fontSize: '0.85rem', color: '#eef4dd', fontWeight: 600 }}>Cambiar comunidad activa:</span>
              <select value={communityId || ''} onChange={e => { const match = userCommunities.find(c => (c as any).id === e.target.value); if (match && onSelectCommunity) onSelectCommunity(match) }}
                style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #cce197', background: '#123e28', color: '#fff', fontSize: '0.88rem', fontWeight: 600 }}>
                {userCommunities.map(c => {
                  const isOwn = (c as any).creatorId === user?.id
                  return <option key={(c as any).id} value={(c as any).id}>{c.name} {isOwn ? '👑 (Mi comunidad)' : '🌱 (Participante)'}</option>
                })}
              </select>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          {(!community || isResponsable) && (
            <button className="community-primary-button community-create" type="button" onClick={editCommunity}>
              <GardenIcon name="community"/>
              <span>{community ? 'Editar comunidad' : 'Crear mi comunidad'}</span>
              <GardenIcon name="arrow"/>
            </button>
          )}
          {community && !isResponsable && !hasCreatedOwnCommunity && (
            <button type="button" onClick={() => { setSpace(null); setFormOpen(true) }}
              style={{ background: '#2b6cb0', color: '#fff', border: 'none', borderRadius: '12px', padding: '12px 18px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem' }}>
              <GardenIcon name="plus"/> Crear mi comunidad propia
            </button>
          )}
          {!community && (
            <button className="community-secondary-button" type="button" onClick={() => setJoinOpen(true)}>Unirme a una comunidad<GardenIcon name="arrow"/></button>
          )}
          {community && (
            <>
              <button type="button" onClick={() => setMembersOpen(true)}
                style={{ background: '#2f855a', color: '#fff', border: 'none', borderRadius: '12px', padding: '12px 18px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem' }}>
                👥 Integrantes {isResponsable ? '& Roles' : ''}
              </button>
              <button type="button" onClick={() => setWarehouseOpen(true)}
                style={{ background: '#2b6cb0', color: '#fff', border: 'none', borderRadius: '12px', padding: '12px 18px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem' }}>
                🌾 Almacén & Cosechas
              </button>
            </>
          )}
        </div>
      </section>

      <p className="community-save-status" role="status" aria-live="polite" aria-atomic="true">{notice}</p>
      <div className="community-stories-grid">
        <div className="community-main-column">
          {community && (
            <CommunityOverview
              community={community}
              garden={garden}
              acceptedMembersCount={acceptedMembersCount}
              pendingInvitationsCount={pendingCommunityInvitationsCount}
              onEdit={isResponsable ? editCommunity : undefined}
              onGarden={onGarden}
            />
          )}
          <CommunityActions onOpen={setSpace}/>
        </div>

        <section className="community-panel community-recent" aria-labelledby="community-recent-title">
          <h2 id="community-recent-title"><GardenIcon name="leaf"/>Lo más reciente en la comunidad</h2>
          <p className="community-section-note">Un espacio que empieza contigo.</p>
          <ul>{UPDATES.map(update => (
            <li key={update.space}>
              <button type="button" onClick={() => setSpace(update.space)}>
                <span className="community-update-icon">{update.icon === 'calendar' ? <CommunityIcon name="calendar"/> : <GardenIcon name={update.icon}/>}</span>
                <span><strong>{update.title}</strong><small>{update.subtitle}</small></span>
                <CommunityIcon name="chevron"/>
              </button>
            </li>
          ))}</ul>
          <button type="button" className="community-primary-button" onClick={() => setSpace('activities')}>Ver actividades<GardenIcon name="arrow"/></button>
          <span className="community-empty-label">Sin publicaciones adicionales</span>
        </section>
      </div>

      <nav className="community-panel community-shortcuts" aria-label="Explora la comunidad">
        <button type="button" onClick={() => setSpace('communities')}><span className="community-shortcut-icon"><CommunityShortcutIcon name="communities"/></span><span><strong>Nuestras comunidades</strong><small>Conoce y únete a proyectos locales.</small></span><CommunityIcon name="chevron"/></button>
        <button type="button" onClick={() => setSpace('garden')}><span className="community-shortcut-icon"><CommunityShortcutIcon name="garden"/></span><span><strong>Huertos compartidos</strong><small>Cultivamos y aprendemos juntos.</small></span><CommunityIcon name="chevron"/></button>
        <button type="button" onClick={() => setSpace('experience')}><span className="community-shortcut-icon"><CommunityIcon name="camera"/></span><span><strong>Publicar mi experiencia</strong><small>Comparte lo que cultivas.</small></span><CommunityIcon name="chevron"/></button>
      </nav>
      <p className="community-visit-note"><CommunityIcon name="info"/>{user ? `Sesión activa · ${user.name}` : 'Demostración pública · '}Datos guardados en la base de datos.</p>
      <GameDecoration kind="flowers" className="community-corner-flowers"/>
    </div>

    {isFormOpen && <CommunityForm community={isResponsable ? community : null} acceptedMembersCount={acceptedMembersCount} onSave={saveCommunity} onClose={() => setFormOpen(false)}/>}
    {isJoinOpen && <CommunityJoinDialog onClose={() => setJoinOpen(false)} onCreate={editCommunity} onHome={onHome}/>}
    {isMembersOpen && community && (
      <CommunityMembersPanel
        communityId={communityId ?? (community as any)?.id ?? null}
        communityName={community.name}
        currentUser={user ?? null}
        onClose={() => {
          setMembersOpen(false)
          onMembersUpdated?.()
        }}
        onMembersUpdated={onMembersUpdated}
      />
    )}
    {isWarehouseOpen && community && (
      <CommunityWarehouse
        communityId={communityId ?? (community as any)?.id ?? null}
        communityName={community.name}
        onClose={() => setWarehouseOpen(false)}
      />
    )}
    {activeSpace && <CommunityDialog title={activeSpace.title} description={activeSpace.description} onClose={() => setSpace(null)}>
      {space === 'communities' && community ? (
        <CommunityOverview
          community={community}
          garden={garden}
          acceptedMembersCount={acceptedMembersCount}
          pendingInvitationsCount={pendingCommunityInvitationsCount}
          onEdit={isResponsable ? editCommunity : undefined}
          onGarden={onGarden}
        />
      ) : <div className="community-space-empty"><span className="community-space-symbol">{space === 'experience' || space === 'conversations' || space === 'activities' ? <CommunityIcon name={space === 'experience' ? 'camera' : space === 'conversations' ? 'chat' : 'calendar'}/> : <GardenIcon name={space === 'garden' ? 'seed' : space === 'communities' ? 'community' : 'history'}/>}</span><h3>Pronto podrás compartir en este espacio</h3><p>Estamos preparando las herramientas para registrar saberes, relatos fotográficos y asambleas.</p></div>}
    </CommunityDialog>}
  </main>
}
