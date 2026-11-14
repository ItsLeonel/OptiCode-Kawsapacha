import { useState } from 'react'
import {
  filterRewardReviews, isAuthoritativeRewardReview,
  REWARD_REVIEW_EFFECT_LABELS, REWARD_REVIEW_STATUS_LABELS,
  type AuthoritativeRewardReview, type RewardReviewFilter,
} from './reward-review'
import './reward-review.css'

const FILTERS: ReadonlyArray<{ id: RewardReviewFilter; title: string }> = [
  { id: 'ALL', title: 'Todas' },
  { id: 'PENDING', title: 'Pendientes' },
  { id: 'APPROVED', title: 'Aprobadas' },
  { id: 'NEEDS_CHANGES', title: 'Con correcciones' },
  { id: 'REJECTED', title: 'Rechazadas' },
]

function dateLabel(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Sin fecha' : date.toLocaleDateString('es-EC', { year: 'numeric', month: 'short', day: 'numeric' })
}

export default function RewardReviewPanel({ authenticated, review }: {
  authenticated: boolean
  /** Solo snapshots obtenidos mediante el servidor autenticado; no inyectar datos de demostración en producción. */
  review?: AuthoritativeRewardReview | null
}) {
  const [filter, setFilter] = useState<RewardReviewFilter>('ALL')
  const [expanded, setExpanded] = useState<string | null>(null)
  const hasData = authenticated && isAuthoritativeRewardReview(review)
  const server = hasData ? review : null
  const entries = server ? filterRewardReviews(server.entries, filter) : []
  const number = (value: number | undefined) => value === undefined ? '—' : value.toLocaleString('es-EC')

  return <section className="rv-review-section" aria-labelledby="rv-review-heading" data-source={hasData ? 'server' : 'unavailable'}>
    <div className="rv-review-heading">
      <div>
        <span className="rv-review-eyebrow">Fase 4.5 · Seguimiento de evidencias</span>
        <h2 id="rv-review-heading">Estado de mis recompensas</h2>
        <p>Conoce qué actividades siguen en revisión y cómo se reflejan las decisiones oficiales.</p>
      </div>
      <span className="rv-review-source-label">{server ? `Actualizado: ${dateLabel(server.updatedAt)}` : 'Pendiente de sincronización'}</span>
    </div>

    <div className="rv-review-stats" aria-label="Saldos de semillas entregados por el servidor">
      <article className="rv-review-stat rv-review-stat--pending"><span className="rv-review-stat-icon" aria-hidden="true">◷</span><div><h3>Provisionales</h3><output aria-label="Semillas provisionales">{number(server?.totals.provisional)}</output><p>En espera de validación</p></div></article>
      <article className="rv-review-stat rv-review-stat--approved"><span className="rv-review-stat-icon" aria-hidden="true">✓</span><div><h3>Confirmadas</h3><output aria-label="Semillas confirmadas">{number(server?.totals.confirmed)}</output><p>Validadas por el servidor</p></div></article>
      <article className="rv-review-stat rv-review-stat--reverted"><span className="rv-review-stat-icon" aria-hidden="true">↶</span><div><h3>Revertidas</h3><output aria-label="Semillas revertidas">{number(server?.totals.reverted)}</output><p>Correcciones registradas</p></div></article>
    </div>

    <p className="rv-review-note" role="status">
      {!authenticated ? 'Modo visitante: tus actividades locales no son decisiones oficiales del MSP. Inicia sesión para consultar una futura revisión.'
        : !hasData ? 'El backend todavía no proporciona un resumen de moderación y recompensas para esta sesión. No se presentan saldos o aprobaciones inventadas.'
          : 'Los saldos, estados y ajustes proceden del servidor. Esta pantalla es solo de consulta y no modifica puntos.'}
    </p>

    <div className="rv-review-history" aria-labelledby="rv-review-history-heading">
      <div className="rv-review-history-title"><h3 id="rv-review-history-heading">Historial de revisión</h3><span>{server ? `${server.entries.length} registros oficiales` : 'Sin datos oficiales'}</span></div>
      <div className="rv-review-filters" role="group" aria-label="Filtrar historial de revisión">
        {FILTERS.map(item => <button key={item.id} type="button" aria-pressed={filter === item.id} onClick={() => { setFilter(item.id); setExpanded(null) }}>
          {item.title}
        </button>)}
      </div>
      {!hasData ? <div className="rv-review-empty"><strong>Historial pendiente de integración</strong><p>Cuando el backend permita consultar las resoluciones, verás aquí las fotografías revisadas y sus cambios de estado.</p></div>
        : entries.length === 0 ? <div className="rv-review-empty"><strong>Sin registros para este filtro</strong><p>{server?.entries.length ? 'Prueba otro estado de revisión.' : 'Aún no existen revisiones oficiales registradas para esta cuenta.'}</p></div>
          : <ol className="rv-review-list">
            {entries.map(item => <li key={item.id} className="rv-review-entry">
              <button type="button" className="rv-review-entry-button" aria-expanded={expanded === item.id} onClick={() => setExpanded(value => value === item.id ? null : item.id)}>
                <span className="rv-review-entry-main"><strong>{item.activityName}</strong><small>{item.plantName || item.gardenName || 'Evidencia agrícola'} · Enviada el {dateLabel(item.submittedAt)}</small></span>
                <span className={`rv-review-status rv-review-status--${item.status.toLowerCase()}`}>{REWARD_REVIEW_STATUS_LABELS[item.status]}</span>
                <span className="rv-review-entry-expand" aria-hidden="true">{expanded === item.id ? '−' : '+'}</span>
              </button>
              {expanded === item.id && <div className="rv-review-entry-detail">
                <dl>
                  <div><dt>Identificador de evidencia</dt><dd>{item.evidenceId}</dd></div>
                  <div><dt>Estado</dt><dd>{REWARD_REVIEW_STATUS_LABELS[item.status]}</dd></div>
                  <div><dt>Movimiento de puntos</dt><dd>{REWARD_REVIEW_EFFECT_LABELS[item.effect]}{item.points != null ? ` · ${item.points.toLocaleString('es-EC')}` : ''}</dd></div>
                  {item.reviewedAt && <div><dt>Revisada el</dt><dd>{dateLabel(item.reviewedAt)}</dd></div>}
                  {item.reviewerNote && <div><dt>Observaciones de revisión</dt><dd>{item.reviewerNote}</dd></div>}
                </dl>
              </div>}
            </li>)}
          </ol>}
    </div>
  </section>
}
