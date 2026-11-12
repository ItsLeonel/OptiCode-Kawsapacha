import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { regionalLandscapes } from '../../../shared/regional-landscapes'
import MoonPhaseIcon from './MoonPhaseIcon'
import { loadLunarMonth } from './lunar-api'
import {
  LUNAR_STAGES, MSP_LUNAR_REFERENCE, estimateLunarMonth, formatLunarDate,
  lunarTimeZone, shiftMonth, todayInTimeZone,
  type LunarDay, type LunarMonth, type LunarRecommendation,
} from './lunar-model'
import './lunar-calendar.css'

type GardenRegion = 'costa' | 'sierra' | 'oriente' | 'galapagos'
type LunarView = 'closed' | 'today' | 'month'

const weekdays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

function iconFor(type?: string): string {
  if (type === 'watering') return '💧'
  if (type === 'fertilizing') return '🌾'
  if (type === 'sowing') return '🌱'
  if (type === 'replanting') return '🪴'
  if (type === 'preparation') return '🪵'
  if (type === 'weeding') return '🍃'
  if (type === 'harvest') return '🌿'
  if (type === 'observation') return '📷'
  return '✨'
}

function RecommendationItems({ items, compact = false }: {
  items: LunarRecommendation[]
  compact?: boolean
}) {
  if (!items.length) return <p className="lunar-empty">No hay recomendaciones específicas publicadas para esta fecha.</p>
  return (
    <ul className={`lunar-recommendations${compact ? ' is-compact' : ''}`}>
      {items.slice(0, compact ? 3 : 4).map((item, index) => (
        <li key={`${item.title}-${index}`} title={item.description}>
          <span className="lunar-activity-icon" aria-hidden="true">{iconFor(item.activityType)}</span>
          <span className="lunar-recommendation-copy">
            <strong>{item.title}</strong>
            {!compact && item.description && <small>{item.description}</small>}
          </span>
          <span className="lunar-recommendation-check" aria-hidden="true">✓</span>
        </li>
      ))}
    </ul>
  )
}

function PhaseDescription({ day, source }: { day: LunarDay; source: LunarMonth['source'] }) {
  const info = LUNAR_STAGES[day.phase]
  return (
    <>
      <div className="lunar-selected-phase">
        <div className="lunar-moon-hero"><MoonPhaseIcon fraction={day.fraction} size={92} /></div>
        <div className="lunar-phase-copy">
          <strong>{day.phaseName}</strong>
          <span className="lunar-ancestral">{info.ancestral}</span>
          <p>{info.description}</p>
        </div>
      </div>
      {source === 'estimated' && (
        <p className="lunar-estimate-note" role="status">
          Vista preliminar: fase calculada de forma aproximada. Pendiente de sincronización con la API lunar.
        </p>
      )}
    </>
  )
}

