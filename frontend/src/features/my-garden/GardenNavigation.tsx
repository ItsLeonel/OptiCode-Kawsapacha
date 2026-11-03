import GardenIcon from './GardenIcon'
import type { GardenDestination } from './garden'

const ITEMS = [
  { destination: 'garden', label: 'Mi jardín', icon: 'garden' },
  { destination: 'community', label: 'Comunidad', icon: 'community' },
  { destination: 'real-garden', label: 'Mi Huerto', icon: 'seed' },
  { destination: 'plants', label: 'Descubrir plantas', icon: 'leaf' },
  { destination: 'history', label: 'Mi historia', icon: 'history' },
] as const

export default function GardenNavigation({ active, onNavigate, onWelcome }: {
  active: GardenDestination
  onNavigate: (destination: GardenDestination) => void
  onWelcome: () => void
}) {
  return <aside className="garden-sidebar">
    <button className="garden-brand" type="button" onClick={() => onNavigate('garden')} aria-label="Kawsapacha, ir a Mi jardín">
      <span className="garden-brand-leaf"><GardenIcon name="leaf"/></span><span><strong>Kawsapacha</strong><small>MI HUERTO VIVO</small></span>
    </button>
    <nav className="garden-nav" aria-label="Navegación principal">
      {ITEMS.map(item => <button type="button" key={item.destination} aria-current={active === item.destination ? 'page' : undefined} onClick={() => onNavigate(item.destination)}><GardenIcon name={item.icon}/><span>{item.label}</span></button>)}
    </nav>
    <div className="garden-sidebar-territory" aria-hidden="true"><GardenIcon name="mountain"/><span>Raíces que nos unen</span></div>
    <div className="garden-path-preview">
      <GardenIcon name="seed"/><strong>Mi camino verde</strong>
      <p>Aprendiz → Oficial → Maestro</p><small>Grado y Semillas de vida sin asignar.</small>
      <button type="button" onClick={() => onNavigate('history')}>Conocer mi camino <GardenIcon name="arrow"/></button>
    </div>
    <div className="garden-sidebar-footer"><span>Visitante · Sin sesión</span><button type="button" onClick={onWelcome}><GardenIcon name="back"/> Volver a bienvenida</button></div>
  </aside>
}
