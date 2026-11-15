import { useCallback, useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import AdminIcon, { type AdminIconName } from './AdminIcon'
import AdminMap from './AdminMap'
import type { AdminNavKey, MspDashboardData } from './admin-types'
import { adminApi } from '../../services/api'
import communityLearning from '../communities/assets/aprender-v2.jpg'
import communityEvents from '../communities/assets/eventos-v2.jpg'
import communityForum from '../communities/assets/foro-v2.jpg'
import { FormattedCount, AdminMetric, AdminPanel, ActionLink, EmptyState, ValueBadge, SectionHead } from './admin-ui'
import { stateLabel, formatActivityType } from './admin-formatters'

const DEMO_EVENTS = new Set([
  'Minga Nacional Agroecológica Kawsapacha',
  'Feria de Semillas Nativas y Salud Comunitaria',
  'Taller Provincial de Compostaje y Riego Eficiente',
])
const DEMO_RESOURCES = new Set([
  'Guía Oficial de Cultivo y Propiedades de Plantas Medicinales Andinas',
  'Manual de Manejo Agroecológico de Suelos y Compostaje Comunitario',
  'Ficha Técnica: Calendario Agroecológico Lunar Kawsapacha',
  'Protocolo de Seguridad Alimentaria en Huertos Comunitarios',
])
function countBy<T>(items: T[], key: (item: T) => string): Array<[string, number]> {
  const totals = new Map<string, number>()
  for (const item of items) {
    const name = key(item) || 'Sin dato'
    totals.set(name, (totals.get(name) ?? 0) + 1)
  }
  return [...totals.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'es'))
}