export default function LunarCalendarWidget({ region, onActivity }: {
  region: GardenRegion
  onActivity: () => void
}) {
  const timeZone = lunarTimeZone(region)
  const today = useMemo(() => todayInTimeZone(timeZone), [timeZone])
  const [view, setView] = useState<LunarView>('closed')
  const [month, setMonth] = useState(today.slice(0, 7))
  const [selectedDate, setSelectedDate] = useState(today)
  const [calendar, setCalendar] = useState<LunarMonth>(() => estimateLunarMonth(today.slice(0, 7), timeZone))
  const [loading, setLoading] = useState(false)
  const toggleRef = useRef<HTMLButtonElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    setMonth(today.slice(0, 7))
    setSelectedDate(today)
  }, [today])

  useEffect(() => {
    const abort = new AbortController()
    setCalendar(estimateLunarMonth(month, timeZone))
    setLoading(true)
    loadLunarMonth(month, timeZone, abort.signal)
      .then(result => { if (!abort.signal.aborted) setCalendar(result) })
      .catch(() => {})
      .finally(() => { if (!abort.signal.aborted) setLoading(false) })
    return () => abort.abort()
  }, [month, timeZone])

  useEffect(() => {
    if (view !== 'month') return
    const oldOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        setView('today')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = oldOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [view])

  function showToday() {
    setSelectedDate(today)
    setMonth(today.slice(0, 7))
    setView(current => current === 'today' ? 'closed' : 'today')
  }

  function goToMonth(delta: number) {
    const next = shiftMonth(month, delta)
    setMonth(next)
    setSelectedDate(`${next}-01`)
  }

  function openActivity() {
    setView('closed')
    onActivity()
  }

  const selectedDay = calendar.days.find(item => item.date === selectedDate)
    ?? estimateLunarMonth(month, timeZone).days.find(item => item.date === selectedDate)
    ?? calendar.days[0]
  const todaysDay = selectedDate === today ? selectedDay :
    calendar.days.find(item => item.date === today) ?? estimateLunarMonth(today.slice(0, 7), timeZone).days.find(item => item.date === today)
  const todayCard = todaysDay ?? selectedDay
  const shortDate = formatLunarDate(today, { day: 'numeric', month: 'long', year: 'numeric' })
  const monthTitle = formatLunarDate(`${month}-01`, { month: 'long', year: 'numeric' })
  const firstDayOfWeek = (new Date(`${month}-01T12:00:00Z`).getUTCDay() + 6) % 7
  const cells: (LunarDay | null)[] = [
    ...Array.from({ length: firstDayOfWeek }, () => null),
    ...calendar.days,
  ]

  return (
    <div className="lunar-garden-widget" data-lunar-widget="true">
      <button ref={toggleRef} type="button" className="lunar-widget-toggle"
        aria-expanded={view !== 'closed'} aria-controls="lunar-today-panel" onClick={showToday}>
        <span aria-hidden="true" className="lunar-button-moon">☾</span>
        <span>Calendario lunar</span>
      </button>

      {view === 'today' && (
        <aside id="lunar-today-panel" className="lunar-today-panel" aria-label="Resumen del calendario lunar">
          <header className="lunar-wood-header">
            <span aria-hidden="true">☾</span>
            <h2>Calendario lunar</h2>
            <button type="button" className="lunar-close" aria-label="Cerrar resumen lunar" onClick={() => { setView('closed'); toggleRef.current?.focus() }}>×</button>
          </header>
          <div className="lunar-today-body">
            <p className="lunar-date-ribbon">📅 {shortDate}</p>
            <PhaseDescription day={todayCard} source={calendar.month === today.slice(0, 7) ? calendar.source : 'estimated'} />
            <div className="lunar-mini-section-title">🌿 Actividades recomendadas</div>
            <RecommendationItems items={todayCard.recommendations} compact />
            <p className="lunar-heritage-note">Orientación agrícola ancestral del MSP. Revisa las necesidades reales de cada planta.</p>
            <div className="lunar-today-actions">
              <button type="button" className="lunar-action-main" onClick={() => { setSelectedDate(today); setMonth(today.slice(0, 7)); setView('month') }}>
                ▦ Ver calendario completo <span aria-hidden="true">›</span>
              </button>
              <button type="button" className="lunar-action-secondary" onClick={openActivity}>＋ Registrar actividad</button>
            </div>
          </div>
        </aside>
      )}

      {view === 'month' && createPortal(
        <div className="lunar-modal-backdrop" onMouseDown={(event: { target: EventTarget | null; currentTarget: EventTarget }) => {
          if (event.target === event.currentTarget) setView('today')
        }}>
          <section className="lunar-modal" role="dialog" aria-modal="true" aria-labelledby="lunar-calendar-title"
            style={{ backgroundImage: `linear-gradient(120deg, rgba(12,43,27,.65), rgba(14,49,30,.27)), url("${regionalLandscapes[region]}")` }}>
            <div className="lunar-modal-topline">
              <button type="button" className="lunar-back-button" ref={closeRef} onClick={() => { setView('today'); toggleRef.current?.focus() }}>
                <span aria-hidden="true">←</span> Volver a mi huerto
              </button>
              <span className="lunar-modal-source">Saberes de nuestros huertos</span>
            </div>
            <header className="lunar-modal-heading">
              <h2 id="lunar-calendar-title">☾ Calendario lunar 🌿</h2>
              <p>Conoce las fases de la Luna y las orientaciones agrícolas tradicionales.</p>
            </header>

            <div className="lunar-modal-columns">
              <section className="lunar-parchment lunar-month-card" aria-label="Calendario lunar mensual">
                <div className="lunar-month-toolbar">
                  <button type="button" aria-label="Mes anterior" onClick={() => goToMonth(-1)}>‹</button>
                  <h3>▦ {monthTitle}</h3>
                  <button type="button" aria-label="Mes siguiente" onClick={() => goToMonth(1)}>›</button>
                </div>
                <div className="lunar-month-grid" aria-label={`Días de ${monthTitle}`}>
                  {weekdays.map((name, index) => <span className="lunar-weekday" key={name} data-weekend={index > 4}>{name}</span>)}
                  {cells.map((day, index) => day ? (
                    <button type="button" className="lunar-day-cell" key={day.date}
                      aria-label={`${formatLunarDate(day.date)}, ${day.phaseName}`}
                      aria-pressed={selectedDate === day.date}
                      data-today={day.date === today ? 'true' : undefined}
                      onClick={() => setSelectedDate(day.date)}>
                      <span className="lunar-day-number">{Number(day.date.slice(-2))}</span>
                      <MoonPhaseIcon fraction={day.fraction} size={35} />
                    </button>
                  ) : <span key={`empty-${index}`} className="lunar-day-empty" />)}
                </div>
                <div className="lunar-legend" aria-label="Leyenda de fases lunares">
                  {(['dark', 'waxing', 'full', 'waning'] as const).map((phase, i) => (
                    <span key={phase}><MoonPhaseIcon fraction={[0, .25, .5, .75][i]} size={23} /> {LUNAR_STAGES[phase].label}</span>
                  ))}
                </div>
              </section>

              <section className="lunar-parchment lunar-day-detail" aria-label="Recomendaciones de la fecha seleccionada">
                <h3 className="lunar-detail-date">📅 {formatLunarDate(selectedDate, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</h3>
                <PhaseDescription day={selectedDay} source={calendar.source} />
                <div className="lunar-mini-section-title">🌱 Recomendaciones del día</div>
                <RecommendationItems items={selectedDay.recommendations} />
                <section className="lunar-garden-advice">
                  <h4>🪴 Actividades sugeridas para tu huerto</h4>
                  <p>Estas recomendaciones son culturales y orientativas. Antes de realizar riegos, abonados o cosechas, observa el estado real de tus plantas.</p>
                </section>
                <button type="button" className="lunar-action-main lunar-modal-register" onClick={openActivity}>▤ Registrar actividad</button>
                <small className="lunar-document-note">{MSP_LUNAR_REFERENCE} {loading && '· Actualizando datos…'}</small>
              </section>
            </div>
          </section>
        </div>, document.body,
      )}
    </div>
  )
}
