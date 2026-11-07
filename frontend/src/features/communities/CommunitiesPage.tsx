import { useState } from 'react'
import GardenIcon from '../my-garden/GardenIcon'
import CommunityDialog from './CommunityDialog'
import CommunityForm from './CommunityForm'
import CommunityIcon from './CommunityIcon'
import CommunityOverview from './CommunityOverview'
import CommunityShortcutIcon from './CommunityShortcutIcon'
import CommunityActions from './CommunityActions'
import { COMMUNITY_SPACES, type Community, type CommunitySave, type CommunitySpace } from './communities'
import './communities.css'

const UPDATES = [
  { space: 'wisdom', title: 'Saberes por compartir', subtitle: 'Aún no hay relatos publicados.', icon: 'history' },
  { space: 'experience', title: 'Experiencias por contar', subtitle: 'Aún no hay experiencias publicadas.', icon: 'seed' },
  { space: 'activities', title: 'Próximas actividades', subtitle: 'Aún no hay encuentros programados.', icon: 'calendar' },
] as const

export default function CommunitiesPage({ community, garden, onSave, onGarden, onHome }: {
  community: Community | null
  garden: string
  onSave: CommunitySave
  onGarden: () => void
  onHome: () => void
}) {
  const [isFormOpen, setFormOpen] = useState(false)
  const [space, setSpace] = useState<CommunitySpace | null>(null)
  const [notice, setNotice] = useState('')
  const activeSpace = space ? COMMUNITY_SPACES[space] : null

  function editCommunity() {
    document.querySelector<HTMLDialogElement>('.community-dialog[open]')?.close()
    setSpace(null)
    setFormOpen(true)
  }

  async function saveCommunity(values: Community) {
    await onSave(values)
    setFormOpen(false)
    setNotice(community ? 'Cambios guardados durante esta visita.' : 'Comunidad creada durante esta visita. Ya puedes consultar sus datos y registrar su huerto compartido.')
  }

  return <main className="communities-page">
    <div className="community-world-background" aria-hidden="true"/>
    <div className="community-page-content">
      <header className="community-topbar">
        <nav className="community-breadcrumbs" aria-label="Ruta de navegación"><button type="button" onClick={onHome}><GardenIcon name="seed"/> Kawsapacha</button><span aria-hidden="true">/</span><span aria-current="page">Comunidad</span></nav>
        <span className="community-visitor"><span aria-hidden="true">V</span>Modo visitante · Sin sesión</span>
      </header>

      <section className="community-hero" aria-labelledby="community-title">
        <div className="community-hero-copy"><h1 id="community-title" data-screen-heading tabIndex={-1}>Comunidad <GardenIcon name="leaf"/></h1><p className="community-subtitle">Historias de la Tierra</p><p className="community-intro">Un espacio para compartir saberes, experiencias<br className="community-desktop-break"/> y la relación con nuestra tierra.</p></div>
        <button className="community-primary-button community-create" type="button" onClick={editCommunity}><GardenIcon name="community"/><span>{community ? 'Mi comunidad' : 'Crear mi comunidad'}</span><GardenIcon name="arrow"/></button>
      </section>

      <p className="community-save-status" role="status" aria-live="polite" aria-atomic="true">{notice}</p>
      {notice && community && !garden && <button className="community-primary-button" type="button" onClick={onGarden}><GardenIcon name="seed"/>Registrar Mi Huerto<GardenIcon name="arrow"/></button>}

      {community && <CommunityOverview community={community} garden={garden} onEdit={editCommunity} onGarden={onGarden}/>}

      <div className="community-stories-grid">
        <CommunityActions onOpen={setSpace}/>

        <section className="community-panel community-recent" aria-labelledby="community-recent-title">
          <h2 id="community-recent-title"><GardenIcon name="leaf"/>Lo más reciente en la comunidad</h2>
          <p className="community-section-note">Un espacio que empieza contigo.</p>
          <ul>{UPDATES.map(update => <li key={update.space}><button type="button" onClick={() => setSpace(update.space)}><span className="community-update-icon">{update.icon === 'calendar' ? <CommunityIcon name="calendar"/> : <GardenIcon name={update.icon}/>}</span><span><strong>{update.title}</strong><small>{update.subtitle}</small></span><CommunityIcon name="chevron"/></button></li>)}</ul>
          <span className="community-empty-label">Sin publicaciones · Demostración</span>
        </section>
      </div>

      <nav className="community-panel community-shortcuts" aria-label="Explora la comunidad">
        <button type="button" onClick={() => setSpace('communities')}><span className="community-shortcut-icon"><CommunityShortcutIcon name="communities"/></span><span><strong>Nuestras comunidades</strong><small>Conoce y únete a proyectos locales.</small></span><CommunityIcon name="chevron"/></button>
        <button type="button" onClick={() => setSpace('garden')}><span className="community-shortcut-icon"><CommunityShortcutIcon name="garden"/></span><span><strong>Huertos compartidos</strong><small>Cultivamos y aprendemos juntos.</small></span><CommunityIcon name="chevron"/></button>
        <button type="button" onClick={() => setSpace('activities')}><span className="community-shortcut-icon"><CommunityShortcutIcon name="activities"/></span><span><strong>Actividades de la comunidad</strong><small>Talleres, mingas y más.</small></span><CommunityIcon name="chevron"/></button>
      </nav>
      <p className="community-visit-note"><CommunityIcon name="info"/>Demostración pública · Los datos se conservan solo en esta visita. Se perderán al recargar.</p>
    </div>

    {isFormOpen && <CommunityForm community={community} onSave={saveCommunity} onClose={() => setFormOpen(false)}/>}
    {activeSpace && <CommunityDialog title={activeSpace.title} description={activeSpace.description} onClose={() => setSpace(null)}>
      {space === 'communities' && community ? <CommunityOverview community={community} garden={garden} onEdit={editCommunity} onGarden={onGarden}/>
        : <div className="community-space-empty"><span className="community-space-symbol">{space === 'experience' || space === 'conversations' || space === 'activities' ? <CommunityIcon name={space === 'experience' ? 'camera' : space === 'conversations' ? 'chat' : 'calendar'}/> : <GardenIcon name={space === 'garden' ? 'seed' : space === 'communities' ? 'community' : 'history'}/>}</span>{activeSpace.pending && <span className="community-pending-label">Pendiente de implementación</span>}<h3>{space === 'garden' && garden ? garden : activeSpace.empty}</h3><p>{space === 'garden' && community ? (garden ? 'Huerto registrado temporalmente para tu comunidad durante esta visita.' : 'Registra su ubicación y características para comenzar a cultivar juntos.') : space === 'communities' ? 'Puedes empezar por crear la tuya.' : activeSpace.pending || 'Este es un espacio de demostración. El contenido y las actividades se mostrarán cuando los servicios de comunidad estén disponibles.'}</p>
          {space === 'garden' && community ? <button className="community-primary-button" type="button" onClick={onGarden}>{garden ? 'Ir al huerto compartido' : 'Registrar huerto compartido'}<GardenIcon name="arrow"/></button>
            : (space === 'communities' || space === 'garden') && <button className="community-primary-button" type="button" onClick={editCommunity}>Crear mi comunidad<GardenIcon name="arrow"/></button>}
        </div>}
      <p className="community-demo-note">Demostración · No hay publicaciones, integrantes ni actividades de ejemplo presentados como reales.</p>
    </CommunityDialog>}
  </main>
}