export function MspHome({ data, setTab }: { data?: MspDashboardData; setTab: (next: AdminNavKey) => void }) {
  const [province, setProvince] = useState('')
  return <>
    <div className="kap-section-heading"><div><h2>Panel de gestión institucional</h2><p>Supervisión y acompañamiento de Kawsapacha · simulación académica, no un portal oficial del MSP</p></div><span className="kap-info-chip"><AdminIcon name="shield" size={14}/> Datos del proyecto</span></div>
    <div className="kap-metrics">
      <AdminMetric icon="users" label="Comunidades registradas" value={data?.communitiesTotal}/>
      <AdminMetric icon="calendar" label="Eventos registrados" value={data?.activeEvents} tone="gold"/>
      <AdminMetric icon="book" label="Recursos educativos" value={data?.educationalResources} tone="brown"/>
      <AdminMetric icon="shield" label="Contenidos en moderación" value={data?.moderationPending} tone="red"/>
    </div>
    <div className="kap-msp-primary-grid">
      <AdminPanel icon="pin" title="Cobertura de comunidades" subtitle="Distribución de comunidades en el territorio nacional" action={<ActionLink onClick={() => setTab('comunidades')}>Ver cobertura territorial</ActionLink>}>
        <div className="kap-map-panel">
          <AdminMap province={province} onProvinceChange={setProvince} communities={data?.communities ?? []}/>
          <div className="kap-map-aside"><div className="kap-tally"><AdminIcon name="users" size={20}/><span><strong><FormattedCount value={data?.communitiesTotal}/></strong><small>Comunidades</small></span></div>
            <div className="kap-tally"><AdminIcon name="shield" size={20}/><span><strong><FormattedCount value={data?.communitiesApproved}/></strong><small>Verificadas</small></span></div>
            <div className="kap-tally"><AdminIcon name="map" size={20}/><span><strong>24</strong><small>Provincias del Ecuador</small></span></div></div>
        </div>
      </AdminPanel>
      <AdminPanel icon="calendar" title="Próximos eventos institucionales" subtitle="Ferias, mingas y actividades de alcance nacional" action={<ActionLink onClick={() => setTab('eventos')}>Ver todos</ActionLink>}>
        {data?.events?.length ? <div className="kap-list-rows">{data.events.slice(0, 3).map(event => <div className="kap-row" key={event.id}>
          <span className="kap-row-icon"><AdminIcon name="calendar" size={20}/></span><div><strong>{event.name}</strong><small>{event.date} · {event.province}</small></div><ValueBadge>{event.scope}</ValueBadge></div>)}</div> :
          <EmptyState title="Sin eventos institucionales publicados" detail="Aquí aparecerán los eventos reales creados por el MSP cuando esté conectada su API." illustration={communityEvents}/>}
      </AdminPanel>
    </div>
    <div className="kap-msp-secondary-grid">
      <AdminPanel icon="book" title="Recursos educativos destacados" subtitle="Guías, materiales y saberes publicados" action={<ActionLink onClick={() => setTab('recursos')}>Ver biblioteca</ActionLink>}>
        {data?.resources?.length ? <div className="kap-resource-list">{data.resources.filter(r => r.published).slice(0, 3).map(resource => <div className="kap-resource-tile" key={resource.id}><AdminIcon name="book" size={25}/><strong>{resource.title}</strong><small>{resource.kind}</small></div>)}</div> :
          <EmptyState title="Biblioteca pendiente de contenido" detail="Las publicaciones verificadas aparecerán aquí." illustration={communityLearning}/>}
      </AdminPanel>
      <AdminPanel icon="shield" title="Contenidos por moderar" subtitle="Publicaciones y evidencias de revisión" action={<ActionLink onClick={() => setTab('moderacion')}>Revisar</ActionLink>}>
        <div className="kap-review-list">
          {([['Comunidades','users'], ['Actividades y evidencias','image']] as [string, AdminIconName][]).map(([label, icon]) => <button type="button" key={label} onClick={() => setTab('moderacion')}><AdminIcon name={icon} size={18}/><span>{label}</span><span className="kap-review-pending">{label === 'Comunidades' ? `${(data?.communities ?? []).filter(c => c.state === 'PENDING' || c.state === 'NEEDS_CHANGES').length} por revisar` : `${(data?.activities ?? []).filter(a => a.reviewStatus === 'PENDING' || a.reviewStatus === 'NEEDS_CHANGES').length} por revisar`}</span></button>)}
        </div>
      </AdminPanel>
      <AdminPanel icon="chart" title="Reportes rápidos" subtitle="Indicadores del programa" action={<ActionLink onClick={() => setTab('reportes')}>Ver reportes</ActionLink>}>
        <div className="kap-report-list">{['Actividades agrícolas', 'Eventos por provincia', 'Recursos por categoría'].map(label => <button type="button" key={label} onClick={() => setTab('reportes')}><AdminIcon name="chart" size={18}/>{label}<AdminIcon name="right" size={17}/></button>)}</div>
      </AdminPanel>
    </div>
  </>
}
export function MspDetail({ tab, data, setTab, onRefresh }: { tab: AdminNavKey; data?: MspDashboardData; setTab: (next: AdminNavKey) => void; onRefresh?: () => void }) {
  const [query, setQuery] = useState('')
  const [province, setProvince] = useState('')
  // Moderación: comunidades pendientes
  const [allCommunities, setAllCommunities] = useState<any[]>([])
  const [selectedCommunityFilter, setSelectedCommunityFilter] = useState('')
  const [pendingComms, setPendingComms] = useState<any[]>([])
  const [activitiesForReview, setActivitiesForReview] = useState<any[]>([])
  const [reviewStatusFilter, setReviewStatusFilter] = useState('ALL')
  const [modLoading, setModLoading] = useState(false)
  const [modMsg, setModMsg] = useState('')
  const [modError, setModError] = useState('')
  const [reasonModal, setReasonModal] = useState<{ type: 'community' | 'activity'; id: string; action: 'NEEDS_CHANGES' | 'REJECTED' } | null>(null)
  const [reasonText, setReasonText] = useState('')

  const loadModeration = useCallback(() => {
    setModLoading(true)
    setModError('')
    Promise.all([
      adminApi.listCommunities(),
      adminApi.listActivities(),
    ]).then(([commRes, actRes]) => {
      const comms = commRes.communities || []
      setAllCommunities(comms)
      setPendingComms(comms.filter((c: any) => c.status === 'PENDING' || c.status === 'NEEDS_CHANGES'))
      setActivitiesForReview(actRes.activities || [])
    }).catch(err => setModError(err instanceof Error ? err.message : 'No se pudo cargar la bandeja de moderación.'))
      .finally(() => setModLoading(false))
  }, [])

  // Eventos MSP
  const [eventsList, setEventsList] = useState<any[]>([])
  const [eventFormOpen, setEventFormOpen] = useState(false)
  const [eventName, setEventName] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [eventProvince, setEventProvince] = useState('Pichincha')
  const [eventScope, setEventScope] = useState('NACIONAL')
  const [eventDesc, setEventDesc] = useState('')
  const [eventSaving, setEventSaving] = useState(false)
  const [eventMsg, setEventMsg] = useState('')
  const [eventError, setEventError] = useState('')

  // Recursos MSP
  const [resourcesList, setResourcesList] = useState<any[]>([])
  const [resourceFormOpen, setResourceFormOpen] = useState(false)
  const [resTitle, setResTitle] = useState('')
  const [resKind, setResKind] = useState('GUIA')
  const [resDesc, setResDesc] = useState('')
  const [resUrl, setResUrl] = useState('')
  const [resSaving, setResSaving] = useState(false)
  const [resMsg, setResMsg] = useState('')
  const [resError, setResError] = useState('')

  const loadEvents = useCallback(() => {
    adminApi.listEvents()
      .then(r => setEventsList(r.events || []))
      .catch(err => setEventError(err instanceof Error ? err.message : 'No se pudieron cargar los eventos.'))
  }, [])

  const loadResources = useCallback(() => {
    adminApi.listResources()
      .then(r => setResourcesList(r.resources || []))
      .catch(err => setResError(err instanceof Error ? err.message : 'No se pudieron cargar los recursos.'))
  }, [])

  useEffect(() => {
    if (tab === 'moderacion') loadModeration()
    if (tab === 'eventos') loadEvents()
    if (tab === 'recursos') loadResources()
  }, [tab, loadModeration, loadEvents, loadResources])

  const handleCreateEvent = async (e: FormEvent) => {
    e.preventDefault()
    if (!eventName.trim() || !eventDate.trim()) return
    setEventSaving(true)
    setEventMsg('')
    setEventError('')
    try {
      await adminApi.createEvent({
        name: eventName.trim(),
        date: eventDate.trim(),
        province: eventProvince,
        scope: eventScope,
        description: eventDesc.trim(),
      })
      setEventMsg('✓ Evento institucional publicado exitosamente.')
      setEventName('')
      setEventDate('')
      setEventDesc('')
      setEventFormOpen(false)
      loadEvents()
      onRefresh?.()
    } catch (err: unknown) {
      setEventError(err instanceof Error ? err.message : 'Error al crear evento')
    } finally {
      setEventSaving(false)
    }
  }

  const handleDeleteEvent = async (id: string) => {
    if (!confirm('¿Deseas eliminar este evento institucional?')) return
    try {
      await adminApi.deleteEvent(id)
      loadEvents()
      onRefresh?.()
    } catch (err) {
      setEventError(err instanceof Error ? err.message : 'No se pudo eliminar el evento.')
    }
  }

  const handleCreateResource = async (e: FormEvent) => {
    e.preventDefault()
    if (!resTitle.trim()) return
    setResSaving(true)
    setResMsg('')
    setResError('')
    try {
      await adminApi.createResource({
        title: resTitle.trim(),
        kind: resKind,
        description: resDesc.trim(),
        fileUrl: resUrl.trim() || undefined,
      })
      setResMsg('✓ Recurso educativo publicado exitosamente.')
      setResTitle('')
      setResDesc('')
      setResUrl('')
      setResourceFormOpen(false)
      loadResources()
      onRefresh?.()
    } catch (err: unknown) {
      setResError(err instanceof Error ? err.message : 'Error al crear recurso')
    } finally {
      setResSaving(false)
    }
  }

  const handleDeleteResource = async (id: string) => {
    if (!confirm('¿Deseas eliminar este recurso educativo?')) return
    try {
      await adminApi.deleteResource(id)
      loadResources()
      onRefresh?.()
    } catch (err) {
      setResError(err instanceof Error ? err.message : 'No se pudo eliminar el recurso.')
    }
  }

  const handleReviewCommunity = async (id: string, action: 'APPROVED' | 'NEEDS_CHANGES' | 'REJECTED', reason?: string) => {
    setModMsg('')
    setModError('')
    try {
      await adminApi.reviewCommunity(id, { action, reason })
      setModMsg(`✓ Comunidad ${action === 'APPROVED' ? 'aprobada' : action === 'NEEDS_CHANGES' ? 'requiere correcciones' : 'rechazada'} correctamente.`)
      loadModeration()
      onRefresh?.()
    } catch (err: unknown) {
      setModError(err instanceof Error ? err.message : 'Error al revisar comunidad')
    }
  }

  const handleReviewActivity = async (id: string, action: 'APPROVED' | 'NEEDS_CHANGES' | 'REJECTED', reason?: string) => {
    setModMsg('')
    setModError('')
    try {
      const res = await adminApi.reviewActivity(id, { action, reason })
      const reverted = res.pointsReverted ?? 0
      setModMsg(`✓ Actividad ${action === 'APPROVED' ? 'verificada (sin duplicar puntos)' : action === 'NEEDS_CHANGES' ? 'requiere correcciones' : `invalidada (${Math.abs(reverted)} Semillas revertidas)`} correctamente.`)
      loadModeration()
      onRefresh?.()
    } catch (err: unknown) {
      setModError(err instanceof Error ? err.message : 'Error al revisar actividad')
    }
  }

  const openReasonModal = (type: 'community' | 'activity', id: string, action: 'NEEDS_CHANGES' | 'REJECTED') => {
    setReasonText('')
    setReasonModal({ type, id, action })
  }

  const submitReason = async () => {
    if (!reasonModal) return
    if (!reasonText.trim() || reasonText.trim().length < 5) {
      setModError('El motivo debe tener al menos 5 caracteres.')
      return
    }
    setReasonModal(null)
    if (reasonModal.type === 'community') {
      await handleReviewCommunity(reasonModal.id, reasonModal.action, reasonText.trim())
    } else {
      await handleReviewActivity(reasonModal.id, reasonModal.action, reasonText.trim())
    }
  }

  const definitions: Record<string, { title: string; description: string; icon: AdminIconName }> = {
    comunidades: { title: 'Comunidades del Ecuador', description: 'Registro y estados de verificación de comunidades.', icon: 'users' },
    eventos: { title: 'Eventos y mingas institucionales', description: 'Ferias y encuentros coordinados por el MSP.', icon: 'calendar' },
    recursos: { title: 'Biblioteca educativa', description: 'Publicación y validación de recursos para las comunidades.', icon: 'book' },
    moderacion: { title: 'Moderación y verificaciones', description: 'Revisión de comunidades, fotografías y publicaciones.', icon: 'shield' },
    reportes: { title: 'Reportes institucionales', description: 'Indicadores de comunidades, eventos y contenido educativo.', icon: 'chart' },
  }
  const definition = definitions[tab] ?? definitions.comunidades
  const communities = (data?.communities ?? []).filter(c => (!province || c.province === province) && `${c.name} ${c.province} ${c.responsibleName ?? ''}`.toLocaleLowerCase().includes(query.toLocaleLowerCase()))
  const reportGroups: Array<{ title: string; icon: AdminIconName; rows: Array<[string, number]> }> = [
    { title: 'Comunidades por estado', icon: 'users', rows: countBy(data?.communities ?? [], c => stateLabel(c)) },
    { title: 'Actividades por estado de revisión', icon: 'shield', rows: countBy(data?.activities ?? [], a => ({ PENDING: 'Pendiente', NEEDS_CHANGES: 'Requiere correcciones', APPROVED: 'Aprobada', REJECTED: 'Rechazada' } as Record<string, string>)[a.reviewStatus] || a.reviewStatus) },
    { title: 'Actividades por tipo agrícola', icon: 'image', rows: countBy(data?.activities ?? [], a => formatActivityType(a.type)) },
    { title: 'Actividades por mes', icon: 'calendar', rows: countBy(data?.activities ?? [], a => a.performedDate?.slice(0, 7) || 'Sin fecha') },
    { title: 'Eventos por provincia', icon: 'calendar', rows: countBy(data?.events ?? [], e => e.province) },
    { title: 'Recursos por categoría', icon: 'book', rows: countBy(data?.resources ?? [], r => r.kind) },
  ]
  return <>
    <SectionHead title={definition.title} subtitle={definition.description} onBack={() => setTab('inicio')}/>

    {/* Modal de motivo */}
    {reasonModal && <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: '10px', padding: '1.5rem', maxWidth: '450px', width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <h3 style={{ margin: '0 0 0.75rem', color: '#2d3748' }}>
          {reasonModal.action === 'NEEDS_CHANGES' ? '📝 Solicitar correcciones' : '❌ Rechazar'}
        </h3>
        <p style={{ margin: '0 0 0.75rem', fontSize: '0.85rem', color: '#718096' }}>
          Escribe un motivo detallado (mínimo 5 caracteres). Será notificado al responsable.
        </p>
        <textarea
          value={reasonText}
          onChange={e => setReasonText(e.target.value)}
          rows={3}
          style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e0', borderRadius: '6px', fontSize: '0.9rem', resize: 'vertical', boxSizing: 'border-box' }}
          placeholder="Ej: La fotografía no es clara, por favor adjunta una imagen de mejor resolución..."
          autoFocus
        />
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', justifyContent: 'flex-end' }}>
          <button type="button" onClick={() => setReasonModal(null)} style={{ padding: '0.4rem 1rem', border: '1px solid #cbd5e0', borderRadius: '6px', background: '#fff', cursor: 'pointer' }}>Cancelar</button>
          <button type="button" onClick={submitReason} style={{ padding: '0.4rem 1rem', border: 'none', borderRadius: '6px', background: reasonModal.action === 'NEEDS_CHANGES' ? '#d69e2e' : '#c53030', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>Confirmar</button>
        </div>
      </div>
    </div>}

    {tab === 'comunidades' && <div className="kap-detail-layout">
      <AdminPanel title="Mapa nacional" subtitle="Cobertura provincial de comunidades" icon="map"><AdminMap province={province} onProvinceChange={setProvince} communities={data?.communities ?? []}/></AdminPanel>
      <AdminPanel title={`Directorio de comunidades (${communities.length})`} subtitle="Datos reales del servidor MSP" icon="users" action={onRefresh ? <button className="kap-icon-button" type="button" onClick={onRefresh} title="Recargar" aria-label="Recargar comunidades"><AdminIcon name="refresh" size={17}/></button> : undefined}><label className="kap-search"><AdminIcon name="search" size={17}/><input value={query} onChange={(e: ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)} placeholder="Buscar comunidad, provincia o responsable" aria-label="Buscar comunidad"/></label>
        {modMsg && <p style={{ margin: '0.5rem 0', color: '#276749', fontWeight: 600 }}>{modMsg}</p>}
        {modError && <p style={{ margin: '0.5rem 0', color: '#c53030', fontWeight: 600 }}>{modError}</p>}
        {communities.length ? <div className="kap-table-scroll"><table className="kap-table"><thead><tr><th>Comunidad</th><th>Provincia</th><th>Responsable</th><th>Miembros</th><th>Huertos</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>{communities.map(c => <tr key={c.id}>
          <td><strong>{c.name}</strong></td>
          <td>{c.province}{c.canton ? ` · ${c.canton}` : ''}</td>
          <td>{c.responsibleName || '—'}</td>
          <td>{c.memberCount ?? '—'}</td>
          <td>{c.gardensCount ?? '—'}</td>
          <td><ValueBadge tone={c.state === 'APPROVED' ? 'green' : c.state === 'REJECTED' ? 'red' : c.state === 'PENDING' ? 'gold' : 'purple'}>{stateLabel(c)}</ValueBadge></td>
          <td style={{ whiteSpace: 'nowrap' }}>{c.state === 'PENDING' || c.state === 'NEEDS_CHANGES' ? <span style={{ display: 'inline-flex', gap: '0.3rem' }}>
            <button type="button" onClick={() => handleReviewCommunity(c.id, 'APPROVED')} style={{ fontSize: '0.75rem', padding: '0.25rem 0.55rem', borderRadius: '4px', border: 'none', background: '#276749', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>✓ Aprobar</button>
            <button type="button" onClick={() => openReasonModal('community', c.id, 'REJECTED')} style={{ fontSize: '0.75rem', padding: '0.25rem 0.55rem', borderRadius: '4px', border: '1px solid #c53030', background: '#fff5f5', color: '#c53030', cursor: 'pointer' }}>✗ Rechazar</button>
          </span> : <small style={{ color: '#a0aec0' }}>Revisada</small>}</td>
        </tr>)}</tbody></table></div> : <EmptyState title="No hay comunidades para mostrar" detail={data?.communities?.length ? 'Ninguna comunidad coincide con el filtro aplicado.' : 'Aún no existen comunidades registradas en el servidor.'}/>}
      </AdminPanel></div>}

    {tab === 'eventos' && (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#2d3748' }}>Eventos del proyecto gestionados por el rol MSP</h3>
            <p style={{ margin: '2px 0 0', fontSize: '0.85rem', color: '#718096' }}>
              Registro y difusión de ferias, mingas y capacitaciones del proyecto para las comunidades.
            </p>
          </div>
          <button
            type="button"
            className="kap-primary-action"
            onClick={() => setEventFormOpen(v => !v)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <AdminIcon name="plus" size={16} />
            {eventFormOpen ? 'Cerrar formulario' : 'Publicar nuevo evento'}
          </button>
        </div>

        {eventMsg && <div style={{ padding: '0.75rem 1rem', background: '#f0fff4', border: '1px solid #9ae6b4', borderRadius: '8px', color: '#276749', fontWeight: 600 }}>{eventMsg}</div>}
        {eventError && <div style={{ padding: '0.75rem 1rem', background: '#fff5f5', border: '1px solid #feb2b2', borderRadius: '8px', color: '#c53030', fontWeight: 600 }}>{eventError}</div>}

        {eventFormOpen && (
          <form onSubmit={handleCreateEvent} style={{ background: '#f7fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <h4 style={{ margin: 0, color: '#2d3748', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AdminIcon name="calendar" size={18} /> Registrar Nuevo Evento Institucional
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem' }}>
              <label style={{ fontSize: '0.83rem', color: '#4a5568', display: 'flex', flexDirection: 'column' }}>
                Nombre del evento *
                <input
                  required
                  placeholder="Ej: Minga Provincial de Riego Comunitario"
                  value={eventName}
                  onChange={e => setEventName(e.target.value)}
                  style={{ width: '100%', padding: '0.45rem', marginTop: '0.25rem', border: '1px solid #cbd5e0', borderRadius: '4px' }}
                />
              </label>
              <label style={{ fontSize: '0.83rem', color: '#4a5568', display: 'flex', flexDirection: 'column' }}>
                Fecha programada *
                <input
                  type="date"
                  required
                  value={eventDate}
                  onChange={e => setEventDate(e.target.value)}
                  style={{ width: '100%', padding: '0.45rem', marginTop: '0.25rem', border: '1px solid #cbd5e0', borderRadius: '4px' }}
                />
              </label>
              <label style={{ fontSize: '0.83rem', color: '#4a5568', display: 'flex', flexDirection: 'column' }}>
                Provincia sede
                <select
                  value={eventProvince}
                  onChange={e => setEventProvince(e.target.value)}
                  style={{ width: '100%', padding: '0.45rem', marginTop: '0.25rem', border: '1px solid #cbd5e0', borderRadius: '4px' }}
                >
                  {['Pichincha', 'Azuay', 'Bolívar', 'Cañar', 'Carchi', 'Chimborazo', 'Cotopaxi', 'El Oro', 'Esmeraldas', 'Galápagos', 'Guayas', 'Imbabura', 'Loja', 'Los Ríos', 'Manabí', 'Morona Santiago', 'Napo', 'Orellana', 'Pastaza', 'Santa Elena', 'Santo Domingo', 'Sucumbíos', 'Tungurahua', 'Zamora Chinchipe'].map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </label>
              <label style={{ fontSize: '0.83rem', color: '#4a5568', display: 'flex', flexDirection: 'column' }}>
                Alcance institucional
                <select
                  value={eventScope}
                  onChange={e => setEventScope(e.target.value)}
                  style={{ width: '100%', padding: '0.45rem', marginTop: '0.25rem', border: '1px solid #cbd5e0', borderRadius: '4px' }}
                >
                  <option value="NACIONAL">Nacional</option>
                  <option value="PROVINCIAL">Provincial</option>
                  <option value="CANTONAL">Cantonal</option>
                </select>
              </label>
            </div>
            <label style={{ fontSize: '0.83rem', color: '#4a5568', display: 'flex', flexDirection: 'column' }}>
              Descripción / Objetivos del evento
              <textarea
                rows={2}
                placeholder="Detalle de actividades, participantes convocados y temas de salud comunitaria..."
                value={eventDesc}
                onChange={e => setEventDesc(e.target.value)}
                style={{ width: '100%', padding: '0.45rem', marginTop: '0.25rem', border: '1px solid #cbd5e0', borderRadius: '4px' }}
              />
            </label>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button type="button" onClick={() => setEventFormOpen(false)} style={{ padding: '0.4rem 0.9rem', borderRadius: '6px', border: '1px solid #cbd5e0', background: '#fff', cursor: 'pointer' }}>Cancelar</button>
              <button type="submit" disabled={eventSaving} className="kap-primary-action" style={{ padding: '0.4rem 1.1rem' }}>
                {eventSaving ? 'Guardando...' : 'Publicar evento'}
              </button>
            </div>
          </form>
        )}

        <AdminPanel icon="calendar" title={`Eventos registrados (${eventsList.length})`} subtitle="Cronograma de mingas y ferias institucionales">
          {eventsList.length === 0 ? (
            <EmptyState title="Sin eventos registrados" detail="Aún no se han programado eventos institucionales." illustration={communityEvents} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {eventsList.map(ev => (
                <div key={ev.id} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1rem', background: '#fafafa', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '8px', background: '#e6fffa', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <AdminIcon name="calendar" size={24} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <strong style={{ fontSize: '0.98rem', color: '#2d3748' }}>{ev.name}</strong>
                        {DEMO_EVENTS.has(ev.name) && <ValueBadge tone="gold">Ejemplo académico</ValueBadge>}
                        <ValueBadge>{ev.scope}</ValueBadge>
                      </div>
                      <p style={{ margin: '0.2rem 0', fontSize: '0.82rem', color: '#718096' }}>
                        📅 {ev.date} · 📍 {ev.province} {ev.canton ? `(${ev.canton})` : ''}
                      </p>
                      {ev.description && <p style={{ margin: '0.35rem 0 0', fontSize: '0.85rem', color: '#4a5568' }}>{ev.description}</p>}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteEvent(ev.id)}
                    style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem', border: '1px solid #feb2b2', background: '#fff5f5', color: '#c53030', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    Eliminar
                  </button>
                </div>
              ))}
            </div>
          )}
        </AdminPanel>
      </div>
    )}

    {tab === 'recursos' && (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#2d3748' }}>Biblioteca educativa del proyecto Kawsapacha</h3>
            <p style={{ margin: '2px 0 0', fontSize: '0.85rem', color: '#718096' }}>
              Guías, materiales y saberes compartidos para las comunidades dentro de la simulación académica.
            </p>
          </div>
          <button
            type="button"
            className="kap-primary-action"
            onClick={() => setResourceFormOpen(v => !v)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <AdminIcon name="plus" size={16} />
            {resourceFormOpen ? 'Cerrar formulario' : 'Publicar nuevo recurso'}
          </button>
        </div>

        {resMsg && <div style={{ padding: '0.75rem 1rem', background: '#f0fff4', border: '1px solid #9ae6b4', borderRadius: '8px', color: '#276749', fontWeight: 600 }}>{resMsg}</div>}
        {resError && <div style={{ padding: '0.75rem 1rem', background: '#fff5f5', border: '1px solid #feb2b2', borderRadius: '8px', color: '#c53030', fontWeight: 600 }}>{resError}</div>}

        {resourceFormOpen && (
          <form onSubmit={handleCreateResource} style={{ background: '#f7fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <h4 style={{ margin: 0, color: '#2d3748', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AdminIcon name="book" size={18} /> Publicar Nuevo Documento / Guía Técnica
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.85rem' }}>
              <label style={{ fontSize: '0.83rem', color: '#4a5568', display: 'flex', flexDirection: 'column' }}>
                Título del recurso *
                <input
                  required
                  placeholder="Ej: Manual de Bioinsumos y Abonos Orgánicos"
                  value={resTitle}
                  onChange={e => setResTitle(e.target.value)}
                  style={{ width: '100%', padding: '0.45rem', marginTop: '0.25rem', border: '1px solid #cbd5e0', borderRadius: '4px' }}
                />
              </label>
              <label style={{ fontSize: '0.83rem', color: '#4a5568', display: 'flex', flexDirection: 'column' }}>
                Tipo de material
                <select
                  value={resKind}
                  onChange={e => setResKind(e.target.value)}
                  style={{ width: '100%', padding: '0.45rem', marginTop: '0.25rem', border: '1px solid #cbd5e0', borderRadius: '4px' }}
                >
                  <option value="GUIA">Guía técnica</option>
                  <option value="MANUAL">Manual de campo</option>
                  <option value="FICHA">Ficha agroecológica</option>
                  <option value="VIDEO">Material multimedia</option>
                </select>
              </label>
              <label style={{ fontSize: '0.83rem', color: '#4a5568', display: 'flex', flexDirection: 'column' }}>
                Enlace al material (opcional; no sube archivos)
                <input
                  placeholder="https://msp.gob.ec/guias/ejemplo.pdf"
                  value={resUrl}
                  onChange={e => setResUrl(e.target.value)}
                  style={{ width: '100%', padding: '0.45rem', marginTop: '0.25rem', border: '1px solid #cbd5e0', borderRadius: '4px' }}
                />
              </label>
            </div>
            <label style={{ fontSize: '0.83rem', color: '#4a5568', display: 'flex', flexDirection: 'column' }}>
              Resumen pedagógico
              <textarea
                rows={2}
                placeholder="Síntesis de recomendaciones agroecológicas y beneficios para la salud de las familias..."
                value={resDesc}
                onChange={e => setResDesc(e.target.value)}
                style={{ width: '100%', padding: '0.45rem', marginTop: '0.25rem', border: '1px solid #cbd5e0', borderRadius: '4px' }}
              />
            </label>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button type="button" onClick={() => setResourceFormOpen(false)} style={{ padding: '0.4rem 0.9rem', borderRadius: '6px', border: '1px solid #cbd5e0', background: '#fff', cursor: 'pointer' }}>Cancelar</button>
              <button type="submit" disabled={resSaving} className="kap-primary-action" style={{ padding: '0.4rem 1.1rem' }}>
                {resSaving ? 'Publicando...' : 'Publicar en biblioteca'}
              </button>
            </div>
          </form>
        )}

        <AdminPanel icon="book" title={`Materiales educativos publicados (${resourcesList.length})`} subtitle="Repositorio técnico disponible para responsables y promotores">
          {resourcesList.length === 0 ? (
            <EmptyState title="Sin materiales registrados" detail="Aún no se han publicado recursos educativos." illustration={communityLearning} />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.85rem' }}>
              {resourcesList.map(res => (
                <div key={res.id} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1rem', background: '#fafafa', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: '8px', background: '#ebf8ff', color: '#2b6cb0' }}>
                        {res.kind}
                      </span>
                      <small style={{ color: '#a0aec0', fontSize: '0.75rem' }}>
                        {res.createdAt ? new Date(res.createdAt).toLocaleDateString('es-EC') : 'Vigente'}
                      </small>
                    </div>
                    <strong style={{ fontSize: '0.94rem', color: '#2d3748', display: 'block', marginBottom: '0.35rem' }}>
                      {res.title}
                    </strong>
                    {res.description && (
                      <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.84rem', color: '#4a5568', lineHeight: 1.4 }}>
                        {res.description}
                      </p>
                    )}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #edf2f7', paddingTop: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.78rem', color: '#276749', fontWeight: 600 }}>{DEMO_RESOURCES.has(res.title) ? 'Ejemplo académico · sin aval oficial' : 'Publicado desde el panel MSP del proyecto'}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {res.fileUrl && (
                        <a
                          href={res.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            fontSize: '0.78rem',
                            padding: '0.25rem 0.65rem',
                            background: '#2f855a',
                            color: '#ffffff',
                            borderRadius: '4px',
                            textDecoration: 'none',
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          📖 Leer guía ↗
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteResource(res.id)}
                        style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', border: '1px solid #feb2b2', background: '#fff5f5', color: '#c53030', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </AdminPanel>
      </div>
    )}

    {tab === 'moderacion' && (() => {
      const filteredComms = selectedCommunityFilter
        ? pendingComms.filter((c: any) => c.id === selectedCommunityFilter)
        : pendingComms
      const filteredActs = activitiesForReview.filter((a: any) =>
        (!selectedCommunityFilter || a.garden?.communityId === selectedCommunityFilter) &&
        (reviewStatusFilter === 'ALL' || (reviewStatusFilter === 'UNAUDITED' ? (a.reviewStatus === 'APPROVED' && !a.reviewedAt) : a.reviewStatus === reviewStatusFilter))
      )
      const pendingCount = activitiesForReview.filter((a: any) => (a.reviewStatus === 'APPROVED' && !a.reviewedAt) || a.reviewStatus === 'PENDING' || a.reviewStatus === 'NEEDS_CHANGES').length

      return (
        <div className="kap-moderation-grid">
          {/* Mensajes globales de moderación */}
          {modMsg && <div style={{ gridColumn: '1/-1', padding: '0.75rem 1rem', background: '#f0fff4', border: '1px solid #9ae6b4', borderRadius: '8px', color: '#276749', fontWeight: 600, marginBottom: '0.5rem' }}>{modMsg}</div>}
          {modError && <div style={{ gridColumn: '1/-1', padding: '0.75rem 1rem', background: '#fff5f5', border: '1px solid #feb2b2', borderRadius: '8px', color: '#c53030', fontWeight: 600, marginBottom: '0.5rem' }}>{modError}</div>}

          {/* Selector de filtro por comunidad */}
          <div style={{
            gridColumn: '1/-1',
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '0.85rem 1.15rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <AdminIcon name="users" size={18} />
              <label htmlFor="msp-comm-filter" style={{ fontSize: '0.88rem', fontWeight: 600, color: '#2d3748' }}>
                Filtrar historial por comunidad:
              </label>
              <select
                id="msp-comm-filter"
                value={selectedCommunityFilter}
                onChange={e => setSelectedCommunityFilter(e.target.value)}
                style={{
                  padding: '0.4rem 0.75rem',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e0',
                  fontSize: '0.88rem',
                  color: '#2d3748',
                  background: '#fff',
                  minWidth: '240px'
                }}
              >
                <option value="">Todas las comunidades ({pendingCount} sin auditoría)</option>
                {allCommunities.map((c: any) => {
                  const commPending = (c.status === 'PENDING' ? 1 : 0) + activitiesForReview.filter((a: any) => a.garden?.communityId === c.id && ((a.reviewStatus === 'APPROVED' && !a.reviewedAt) || a.reviewStatus === 'PENDING' || a.reviewStatus === 'NEEDS_CHANGES')).length
                  return (
                    <option key={c.id} value={c.id}>
                      {c.name} {commPending > 0 ? `(${commPending} pendientes)` : ''}
                    </option>
                  )
                })}
              </select>
            </div>
            {selectedCommunityFilter && (
              <button
                type="button"
                onClick={() => setSelectedCommunityFilter('')}
                style={{
                  padding: '0.35rem 0.75rem',
                  fontSize: '0.8rem',
                  border: '1px solid #cbd5e0',
                  borderRadius: '4px',
                  background: '#f7fafc',
                  cursor: 'pointer',
                  color: '#4a5568'
                }}
              >
                ✕ Limpiar filtro
              </button>
            )}
          </div>

          <label style={{ gridColumn: '1/-1', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
            Estado de actividades
            <select aria-label="Filtrar actividades por estado MSP" value={reviewStatusFilter} onChange={e => setReviewStatusFilter(e.target.value)}
              style={{ padding: '0.4rem 0.7rem', borderRadius: '6px', border: '1px solid #cbd5e0' }}>
              <option value="ALL">Todo el historial</option>
              <option value="UNAUDITED">Válidas sin auditoría MSP</option>
              <option value="PENDING">Pendientes heredadas</option>
              <option value="NEEDS_CHANGES">Requieren corrección</option>
              <option value="APPROVED">Válidas (con o sin auditoría)</option>
              <option value="REJECTED">Invalidadas</option>
            </select>
          </label>

          {/* Comunidades pendientes */}
          <AdminPanel title={`Comunidades pendientes de revisión (${filteredComms.length})`} icon="users" action={<button className="kap-icon-button" type="button" onClick={loadModeration} title="Recargar" aria-label="Recargar"><AdminIcon name="refresh" size={17}/></button>}>
            {modLoading ? <p style={{ padding: '1rem', color: '#718096' }}>Cargando…</p> : filteredComms.length === 0 ? (
              <EmptyState title="Sin comunidades pendientes" detail={selectedCommunityFilter ? "Esta comunidad no tiene revisiones de creación pendientes." : "Todas las comunidades han sido revisadas."}/>
            ) : (
              <div className="kap-table-scroll"><table className="kap-table"><thead><tr><th>Comunidad</th><th>Provincia</th><th>Responsable</th><th>Acciones</th></tr></thead><tbody>
                {filteredComms.map((c: any) => <tr key={c.id}>
                  <td><strong>{c.name}</strong></td>
                  <td>{c.province || '—'}</td>
                  <td>{c.responsible || c.creator?.name || '—'}</td>
                  <td style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                    <button type="button" onClick={() => handleReviewCommunity(c.id, 'APPROVED')} style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem', borderRadius: '4px', border: 'none', background: '#276749', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>✓ Aprobar</button>
                    <button type="button" onClick={() => openReasonModal('community', c.id, 'NEEDS_CHANGES')} style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem', borderRadius: '4px', border: '1px solid #d69e2e', background: '#fffff0', color: '#744210', cursor: 'pointer' }}>✏️ Correcciones</button>
                    <button type="button" onClick={() => openReasonModal('community', c.id, 'REJECTED')} style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem', borderRadius: '4px', border: '1px solid #c53030', background: '#fff5f5', color: '#c53030', cursor: 'pointer' }}>✗ Rechazar</button>
                  </td>
                </tr>)}
              </tbody></table></div>
            )}
          </AdminPanel>

          {/* Historial completo de evidencias agrícolas: los registros nuevos son válidos automáticamente. */}
          <AdminPanel title={`Historial de actividades (${filteredActs.length})`} icon="image" action={<button className="kap-icon-button" type="button" onClick={loadModeration} title="Recargar" aria-label="Recargar"><AdminIcon name="refresh" size={17}/></button>}>
            {modLoading ? <p style={{ padding: '1rem', color: '#718096' }}>Cargando…</p> : filteredActs.length === 0 ? (
              <EmptyState title="Sin actividades en este filtro" detail="Prueba con otro estado o comunidad." illustration={communityForum}/>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {filteredActs.map((a: any) => {
                  const photoUrl = a.evidences?.[0]?.fileUrl ? (a.evidences[0].fileUrl.startsWith('http') ? a.evidences[0].fileUrl : a.evidences[0].fileUrl) : null
                  return <div key={a.id} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.85rem', display: 'flex', gap: '0.85rem', alignItems: 'flex-start', background: '#fafafa' }}>
                    {photoUrl ? (
                      <img src={photoUrl} alt="Evidencia" style={{ width: '72px', height: '72px', objectFit: 'cover', borderRadius: '6px', flexShrink: 0, border: '1px solid #e2e8f0' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}/>
                    ) : (
                      <div style={{ width: '72px', height: '72px', background: '#e2e8f0', borderRadius: '6px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><AdminIcon name="image" size={28}/></div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.3rem' }}>
                        <strong style={{ fontSize: '0.92rem', color: '#2d3748', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <span>{formatActivityType(a.type)}</span>
                          <span style={{ color: '#718096', fontWeight: 400 }}>· {a.garden?.name || 'Huerto'}</span>
                          {a.plant?.customName || a.plant?.species?.name ? (
                            <span style={{ color: '#2b6cb0', fontSize: '0.82rem', fontWeight: 600 }}>({a.plant.customName || a.plant.species.name})</span>
                          ) : a.plotIndex !== null && a.plotIndex !== undefined ? (
                            <span style={{ color: '#4a5568', fontSize: '0.82rem', fontWeight: 500 }}>(Parcela #{a.plotIndex + 1})</span>
                          ) : null}
                        </strong>
                        <ValueBadge tone={a.reviewStatus === 'APPROVED' ? 'green' : a.reviewStatus === 'REJECTED' ? 'red' : 'gold'}>{a.reviewStatus === 'APPROVED' ? (a.reviewedAt ? 'Comprobada MSP' : 'Válida · Sin auditoría') : a.reviewStatus === 'REJECTED' ? 'Invalidada' : a.reviewStatus === 'NEEDS_CHANGES' ? 'Requiere correcciones' : 'Pendiente'}</ValueBadge>
                      </div>
                      <p style={{ margin: '0.2rem 0 0.1rem', fontSize: '0.8rem', color: '#718096' }}>
                        <AdminIcon name="users" size={13}/> {a.actorUser?.name || '—'} · {a.performedDate ? new Date(a.performedDate).toLocaleDateString('es-EC') : '—'}
                      </p>
                      {a.notes && <p style={{ margin: '0.1rem 0 0.5rem', fontSize: '0.8rem', color: '#4a5568', fontStyle: 'italic' }}>"{a.notes}"</p>}
                      <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                        {(a.reviewStatus === 'PENDING' || a.reviewStatus === 'NEEDS_CHANGES' || (a.reviewStatus === 'APPROVED' && !a.reviewedAt)) && <button type="button" onClick={() => handleReviewActivity(a.id, 'APPROVED')} style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem', borderRadius: '4px', border: 'none', background: '#276749', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>✓ Verificar</button>}
                        {a.reviewStatus !== 'REJECTED' && <button type="button" onClick={() => openReasonModal('activity', a.id, 'NEEDS_CHANGES')} style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem', borderRadius: '4px', border: '1px solid #d69e2e', background: '#fffff0', color: '#744210', cursor: 'pointer' }}>✏️ Pedir corrección</button>}
                        {a.reviewStatus !== 'REJECTED' && <button type="button" onClick={() => openReasonModal('activity', a.id, 'REJECTED')} style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem', borderRadius: '4px', border: '1px solid #c53030', background: '#fff5f5', color: '#c53030', cursor: 'pointer' }}>✗ Invalidar</button>}
                      </div>
                    </div>
                  </div>
                })}
              </div>
            )}
          </AdminPanel>
        </div>
      )
    })()}

    {tab === 'reportes' && <>
      <AdminPanel icon="chart" title="Indicadores y reportes" subtitle="Datos agregados de comunidades, actividades, eventos y recursos registrados en SQLite">
        <div className="kap-metrics" style={{ marginTop: '0.5rem' }}>
          <AdminMetric icon="users" label="Total comunidades" value={data?.communitiesTotal}/>
          <AdminMetric icon="shield" label="Comunidades aprobadas" value={data?.communitiesApproved} tone="green"/>
          <AdminMetric icon="alert" label="Pendientes de revisión" value={data?.moderationPending} tone="red"/>
          <AdminMetric icon="image" label="Actividades registradas" value={data?.activities?.length} tone="brown"/>
        </div>
        <p className="kap-table-note">Indicadores académicos de Kawsapacha. No son estadísticas oficiales del Ministerio de Salud Pública.</p>
      </AdminPanel>
      <div className="kap-detail-layout">
        {reportGroups.map(group => <AdminPanel key={group.title} title={group.title} icon={group.icon}>
          {group.rows.length ? <div className="kap-table-scroll"><table className="kap-table"><thead><tr><th>Categoría</th><th>Registros</th></tr></thead><tbody>
            {group.rows.map(([label, count]) => <tr key={label}><td>{label}</td><td><FormattedCount value={count}/></td></tr>)}
          </tbody></table></div> : <EmptyState title="Sin datos registrados" detail="No hay registros para este indicador."/>}
        </AdminPanel>)}
      </div>
    </>}
  </>
}

