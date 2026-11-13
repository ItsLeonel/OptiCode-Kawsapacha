import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import type { GardenPlant } from './garden'
import { PLANT_STATES } from './garden'
import type { GardenActivity, ActivityType, ActivityDetails } from './journal/activities'
import { ACTIVITY_TYPES } from './journal/activities'
import { careApi, getToken, type CareLog } from '../../services/api'
import { regionalLandscapes } from '../../shared/regional-landscapes'
import { useGardenDialog } from './useGardenDialog'
import BitacoraIcon, { type BitacoraIconName } from './BitacoraIcons'
import bookHeader from './bitacora-art/book-header.webp'
import './bitacora-viva.css'

type ActivityFilter = 'all' | ActivityType | 'pruning' | 'pest_control' | 'other'
type FeedItem = {
  key: string
  id: string
  type: ActivityFilter
  title: string
  date: string
  createdAt: string
  responsible: string
  plantId?: string
  plot?: number
  targetName: string
  notes: string
  details: ActivityDetails
  photos: string[]
  photoIds: string[]
  source: 'journal' | 'care'
  voidedAt?: string
  voidReason?: string
}

const MAIN_FILTERS: { key: ActivityFilter; title: string; icon: BitacoraIconName }[] = [
  { key: 'all', title: 'Todas', icon: 'layers' },
  { key: 'watering', title: 'Riego', icon: 'water' },
  { key: 'sowing', title: 'Siembra', icon: 'sowing' },
  { key: 'fertilizing', title: 'Abonado', icon: 'fertilizing' },
  { key: 'observation', title: 'Seguimiento', icon: 'observation' },
  { key: 'harvest', title: 'Cosecha', icon: 'harvest' },
]

const OTHER_FILTERS: { key: ActivityFilter; title: string }[] = [
  { key: 'preparation', title: 'Preparación del terreno' },
  { key: 'weeding', title: 'Limpieza y deshierbe' },
  { key: 'hilling', title: 'Aporque' },
  { key: 'replanting', title: 'Replante' },
  { key: 'pruning', title: 'Poda' },
  { key: 'pest_control', title: 'Control de plagas' },
  { key: 'other', title: 'Otros cuidados' },
]

function activityIcon(type: ActivityFilter): BitacoraIconName {
  const icons: Record<string, BitacoraIconName> = {
    watering: 'water', sowing: 'sowing', fertilizing: 'fertilizing', observation: 'observation',
    harvest: 'harvest', preparation: 'preparation', weeding: 'weeding', hilling: 'hilling',
    replanting: 'replanting', pruning: 'weeding', pest_control: 'leaf', other: 'leaf',
  }
  return icons[type] ?? 'leaf'
}

function displayDate(value: string): string {
  const day = value.slice(0, 10)
  const date = /^\d{4}-\d{2}-\d{2}$/.test(day) ? new Date(`${day}T12:00:00`) : new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('es-EC', { day: 'numeric', month: 'long', year: 'numeric' })
}

function activityLabel(type: ActivityFilter): string {
  if (type === 'pruning') return 'Poda'
  if (type === 'pest_control') return 'Control de plagas'
  if (type === 'other') return 'Otro cuidado'
  if (type === 'all') return 'Actividad'
  return ACTIVITY_TYPES[type]
}

function normalizeText(value: string): string { return value.trim().toLocaleLowerCase('es').replace(/\s+/g, ' ') }

function isTheSameCare(item: FeedItem, other: FeedItem): boolean {
  return item.id === other.id || (
    item.source !== other.source && item.plantId === other.plantId && item.type === other.type &&
    item.date === other.date && normalizeText(item.notes) === normalizeText(other.notes)
  )
}

