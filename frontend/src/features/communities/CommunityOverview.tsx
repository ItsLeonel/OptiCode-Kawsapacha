import GardenIcon from '../my-garden/GardenIcon'
import CommunityIcon from './CommunityIcon'
import { gameRegionAssets } from '../../shared/ui/game-ui/game-region-assets'
import { regionForProvince } from '../real-gardens/garden-region'
import type { Community } from './communities'
import CommunityCoverPhoto from './CommunityCoverPhoto'

export default function CommunityOverview({ community, garden, onEdit, onGarden }: {
  community: Community
  garden: string
  onEdit: () => void
  onGarden: () => void
}) {
  return <section className="community-panel community-overview" aria-label="Mi comunidad registrada">
    <div className="community-overview-cover"><CommunityCoverPhoto photo={community.coverPhoto} fallback={gameRegionAssets[regionForProvince(community.province ?? '')].background}/></div>
    <div className="community-overview-body">
      <div className="community-overview-heading">
        <div><span className="community-kicker">MI COMUNIDAD</span><h2>{community.name}</h2></div>
        <button className="community-secondary-button" type="button" onClick={onEdit}><CommunityIcon name="edit"/> Editar comunidad</button>
      </div>
      <div className="community-overview-grid">
        {community.description && <div className="community-overview-information"><p>{community.description}</p></div>}
        <dl className="community-overview-location"><div><dt><GardenIcon name="map"/> Localidad</dt><dd>{community.location || 'Sin especificar'}</dd></div><div><dt>Responsable</dt><dd>{community.responsible || 'Sin especificar'}</dd></div></dl>
        <div className="community-overview-members"><h3><GardenIcon name="community"/> Integrantes</h3><p>{(community.members?.length ?? 0) + 1} {(community.members?.length ?? 0) > 0 ? 'personas' : 'persona'}</p></div>
        <div className="community-overview-garden"><h3><GardenIcon name="seed"/>{garden || 'Huerto compartido'}</h3><button className="community-text-button" type="button" onClick={onGarden}>{garden ? 'Ver mi terreno' : 'Registrar mi terreno'}<GardenIcon name="arrow"/></button></div>
      </div>
    </div>
  </section>
}
