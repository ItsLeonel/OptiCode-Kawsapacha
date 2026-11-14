import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent, type MouseEvent } from 'react'
import AdminIcon from './AdminIcon'
import { PROVINCES } from './AdminMap'
import type {
  EvidenceDecision, EvidenceReviewHandler, EvidenceReviewRow, EvidenceReviewState,
  EvidencePhoto,
} from './admin-types'
import './admin-evidence-review.css'

type StatusFilter = 'ALL' | EvidenceReviewState
const PAGE_SIZE = 6
const STATUSES: { value: StatusFilter; label: string }[] = [
  { value: 'ALL', label: 'Todos los estados' },
  { value: 'PENDING', label: 'Pendientes' },
  { value: 'NEEDS_CHANGES', label: 'Requieren corrección' },
  { value: 'APPROVED', label: 'Aprobadas' },
  { value: 'REJECTED', label: 'Rechazadas' },
]
const STATES: Record<EvidenceReviewState, string> = {
  PENDING: 'Pendiente', APPROVED: 'Aprobada',
  NEEDS_CHANGES: 'Requiere correcciones', REJECTED: 'Rechazada',
}
const DECISIONS: { value: EvidenceDecision; title: string; description: string }[] = [
  { value: 'APPROVED', title: 'Aprobar evidencia', description: 'Confirma los puntos ya acreditados, sin duplicarlos.' },
  { value: 'NEEDS_CHANGES', title: 'Solicitar corrección', description: 'Explica qué debe completar o reenviar la persona.' },
  { value: 'REJECTED', title: 'Rechazar evidencia', description: 'El servidor debe registrar el rechazo y revertir puntos una sola vez.' },
]
const clean = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
const localeDate = (value?: string) => {
  if (!value) return 'No registrada'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Fecha no disponible' : new Intl.DateTimeFormat('es-EC', { dateStyle: 'medium' }).format(date)
}
const statusClass = (state: EvidenceReviewState) => `kap-evidence-status kap-evidence-${state.toLowerCase().replace('_', '-')}`
const val = (value?: string | null) => value?.trim() || 'No disponible'
function photosFor(row: EvidenceReviewRow): EvidencePhoto[] {
  const photos = row.photos?.filter(photo => Boolean(photo.url?.trim())) ?? []
  if (photos.length) return photos
  return row.photoUrl ? [{ id: `${row.id}-principal`, url: row.photoUrl, description: 'Evidencia fotográfica' }] : []
}
function RewardState({ reward }: { reward: EvidenceReviewRow['reward'] }) {
  if (!reward) return <span className="kap-evidence-reward-unknown">Recompensas: información no sincronizada</span>
  const names = {
    PROVISIONAL: 'Acreditación provisional',
    CONFIRMED: 'Puntos confirmados',
    REVERSED: 'Reversión registrada',
    NOT_ELIGIBLE: 'Sin recompensa aplicable',
  } as const
  return <div className="kap-evidence-reward">
    <AdminIcon name="leaf" size={19}/>
    <div><strong>{names[reward.state]}</strong>
      <span>{typeof reward.points === 'number' ? `${reward.points.toLocaleString('es-EC')} Semillas informadas por el servidor` : 'Cantidad no suministrada por el servidor'}</span>
    </div>
  </div>
}

/**
 * Fase 4.5D: solo renderiza datos de una API administrativa autorizada.
 * No consume /api/activities normales ni calcula premios, permisos o decisiones.
 * Las fotografías deben provenir de URLs temporales/autorizadas por el backend.
 */
