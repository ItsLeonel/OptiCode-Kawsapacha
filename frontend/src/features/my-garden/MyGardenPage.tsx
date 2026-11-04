import GardenIcon from './GardenIcon'
import GardenScene from './GardenScene'
import GreenChallenges from './GreenChallenges'
import { GardenRegionalBackground } from './GardenRegionalScenery'
import { regionForProvince } from '../real-gardens/garden-region'
import type { GardenAction, GardenDestination, GardenPlant } from './garden'
import { GARDEN_KINDS, formatGardenArea, type RealGarden } from '../real-gardens/real-garden'
import './my-garden.css'
import './my-garden-v2.css'
import './garden-scene.css'

const ACTIONS = [
  { action: 'register', label: 'Registrar planta', icon: 'seed' },
  { action: 'logbook', label: 'Bitácora', icon: 'book' },
  { action: 'real-garden', label: 'Mi huerto real', icon: 'map' },
  { action: 'passport', label: 'Pasaporte Vivo', icon: 'history' },
] as const

export default function MyGardenPage({ plants, community, garden, province, realGarden, selectedPlot, onSelect, onRegister, onAction, onNavigate }: {
  plants: GardenPlant[]
  community: string
  garden: string
  province: string
  realGarden: RealGarden | null
  selectedPlot: number | null
  onSelect: (plant: GardenPlant) => void
  onRegister: (plot: number) => void
  onAction: (action: GardenAction) => void
  onNavigate: (destination: GardenDestination) => void
}) {
  const region = regionForProvince(realGarden?.location.province ?? '')
  return <main className="my-garden-page" data-region={region} data-garden-kind={realGarden?.kind ?? 'unregistered'}>
    <GardenRegionalBackground region={region}/>
    <div className="garden-visitor-notice"><span className="garden-visitor-dot"/> Demostración pública · Visitante sin sesión</div>
    <header className="garden-welcome">
      <div><span className="garden-eyebrow">MI JARDÍN · KAWSAPACHA</span><h1 tabIndex={-1} data-screen-heading>¡Bienvenido a <span>tu Jardín!</span> <GardenIcon name="leaf"/></h1><p>Tu huerto real y tu jardín digital crecen juntos.</p></div>
      {realGarden && <span className="garden-territory" aria-label="Ubicación de tu huerto"><GardenIcon name="map"/><strong>{province}</strong><small className="garden-territory-name">{garden}</small><small>{GARDEN_KINDS[realGarden.kind].label} · {formatGardenArea(realGarden.areaM2)}{realGarden.location.canton && ` · ${realGarden.location.canton}`}</small></span>}
    </header>
    <div className="garden-world-content">{realGarden ? <GardenScene kind={realGarden.kind} region={region} plants={plants} selectedPlot={selectedPlot} onRegister={onRegister} onSelect={onSelect}/> :
      <section className="garden-start" aria-labelledby="garden-start-title"><div className="garden-start-emblem" aria-hidden="true"><GardenIcon name="seed"/></div><span className="garden-eyebrow">RAÍCES REALES, UN JARDÍN POR DESCUBRIR</span><h2 id="garden-start-title">Tu jardín comienza<br/>con un huerto real</h2><p>Registra dónde cultivas y dale un lugar a cada planta.</p><button type="button" className="garden-start-button" onClick={() => onAction('real-garden')}><GardenIcon name="map"/>Registrar mi huerto<GardenIcon name="arrow"/></button></section>}
      <GreenChallenges onNavigate={onNavigate} onAction={onAction}/></div>
    <nav className="garden-quick-actions" aria-label="Acciones de tu jardín">{ACTIONS.map(item => <button key={item.action} type="button" data-action={item.action} onClick={() => onAction(item.action)}><span><GardenIcon name={item.icon}/></span>{item.label}</button>)}</nav>
    <p className="garden-world-footer"><GardenIcon name="mountain"/>{community ? `${community} · ` : ''}Registros temporales. Se pierden al recargar.</p>
  </main>
}
