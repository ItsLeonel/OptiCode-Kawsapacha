import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react'
import AdminIcon from './AdminIcon'
import AdminMap, { PROVINCES } from './AdminMap'
import type { CommunityRow, CommunityReviewDecision, CommunityReviewHandler } from './admin-types'
import './admin-community-verification.css'

type FilterStatus = 'ALL' | CommunityRow['state']
const STATUSES: { value: FilterStatus; label: string }[] = [
  { value: 'ALL', label: 'Todos los estados' },
  { value: 'PENDING', label: 'Pendientes' },
  { value: 'APPROVED', label: 'Aprobadas' },
  { value: 'NEEDS_CHANGES', label: 'Requieren corrección' },
  { value: 'REJECTED', label: 'Rechazadas' },
  { value: 'SUSPENDED', label: 'Suspendidas' },
]
const DECISIONS: { value: CommunityReviewDecision; label: string; description: string }[] = [
  { value: 'APPROVED', label: 'Aprobar', description: 'Confirmar que la comunidad cumple los requisitos de verificación.' },
  { value: 'NEEDS_CHANGES', label: 'Solicitar correcciones', description: 'Indicar al responsable qué información debe corregir o completar.' },
  { value: 'REJECTED', label: 'Rechazar', description: 'Registrar el motivo y conservar la solicitud para auditoría.' },
]
const LABELS: Record<CommunityRow['state'], string> = {
  PENDING: 'Pendiente', APPROVED: 'Aprobada', NEEDS_CHANGES: 'Requiere correcciones',
  REJECTED: 'Rechazada', SUSPENDED: 'Suspendida',
}
const PAGE_SIZE = 6
const normalize = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
function statusClass(state: CommunityRow['state']) { return `kap-com-status kap-com-${state.toLowerCase().replace('_', '-')}` }
function displayedDate(date?: string) {
  if (!date) return 'No registrada'
  const parsed = new Date(date)
  return Number.isNaN(parsed.getTime()) ? 'No registrada' : new Intl.DateTimeFormat('es-EC', { dateStyle: 'medium' }).format(parsed)
}

/** Vista de supervisión MSP. Los datos y decisiones vienen EXCLUSIVAMENTE de una API autorizada.
 * Sin CommunityReviewHandler, la UI nunca simula aprobar, rechazar ni alterar puntos. */
