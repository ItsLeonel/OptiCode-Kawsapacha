import { useState, type CSSProperties } from 'react'
import { GARDEN_REGIONS, type GardenRegion } from '../../real-gardens/garden-region'
import type { GardenJournal } from '../journal/journal'
import { calculateProgress } from '../journal/progress'
import { BADGE_DEFINITIONS, DOCUMENTED_LEVELS, MISSION_DEFINITIONS, type AuthoritativeRewards, type RewardBadgeId, type RewardMissionId } from './rewards-types'
import './rewards.css'

const IMAGE_FILES: Record<string, string> = {
  'seed-cacao': new URL('./art/seed-cacao.webp', import.meta.url).href,
  'level-shield': new URL('./art/level-shield.webp', import.meta.url).href,
  'badge-seed': new URL('./art/badge-seed.webp', import.meta.url).href,
  'badge-water': new URL('./art/badge-water.webp', import.meta.url).href,
  'badge-observe': new URL('./art/badge-observe.webp', import.meta.url).href,
  'badge-harvest': new URL('./art/badge-harvest.webp', import.meta.url).href,
  'mission-water': new URL('./art/mission-water.webp', import.meta.url).href,
  'mission-camera': new URL('./art/mission-camera.webp', import.meta.url).href,
  'mission-moon': new URL('./art/mission-moon.webp', import.meta.url).href,
}

function Art({ name, className = '' }: { name: keyof typeof IMAGE_FILES; className?: string }) {
  return <img className={`rv-art ${className}`} src={IMAGE_FILES[name]} alt="" aria-hidden="true" decoding="async" />
}

function localMissionDates(journal: GardenJournal) {
  const valid = journal.activities.filter(activity => activity.gardenId === journal.gardenId && activity.validation === 'local-v1' && !activity.voidedAt)
  const watering = new Set(valid.filter(activity => activity.type === 'watering').map(activity => activity.date)).size
  const observer = new Set(valid.filter(activity => activity.type === 'observation' && activity.photoIds.length > 0).map(activity => activity.date)).size
  return { care: Math.min(watering, 3), observer: Math.min(observer, 3) }
}

