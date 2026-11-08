import { lazy, Suspense, type ReactNode } from 'react'
import GardenIcon from './GardenIcon'
import GreenChallenges from './GreenChallenges'
import GardenOnboarding from './GardenOnboarding'
import type { Community } from '../communities/communities'
import { GardenRegionalBackground } from './GardenRegionalScenery'
import { regionForProvince } from '../real-gardens/garden-region'
import GameTitle from '../../shared/ui/game-ui/GameTitle'
import GameDecoration from '../../shared/ui/game-ui/GameDecoration'
import type { GardenAction, GardenDestination, GardenPlant } from './garden'
import type { GardenSceneRenderer } from './garden-scene-renderer'
import type { GardenSceneRendererProps } from './garden-scene-renderer'
import { GARDEN_KINDS, formatGardenArea, type RealGarden } from '../real-gardens/real-garden'
import './my-garden.css'
import './my-garden-v2.css'
import './garden-scene.css'
import './my-garden-v3.css'

const ACTIONS = [
  { action: 'activity', label: 'Registrar actividad', icon: 'book' },
  { action: 'register', label: 'Registrar planta', icon: 'seed' },
  { action: 'logbook', label: 'Bitácora', icon: 'book' },
  { action: 'passport', label: 'Pasaporte Vivo', icon: 'history' },
  { action: 'my-plants', label: 'Mis plantas', icon: 'pot' },
  { action: 'progress', label: 'Progreso', icon: 'target' },
] as const
const PhaserGarden = lazy(() => import('./phaser-poc/PhaserGardenPoc'))

export default function MyGardenPage({ plants, community, realGarden, selectedPlot, onCreateCommunity, onJoinCommunity, onSelect, onRegister, onAction, onNavigate, terrainView, terrainProvince, renderGardenScene, activities, feedback, progress, interactionBlocked = false, demo = true }: {
  plants: GardenPlant[]
  community: Community | null
  realGarden: RealGarden | null
  selectedPlot: number | null
  terrainView?: ReactNode
  terrainProvince?: string
  renderGardenScene?: GardenSceneRenderer
  activities?: GardenSceneRendererProps['activities']
  feedback?: GardenSceneRendererProps['feedback']
  progress?: GardenSceneRendererProps['progress']
  interactionBlocked?: boolean
  onCreateCommunity: () => void
  onJoinCommunity: () => void
  demo?: boolean
  onSelect: (plant: GardenPlant) => void
  onRegister: (plot: number) => void
  onAction: (action: GardenAction) => void
  onNavigate: (destination: GardenDestination) => void
}) {
  const territory = (terrainView ? terrainProvince : realGarden?.location.province) || community?.province || ''
  const region = regionForProvince(territory)
  return <main className="my-garden-page game-v3" data-view={terrainView ? 'terrain' : 'garden'} data-region={region} data-garden-kind={realGarden?.kind ?? 'unregistered'} data-onboarding={community && realGarden ? 'complete' : community ? 'real-garden' : 'community'}>
    <GardenRegionalBackground region={region} variant={realGarden && !terrainView ? 'garden' : 'welcome'}/>
    <div className="garden-visitor-notice"><span className="garden-visitor-dot"/> {demo ? 'Demostración pública · Visitante sin sesión' : 'Sesión confirmada · Guardado local'}</div>
    <header className="garden-welcome">
      <div className="garden-welcome-sign"><GameDecoration kind="plank" className="garden-welcome-wood"/><GameTitle as="h1" screenHeading tabIndex={-1} icon={<GardenIcon name="leaf"/>}>{terrainView ? 'Mi terreno' : '¡Bienvenido a tu Jardín!'}</GameTitle><p>{terrainView ? realGarden ? 'La ubicación y las características de tu espacio de cultivo.' : 'Registra y describe tu espacio de cultivo real.' : 'Tu huerto real y tu jardín digital crecen juntos.'}</p></div>
      {realGarden && !terrainView && <span className="garden-territory" aria-label="Ubicación de tu huerto"><GardenIcon name="map"/><strong>{realGarden.location.province}</strong><small className="garden-territory-name">{realGarden.name}</small><small>{GARDEN_KINDS[realGarden.kind].label} · {formatGardenArea(realGarden.areaM2)}{realGarden.location.canton && ` · ${realGarden.location.canton}`}</small></span>}
    </header>
    <nav className="garden-view-navigation" aria-label="Vistas de Mi Jardín"><button type="button" aria-current={!terrainView ? 'page' : undefined} onClick={() => onNavigate('garden')}><GardenIcon name="garden"/>Mi Jardín</button><button type="button" aria-current={terrainView ? 'page' : undefined} onClick={() => onAction('real-garden')}><GardenIcon name="map"/>Mi terreno</button></nav>
    <div className={`garden-world-content${terrainView ? ' garden-world-content--terrain' : ''}`}>{terrainView || (community && realGarden ? renderGardenScene ? renderGardenScene({ realGarden, plants, selectedPlot, interactionBlocked, onRegister, onSelect, activities, feedback, progress }) : <Suspense fallback={<p role="status">Preparando Mi Jardín Vivo…</p>}><PhaserGarden realGarden={realGarden} plants={plants} selectedPlot={selectedPlot} interactionBlocked={interactionBlocked} onRegister={onRegister} onSelect={onSelect} activities={activities} feedback={feedback} progress={progress}/></Suspense> :
      <GardenOnboarding community={community} region={region} onCreateCommunity={onCreateCommunity} onJoinCommunity={onJoinCommunity} onCommunity={() => onNavigate('community')} onRegisterGarden={() => onAction('real-garden')}/>)}
      {!terrainView && <GreenChallenges onNavigate={onNavigate} onAction={onAction}/>}</div>
    <nav className="garden-quick-actions" aria-label="Acciones de tu jardín">{ACTIONS.map(item => <button key={item.action} type="button" data-action={item.action} onClick={() => onAction(item.action)}><span><GardenIcon name={item.icon}/></span>{item.label}</button>)}</nav>
    <p className="garden-world-footer"><GardenIcon name="mountain"/>{community ? `${community.name} · ` : ''}Registros y fotografías guardados en este navegador.</p>
  </main>
}
