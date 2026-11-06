import GardenIcon from '../my-garden/GardenIcon'
import CommunityIcon from './CommunityIcon'
import communityImage from './assets/comunidad-v2.jpg'
import type { Community } from './communities'

export default function CommunityOverview({ community, garden, onEdit, onGarden }: {
  community: Community
  garden: string
  onEdit?: () => void
  onGarden: () => void
}) {
  return <section className="community-panel community-overview" aria-label="Mi comunidad registrada">
    <div className="community-overview-cover" aria-hidden="true"><img src={communityImage} alt="" width="1536" height="1024" decoding="async"/><span>Ilustración decorativa</span></div>
    <div className="community-overview-body">
      <div className="community-overview-heading">
        <div><span className="community-kicker">MI COMUNIDAD · REGISTRO TEMPORAL</span><h2>{community.name}</h2></div>
        {onEdit && (
          <button className="community-secondary-button" type="button" onClick={onEdit}><CommunityIcon name="edit"/> Editar comunidad</button>
        )}
      </div>
      <div className="community-overview-grid">
        <div className="community-overview-information"><p>{community.description || 'Aún no has añadido una descripción.'}</p></div>
        <dl className="community-overview-location"><div><dt><GardenIcon name="map"/> Localidad</dt><dd>{community.location || 'Sin especificar'}</dd></div><div><dt>Responsable</dt><dd>{community.responsible || 'Sin especificar'}</dd></div></dl>
        <div className="community-overview-members"><h3><GardenIcon name="community"/> Integrantes</h3><p>Aún no hay integrantes registrados.</p></div>
        <div className="community-overview-garden"><h3><GardenIcon name="seed"/>{garden || 'Huerto compartido'}</h3><button className="community-text-button" type="button" onClick={onGarden}>{garden ? 'Ir al huerto compartido' : 'Registrar huerto compartido'}<GardenIcon name="arrow"/></button></div>
      </div>
    </div>
  </section>
}
