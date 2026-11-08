import GardenIcon from './GardenIcon'
import type { GardenDestination } from './garden'
import GameDecoration from '../../shared/ui/game-ui/GameDecoration'
import './garden-navigation-v3.css'

type PrimaryDestination = 'garden' | 'community' | 'progress'
type SidebarProgress = {
  points: number
  level: string
  progressPercent: number
  nextLevel?: string
  badges: { id: string; label: string; earned: boolean }[]
}

const ITEMS: { destination: PrimaryDestination; label: string; icon: 'garden' | 'community' | 'target' }[] = [
  { destination: 'garden', label: 'Mi Huerto Vivo', icon: 'garden' },
  { destination: 'community', label: 'Comunidad', icon: 'community' },
  { destination: 'progress', label: 'Mi camino verde', icon: 'target' },
]

export default function GardenNavigation({ active, onNavigate, onWelcome, demo = true, progress }: {
  active: PrimaryDestination
  onNavigate: (destination: GardenDestination) => void
  onWelcome: () => void
  demo?: boolean
  progress: SidebarProgress
}) {
  const earnedBadges = progress.badges.filter(badge => badge.earned)
  return <aside className="garden-sidebar game-v3">
    <button className="garden-brand" type="button" onClick={() => onNavigate('garden')} aria-label="Kawsapacha, ir a Mi Huerto Vivo">
      <GameDecoration kind="plank" className="garden-brand-plank"/>
      <span className="garden-brand-leaf"><GardenIcon name="leaf"/></span><span><strong>Kawsapacha</strong><small>MI HUERTO VIVO</small></span>
    </button>
    <nav className="garden-nav" aria-label="Módulos principales">
      {ITEMS.map(item => <button type="button" key={item.destination} aria-current={active === item.destination ? 'page' : undefined} onClick={() => onNavigate(item.destination)}><GardenIcon name={item.icon}/><span>{item.label}</span></button>)}
    </nav>
    <button className="garden-path-preview" type="button" onClick={() => onNavigate('progress')} aria-label={`Ver Mi camino verde: ${progress.points} Semillas de vida, nivel ${progress.level}`}>
      <span className="garden-progress-heading"><GardenIcon name="seed"/><strong>Mi progreso</strong></span>
      <span className="garden-progress-level"><strong>{progress.level}</strong><output>{progress.points} Semillas</output></span>
      <progress aria-label="Avance al siguiente nivel" max={100} value={progress.progressPercent}/>
      <span className="garden-progress-next">{progress.nextLevel ? `Siguiente: ${progress.nextLevel}` : 'Nivel Maestro'}</span>
      <span className="garden-progress-badges" aria-label={`${earnedBadges.length} insignias obtenidas`}>
        {earnedBadges.length ? earnedBadges.map(badge => <span key={badge.id} title={badge.label} aria-label={badge.label}>✦</span>) : <small>Sin insignias obtenidas</small>}
      </span>
    </button>
    <div className="garden-sidebar-footer"><span>{demo ? 'Visitante · Sin sesión' : 'Sesión confirmada'}</span><button type="button" onClick={onWelcome}><GardenIcon name="back"/> Volver a bienvenida</button></div>
  </aside>
}
