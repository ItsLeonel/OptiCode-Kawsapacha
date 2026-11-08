import { GameButton, GameGuide, GamePanel } from '../../shared/ui/game-ui/GameUI'
import type { Community } from '../communities/communities'
import type { GardenRegion } from '../real-gardens/garden-region'
import GardenIcon from './GardenIcon'
import './garden-onboarding.css'
import GameDecoration from '../../shared/ui/game-ui/GameDecoration'

export default function GardenOnboarding({
  community,
  region,
  onCreateCommunity,
  onJoinCommunity,
  onCommunity,
  onRegisterGarden,
  onOpenNotifications,
  pendingInvitationsCount = 0,
}: {
  community: Community | null
  region: GardenRegion
  onCreateCommunity: () => void
  onJoinCommunity: () => void
  onCommunity: () => void
  onRegisterGarden: () => void
  onOpenNotifications?: () => void
  pendingInvitationsCount?: number
}) {
  return <section className="garden-onboarding" aria-labelledby="garden-onboarding-title">
    <GameGuide region={region}/>
    <GamePanel className="garden-onboarding-panel">
      <div className="garden-onboarding-copy">
        <span className="garden-onboarding-kicker"><GardenIcon name="leaf"/>{community ? 'SIGUIENTE PASO · TU TERRITORIO' : 'EMPIEZA TU CAMINO'}</span>
        <h2 id="garden-onboarding-title">{community ? 'Tu comunidad ya está creada' : 'Empieza tu comunidad'}</h2>
        <p>{community ? 'Registra el lugar donde cultivan para verlo en Mi Jardín.' : 'Encuentra a las personas con quienes quieres cultivar. También puedes crear una comunidad personal, de una sola persona.'}</p>
        {community ? <>
          <div className="garden-onboarding-community"><GardenIcon name="community"/><div><strong>{community.name}</strong><span>{community.location || community.province || 'Comunidad local'}</span></div></div>
          <GameButton className="garden-start-button" onClick={onRegisterGarden}><GardenIcon name="map"/>Registrar mi terreno<GardenIcon name="arrow"/></GameButton>
          <button className="garden-onboarding-link" type="button" onClick={onCommunity}>Ver mi comunidad<GardenIcon name="arrow"/></button>
        </> : <div className="garden-onboarding-actions">
          <GameButton onClick={onCreateCommunity}><GardenIcon name="community"/>Crear mi comunidad<GardenIcon name="arrow"/></GameButton>
          <GameButton variant="secondary" onClick={onJoinCommunity}><GardenIcon name="community"/>Unirme a una comunidad<GardenIcon name="arrow"/></GameButton>
          {onOpenNotifications && (
            <GameButton variant="secondary" onClick={onOpenNotifications}>
              <span aria-hidden="true">🔔</span>
              {pendingInvitationsCount > 0 ? `Bandeja de Notificaciones (${pendingInvitationsCount})` : 'Bandeja de Notificaciones'}
              <GardenIcon name="arrow"/>
            </GameButton>
          )}
        </div>}
      </div>
      <GameDecoration kind="flowers" className="garden-onboarding-foliage"/>
    </GamePanel>
  </section>
}