function normalizeActivity(activity: GardenActivity, plants: GardenPlant[]): FeedItem {
  const targetPlantId = activity.target.kind === 'plant' ? activity.target.plantId : undefined
  const plant = targetPlantId ? plants.find(p => p.id === targetPlantId) : undefined
  const plot = activity.target.kind === 'garden' ? undefined : activity.target.plot
  return {
    key: `journal:${activity.id}`, id: activity.id, type: activity.type, title: activityLabel(activity.type),
    date: activity.date, createdAt: activity.createdAt, responsible: activity.responsible,
    plantId: targetPlantId, plot, targetName: plant?.name ?? (plot === undefined ? 'Todo el huerto' : `Espacio ${plot + 1}`),
    notes: activity.notes, details: activity.details, photos: activity.photos ?? [], photoIds: activity.photoIds,
    source: 'journal', voidedAt: activity.voidedAt, voidReason: activity.voidReason,
  }
}

function normalizeCare(log: CareLog, plant: GardenPlant): FeedItem {
  const type: ActivityFilter = ({ WATERING: 'watering', FERTILIZER: 'fertilizing', PRUNING: 'pruning', PEST_CONTROL: 'pest_control' } as Record<string, ActivityFilter>)[log.actionType] ?? 'other'
  return {
    key: `care:${log.id}`, id: log.id, type, title: activityLabel(type), date: log.performedAt.slice(0, 10),
    createdAt: log.performedAt, responsible: log.user?.name ?? 'Integrante de la comunidad',
    plantId: plant.id, plot: plant.plot, targetName: plant.name, notes: log.notes ?? '',
    details: {}, photos: [], photoIds: [], source: 'care',
  }
}

function EntryVisual({ item, plant }: { item: FeedItem; plant?: GardenPlant }) {
  const photo = item.photos[0] || plant?.photo
  const isEvidence = item.photos.length > 0
  return <div className="bv-entry-photo">
    {photo ? <img src={photo} alt={isEvidence ? `Evidencia de ${item.title.toLowerCase()}` : `Fotografía de ${plant?.name ?? 'planta registrada'}`} loading="lazy" />
      : <div className="bv-entry-photo-empty"><BitacoraIcon name={activityIcon(item.type)} size={47}/><span>Sin fotografía</span></div>}
    {photo && <span className="bv-entry-photo-label"><BitacoraIcon name={isEvidence ? 'camera' : 'leaf'} size={12}/>{isEvidence ? 'Evidencia' : 'Foto de planta'}</span>}
  </div>
}

