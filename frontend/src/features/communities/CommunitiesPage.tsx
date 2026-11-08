import { useState } from 'react'
import GardenIcon from '../my-garden/GardenIcon'
import CommunityDialog from './CommunityDialog'
import CommunityForm from './CommunityForm'
import CommunityIcon from './CommunityIcon'
import CommunityOverview from './CommunityOverview'
import CommunityShortcutIcon from './CommunityShortcutIcon'
import CommunityActions from './CommunityActions'
import CommunityJoinDialog from './CommunityJoinDialog'
import { COMMUNITY_SPACES, type Community, type CommunitySave, type CommunitySpace } from './communities'
import './communities.css'
import './community-v3.css'
import './community-page-v3.css'
import GameTitle from '../../shared/ui/game-ui/GameTitle'
import GameDecoration from '../../shared/ui/game-ui/GameDecoration'
import { GameWorld } from '../../shared/ui/game-ui/GameUI'
import { regionForProvince } from '../real-gardens/garden-region'

const UPDATES = [
  { space: 'wisdom', title: 'Saberes por compartir', subtitle: 'Aún no hay relatos publicados.', icon: 'history' },
  { space: 'experience', title: 'Experiencias por contar', subtitle: 'Aún no hay experiencias publicadas.', icon: 'seed' },
  { space: 'activities', title: 'Próximas actividades', subtitle: 'Aún no hay encuentros programados.', icon: 'calendar' },
] as const

export type CommunityEntryAction = 'create' | 'join'

