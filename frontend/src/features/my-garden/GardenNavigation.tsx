import GardenIcon from './GardenIcon'
import type { GardenDestination } from './garden'
import GameDecoration from '../../shared/ui/game-ui/GameDecoration'
import { gameRegionAssets, type GameRegion } from '../../shared/ui/game-ui/game-region-assets'
import './garden-navigation-v3.css'

const ITEMS = [
  { destination: 'garden', label: 'Mi Jardín', icon: 'garden' },
  { destination: 'real-garden', label: 'Mi terreno', icon: 'map' },
  { destination: 'community', label: 'Comunidad', icon: 'community' },
  { destination: 'plants', label: 'Descubrir plantas', icon: 'leaf' },
  { destination: 'my-plants', label: 'Mis plantas', icon: 'pot' },
  { destination: 'history', label: 'Mi historia', icon: 'history' },
  { destination: 'progress', label: 'Mi camino verde', icon: 'target' },
] as const

export default function GardenNavigation({ active, onNavigate, onWelcome, demo = true, region = 'sierra' }: {
  active: GardenDestination
  onNavigate: (destination: GardenDestination) => void
  onWelcome: () => void
  demo?: boolean
  region?: GameRegion
}) {
  return <aside className="garden-sidebar game-v3" data-navigation={active}>
    <button className="garden-brand" type="button" onClick={() => onNavigate('garden')} aria-label="Kawsapacha, ir a Mi jardín">
      <GameDecoration kind="plank" className="garden-brand-plank"/>
      <span className="garden-brand-leaf"><GardenIcon name="leaf"/></span><span><strong>Kawsapacha</strong><small>MI HUERTO VIVO</small></span>
    </button>
    <nav className="garden-nav" aria-label="Navegación principal">
      {ITEMS.map(item => <button type="button" key={item.destination} aria-current={active === item.destination ? 'page' : undefined} onClick={() => onNavigate(item.destination)}><GardenIcon name={item.icon}/><span>{item.label}</span></button>)}
    </nav>
    <div className="garden-sidebar-territory" aria-hidden="true"><GardenIcon name="mountain"/></div>
    {active !== 'community' && <div className="garden-path-preview">
      <GardenIcon name="seed"/><strong>Mi camino verde</strong>
      <p>Aprende · Cultiva · Comparte</p>
      <button type="button" onClick={() => onNavigate('progress')}>Conocer mi camino <GardenIcon name="arrow"/></button>
    </div>}
    {active === 'community' && <img className="garden-sidebar-character" src={gameRegionAssets[region].guide} alt="" aria-hidden="true"/>}
    <div className="garden-sidebar-footer"><span>{demo ? 'Visitante · Sin sesión' : 'Sesión confirmada'}</span><button type="button" onClick={onWelcome}><GardenIcon name="back"/> Volver a bienvenida</button></div>
  </aside>
}