function EntryDetails({ item, plant, onSelect, onVoid, onClose }: {
  item: FeedItem; plant?: GardenPlant; onSelect: (plant: GardenPlant) => void
  onVoid?: (id: string, reason: string) => Promise<void>; onClose: () => void
}) {
  const dialog = useGardenDialog()
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function handleVoid(event: FormEvent) {
    event.preventDefault()
    if (!onVoid || busy || !reason.trim()) return
    setBusy(true); setError('')
    try { await onVoid(item.id, reason.trim()); onClose() }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'No fue posible anular el registro.') }
    finally { setBusy(false) }
  }
  return <dialog ref={dialog} className="bv-entry-dialog" aria-labelledby="bv-entry-title" onCancel={e => { e.preventDefault(); if (!busy) onClose() }}>
    <header><div className="bv-entry-dialog-heading"><BitacoraIcon name={activityIcon(item.type)} size={27}/><div><small>DETALLE DE LA BITÁCORA</small><h2 id="bv-entry-title">{item.title}</h2></div></div><button type="button" className="bv-dialog-close" aria-label="Cerrar detalle" disabled={busy} onClick={onClose}><BitacoraIcon name="close" size={20}/></button></header>
    <div className="bv-entry-dialog-body">
      <dl className="bv-detail-facts">
        <div><dt>Fecha</dt><dd><BitacoraIcon name="calendar" size={16}/>{displayDate(item.date)}</dd></div>
        <div><dt>Responsable</dt><dd><BitacoraIcon name="person" size={16}/>{item.responsible}</dd></div>
        <div><dt>Ubicación</dt><dd><BitacoraIcon name="pin" size={16}/>{item.targetName}{item.plot !== undefined ? ` · Espacio ${item.plot + 1}` : ''}</dd></div>
        <div><dt>Guardado</dt><dd><BitacoraIcon name={item.source === 'care' ? 'check' : 'file'} size={16}/>{item.source === 'care' ? 'Registro de cuidados del servidor' : 'Registro de la bitácora local'}</dd></div>
      </dl>
      {item.notes && <section className="bv-detail-section"><h3>Observaciones</h3><p>{item.notes}</p></section>}
      {Object.keys(item.details).length > 0 && <section className="bv-detail-section"><h3>Detalles de la actividad</h3><dl className="bv-detail-extras">
        {item.details.method && <div><dt>Método</dt><dd>{item.details.method}</dd></div>}
        {item.details.material && <div><dt>Material o abono</dt><dd>{item.details.material}</dd></div>}
        {item.details.quantity !== undefined && <div><dt>Cantidad</dt><dd>{item.details.quantity} {item.details.unit ?? ''}</dd></div>}
        {item.details.heightCm !== undefined && <div><dt>Altura observada</dt><dd>{item.details.heightCm} cm</dd></div>}
        {item.details.state && <div><dt>Estado documentado</dt><dd>{PLANT_STATES[item.details.state]}</dd></div>}
        {item.details.destinationPlot !== undefined && <div><dt>Espacio de destino</dt><dd>{item.details.destinationPlot + 1}</dd></div>}
        {item.details.harvestMode && <div><dt>Tipo de cosecha</dt><dd>{item.details.harvestMode === 'complete' ? 'Completa' : 'Parcial'}</dd></div>}
      </dl></section>}
      <section className="bv-detail-section"><h3>Registro fotográfico</h3>
        {item.photos.length > 0 ? <div className="bv-detail-photos">{item.photos.map((url, index) => <img key={`${item.key}:${index}`} src={url} alt={`Fotografía ${index + 1} del registro`} loading="lazy" />)}</div>
          : <p className="bv-muted">Esta actividad no tiene una fotografía de evidencia adjunta.{plant?.photo ? ' La foto de la planta que aparece en el álbum es su ficha, no evidencia de esta actividad.' : ''}</p>}
      </section>
      {item.voidedAt && <p className="bv-void-note">Registro anulado el {displayDate(item.voidedAt)}. Motivo: {item.voidReason || 'No indicado'}.</p>}
      {onVoid && item.source === 'journal' && !item.voidedAt && <form className="bv-void-form" onSubmit={handleVoid}><label htmlFor="bv-void-reason">Anular actividad conservando su historial</label><div><input id="bv-void-reason" required minLength={5} maxLength={300} value={reason} onChange={e => setReason(e.target.value)} placeholder="Indica el motivo de anulación" disabled={busy}/><button type="submit" disabled={busy}>{busy ? 'Anulando…' : 'Anular registro'}</button></div>{error && <p role="alert">{error}</p>}</form>}
      <footer>{plant && <button type="button" className="bv-secondary-button" onClick={() => { onClose(); onSelect(plant) }}><BitacoraIcon name="book" size={25}/> Abrir Pasaporte Vivo</button>}<button type="button" className="bv-primary-button" onClick={onClose}>Cerrar detalle</button></footer>
    </div>
  </dialog>
}