export default function AdminEvidenceReview({
  evidences, loading = false, loadError, onReview, onRefresh,
}: {
  evidences?: EvidenceReviewRow[]
  loading?: boolean
  loadError?: string
  onReview?: EvidenceReviewHandler
  onRefresh?: () => Promise<void> | void
}) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<StatusFilter>('PENDING')
  const [province, setProvince] = useState('')
  const [activity, setActivity] = useState('')
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null)
  const [invalidPhotos, setInvalidPhotos] = useState<string[]>([])
  const [enlargedPhoto, setEnlargedPhoto] = useState<EvidencePhoto | null>(null)
  const [decision, setDecision] = useState<EvidenceDecision>('APPROVED')
  const [reason, setReason] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [saving, setSaving] = useState(false)
  const [submittedKey, setSubmittedKey] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const closeButtonRef = useRef<HTMLButtonElement | null>(null)
  const returnFocusRef = useRef<HTMLElement | null>(null)

  const records = evidences ?? []
  const activityTypes = useMemo(() => Array.from(new Set(records.map(row => row.activityType).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'es')), [records])
  const filtered = useMemo(() => records.filter(row => {
    if (status !== 'ALL' && row.state !== status) return false
    if (province && clean(row.province ?? '') !== clean(province)) return false
    if (activity && row.activityType !== activity) return false
    const searchable = [row.activityType, row.plantName, row.gardenName, row.communityName, row.authorName, row.province, row.observation].join(' ')
    return clean(searchable).includes(clean(query.trim()))
  }).sort((a, b) => {
    const aTime = Date.parse(a.activityDate || a.createdAt || '')
    const bTime = Date.parse(b.activityDate || b.createdAt || '')
    return (Number.isFinite(bTime) ? bTime : 0) - (Number.isFinite(aTime) ? aTime : 0)
  }), [records, query, status, province, activity])
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const visiblePage = Math.min(page, pageCount)
  const visible = filtered.slice((visiblePage - 1) * PAGE_SIZE, visiblePage * PAGE_SIZE)
  const selected = visible.find(row => row.id === selectedId) ?? visible[0] ?? null
  const photos = selected ? photosFor(selected) : []
  const activePhoto = photos.find(photo => photo.id === selectedPhotoId) ?? photos[0]
  const selectedKey = selected ? `${selected.id}:${selected.version ?? 'n/a'}` : ''
  const alreadySubmitted = Boolean(selectedKey && selectedKey === submittedKey)
  const reviewAvailable = Boolean(onReview && selected?.state === 'PENDING' && !saving && !alreadySubmitted && !loading && !loadError)
  const pending = evidences === undefined ? null : records.filter(row => row.state === 'PENDING').length
  const changes = evidences === undefined ? null : records.filter(row => row.state === 'NEEDS_CHANGES').length
  const approved = evidences === undefined ? null : records.filter(row => row.state === 'APPROVED').length
  const rejected = evidences === undefined ? null : records.filter(row => row.state === 'REJECTED').length

  useEffect(() => {
    setSelectedPhotoId(null)
    setInvalidPhotos([])
    setDecision('APPROVED')
    setReason('')
    setConfirmed(false)
    setMessage('')
    setError('')
  }, [selected?.id, selected?.version])
  useEffect(() => {
    if (!enlargedPhoto) return
    closeButtonRef.current?.focus()
    const keyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setEnlargedPhoto(null)
      if (event.key === 'Tab') { event.preventDefault(); closeButtonRef.current?.focus() }
    }
    document.addEventListener('keydown', keyDown)
    return () => {
      document.removeEventListener('keydown', keyDown)
      returnFocusRef.current?.focus()
    }
  }, [enlargedPhoto])

  const markFailedPhoto = (url: string) => setInvalidPhotos(previous => previous.includes(url) ? previous : [...previous, url])
  function openPhoto(photo: EvidencePhoto) {
    returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    setEnlargedPhoto(photo)
  }
  function updateFilters() { setPage(1); setSelectedId(null) }
  async function refresh() {
    if (!onRefresh || refreshing) return
    setRefreshing(true)
    setError('')
    try { await onRefresh() }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo actualizar la bandeja de evidencias.') }
    finally { setRefreshing(false) }
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selected || !onReview || selected.state !== 'PENDING' || saving || alreadySubmitted) return
    const justification = reason.trim()
    if (decision === 'APPROVED' && (photos.length === 0 || photos.every(photo => invalidPhotos.includes(photo.url)))) {
      setError('No se puede aprobar sin consultar al menos una fotografía disponible. Solicita corrección o revisa la conexión de imágenes.')
      return
    }
    if (decision !== 'APPROVED' && justification.length < 10) {
      setError('Escribe al menos 10 caracteres para justificar la corrección o el rechazo.')
      return
    }
    if (!confirmed) { setError('Debes confirmar que revisaste las fotografías y los datos de la actividad.'); return }
    setSaving(true); setMessage(''); setError('')
    try {
      await onReview(selected.id, { state: decision, reason: justification, expectedVersion: selected.version })
      setSubmittedKey(selectedKey)
      setReason(''); setConfirmed(false)
      setMessage('El servidor confirmó la decisión. Los puntos y avisos se actualizarán exclusivamente desde sus registros.')
      if (onRefresh) {
        try { await onRefresh() }
        catch { setError('La decisión fue confirmada, pero no se pudo actualizar el listado. Recarga la bandeja antes de continuar.') }
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'El servidor no pudo registrar la revisión.')
    } finally { setSaving(false) }
  }

  return <div className="kap-evidence-root">
    <div className="kap-evidence-heading">
      <div><span className="kap-evidence-eyebrow"><AdminIcon name="image" size={16}/> EVIDENCIAS AGRÍCOLAS</span>
        <h3>Bandeja de revisión fotográfica</h3>
        <p>Consulta las actividades realizadas en los huertos y registra decisiones con trazabilidad.</p>
      </div>
      <button type="button" className="kap-evidence-refresh" onClick={refresh} disabled={!onRefresh || refreshing || loading}>
        <AdminIcon name="refresh" size={17}/>{refreshing ? 'Actualizando…' : 'Actualizar bandeja'}
      </button>
    </div>

    <div className="kap-evidence-metrics" aria-label="Estados de revisión de evidencias">
      {([
        ['Pendientes de revisión', pending, 'clock'],
        ['Con correcciones solicitadas', changes, 'edit'],
        ['Aprobadas', approved, 'check'],
        ['Rechazadas', rejected, 'shield'],
      ] as const).map(([label, count, icon]) => <div className="kap-evidence-metric" key={label}>
        <AdminIcon name={icon} size={22}/><div><span>{label}</span><strong>{count === null ? '—' : count.toLocaleString('es-EC')}</strong></div>
      </div>)}
    </div>

    <div className="kap-evidence-info" role="status">
      <AdminIcon name="info" size={20}/>
      <span>{evidences === undefined
        ? 'La API de evidencias del MSP aún no está conectada. Esta vista no contiene registros ficticios y no permite decisiones sin autorización del servidor.'
        : 'Las evidencias mostradas provienen del backend autorizado. Las decisiones y los ajustes de puntos se registran únicamente en el servidor.'}</span>
    </div>
    {loadError && <p className="kap-evidence-error" role="alert">{loadError}</p>}
    {loading && <p className="kap-evidence-loading" role="status">Cargando actividades agrícolas autorizadas…</p>}
    <div className="kap-evidence-main-grid">
      <section className="kap-evidence-panel" aria-labelledby="kap-evidence-list-title">
        <div className="kap-evidence-panel-head"><AdminIcon name="clipboard" size={21}/><div>
          <h4 id="kap-evidence-list-title">Actividades registradas</h4><p>Filtra y selecciona un expediente para revisarlo</p>
        </div></div>
        <div className="kap-evidence-filters">
          <label className="kap-evidence-filter kap-evidence-search"><span>Buscar actividad</span>
            <input value={query} onChange={(event: ChangeEvent<HTMLInputElement>) => { setQuery(event.target.value); updateFilters() }} placeholder="Planta, autor, huerto, comunidad…" aria-label="Buscar evidencia"/>
          </label>
          <label className="kap-evidence-filter"><span>Estado</span>
            <select value={status} onChange={(event: ChangeEvent<HTMLSelectElement>) => { setStatus(event.target.value as StatusFilter); updateFilters() }}>
              {STATUSES.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </label>
          <label className="kap-evidence-filter"><span>Provincia</span>
            <select value={province} onChange={(event: ChangeEvent<HTMLSelectElement>) => { setProvince(event.target.value); updateFilters() }}>
              <option value="">Todas las provincias</option>{PROVINCES.map(name => <option key={name} value={name}>{name}</option>)}
            </select>
          </label>
          <label className="kap-evidence-filter"><span>Actividad</span>
            <select value={activity} onChange={(event: ChangeEvent<HTMLSelectElement>) => { setActivity(event.target.value); updateFilters() }}>
              <option value="">Todos los tipos</option>{activityTypes.map(name => <option key={name} value={name}>{name}</option>)}
            </select>
          </label>
        </div>
        <p className="kap-evidence-results" aria-live="polite">{evidences === undefined ? 'Sin datos sincronizados' : `${filtered.length} evidencia(s) en este filtro`}</p>
        {visible.length ? <div className="kap-evidence-list">
          {visible.map(row => {
            const images = photosFor(row)
            const first = images[0]
            return <button key={row.id} className={`kap-evidence-item${selected?.id === row.id ? ' is-active' : ''}`} type="button" aria-pressed={selected?.id === row.id} onClick={() => setSelectedId(row.id)}>
              <span className="kap-evidence-thumb" aria-hidden="true">
                {first && !invalidPhotos.includes(first.url) ? <img src={first.url} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => markFailedPhoto(first.url)}/> : <AdminIcon name="image" size={25}/>}
              </span>
              <span className="kap-evidence-item-copy"><strong>{val(row.activityType)}</strong><small>{val(row.plantName)} · {localeDate(row.activityDate)}</small><small>{val(row.communityName)}</small>
                <span className={statusClass(row.state)}>{STATES[row.state]}</span></span>
              <AdminIcon name="right" size={18}/>
            </button>
          })}
        </div> : <div className="kap-evidence-empty">
          <AdminIcon name="image" size={37}/>
          <strong>{evidences === undefined ? 'Esperando conexión con el backend' : 'No hay actividades para este filtro'}</strong>
          <p>{evidences === undefined ? 'Aquí aparecerán las evidencias reales proporcionadas por la API MSP.' : 'Prueba con otro estado, provincia o tipo de actividad.'}</p>
        </div>}
        {filtered.length > PAGE_SIZE && <div className="kap-evidence-pages"><button type="button" disabled={visiblePage <= 1} onClick={() => setPage(visiblePage - 1)}>Anterior</button><span>Página {visiblePage} de {pageCount}</span><button type="button" disabled={visiblePage >= pageCount} onClick={() => setPage(visiblePage + 1)}>Siguiente</button></div>}
      </section>

      <section className="kap-evidence-panel kap-evidence-detail" aria-labelledby="kap-evidence-detail-title">
        <div className="kap-evidence-panel-head"><AdminIcon name="shield" size={22}/><div>
          <h4 id="kap-evidence-detail-title">Expediente y decisión</h4><p>Fotografía, actividad, responsable y revisión</p>
        </div></div>
        {selected ? <>
          <div className="kap-evidence-detail-title"><div><h5>{val(selected.activityType)}</h5><span className={statusClass(selected.state)}>{STATES[selected.state]}</span></div><span className="kap-evidence-number">Expediente {selected.id.slice(-8)}</span></div>
          <div className="kap-evidence-photo-stage">
            {activePhoto && !invalidPhotos.includes(activePhoto.url) ? <button type="button" className="kap-evidence-photo-open" onClick={() => openPhoto(activePhoto)} aria-label="Ampliar fotografía de evidencia">
              <img src={activePhoto.url} alt={activePhoto.description || `Fotografía de la actividad ${val(selected.activityType)}`} referrerPolicy="no-referrer" onError={() => markFailedPhoto(activePhoto.url)}/><span><AdminIcon name="eye" size={16}/> Ampliar fotografía</span>
            </button> : <div className="kap-evidence-no-photo"><AdminIcon name="image" size={36}/><strong>Fotografía no disponible</strong><small>La imagen debe enviarse mediante un acceso autorizado del servidor.</small></div>}
          </div>
          {photos.length > 1 && <div className="kap-evidence-photo-strip" aria-label="Fotografías del expediente">{photos.map((photo, index) =>
            <button key={photo.id} type="button" onClick={() => setSelectedPhotoId(photo.id)} aria-pressed={activePhoto?.id === photo.id} title={`Ver fotografía ${index + 1}`}>
              {invalidPhotos.includes(photo.url) ? <AdminIcon name="image" size={22}/> : <img src={photo.url} alt={`Fotografía ${index + 1}`} loading="lazy" referrerPolicy="no-referrer" onError={() => markFailedPhoto(photo.url)}/>}
            </button>)}</div>}
          <dl className="kap-evidence-data">
            <div><dt>Planta</dt><dd>{val(selected.plantName)}</dd></div><div><dt>Fecha de actividad</dt><dd>{localeDate(selected.activityDate)}</dd></div>
            <div><dt>Comunidad</dt><dd>{val(selected.communityName)}</dd></div><div><dt>Huerto</dt><dd>{val(selected.gardenName)}</dd></div>
            <div><dt>Provincia</dt><dd>{val(selected.province)}</dd></div><div><dt>Autor</dt><dd>{val(selected.authorName)}</dd></div>
            <div><dt>Registro en sistema</dt><dd>{localeDate(selected.createdAt)}</dd></div><div><dt>Fotos adjuntas</dt><dd>{photos.length}</dd></div>
          </dl>
          <div className="kap-evidence-observation"><strong>Descripción u observaciones</strong><p>{selected.observation?.trim() || 'Sin observaciones registradas.'}</p></div>
          <RewardState reward={selected.reward}/>
          {selected.reviewHistory?.length ? <div className="kap-evidence-history"><h5><AdminIcon name="clock" size={17}/> Historial de revisión</h5>
            <ol>{selected.reviewHistory.map((item, index) => <li key={item.id || `${item.reviewedAt}-${index}`}><span className={statusClass(item.state)}>{STATES[item.state]}</span><small>{localeDate(item.reviewedAt)}{item.reviewerName ? ` · ${item.reviewerName}` : ''}</small>{item.reason && <p>{item.reason}</p>}</li>)}</ol>
          </div> : selected.reviewReason ? <div className="kap-evidence-history"><h5>Última justificación registrada</h5><p>{selected.reviewReason}</p></div> : null}
          <form className="kap-evidence-decision-form" onSubmit={submit}>
            <h5><AdminIcon name="clipboard" size={19}/> Registrar revisión</h5>
            {selected.state !== 'PENDING' ? <p className="kap-evidence-form-note">Esta evidencia ya tiene un estado de revisión. Para modificarlo debe existir un nuevo proceso autorizado en el backend.</p> : !onReview ? <p className="kap-evidence-form-note">La revisión todavía no está habilitada: falta conectar los permisos y el endpoint MSP de Ronny.</p> : null}
            <fieldset disabled={!reviewAvailable}>
              <legend>Decisión administrativa</legend>
              <div className="kap-evidence-decisions">{DECISIONS.map(option => <label key={option.value} className={decision === option.value ? 'is-selected' : ''}>
                <input type="radio" name="evidenceDecision" value={option.value} checked={decision === option.value} onChange={() => { setDecision(option.value); setError('') }}/><span><strong>{option.title}</strong><small>{option.description}</small></span>
              </label>)}</div>
              <label className="kap-evidence-reason"><span>Justificación {decision !== 'APPROVED' ? '(obligatoria)' : '(opcional)'}</span>
                <textarea rows={3} maxLength={1000} value={reason} onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setReason(event.target.value)} placeholder="Explica la observación registrada; no supongas fraude sin pruebas."/></label>
              {decision === 'REJECTED' && <div className="kap-evidence-critical"><AdminIcon name="alert" size={19}/><span>El rechazo debe originar una reversión idempotente de recompensas desde el servidor, conservando la evidencia y el historial.</span></div>}
              <label className="kap-evidence-confirm"><input type="checkbox" checked={confirmed} onChange={(event: ChangeEvent<HTMLInputElement>) => setConfirmed(event.target.checked)}/><span>Confirmo que revisé las fotografías y los datos del expediente, y deseo registrar esta decisión.</span></label>
              <button type="submit" className="kap-evidence-submit" disabled={!reviewAvailable}><AdminIcon name="shield" size={17}/>{saving ? 'Registrando…' : 'Confirmar decisión'}</button>
            </fieldset>
            {alreadySubmitted && <p className="kap-evidence-form-note">Decisión enviada para esta versión. Actualiza el expediente antes de volver a actuar.</p>}
            {message && <p className="kap-evidence-success" role="status">{message}</p>}
            {error && <p className="kap-evidence-error" role="alert">{error}</p>}
          </form>
        </> : <div className="kap-evidence-detail-empty"><AdminIcon name="leaf" size={40}/><h5>Selecciona una actividad</h5><p>Cuando la API envíe evidencias podrás revisar fotografías, historial y registrar decisiones.</p></div>}
      </section>
    </div>
    {enlargedPhoto && <div className="kap-evidence-modal-backdrop" role="presentation" onMouseDown={(event: MouseEvent<HTMLDivElement>) => { if (event.target === event.currentTarget) setEnlargedPhoto(null) }}>
      <div role="dialog" aria-modal="true" aria-label="Fotografía ampliada de evidencia" className="kap-evidence-modal">
        <header><strong>Fotografía de evidencia</strong><button ref={closeButtonRef} type="button" onClick={() => setEnlargedPhoto(null)} aria-label="Cerrar fotografía"><AdminIcon name="close" size={21}/></button></header>
        <img src={enlargedPhoto.url} alt={enlargedPhoto.description || 'Fotografía ampliada de una actividad agrícola'} referrerPolicy="no-referrer" onError={() => { markFailedPhoto(enlargedPhoto.url); setEnlargedPhoto(null) }}/>
        <p>Imagen facilitada por el servicio de evidencias autorizado.</p>
      </div>
    </div>}
  </div>
}
