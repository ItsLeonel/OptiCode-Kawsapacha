import { useState } from 'react'
import type { GardenJournal } from './journal/journal'
import { ACTIVITY_TYPES } from './journal/activities'
import { calculateProgress, LOCAL_LEVELS, LOCAL_POINTS, normalizeResponsible } from './journal/progress'
import './garden-journal.css'

export default function GardenProgress({ journal }: { journal: GardenJournal }) {
  const actors = [...new Map([journal.community?.responsible, ...journal.activities.map(activity => activity.responsible)].filter((name): name is string => Boolean(name?.trim())).map(name => [normalizeResponsible(name), name.trim()])).values()]
  const [selected, setSelected] = useState(journal.community?.responsible ?? '')
  const actor = actors.find(name => normalizeResponsible(name) === normalizeResponsible(selected)) ?? actors[0]
  const personal = calculateProgress(journal, actor), community = calculateProgress(journal)
  const recorded = personal.ledger.flatMap(entry => { const activity = journal.activities.find(item => item.id === entry.activityId); return activity ? [{ entry, activity }] : [] })
  const firstFor = (type: keyof typeof ACTIVITY_TYPES, withPhoto = false) => recorded.find(item => item.entry.type === type && (!withPhoto || item.activity.photoIds.length > 0))?.entry.date
  const thirdDateFor = (type: keyof typeof ACTIVITY_TYPES, withPhoto = false) => [...new Set(recorded.filter(item => item.entry.type === type && (!withPhoto || item.activity.photoIds.length > 0)).map(item => item.entry.date))].sort()[2]
  const milestones: { id: string; date: string; title: string; detail: string }[] = []
  const sowingDate = firstFor('sowing', true), wateringDate = thirdDateFor('watering'), observationDate = thirdDateFor('observation', true), harvestDate = firstFor('harvest', true)
  const badgeDates: Record<string, string | undefined> = { 'first-sowing': sowingDate, care: wateringDate, observer: observationDate, harvest: harvestDate }
  personal.badges.filter(badge => badge.earned).forEach(badge => {
    const date = badgeDates[badge.id]
    if (date) milestones.push({ id: 'badge-' + badge.id, date, title: badge.label, detail: 'Insignia documentada' })
  })
  let accumulated = 0
  for (const { entry } of recorded) {
    const before = accumulated
    accumulated += entry.points
    for (const level of LOCAL_LEVELS.slice(1)) {
      if (before < level.threshold && accumulated >= level.threshold) milestones.push({ id: `level-${level.name}`, date: entry.date, title: `Nivel ${level.name}`, detail: `${level.threshold} Semillas de vida registradas` })
    }
  }
  milestones.sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title))
  return <section className="journal-progress" aria-label="Mi camino verde">
    <div className="journal-heading"><div><small>RECONOCIMIENTOS LOCALES</small><h2>Mi camino verde</h2></div>{actors.length > 0 && <label>Persona responsable<select className="journal-filter" aria-label="Responsable del progreso" value={actor} onChange={event => setSelected(event.target.value)}>{actors.map(name => <option key={normalizeResponsible(name)} value={name}>{name}</option>)}</select></label>}</div>
    <p>Avances por las actividades que has documentado. Son locales a este navegador y no tienen verificación externa.</p>
    <section className="journal-personal-history" aria-labelledby="personal-history-title"><div><h3 id="personal-history-title">Mi historia</h3><p>Hitos y logros derivados de tus registros reales.</p></div>{milestones.length ? <ol>{milestones.map(item => <li key={item.id}><time dateTime={item.date}>{item.date}</time><span><strong>{item.title}</strong><small>{item.detail}</small></span></li>)}</ol> : <p>Aún no hay hitos documentados para esta trayectoria.</p>}</section>
    <div className="journal-progress-cards"><div><span>Semillas de vida</span><output aria-label="Semillas de vida individuales">{personal.points}</output><small>{actor || 'Sin actividades registradas'}</small></div><div><span>Nivel local</span><strong>{personal.level}</strong><progress aria-label="Progreso de nivel" max="100" value={personal.progressPercent}/><small>{personal.nextLevel ? `${personal.remaining} para ${personal.nextLevel}` : 'Nivel Maestro alcanzado con registros locales'}</small></div><div><span>Actividades documentadas</span><strong>{personal.activities}</strong><small>Incluye actividades sin una segunda recompensa el mismo día</small></div></div>
    <h3>Insignias</h3><ul className="journal-badges">{personal.badges.map(badge => <li key={badge.id} data-earned={badge.earned}><span aria-hidden="true">{badge.earned ? '✦' : '◇'}</span><strong>{badge.label}</strong><small>{badge.criterion}</small><span>{badge.earned ? 'Obtenida' : 'Por documentar'}</span></li>)}</ul>
    {journal.community && <section className="journal-community-progress" aria-label="Progreso comunitario local"><h3>{journal.community.name}</h3><p>Solo actividades conservadas en este dispositivo; no representa el progreso completo de la comunidad.</p><output aria-label="Semillas de vida comunitarias locales">{community.points}</output><span> Semillas de vida · {community.activities} actividades</span></section>}
    <details><summary>Reglas y desglose de los reconocimientos</summary><p>Un reconocimiento por tipo de actividad, fecha, responsable y destino. Repetir el guardado, modificar las notas o recargar no duplica los puntos. Las actividades anuladas se excluyen.</p><p>{LOCAL_LEVELS.map(level => `${level.name}: ${level.threshold}`).join(' · ')}</p><ul>{Object.entries(LOCAL_POINTS).map(([key, points]) => <li key={key}>{ACTIVITY_TYPES[key as keyof typeof ACTIVITY_TYPES]}: {points} Semillas de vida</li>)}</ul></details>
  </section>
}
