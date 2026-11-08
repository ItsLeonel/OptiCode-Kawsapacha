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
  return <section className="journal-progress" aria-label="Mi camino verde">
    <div className="journal-heading"><div><small>RECONOCIMIENTOS LOCALES</small><h2>Mi camino verde</h2></div>{actors.length > 0 && <label>Persona responsable<select className="journal-filter" aria-label="Responsable del progreso" value={actor} onChange={event => setSelected(event.target.value)}>{actors.map(name => <option key={normalizeResponsible(name)} value={name}>{name}</option>)}</select></label>}</div>
    <p>Avances por las actividades que has documentado. Son locales a este navegador y no tienen verificación externa.</p>
    <div className="journal-progress-cards"><div><span>Semillas de vida</span><output aria-label="Semillas de vida individuales">{personal.points}</output><small>{actor || 'Sin actividades registradas'}</small></div><div><span>Nivel local</span><strong>{personal.level}</strong><progress aria-label="Progreso de nivel" max="100" value={personal.progressPercent}/><small>{personal.nextLevel ? `${personal.remaining} para ${personal.nextLevel}` : 'Nivel Maestro alcanzado con registros locales'}</small></div><div><span>Actividades documentadas</span><strong>{personal.activities}</strong><small>Incluye actividades sin una segunda recompensa el mismo día</small></div></div>
    <h3>Insignias</h3><ul className="journal-badges">{personal.badges.map(badge => <li key={badge.id} data-earned={badge.earned}><span aria-hidden="true">{badge.earned ? '✦' : '◇'}</span><strong>{badge.label}</strong><small>{badge.criterion}</small><span>{badge.earned ? 'Obtenida' : 'Por documentar'}</span></li>)}</ul>
    {journal.community && <section className="journal-community-progress" aria-label="Progreso comunitario local"><h3>{journal.community.name}</h3><p>Solo actividades conservadas en este dispositivo; no representa el progreso completo de la comunidad.</p><output aria-label="Semillas de vida comunitarias locales">{community.points}</output><span> Semillas de vida · {community.activities} actividades</span></section>}
    <details><summary>Reglas y desglose de los reconocimientos</summary><p>Un reconocimiento por tipo de actividad, fecha, responsable y destino. Repetir el guardado, modificar las notas o recargar no duplica los puntos. Las actividades anuladas se excluyen.</p><p>{LOCAL_LEVELS.map(level => `${level.name}: ${level.threshold}`).join(' · ')}</p><ul>{Object.entries(LOCAL_POINTS).map(([key, points]) => <li key={key}>{ACTIVITY_TYPES[key as keyof typeof ACTIVITY_TYPES]}: {points} Semillas de vida</li>)}</ul><ul>{personal.ledger.map(item => <li key={item.activityId}>{item.date} · {ACTIVITY_TYPES[item.type]}: {item.points}{item.points === 0 ? ' (ya reconocido ese día y destino)' : ''}</li>)}</ul></details>
  </section>
}