export default function AdminCommunityVerification({ communities, onReview, onRefresh }: {
  communities?: CommunityRow[]
  onReview?: CommunityReviewHandler
  onRefresh?: () => Promise<void> | void
}) {
  const [query, setQuery] = useState('')
  const [province, setProvince] = useState('')
  const [status, setStatus] = useState<FilterStatus>('ALL')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [decision, setDecision] = useState<CommunityReviewDecision>('APPROVED')
  const [reason, setReason] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const records = communities ?? []
  const filtered = useMemo(() => records.filter(row => {
    const matchProvince = !province || normalize(row.province) === normalize(province)
    const matchStatus = status === 'ALL' || row.state === status
    const search = normalize(`${row.name} ${row.province} ${row.canton ?? ''} ${row.responsibleName ?? ''}`)
    return matchProvince && matchStatus && search.includes(normalize(query.trim()))
  }), [records, province, status, query])
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount)
  const visible = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)
  const selected = filtered.find(row => row.id === selectedId) ?? visible[0] ?? null
  const total = communities === undefined ? null : records.length
  const pending = communities === undefined ? null : records.filter(row => row.state === 'PENDING').length
  const approved = communities === undefined ? null : records.filter(row => row.state === 'APPROVED').length
  const changes = communities === undefined ? null : records.filter(row => row.state === 'NEEDS_CHANGES').length
  const unlocated = filtered.filter(row => typeof (row.latitude ?? row.coordinates?.latitude) !== 'number' || typeof (row.longitude ?? row.coordinates?.longitude) !== 'number').length

  useEffect(() => { setDecision('APPROVED'); setReason(''); setConfirmed(false); setError(''); setMessage('') }, [selected?.id])
  function select(id: string) { setSelectedId(id); setMessage(''); setError('') }
  function updateProvince(value: string) { setProvince(value); setPage(1) }
  function updateStatus(value: FilterStatus) { setStatus(value); setPage(1) }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selected || !onReview || saving) return
    if (decision !== 'APPROVED' && reason.trim().length < 10) {
      setError('Escribe una justificación de al menos 10 caracteres para esta decisión.')
      return
    }
    if (!confirmed) { setError('Confirma que revisaste la información antes de enviar la decisión.'); return }
    setError(''); setMessage(''); setSaving(true)
    try {
      await onReview(selected.id, { state: decision, reason: reason.trim() })
      setMessage('El servidor confirmó la operación. La comunidad y su historial deben actualizarse con los datos oficiales.')
      setReason(''); setConfirmed(false)
      await onRefresh?.()
    } catch (err) { setError(err instanceof Error ? err.message : 'El servidor no pudo completar la verificación.') }
    finally { setSaving(false) }
  }

  return <div className="kap-community-review">
    <div className="kap-verify-metrics" aria-label="Resumen nacional de verificación">
      {([['Comunidades registradas', total, 'users'], ['Pendientes de verificación', pending, 'clock'], ['Comunidades aprobadas', approved, 'shield'], ['Requieren correcciones', changes, 'alert']] as const).map(([label, value, icon]) =>
        <div className="kap-verify-metric" key={label}><AdminIcon name={icon} size={21}/><span>{label}</span><strong>{value === null ? '—' : value.toLocaleString('es-EC')}</strong></div>)}
    </div>
    <section className="kap-verify-panel" aria-labelledby="kap-verify-map-title">
      <header className="kap-verify-title"><AdminIcon name="map" size={22}/><div><h3 id="kap-verify-map-title">Cobertura nacional</h3><p>Comunidades registradas y su distribución provincial</p></div></header>
      <div className="kap-verify-map-area"><AdminMap province={province} onProvinceChange={updateProvince} communities={filtered} selectedId={selected?.id} onSelectCommunity={select}/></div>
      {unlocated > 0 && <p className="kap-verify-hint">{unlocated} comunidad(es) del filtro sin coordenadas: se representan agrupadas por provincia, nunca como ubicaciones exactas.</p>}
    </section>
    <div className="kap-verify-grid">
      <section className="kap-verify-panel" aria-labelledby="kap-verify-list-title">
        <header className="kap-verify-title"><AdminIcon name="users" size={22}/><div><h3 id="kap-verify-list-title">Directorio de comunidades</h3><p>Selecciona una comunidad para revisar su expediente</p></div></header>
        <div className="kap-verify-filters">
          <label className="kap-verify-filter kap-verify-search"><span>Buscar comunidad</span><input aria-label="Buscar comunidad" placeholder="Nombre, cantón o responsable…" value={query} onChange={(event: ChangeEvent<HTMLInputElement>) => { setQuery(event.target.value); setPage(1) }}/></label>
          <label className="kap-verify-filter"><span>Estado</span><select value={status} onChange={(event: ChangeEvent<HTMLSelectElement>) => updateStatus(event.target.value as FilterStatus)}>{STATUSES.map(option => <option value={option.value} key={option.value}>{option.label}</option>)}</select></label>
          <label className="kap-verify-filter"><span>Provincia</span><select value={province} onChange={(event: ChangeEvent<HTMLSelectElement>) => updateProvince(event.target.value)}><option value="">Todas las provincias</option>{PROVINCES.map(name => <option key={name} value={name}>{name}</option>)}</select></label>
        </div>
        {communities === undefined && <div className="kap-verify-unavailable" role="status"><AdminIcon name="info" size={19}/><div><strong>Sincronización MSP pendiente</strong><p>La lista nacional se mostrará cuando Ronny habilite la API administrativa y la sesión autorizada. No se muestran registros ficticios.</p></div></div>}
        <div className="kap-verify-results" aria-live="polite">{communities !== undefined && `${filtered.length} comunidad(es) encontradas`}</div>
        {visible.length ? <div className="kap-verify-list">{visible.map(row => <button type="button" key={row.id} className={`kap-verify-list-item${selected?.id === row.id ? ' is-active' : ''}`} onClick={() => select(row.id)} aria-pressed={selected?.id === row.id}>
          <span className="kap-verify-list-icon"><AdminIcon name="users" size={21}/></span>
          <span className="kap-verify-list-copy"><strong>{row.name}</strong><small>{row.province}{row.canton ? ` · ${row.canton}` : ''}</small><span className={statusClass(row.state)}>{LABELS[row.state]}</span></span>
          <AdminIcon name="right" size={17}/>
        </button>)}</div> : <div className="kap-verify-no-data">{communities === undefined ? 'No hay comunidades sincronizadas.' : 'No se encontraron comunidades para estos filtros.'}</div>}
        {filtered.length > PAGE_SIZE && <div className="kap-verify-pagination"><button disabled={safePage <= 1} onClick={() => setPage(safePage - 1)} type="button">Anterior</button><span>Página {safePage} de {pageCount}</span><button disabled={safePage >= pageCount} onClick={() => setPage(safePage + 1)} type="button">Siguiente</button></div>}
      </section>
      <section className="kap-verify-panel kap-verify-detail" aria-labelledby="kap-verify-detail-title">
        <header className="kap-verify-title"><AdminIcon name="shield" size={22}/><div><h3 id="kap-verify-detail-title">Ficha de verificación</h3><p>Información recibida del expediente comunitario</p></div></header>
        {selected ? <>
          {selected.photoUrl && <img className="kap-verify-cover" src={selected.photoUrl} alt={`Fotografía de ${selected.name}`} loading="lazy"/>}
          <div className="kap-verify-detail-header"><h4>{selected.name}</h4><span className={statusClass(selected.state)}>{LABELS[selected.state]}</span></div>
          <dl className="kap-verify-data"><div><dt>Provincia</dt><dd>{selected.province || 'No registrada'}</dd></div><div><dt>Cantón</dt><dd>{selected.canton || 'No registrado'}</dd></div><div><dt>Responsable</dt><dd>{selected.responsibleName || 'No informado'}</dd></div><div><dt>Registrada el</dt><dd>{displayedDate(selected.createdAt)}</dd></div><div><dt>Huertos vinculados</dt><dd>{typeof selected.gardensCount === 'number' ? selected.gardensCount : 'No disponible'}</dd></div><div><dt>Integrantes</dt><dd>{typeof selected.memberCount === 'number' ? selected.memberCount : 'No disponible'}</dd></div></dl>
          {selected.description && <div className="kap-verify-description"><strong>Descripción</strong><p>{selected.description}</p></div>}
          {selected.reviewReason && <div className="kap-verify-reason"><strong>Última observación registrada</strong><p>{selected.reviewReason}</p></div>}
          {selected.state === 'APPROVED' && <p className="kap-verify-hint">Esta comunidad ya figura como aprobada; la revisión adicional depende de las reglas del MSP.</p>}
          <form onSubmit={submit} className="kap-verify-decision">
            <h4><AdminIcon name="clipboard" size={19}/> Registrar decisión</h4>
            <label className="kap-verify-filter"><span>Resolución</span><select value={decision} onChange={(e: ChangeEvent<HTMLSelectElement>) => { setDecision(e.target.value as CommunityReviewDecision); setConfirmed(false); setError(''); setMessage('') }}>{DECISIONS.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
            <p className="kap-verify-hint">{DECISIONS.find(item => item.value === decision)?.description}</p>
            <label className="kap-verify-filter"><span>Justificación {decision === 'APPROVED' ? '(opcional)' : '(obligatoria)'}</span><textarea value={reason} onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setReason(e.target.value)} rows={3} maxLength={1000} placeholder={decision === 'APPROVED' ? 'Observaciones de la revisión (opcional)' : 'Explica claramente los motivos de la decisión'} required={decision !== 'APPROVED'}/></label>
            <label className="kap-verify-confirm"><input type="checkbox" checked={confirmed} onChange={(e: ChangeEvent<HTMLInputElement>) => setConfirmed(e.target.checked)}/><span>He revisado la información y la evidencia de la comunidad.</span></label>
            {!onReview && <div role="note" className="kap-verify-unavailable kap-verify-unavailable-inline"><AdminIcon name="lock" size={18}/><span>Las decisiones están deshabilitadas hasta que el backend MSP exponga la API protegida de verificación.</span></div>}
            {error && <p role="alert" className="kap-verify-error">{error}</p>}
            {message && <p role="status" className="kap-verify-success">{message}</p>}
            <button type="submit" className="kap-verify-submit" disabled={!onReview || saving || !confirmed || (decision !== 'APPROVED' && reason.trim().length < 10)}><AdminIcon name="shield" size={17}/>{saving ? 'Guardando en servidor…' : `Confirmar: ${DECISIONS.find(item => item.value === decision)?.label}`}</button>
          </form>
        </> : <div className="kap-verify-no-data">Selecciona una comunidad del directorio para consultar su información y las posibles acciones de verificación.</div>}
      </section>
    </div>
  </div>
}