export default function RewardsDashboard({ journal, region, authenticated, official }: {
  journal: GardenJournal
  region: GardenRegion
  authenticated: boolean
  /** Opcional: exclusivamente datos entregados y validados por la futura API. */
  official?: AuthoritativeRewards | null
}) {
  const [selectedBadge, setSelectedBadge] = useState<RewardBadgeId | null>(null)
  const [selectedMission, setSelectedMission] = useState<RewardMissionId | null>(null)
  const [showTrajectory, setShowTrajectory] = useState(false)
  const [showAllBadges, setShowAllBadges] = useState(false)
  const [showAllMissions, setShowAllMissions] = useState(false)

  const isServer = authenticated && official?.source === 'server'
  const isVisitor = !authenticated
  const actor = journal.community?.responsible || journal.activities[0]?.responsible
  const local = isVisitor ? calculateProgress(journal, actor) : null
  const localCounts = isVisitor ? localMissionDates(journal) : { care: 0, observer: 0 }
  const seeds = isServer ? official?.seeds : local?.points
  const level = isServer ? official?.level : local?.level
  const next = isServer ? official?.nextLevel : local?.nextLevel
  const percent = isServer ? official?.progressPercent : local?.progressPercent
  const remaining = isServer ? official?.remaining : local?.remaining
  const currentRegion = GARDEN_REGIONS[region] ?? GARDEN_REGIONS.sierra
  const background = { '--rv-region-background': `url("${currentRegion.background}")` } as CSSProperties
  const missionProgress = (id: RewardMissionId): AuthoritativeRewards['missions'][number] | null => {
    if (isServer && official) return official.missions.find(item => item.id === id) ?? null
    if (isVisitor && id !== 'lunar') return { id, current: localCounts[id], target: 3, completed: localCounts[id] >= 3 }
    return null
  }
  const earnedBadge = (id: RewardBadgeId) => {
    if (isServer) return Boolean(official?.badges.find(item => item.id === id)?.earned)
    if (isVisitor) return Boolean(local?.badges.find(item => item.id === id)?.earned)
    return false
  }
  const selected = BADGE_DEFINITIONS.find(item => item.id === selectedBadge)
  const missionSelected = MISSION_DEFINITIONS.find(item => item.id === selectedMission)

  return <section className="kaws-rewards" style={background} data-region={region} aria-label="Mi camino verde">
    <div className="rv-landscape" aria-hidden="true" />
    <header className="rv-hero">
      <div className="rv-hero-sign"><span className="rv-hero-leaves" aria-hidden="true">❧</span><h1>Mi camino verde</h1><span className="rv-hero-leaves" aria-hidden="true">❧</span></div>
      <p>Tu trayectoria de aprendizaje y cuidado del huerto</p>
    </header>
    <div className="rv-content">
      <p className="rv-source" role="status">
        {isServer ? 'Semillas, insignias y misiones confirmadas por Kawsapacha.'
          : authenticated ? 'Recompensas oficiales pendientes de sincronización con el servidor. No se muestran puntos locales como oficiales.'
            : 'Modo visitante · vista previa local. Los puntos mostrados no son oficiales ni se comparten entre dispositivos.'}
      </p>
      <section className="rv-surface rv-summary" aria-label="Tu progreso">
        <div className="rv-summary-seeds"><Art name="seed-cacao" className="rv-summary-seed-img"/><div><h2>Semillas de vida</h2><output aria-label="Semillas de vida">{seeds ?? '—'}</output></div></div>
        <div className="rv-summary-medallion"><Art name="level-shield" /></div>
        <div className="rv-summary-level"><h2>Mi nivel actual</h2><strong className="rv-level-tag">{level ?? 'Sin sincronizar'}</strong></div>
        <div className="rv-summary-next"><strong>{next ? `Siguiente: ${next}` : level === 'Maestro' ? 'Nivel Maestro' : 'Siguiente nivel pendiente'}</strong><progress aria-label="Progreso al siguiente nivel" value={percent ?? 0} max={100} /><small>{remaining !== undefined ? (next ? `${remaining} semillas para ${next}` : 'Nivel máximo documentado') : 'Sin datos oficiales'}</small></div>
      </section>
      <div className="rv-main-grid">
        <section className="rv-surface rv-panel rv-badges" aria-labelledby="rv-badges-heading">
          <h2 id="rv-badges-heading" className="rv-plank"><span aria-hidden="true">✺</span> Mis insignias</h2>
          <div className="rv-badge-grid">
            {BADGE_DEFINITIONS.map(badge => <button key={badge.id} type="button" className={`rv-badge${earnedBadge(badge.id) ? ' is-earned' : ' is-locked'}`} aria-pressed={selectedBadge === badge.id} onClick={() => setSelectedBadge(selectedBadge === badge.id ? null : badge.id)}>
              <Art name={badge.image}/><strong>{badge.label}</strong><small>{earnedBadge(badge.id) ? 'Obtenida' : authenticated ? 'Pendiente' : 'Por conseguir'}</small>
            </button>)}
          </div>
          {selected && <div className="rv-selected-detail" role="status"><strong>{selected.label}</strong><span>{selected.criterion}</span><small>{earnedBadge(selected.id) ? 'Insignia conseguida' : 'Aún no desbloqueada'}</small></div>}
          <button type="button" className="rv-subtle-button" aria-expanded={showAllBadges} onClick={() => setShowAllBadges(value => !value)}>{showAllBadges ? 'Ocultar requisitos' : 'Ver todas mis insignias'} <span aria-hidden="true">{showAllBadges ? '⌃' : '⌄'}</span></button>
          {showAllBadges && <ul className="rv-extra-detail">{BADGE_DEFINITIONS.map(badge => <li key={badge.id}><strong>{badge.label}:</strong> {badge.criterion}</li>)}</ul>}
        </section>
        <section className="rv-surface rv-panel rv-missions" aria-labelledby="rv-missions-heading">
          <h2 id="rv-missions-heading" className="rv-plank"><span aria-hidden="true">◎</span> Misiones verdes</h2>
          <span className="rv-mission-count">{isServer ? `${official?.missions.filter(item => !item.completed).length ?? 0} misiones activas` : isVisitor ? '3 misiones sugeridas' : 'Por sincronizar'}</span>
          <div className="rv-mission-list">
            {MISSION_DEFINITIONS.map(mission => {
              const status = missionProgress(mission.id)
              const filled = status ? Math.max(0, Math.min(100, status.current / Math.max(1, status.target) * 100)) : 0
              return <button key={mission.id} type="button" className="rv-mission" aria-pressed={selectedMission === mission.id} onClick={() => setSelectedMission(selectedMission === mission.id ? null : mission.id)}>
                <Art name={mission.image}/><span className="rv-mission-body"><strong>{mission.label}</strong><small>{mission.criterion}</small></span><span className="rv-mission-score"><b>{status ? `${status.current} / ${status.target}` : '— / 3'}</b><span className="rv-meter"><span style={{ width: `${filled}%` }}/></span></span><span className="rv-mission-reward">{isServer && status?.rewardSeeds !== undefined ? `+${status.rewardSeeds} semillas` : status?.completed ? 'Completada' : 'Sin premio confirmado'}</span>
              </button>
            })}
          </div>
          {missionSelected && <div className="rv-selected-detail"><strong>{missionSelected.label}</strong><span>{missionSelected.criterion}</span><small>{missionSelected.id === 'lunar' ? 'La validación de fases lunares requiere la API.' : 'Solo se reconocen actividades documentadas y válidas.'}</small></div>}
          <button type="button" className="rv-subtle-button rv-missions-toggle" aria-expanded={showAllMissions} onClick={() => setShowAllMissions(value => !value)}>{showAllMissions ? 'Ocultar explicación' : 'Ver todas las misiones'} <span aria-hidden="true">{showAllMissions ? '⌃' : '⌄'}</span></button>
          {showAllMissions && <p className="rv-extra-detail">La misión «Ciclo lunar consciente» y las recompensas de todas las misiones se habilitarán cuando el backend confirme las reglas. Registrar una actividad no garantiza automáticamente puntos.</p>}
        </section>
      </div>
      <section className="rv-trajectory">
        <button className="rv-trajectory-head" type="button" aria-expanded={showTrajectory} aria-controls="rv-trajectory-content" onClick={() => setShowTrajectory(value => !value)}><strong><span aria-hidden="true">▥</span> Mi trayectoria</strong><span>Toca para ver tu ruta de niveles</span><span className={`rv-trajectory-chevron${showTrajectory ? ' is-open' : ''}`} aria-hidden="true">⌄</span></button>
        {showTrajectory && <div id="rv-trajectory-content" className="rv-trajectory-content">
          <div className="rv-level-path">{DOCUMENTED_LEVELS.map((item, i) => <div key={item.id} className={`rv-path-stage${level === item.id ? ' is-current' : ''}`}><span className="rv-path-medal" aria-hidden="true">{i === 0 ? 'Ⅰ' : i === 1 ? 'Ⅱ' : 'Ⅲ'}</span><strong>{item.id}</strong><small>{isServer ? 'Nivel reconocido por servidor' : isVisitor ? `${item.threshold} semillas (regla V1 local)` : 'Pendiente de sincronización'}</small></div>)}</div>
          <p>La trayectoria muestra tu nivel y los siguientes hitos. Los datos oficiales procederán del servidor y no del navegador.</p>
        </div>}
      </section>
    </div>
  </section>
}