export default function CommunitiesPage({ community, garden, onSave, onGarden, onHome, entryAction, demo = true }: {
  community: Community | null
  garden: string
  onSave: CommunitySave
  onGarden: () => void
  onHome: () => void
  entryAction?: CommunityEntryAction | null
  demo?: boolean
}) {
  const [isFormOpen, setFormOpen] = useState(entryAction === 'create')
  const [isJoinOpen, setJoinOpen] = useState(entryAction === 'join')
  const [space, setSpace] = useState<CommunitySpace | null>(null)
  const [notice, setNotice] = useState('')
  const activeSpace = space ? COMMUNITY_SPACES[space] : null

  function editCommunity() {
    document.querySelector<HTMLDialogElement>('.community-dialog[open]')?.close()
    setSpace(null)
    setJoinOpen(false)
    setFormOpen(true)
  }

  async function saveCommunity(values: Community) {
    await onSave(values)
    setFormOpen(false)
    setNotice(community ? 'Cambios guardados en este navegador.' : 'Comunidad guardada en este navegador. Ya puedes consultar sus datos y registrar su huerto compartido.')
  }

  const region = regionForProvince(community?.province ?? '')
  return <main className="communities-page game-v3" data-region={region}>
    <GameWorld region={region} className="community-world-background">{null}</GameWorld>
    <div className="community-page-content">
      <header className="community-topbar">
        <nav className="community-breadcrumbs" aria-label="Ruta de navegación"><button type="button" onClick={onHome}><GardenIcon name="seed"/> Kawsapacha</button><span aria-hidden="true">/</span><span aria-current="page">Comunidad</span></nav>
        <span className="community-visitor"><span aria-hidden="true">{demo ? 'V' : '✓'}</span>{demo ? 'Modo visitante · Sin sesión' : 'Sesión confirmada'}</span>
      </header>

      <section className="community-hero" aria-labelledby="community-title">
        <div className="community-hero-copy"><GameTitle as="h1" id="community-title" screenHeading tabIndex={-1} subtitle="Historias de la Tierra" icon={<GardenIcon name="community"/>}>Comunidad</GameTitle><p className="community-intro">Compartimos saberes, experiencias y raíces.</p></div>
        {!community && <button className="community-primary-button community-create" type="button" onClick={editCommunity}><GardenIcon name="community"/><span>Crear mi comunidad</span><GardenIcon name="arrow"/></button>}
      </section>

      {!community && <button className="community-secondary-button" type="button" onClick={() => setJoinOpen(true)}>Unirme a una comunidad<GardenIcon name="arrow"/></button>}

      <p className="community-save-status" role="status" aria-live="polite" aria-atomic="true">{notice}</p>
      <div className="community-stories-grid">
        <div className="community-main-column">
          {community && <CommunityOverview community={community} garden={garden} onEdit={editCommunity} onGarden={onGarden}/>}
          <CommunityActions onOpen={setSpace}/>
        </div>

        <section className="community-panel community-recent" aria-labelledby="community-recent-title">
          <h2 id="community-recent-title"><GardenIcon name="leaf"/>Lo más reciente en la comunidad</h2>
          <ul>{UPDATES.map(update => <li key={update.space}><button type="button" onClick={() => setSpace(update.space)}><span className="community-update-icon">{update.icon === 'calendar' ? <CommunityIcon name="calendar"/> : <GardenIcon name={update.icon}/>}</span><span><strong>{update.title}</strong><small>{update.subtitle}</small></span><CommunityIcon name="chevron"/></button></li>)}</ul>
          <button type="button" className="community-primary-button" onClick={() => setSpace('activities')}>Ver actividades<GardenIcon name="arrow"/></button>
        </section>
      </div>

      <nav className="community-panel community-shortcuts" aria-label="Explora la comunidad">
        <button type="button" onClick={() => setSpace('communities')}><span className="community-shortcut-icon"><CommunityShortcutIcon name="communities"/></span><span><strong>Nuestras comunidades</strong><small>Conoce y únete a proyectos locales.</small></span><CommunityIcon name="chevron"/></button>
        <button type="button" onClick={() => setSpace('garden')}><span className="community-shortcut-icon"><CommunityShortcutIcon name="garden"/></span><span><strong>Huertos compartidos</strong><small>Cultivamos y aprendemos juntos.</small></span><CommunityIcon name="chevron"/></button>
        <button type="button" onClick={() => setSpace('experience')}><span className="community-shortcut-icon"><CommunityIcon name="camera"/></span><span><strong>Publicar mi experiencia</strong><small>Comparte lo que cultivas.</small></span><CommunityIcon name="chevron"/></button>
      </nav>
      <p className="community-visit-note"><CommunityIcon name="info"/>{demo ? 'Demostración pública · ' : ''}Los datos se conservan en este navegador al recargar. Todavía no se sincronizan con otras personas.</p>
      <GameDecoration kind="flowers" className="community-corner-flowers"/>
    </div>

    {isFormOpen && <CommunityForm community={community} onSave={saveCommunity} onClose={() => setFormOpen(false)}/>}
    {isJoinOpen && <CommunityJoinDialog onClose={() => setJoinOpen(false)} onCreate={editCommunity} onHome={onHome}/>}
    {activeSpace && <CommunityDialog title={activeSpace.title} description={activeSpace.description} onClose={() => setSpace(null)}>
      {space === 'communities' && community ? <CommunityOverview community={community} garden={garden} onEdit={editCommunity} onGarden={onGarden}/>
        : <div className="community-space-empty"><span className="community-space-symbol">{space === 'experience' || space === 'conversations' || space === 'activities' ? <CommunityIcon name={space === 'experience' ? 'camera' : space === 'conversations' ? 'chat' : 'calendar'}/> : <GardenIcon name={space === 'garden' ? 'seed' : space === 'communities' ? 'community' : 'history'}/>}</span>{activeSpace.pending && <span className="community-pending-label">Pendiente de implementación</span>}<h3>{space === 'garden' && garden ? garden : activeSpace.empty}</h3><p>{space === 'garden' && community ? (garden ? 'Huerto registrado en este navegador para tu comunidad. El progreso compartido requiere un servicio de comunidad.' : 'Registra su ubicación y características para comenzar a cultivar juntos.') : space === 'communities' ? 'Puedes empezar por crear la tuya.' : activeSpace.pending || 'Este es un espacio de demostración. El contenido y las actividades se mostrarán cuando los servicios de comunidad estén disponibles.'}</p>
          {space === 'garden' && community ? <button className="community-primary-button" type="button" onClick={onGarden}>{garden ? 'Ir al huerto compartido' : 'Registrar huerto compartido'}<GardenIcon name="arrow"/></button>
            : (space === 'communities' || space === 'garden') && <button className="community-primary-button" type="button" onClick={editCommunity}>Crear mi comunidad<GardenIcon name="arrow"/></button>}
        </div>}
      <p className="community-demo-note">Demostración · No hay publicaciones, integrantes ni actividades de ejemplo presentados como reales.</p>
    </CommunityDialog>}
  </main>
}