export default function GardenHistory({ plants, onRegister, onSelect, activities = [], onActivity, onVoid }: {
  plants: GardenPlant[]
  onRegister: () => void
  onSelect: (plant: GardenPlant) => void
  onRealGarden: () => void // Compatibilidad con App.tsx; no se muestra en Bitácora.
  activities?: GardenActivity[]
  onActivity?: () => void
  onVoid?: (id: string, reason: string) => Promise<void>
}) {
  const [filter, setFilter] = useState<ActivityFilter>('all')
  const [plantFilter, setPlantFilter] = useState('all')
  const [includeArchived, setIncludeArchived] = useState(false)
  const [allActivities, setAllActivities] = useState(false)
  const [allPlants, setAllPlants] = useState(false)
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [care, setCare] = useState<FeedItem[]>([])
  const [loadingCare, setLoadingCare] = useState(false)
  const activityAnchor = useRef<HTMLElement>(null)

  useEffect(() => {
    let cancelled = false
    if (!getToken() || !plants.length) { setCare([]); setLoadingCare(false); return }
    setLoadingCare(true)
    void Promise.all(plants.map(async plant => {
      try { const logs = await careApi.list(plant.id); return logs.map(log => normalizeCare(log, plant)) }
      catch { return [] as FeedItem[] }
    })).then(results => { if (!cancelled) setCare(results.flat()) }).finally(() => { if (!cancelled) setLoadingCare(false) })
    return () => { cancelled = true }
  }, [plants])

  const entries = useMemo(() => {
    const local = activities.map(activity => normalizeActivity(activity, plants))
    const merged = [...local]
    for (const backend of care) if (!merged.some(existing => isTheSameCare(existing, backend))) merged.push(backend)
    return merged.sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
  }, [activities, plants, care])
  const activeEntries = entries.filter(item => !item.voidedAt)
  const activePlants = plants.filter(p => !p.archivedAt)
  const shownPlants = plants.filter(p => Boolean(p.archivedAt) === includeArchived)
  const filtered = entries.filter(item => (filter === 'all' || item.type === filter) && (plantFilter === 'all' || item.plantId === plantFilter))
  const displayEntries = allActivities ? filtered : filtered.slice(0, 3)
  const selected = entries.find(e => e.key === selectedKey)
  const photoCount = activeEntries.reduce((sum, e) => sum + e.photoIds.length, 0)
  const latest = activeEntries[0]
  function seePlantHistory(plantId: string) {
    setPlantFilter(plantId); setFilter('all'); setAllActivities(true)
    activityAnchor.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return <section className="kaws-logbook" data-standalone={typeof window !== 'undefined' && window.location.hash === '#bitacora' ? 'true' : 'false'} aria-label="Bitácora Viva del huerto medicinal">
    <header className="bv-hero" style={{ backgroundImage: `linear-gradient(90deg,rgba(255,243,198,.96) 0%,rgba(255,243,198,.86) 44%,rgba(255,242,207,.07) 100%), url("${regionalLandscapes.sierra}")` }}>
      <div className="bv-hero-title">
        <div className="bv-hero-book"><img src={bookHeader} alt="" /></div>
        <div><p className="bv-eyebrow">KAWSAPACHA · MI HUERTO VIVO</p><h1 tabIndex={-1} data-screen-heading>Bitácora Viva <BitacoraIcon name="leaf" size={24}/></h1><p className="bv-hero-sub"><span aria-hidden="true">◇</span> La memoria de tu huerto medicinal <span aria-hidden="true">◇</span></p></div>
      </div>
      {onActivity && <button type="button" className="bv-register-button" onClick={onActivity}><BitacoraIcon name="plus" size={21}/> Registrar actividad</button>}
    </header>

    <div className="bv-content">
      <div className="bv-summary" aria-label="Resumen de la bitácora">
        <div className="bv-stat"><span className="bv-stat-icon bv-ink-orange"><BitacoraIcon name="clipboard" size={37}/></span><div><strong>{activeEntries.length}</strong><span>Actividades registradas</span></div></div>
        <div className="bv-stat"><span className="bv-stat-icon bv-ink-green"><BitacoraIcon name="sprout" size={39}/></span><div><strong>{activePlants.length}</strong><span>Plantas en seguimiento</span></div></div>
        <div className="bv-stat"><span className="bv-stat-icon bv-ink-orange"><BitacoraIcon name="camera" size={37}/></span><div><strong>{photoCount}</strong><span>Evidencias fotográficas</span></div></div>
        <div className="bv-stat bv-stat-last"><span className="bv-stat-icon bv-ink-orange"><BitacoraIcon name="calendar" size={36}/></span><div><span>Última actividad</span><strong>{latest ? `${latest.title} · ${latest.targetName}` : 'Sin registros'}</strong><small>{latest ? displayDate(latest.date) : 'Comienza tu historia agrícola'}</small></div></div>
      </div>

      <div className="bv-filters" aria-label="Filtrar actividades">
        <div className="bv-filter-label"><BitacoraIcon name="filter" size={21}/><strong>Filtrar actividades:</strong></div>
        <div className="bv-filter-buttons" role="group" aria-label="Tipo de actividad">
          {MAIN_FILTERS.map(item => <button key={item.key} type="button" className={`bv-filter-pill${filter === item.key ? ' is-active' : ''}`} aria-pressed={filter === item.key} onClick={() => { setFilter(item.key); setAllActivities(false) }}><BitacoraIcon name={item.icon} size={18}/>{item.title}</button>)}
          <select aria-label="Otras actividades" className="bv-other-filter" value={OTHER_FILTERS.some(o => o.key === filter) ? filter : ''} onChange={e => { setFilter(e.target.value as ActivityFilter); setAllActivities(false) }}><option value="">Más tipos</option>{OTHER_FILTERS.map(item => <option key={item.key} value={item.key}>{item.title}</option>)}</select>
        </div>
        <label className="bv-plant-selector"><BitacoraIcon name="leaf" size={19}/><span className="bv-sr-only">Filtrar por planta</span><select aria-label="Filtrar por planta" value={plantFilter} onChange={e => { setPlantFilter(e.target.value); setAllActivities(false) }}><option value="all">Todas las plantas</option>{plants.map(plant => <option key={plant.id} value={plant.id}>{plant.name}</option>)}</select></label>
      </div>

      <section className="bv-activities" ref={activityAnchor} aria-labelledby="bv-activities-title">
        <div className="bv-section-heading"><div><BitacoraIcon name="leaf" size={30}/><div><h2 id="bv-activities-title">Álbum de actividades</h2><p>Cuidados, observaciones y momentos de tu huerto real.</p></div></div><span className="bv-quantity">{filtered.length} {filtered.length === 1 ? 'registro' : 'registros'}</span></div>
        {loadingCare && <p className="bv-status" role="status">Consultando los cuidados del servidor…</p>}
        {filtered.length ? <div className="bv-activity-grid">{displayEntries.map(item => {
          const plant = item.plantId ? plants.find(p => p.id === item.plantId) : undefined
          return <article key={item.key} className="bv-entry-card" data-type={item.type} data-voided={item.voidedAt ? 'true' : 'false'}>
            <EntryVisual item={item} plant={plant}/>
            <div className="bv-entry-copy"><div className="bv-entry-type"><span className="bv-activity-icon"><BitacoraIcon name={activityIcon(item.type)} size={29}/></span><h3>{item.title}</h3></div>
              <div className="bv-entry-meta"><span><BitacoraIcon name="leaf" size={15}/>{item.targetName}</span><span><BitacoraIcon name="pin" size={15}/>{item.plot === undefined ? 'Todo el huerto' : `Espacio ${item.plot + 1}`}</span><span><BitacoraIcon name="calendar" size={15}/>{displayDate(item.date)}</span></div>
              <p className="bv-entry-excerpt">{item.notes || 'Actividad documentada sin observaciones adicionales.'}</p>
              {item.voidedAt && <span className="bv-entry-status">Anulada · historial conservado</span>}
              <button type="button" className="bv-card-action" onClick={() => setSelectedKey(item.key)}>Ver detalle <BitacoraIcon name="right" size={17}/></button>
            </div>
          </article>
        })}</div> : <div className="bv-empty"><BitacoraIcon name="book" size={66}/><h3>No hay actividades para esta selección</h3><p>Prueba otro filtro o registra un cuidado real con su fotografía.</p>{onActivity && <button type="button" className="bv-primary-button" onClick={onActivity}>Registrar actividad</button>}</div>}
        {filtered.length > 3 && <div className="bv-more-row"><button type="button" className="bv-more-button" onClick={() => setAllActivities(!allActivities)}>{allActivities ? 'Ver menos actividades' : `Ver toda la bitácora (${filtered.length})`} <BitacoraIcon name={allActivities ? 'chevron' : 'right'} size={18}/></button></div>}
      </section>

      <section className="bv-plants" aria-labelledby="bv-plants-title">
        <div className="bv-section-heading bv-plant-head"><div><BitacoraIcon name="sprout" size={33}/><div><h2 id="bv-plants-title">Mis plantas</h2><p>Plantas que forman parte de tu huerto y su historial de cuidados.</p></div></div><div className="bv-plant-head-actions"><button type="button" aria-pressed={!includeArchived} className={!includeArchived ? 'is-active' : ''} onClick={() => { setIncludeArchived(false); setAllPlants(false) }}>En mi huerto</button><button type="button" aria-pressed={includeArchived} className={includeArchived ? 'is-active' : ''} onClick={() => { setIncludeArchived(true); setAllPlants(false) }}>Archivadas</button></div></div>
        {shownPlants.length ? <div className="bv-plant-grid">{(allPlants ? shownPlants : shownPlants.slice(0, 3)).map(plant => {
          const last = activeEntries.find(entry => entry.plantId === plant.id)
          return <article className="bv-plant-card" key={plant.id}><div className="bv-plant-photo">{plant.photo ? <img src={plant.photo} alt={`Fotografía de ${plant.name}`} loading="lazy"/> : <BitacoraIcon name="sprout" size={36}/>}</div><div className="bv-plant-info"><h3>{plant.name}</h3><em>{plant.latin}</em><span className="bv-plant-state"><BitacoraIcon name={plant.archivedAt ? 'archive' : 'sprout'} size={14}/>{plant.archivedAt ? 'Archivada' : PLANT_STATES[plant.state ?? 'not-documented']}</span></div><div className="bv-plant-last"><span><BitacoraIcon name="calendar" size={15}/> Última actividad</span><strong>{last?.title ?? 'Sin registros'}</strong><small>{last ? displayDate(last.date) : 'Sin fecha'}</small><div className="bv-plant-buttons"><button type="button" aria-label={`Ver historial de ${plant.name}`} onClick={() => seePlantHistory(plant.id)} title="Ver historial"><BitacoraIcon name="history" size={17}/></button><button type="button" aria-label={`Abrir Pasaporte Vivo de ${plant.name}`} onClick={() => onSelect(plant)} title="Abrir Pasaporte Vivo"><BitacoraIcon name="right" size={18}/></button></div></div></article>
        })}</div> : <div className="bv-plant-empty"><BitacoraIcon name="sprout" size={34}/><p>{includeArchived ? 'Todavía no hay plantas archivadas.' : 'Todavía no has registrado plantas en tu huerto.'}</p>{!includeArchived && <button type="button" className="bv-primary-button" onClick={onRegister}>Registrar una planta</button>}</div>}
        {shownPlants.length > 3 && <div className="bv-more-row"><button type="button" className="bv-more-button" onClick={() => setAllPlants(!allPlants)}>{allPlants ? 'Ver menos plantas' : `Ver todas mis plantas (${shownPlants.length})`} <BitacoraIcon name="right" size={17}/></button></div>}
      </section>
      <p className="bv-honesty-note"><BitacoraIcon name="info" size={15}/> Las fotografías y las actividades se muestran según su origen. Los registros locales todavía no están sincronizados como bitácora general con el backend.</p>
    </div>
    {selected && <EntryDetails key={selected.key} item={selected} plant={selected.plantId ? plants.find(p => p.id === selected.plantId) : undefined} onSelect={onSelect} onVoid={onVoid} onClose={() => setSelectedKey(null)}/>}
  </section>
}
