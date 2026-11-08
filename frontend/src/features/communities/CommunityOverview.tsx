import GardenIcon from '../my-garden/GardenIcon'
import CommunityIcon from './CommunityIcon'
import { gameRegionAssets } from '../../shared/ui/game-ui/game-region-assets'
import { regionForProvince } from '../real-gardens/garden-region'
import type { Community } from './communities'
import CommunityCoverPhoto from './CommunityCoverPhoto'
import { COMMUNITY_TYPES } from './community-art'

export default function CommunityOverview({
  community,
  garden,
  acceptedMembersCount,
  pendingInvitationsCount,
  onEdit,
  onGarden,
}: {
  community: Community
  garden: string
  acceptedMembersCount?: number
  pendingInvitationsCount?: number
  onEdit?: () => void
  onGarden: () => void
}) {
  const typeLabel = COMMUNITY_TYPES.find(t => t.value === community.type)?.label ||
    (community.type ? community.type.charAt(0).toUpperCase() + community.type.slice(1) : null)

  const count = acceptedMembersCount !== undefined
    ? acceptedMembersCount
    : ((community as any)?._count?.members ?? ((community.members?.length ?? 0) + 1))

  return <section className="community-panel community-overview" aria-label="Mi comunidad registrada">
    <div className="community-overview-cover"><CommunityCoverPhoto photo={community.coverPhoto} fallback={gameRegionAssets[regionForProvince(community.province ?? '')].background}/></div>
    <div className="community-overview-body">
      <div className="community-overview-heading">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span className="community-kicker">MI COMUNIDAD</span>
            {typeLabel && (
              <span className="community-type-pill" style={{
                background: '#edf7ed',
                color: '#2e7d32',
                border: '1px solid #c8e6c9',
                borderRadius: '12px',
                padding: '2px 10px',
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '0.5px'
              }}>
                Comunidad {typeLabel}
              </span>
            )}
          </div>
          <h2>{community.name}</h2>
        </div>
        {onEdit && (
          <button className="community-secondary-button" type="button" onClick={onEdit}><CommunityIcon name="edit"/> Editar comunidad</button>
        )}
      </div>
      <div className="community-overview-grid">
        {community.description && <div className="community-overview-information"><p>{community.description}</p></div>}
        <dl className="community-overview-location"><div><dt><GardenIcon name="map"/> Localidad</dt><dd>{community.location || 'Sin especificar'}</dd></div><div><dt>Responsable</dt><dd>{community.responsible || 'Sin especificar'}</dd></div></dl>
        <div className="community-overview-members">
          <h3><GardenIcon name="community"/> Integrantes</h3>
          <p>{count} {count === 1 ? 'persona' : 'personas'}</p>
          {Boolean(pendingInvitationsCount && pendingInvitationsCount > 0) && (
            <small style={{ color: '#8a641a', fontSize: '11px', display: 'block', marginTop: '2px', fontWeight: 600 }}>
              ⏳ {pendingInvitationsCount} {pendingInvitationsCount === 1 ? 'solicitud pendiente' : 'solicitudes pendientes'}
            </small>
          )}
        </div>
        <div className="community-overview-garden"><h3><GardenIcon name="seed"/>{garden || 'Huerto compartido'}</h3><button className="community-text-button" type="button" onClick={onGarden}>{garden ? 'Ver mi terreno' : 'Registrar mi terreno'}<GardenIcon name="arrow"/></button></div>
      </div>
    </div>
  </section>
}
