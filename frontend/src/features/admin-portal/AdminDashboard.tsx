import { useCallback, useEffect, useState, type ReactNode, type ChangeEvent, type FormEvent } from 'react'
import AdminIcon, { type AdminIconName } from './AdminIcon'
import AdminMap from './AdminMap'
import type {
  AdminNavKey, AdminPanelKind, MspDashboardData, TechDashboardData,
  SystemHealth, CommunityRow, AdminUserRow, AuditRow,
} from './admin-types'
import { adminApi } from '../../services/api'
import brandLogo from './assets/kawsapacha-marca.svg'
import ecuadorInsignia from './assets/ecuador-insignia.svg'
import communityLearning from '../communities/assets/aprender-v2.jpg'
import communityEvents from '../communities/assets/eventos-v2.jpg'
import communityForum from '../communities/assets/foro-v2.jpg'
import './admin-portal.css'

const MSP_NAV: { key: AdminNavKey; label: string; icon: AdminIconName }[] = [
  { key: 'inicio', label: 'Resumen', icon: 'home' },
  { key: 'comunidades', label: 'Comunidades', icon: 'users' },
  { key: 'eventos', label: 'Eventos', icon: 'calendar' },
  { key: 'recursos', label: 'Recursos educativos', icon: 'book' },
  { key: 'moderacion', label: 'Moderación', icon: 'shield' },
  { key: 'reportes', label: 'Reportes', icon: 'chart' },
]
const TECH_NAV: { key: AdminNavKey; label: string; icon: AdminIconName }[] = [
  { key: 'inicio', label: 'Resumen', icon: 'home' },
  { key: 'usuarios', label: 'Usuarios y roles', icon: 'users' },
  { key: 'configuracion', label: 'Configuración y sistema', icon: 'settings' },
  { key: 'auditoria', label: 'Registro de actividad', icon: 'clipboard' },
]

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
function FormattedCount({ value, suffix = '' }: { value?: number; suffix?: string }) {
  return <>{typeof value === 'number' ? value.toLocaleString('es-EC') + suffix : '—'}</>
}
function AdminMetric({ icon, label, value, tone = 'green', note }: {
  icon: AdminIconName; label: string; value?: number; tone?: 'green' | 'gold' | 'brown' | 'red'; note?: string
}) {
  return <article className={`kap-metric kap-metric-${tone}`}>
    <div className="kap-metric-icon"><AdminIcon name={icon} size={29}/></div>
    <div className="kap-metric-body"><span>{label}</span><strong><FormattedCount value={value}/></strong><small>{typeof value === 'number' ? (note ?? 'Datos del servidor') : 'Pendiente de sincronización'}</small></div>
  </article>
}
function AdminPanel({ title, subtitle, icon, children, action, className = '' }: {
  title: string; subtitle?: string; icon: AdminIconName; children: ReactNode; action?: ReactNode; className?: string
}) {
  return <section className={`kap-panel ${className}`}>
    <header className="kap-panel-head">
      <span className="kap-panel-icon"><AdminIcon name={icon} size={22}/></span>
      <div className="kap-panel-title"><h3>{title}</h3>{subtitle && <p>{subtitle}</p>}</div>
      {action && <div className="kap-panel-action">{action}</div>}
    </header>
    {children}
  </section>
}
function ActionLink({ children, onClick, icon = 'arrow' }: { children: ReactNode; onClick: () => void; icon?: AdminIconName }) {
  return <button className="kap-outline-action" type="button" onClick={onClick}>{children}<AdminIcon name={icon} size={15}/></button>
}
function EmptyState({ title, detail, illustration }: { title: string; detail?: string; illustration?: string }) {
  return <div className="kap-empty">
    {illustration && <img className="kap-empty-image" src={illustration} alt="" loading="lazy"/>}
    <div className="kap-empty-text"><AdminIcon name="leaf" size={25}/><strong>{title}</strong>{detail && <p>{detail}</p>}</div>
  </div>
}
function ValueBadge({ children, tone }: { children: ReactNode; tone?: 'green' | 'red' | 'gold' | 'blue' | 'purple' | 'gray' }) {
  const toneStyles: Record<string, { color: string; background: string; border?: string }> = {
    green: { color: '#22543d', background: '#c6f6d5', border: '1px solid #9ae6b4' },
    red: { color: '#742a2a', background: '#fed7d7', border: '1px solid #feb2b2' },
    gold: { color: '#744210', background: '#feebc8', border: '1px solid #fbd38d' },
    blue: { color: '#2a4365', background: '#bee3f8', border: '1px solid #90cdf4' },
    purple: { color: '#44337a', background: '#e9d8fd', border: '1px solid #d6bcfa' },
    gray: { color: '#4a5568', background: '#edf2f7', border: '1px solid #cbd5e0' },
  }
  const style = tone && toneStyles[tone] ? toneStyles[tone] : undefined
  return <span className="kap-status-pill" style={style}>{children}</span>
}
function NavList({ kind, selected, onSelect, onClose }: { kind: AdminPanelKind; selected: AdminNavKey; onSelect: (next: AdminNavKey) => void; onClose: () => void }) {
  const navigation = kind === 'msp' ? MSP_NAV : TECH_NAV
  return <nav className="kap-nav" aria-label="Navegación administrativa">
    {navigation.map(item => <button key={item.key} type="button" className={`kap-nav-item${selected === item.key ? ' is-active' : ''}`}
      aria-current={selected === item.key ? 'page' : undefined} onClick={() => { onSelect(item.key); onClose() }}>
      <AdminIcon name={item.icon} size={18}/><span>{item.label}</span>
    </button>)}
  </nav>
}
function SectionHead({ title, subtitle, onBack }: { title: string; subtitle: string; onBack: () => void }) {
  return <div className="kap-section-heading"><div><h2>{title}</h2><p>{subtitle}</p></div><ActionLink icon="home" onClick={onBack}>Volver al resumen</ActionLink></div>
}
function MspHome({ data, setTab }: { data?: MspDashboardData; setTab: (next: AdminNavKey) => void }) {
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
function MspDetail({ tab, data, setTab, onRefresh }: { tab: AdminNavKey; data?: MspDashboardData; setTab: (next: AdminNavKey) => void; onRefresh?: () => void }) {
  const [query, setQuery] = useState('')
  const [province, setProvince] = useState('')
  // Moderación: comunidades pendientes
  const [allCommunities, setAllCommunities] = useState<any[]>([])
  const [selectedCommunityFilter, setSelectedCommunityFilter] = useState('')
  const [pendingComms, setPendingComms] = useState<any[]>([])
  const [pendingActs, setPendingActs] = useState<any[]>([])
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
      setPendingActs((actRes.activities || []).filter((a: any) => a.reviewStatus === 'PENDING' || a.reviewStatus === 'NEEDS_CHANGES'))
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
      const pts = res.reward?.pointsAwarded
      setModMsg(`✓ Actividad ${action === 'APPROVED' ? `aprobada${pts ? ` (+${pts} Semillas)` : ''}` : action === 'NEEDS_CHANGES' ? 'requiere correcciones' : 'rechazada'} correctamente.`)
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
      const filteredActs = selectedCommunityFilter
        ? pendingActs.filter((a: any) => a.garden?.communityId === selectedCommunityFilter)
        : pendingActs

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
                Filtrar solicitudes por comunidad:
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
                <option value="">Todas las comunidades ({pendingComms.length + pendingActs.length} pendientes)</option>
                {allCommunities.map((c: any) => {
                  const commPending = (c.status === 'PENDING' ? 1 : 0) + pendingActs.filter((a: any) => a.garden?.communityId === c.id).length
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

          {/* Evidencias fotográficas pendientes */}
          <AdminPanel title={`Siembras y actividades por revisar (${filteredActs.length})`} icon="image" action={<button className="kap-icon-button" type="button" onClick={loadModeration} title="Recargar" aria-label="Recargar"><AdminIcon name="refresh" size={17}/></button>}>
            {modLoading ? <p style={{ padding: '1rem', color: '#718096' }}>Cargando…</p> : filteredActs.length === 0 ? (
              <EmptyState title="Sin actividades pendientes" detail={selectedCommunityFilter ? "Esta comunidad no tiene siembras ni actividades pendientes de revisión." : "Todas las siembras y actividades han sido revisadas."} illustration={communityForum}/>
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
                        <ValueBadge tone="gold">{a.reviewStatus === 'NEEDS_CHANGES' ? 'Requiere correcciones' : 'Pendiente de revisión'}</ValueBadge>
                      </div>
                      <p style={{ margin: '0.2rem 0 0.1rem', fontSize: '0.8rem', color: '#718096' }}>
                        <AdminIcon name="users" size={13}/> {a.actorUser?.name || '—'} · {a.performedDate ? new Date(a.performedDate).toLocaleDateString('es-EC') : '—'}
                      </p>
                      {a.notes && <p style={{ margin: '0.1rem 0 0.5rem', fontSize: '0.8rem', color: '#4a5568', fontStyle: 'italic' }}>"{a.notes}"</p>}
                      <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                        <button type="button" onClick={() => handleReviewActivity(a.id, 'APPROVED')} style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem', borderRadius: '4px', border: 'none', background: '#276749', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>✓ Aprobar</button>
                        <button type="button" onClick={() => openReasonModal('activity', a.id, 'NEEDS_CHANGES')} style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem', borderRadius: '4px', border: '1px solid #d69e2e', background: '#fffff0', color: '#744210', cursor: 'pointer' }}>✏️ Pedir corrección</button>
                        <button type="button" onClick={() => openReasonModal('activity', a.id, 'REJECTED')} style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem', borderRadius: '4px', border: '1px solid #c53030', background: '#fff5f5', color: '#c53030', cursor: 'pointer' }}>✗ Rechazar</button>
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
function stateLabel(c: CommunityRow) {
  const map: Record<CommunityRow['state'], string> = {
    PENDING: 'Pendiente',
    APPROVED: 'Verificada',
    NEEDS_CHANGES: 'Requiere correcciones',
    REJECTED: 'Rechazada',
    SUSPENDED: 'Suspendida',
  }
  return map[c.state] || c.state
}

export const ACTIVITY_TYPE_MAP: Record<string, { label: string; icon: string }> = {
  preparation: { label: 'Preparación del terreno', icon: '🪵' },
  watering: { label: 'Riego', icon: '💧' },
  fertilizing: { label: 'Abonado orgánico', icon: '🌾' },
  weeding: { label: 'Limpieza y mantenimiento', icon: '🍃' },
  hilling: { label: 'Aporque', icon: '🪴' },
  harvest: { label: 'Cosecha', icon: '🌿' },
  sowing: { label: 'Siembra', icon: '🌱' },
  replanting: { label: 'Trasplante o resiembra', icon: '🔄' },
  observation: { label: 'Observación botánica', icon: '📷' },
}

export function formatActivityType(type: string): string {
  const item = ACTIVITY_TYPE_MAP[type]
  return item ? `${item.icon} ${item.label}` : type
}

const AUDIT_ACTION_MAP: Record<string, { label: string; tone: 'green' | 'red' | 'gold' | 'blue' | 'purple' | 'gray' }> = {
  ACTIVITY_APPROVED: { label: 'Aprobación de actividad', tone: 'green' },
  ACTIVITY_REJECTED: { label: 'Rechazo de actividad', tone: 'red' },
  ACTIVITY_NEEDS_CHANGES: { label: 'Corrección de actividad solicitada', tone: 'gold' },
  COMMUNITY_APPROVED: { label: 'Aprobación de comunidad', tone: 'green' },
  COMMUNITY_REJECTED: { label: 'Rechazo de comunidad', tone: 'red' },
  COMMUNITY_NEEDS_CHANGES: { label: 'Corrección de comunidad solicitada', tone: 'gold' },
  PROVISION_MSP: { label: 'Creación de funcionario MSP', tone: 'blue' },
  USER_STATUS_CHANGE: { label: 'Cambio de estado de usuario', tone: 'purple' },
  LOGIN: { label: 'Inicio de sesión', tone: 'blue' },
  LOGOUT: { label: 'Cierre de sesión', tone: 'gray' },
}

export function formatAuditAction(action: string): { label: string; tone?: 'green' | 'red' | 'gold' | 'blue' | 'purple' | 'gray' } {
  if (AUDIT_ACTION_MAP[action]) {
    return AUDIT_ACTION_MAP[action]
  }
  const clean = action.replace(/_/g, ' ').toLowerCase()
  return {
    label: clean.charAt(0).toUpperCase() + clean.slice(1),
    tone: 'gray',
  }
}

export function roleLabel(role: string): string {
  const map: Record<string, string> = {
    ADMIN_TECNICO: 'Admin Técnico',
    ADMIN_MSP: 'Funcionario MSP',
    USUARIO: 'Agricultor / Usuario',
    PARTICIPANTE: 'Participante',
    RESPONSABLE: 'Responsable',
  }
  return map[role] || role
}

const DETAIL_KEY_MAP: Record<string, string> = {
  reason: 'Motivo',
  pointsAwarded: 'Puntos otorgados',
  totalPoints: 'Puntos totales',
  level: 'Nivel',
  userEmail: 'Correo',
  email: 'Correo',
  userName: 'Nombre',
  name: 'Nombre',
  role: 'Rol',
  previousStatus: 'Estado previo',
  newStatus: 'Nuevo estado',
  creator: 'Creador',
  action: 'Acción',
  scope: 'Alcance',
  date: 'Fecha',
  status: 'Estado',
}

const DETAIL_VAL_MAP: Record<string, string> = {
  ACTIVE: 'Activo',
  INACTIVE: 'Inactivo',
  APPROVED: 'Aprobado',
  REJECTED: 'Rechazado',
  NEEDS_CHANGES: 'Requiere correcciones',
  PENDING: 'Pendiente',
  ADMIN_TECNICO: 'Admin Técnico',
  ADMIN_MSP: 'Funcionario MSP',
  USUARIO: 'Agricultor / Usuario',
  RESPONSABLE: 'Responsable',
  PARTICIPANTE: 'Participante',
}

const RESOURCE_MAP: Record<string, string> = {
  activity: 'Actividad',
  community: 'Comunidad',
  user: 'Usuario',
  garden: 'Huerto',
  plant: 'Planta',
}

function translateValue(val: unknown): string {
  if (val === null || val === undefined) return '—'
  if (typeof val === 'boolean') return val ? 'Sí' : 'No'
  if (typeof val === 'string' && DETAIL_VAL_MAP[val]) return DETAIL_VAL_MAP[val]
  if (typeof val === 'object') return JSON.stringify(val)
  return String(val)
}

function formatAuditDetail(detail: unknown, resource?: string, targetId?: string): string {
  const resourceLabel = resource && RESOURCE_MAP[resource.toLowerCase()] ? RESOURCE_MAP[resource.toLowerCase()] : resource
  if (!detail) return `${resourceLabel || ''} ${targetId || ''}`.trim() || '—'

  let parsed: unknown = detail
  if (typeof detail === 'string') {
    try {
      parsed = JSON.parse(detail)
    } catch {
      return detail
    }
  }

  if (typeof parsed === 'object' && parsed !== null) {
    const entries = Object.entries(parsed as Record<string, unknown>)
      .map(([k, v]) => {
        const keyLabel = DETAIL_KEY_MAP[k] || k
        const valLabel = translateValue(v)
        return `${keyLabel}: ${valLabel}`
      })
    return entries.join(' · ')
  }

  return translateValue(detail)
}
function ServiceStatus({ label, state, detail, icon }: { label: string; state: 'online' | 'offline' | 'unknown'; detail?: string; icon: AdminIconName }) {
  return <div className="kap-service-row"><AdminIcon name={icon} size={22}/><strong>{label}</strong><span className={`kap-service-status status-${state}`}><span className="kap-status-dot"/>{state === 'online' ? 'Operativo' : state === 'offline' ? 'No disponible' : 'Sin comprobar'}</span>{detail && <small>{detail}</small>}</div>
}
function TechnicalHome({ data, health, setTab, onRefresh }: { data?: TechDashboardData; health: SystemHealth; setTab: (tab: AdminNavKey) => void; onRefresh: () => void }) {
  return <>
    <div className="kap-section-heading"><div><h2>Administrador técnico</h2><p>Gestión, seguridad y operación de la plataforma Kawsapacha</p></div><span className="kap-info-chip"><AdminIcon name="lock" size={14}/> Acceso administrativo</span></div>
    <div className="kap-metrics">
      <AdminMetric icon="users" label="Usuarios registrados" value={data?.accountsTotal}/>
      <AdminMetric icon="shield" label="Roles activos" value={data?.rolesTotal} tone="gold"/>
      <AdminMetric icon="server" label="Servicios operativos" value={health.api === 'online' ? 1 : undefined} tone="brown" note="API comprobada"/>
      <AdminMetric icon="alert" label="Eventos de auditoría" value={data?.auditEvents} tone="red"/>
    </div>
    <div className="kap-tech-primary-grid">
      <AdminPanel icon="users" title="Usuarios y roles" subtitle="Administración de cuentas y permisos" action={<ActionLink onClick={() => setTab('usuarios')}>Ver usuarios</ActionLink>}>
        <div className="kap-table-scroll"><table className="kap-table"><thead><tr><th>Usuario</th><th>Correo</th><th>Rol</th><th>Estado</th></tr></thead><tbody>
          {data?.users?.length ? data.users.slice(0, 4).map(user => <tr key={user.id}><td>{user.name}</td><td>{user.email}</td><td><ValueBadge tone="blue">{roleLabel(user.role)}</ValueBadge></td><td>{user.active ? 'Activo' : 'Inactivo'}</td></tr>) : <tr><td colSpan={4} className="kap-no-rows">Sin cuentas sincronizadas con el servidor.</td></tr>}
        </tbody></table></div>
        <div className="kap-table-note"><AdminIcon name="info" size={15}/> Solo el servidor puede crear administradores y asignar permisos.</div>
      </AdminPanel>
      <AdminPanel icon="server" title="Estado del sistema" subtitle="Salud y disponibilidad de los componentes críticos" action={<button className="kap-icon-button" type="button" onClick={onRefresh} title="Comprobar nuevamente" aria-label="Comprobar servicios"><AdminIcon name="refresh" size={18}/></button>}>
        <div className="kap-services">
          <ServiceStatus label="Backend (API)" state={health.api} icon="server"/>
          <ServiceStatus label="Base de datos" state={health.database} icon="database"/>
          <ServiceStatus label="Almacenamiento" state="unknown" icon="file" detail="Sin API de monitoreo"/>
          <ServiceStatus label="Respaldos" state="unknown" icon="refresh" detail="Sin API de monitoreo"/>
        </div>
      </AdminPanel>
    </div>
    <div className="kap-tech-secondary-grid">
      <button type="button" className="kap-link-card" onClick={() => setTab('configuracion')}><span className="kap-card-icon"><AdminIcon name="settings" size={28}/></span><div><h3>Configuración y sistema</h3><p>Seguridad, respaldos y estado de los servicios</p></div><AdminIcon name="right" size={20}/></button>
      <button type="button" className="kap-link-card" onClick={() => setTab('auditoria')}><span className="kap-card-icon"><AdminIcon name="clipboard" size={28}/></span><div><h3>Registro de actividad</h3><p>Bitácora de accesos, cambios y eventos del sistema</p></div><AdminIcon name="right" size={20}/></button>
    </div>
  </>
}
function TechnicalDetail({ tab, data, health, setTab, onRefresh }: { tab: AdminNavKey; data?: TechDashboardData; health: SystemHealth; setTab: (next: AdminNavKey) => void; onRefresh: () => void }) {
  const [mspName, setMspName] = useState('')
  const [mspEmail, setMspEmail] = useState('')
  const [mspPassword, setMspPassword] = useState('')
  const [creating, setCreating] = useState(false)
  const [actionMsg, setActionMsg] = useState('')
  const [actionError, setActionError] = useState('')

  const handleCreateMsp = async (e: FormEvent) => {
    e.preventDefault()
    if (!mspName.trim() || !mspEmail.trim() || !mspPassword.trim()) return
    setCreating(true)
    setActionMsg('')
    setActionError('')
    try {
      const user = await adminApi.createMspUser({ name: mspName.trim(), email: mspEmail.trim().toLowerCase(), password: mspPassword })
      setActionMsg(`✓ Funcionario MSP creado exitosamente: ${user.name} (${user.email}). Ya puede iniciar sesión.`)
      setMspName('')
      setMspEmail('')
      setMspPassword('')
      onRefresh()
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Error al crear cuenta MSP')
    } finally {
      setCreating(false)
    }
  }

  const handleToggle = async (userId: string, currentActive: boolean) => {
    setActionMsg('')
    setActionError('')
    try {
      const updated = await adminApi.toggleUserStatus(userId, !currentActive)
      setActionMsg(`✓ Estado actualizado: usuario ${updated.email} ${updated.isActive ? 'activado' : 'desactivado'}.`)
      onRefresh()
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Error al cambiar estado')
    }
  }

  const definitions: Record<string, { title: string; subtitle: string; icon: AdminIconName }> = {
    usuarios: { title: 'Usuarios y roles', subtitle: 'Todas las cuentas del sistema: funcionarios MSP, administradores técnicos y usuarios de comunidades.', icon: 'users' },
    configuracion: { title: 'Configuración y sistema', subtitle: 'Seguridad, respaldos y estado de los servicios.', icon: 'settings' },
    auditoria: { title: 'Registro de actividad', subtitle: 'Trazabilidad de acciones administrativas.', icon: 'clipboard' },
  }
  const d = definitions[tab] ?? definitions.usuarios
  return <>
    <SectionHead title={d.title} subtitle={d.subtitle} onBack={() => setTab('inicio')}/>
    <AdminPanel title={d.title} subtitle={d.subtitle} icon={d.icon}>
      {tab === 'usuarios' && <>
        <div style={{ marginBottom: '1.25rem', padding: '1rem', background: '#f7fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
          <h4 style={{ margin: '0 0 0.35rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#2d3748' }}>
            <AdminIcon name="shield" size={18}/> Aprovisionar Nuevo Funcionario del MSP
          </h4>
          <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.85rem', color: '#718096' }}>
            Como Administrador Técnico, registra las cuentas institucionales del Ministerio de Salud Pública con rol global <strong>ADMIN_MSP</strong>.
          </p>
          <form onSubmit={handleCreateMsp} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', alignItems: 'end' }}>
            <label style={{ fontSize: '0.82rem', color: '#4a5568', display: 'flex', flexDirection: 'column' }}>
              Nombre completo
              <input required style={{ width: '100%', padding: '0.45rem', marginTop: '0.25rem', border: '1px solid #cbd5e0', borderRadius: '4px' }}
                placeholder="Ej: Dra. María López" value={mspName} onChange={e => setMspName(e.target.value)} />
            </label>
            <label style={{ fontSize: '0.82rem', color: '#4a5568', display: 'flex', flexDirection: 'column' }}>
              Correo electrónico
              <input type="email" required style={{ width: '100%', padding: '0.45rem', marginTop: '0.25rem', border: '1px solid #cbd5e0', borderRadius: '4px' }}
                placeholder="msp@kawsapacha.gob.ec" value={mspEmail} onChange={e => setMspEmail(e.target.value)} />
            </label>
            <label style={{ fontSize: '0.82rem', color: '#4a5568', display: 'flex', flexDirection: 'column' }}>
              Contraseña inicial
              <input type="password" required style={{ width: '100%', padding: '0.45rem', marginTop: '0.25rem', border: '1px solid #cbd5e0', borderRadius: '4px' }}
                placeholder="Password123" value={mspPassword} onChange={e => setMspPassword(e.target.value)} />
            </label>
            <button type="submit" disabled={creating} className="kap-primary-action" style={{ height: '36px', padding: '0 1rem' }}>
              <AdminIcon name="plus" size={16}/> {creating ? 'Creando…' : 'Crear cuenta MSP'}
            </button>
          </form>
          {actionMsg && <p style={{ margin: '0.75rem 0 0 0', color: '#276749', fontSize: '0.85rem', fontWeight: 600 }}>{actionMsg}</p>}
          {actionError && <p style={{ margin: '0.75rem 0 0 0', color: '#c53030', fontSize: '0.85rem', fontWeight: 600 }}>{actionError}</p>}
        </div>

        <div className="kap-table-scroll"><table className="kap-table"><thead><tr><th>Nombre</th><th>Correo</th><th>Rol global</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>
          {data?.users?.length ? data.users.map((user: AdminUserRow) => <tr key={user.id}>
            <td>{user.name}</td>
            <td>{user.email}</td>
            <td><ValueBadge tone="blue">{roleLabel(user.role)}</ValueBadge></td>
            <td><span style={{ color: user.active ? '#276749' : '#c53030', fontWeight: 600 }}>{user.active ? 'Activo' : 'Inactivo'}</span></td>
            <td>
              {user.role !== 'ADMIN_TECNICO' ? (
                <button
                  type="button"
                  onClick={() => handleToggle(user.id, user.active)}
                  style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', cursor: 'pointer', borderRadius: '4px', border: '1px solid #cbd5e0', background: user.active ? '#fff5f5' : '#f0fff4', color: user.active ? '#c53030' : '#276749' }}
                >
                  {user.active ? 'Desactivar' : 'Activar'}
                </button>
              ) : (
                <small style={{ color: '#a0aec0' }}>Protegido</small>
              )}
            </td>
          </tr>) : <tr><td colSpan={5} className="kap-no-rows">No hay usuarios sincronizados.</td></tr>}
        </tbody></table></div>
      </>}
      {tab === 'configuracion' && <>
        <div className="kap-detail-note"><AdminIcon name="lock" size={19}/> Las opciones de seguridad, parámetros y respaldos están configuradas con verificación en tiempo real del backend.</div>
        <div className="kap-services">
          <ServiceStatus label="Backend (API)" state={health.api} icon="server"/>
          <ServiceStatus label="Base de datos" state={health.database} icon="database"/>
          <ServiceStatus label="Almacenamiento de fotografías" state="online" icon="image" detail="Directorio persistente /uploads"/>
          <ServiceStatus label="Copias de respaldo" state="unknown" icon="refresh" detail="Configuración automática SQLite"/>
          <button className="kap-primary-action" type="button" onClick={onRefresh}><AdminIcon name="refresh" size={17}/> Verificar conexión API</button>
        </div>
      </>}
      {tab === 'auditoria' && <div className="kap-table-scroll"><table className="kap-table"><thead><tr><th>Fecha</th><th>Actor</th><th>Acción</th><th>Detalle</th></tr></thead><tbody>
        {data?.audit?.length ? data.audit.map(row => {
          const actionInfo = formatAuditAction(row.action)
          return (
            <tr key={row.id}>
              <td style={{ whiteSpace: 'nowrap', fontSize: '0.84rem' }}>{row.date}</td>
              <td><strong>{row.actor}</strong></td>
              <td><ValueBadge tone={actionInfo.tone}>{actionInfo.label}</ValueBadge></td>
              <td style={{ fontSize: '0.84rem', color: '#4a5568' }}>{String(row.detail || '—')}</td>
            </tr>
          )
        }) : <tr><td colSpan={4} className="kap-no-rows">Sin registros de auditoría proporcionados por el servidor.</td></tr>}
      </tbody></table></div>}
    </AdminPanel>
  </>
}

export default function AdminDashboard({ kind, userName, isPreview = false, onLogout, onBack, mspData, techData }: {
  kind: AdminPanelKind; userName?: string; isPreview?: boolean; onLogout: () => void; onBack: () => void;
  mspData?: MspDashboardData; techData?: TechDashboardData;
}) {
  const [activeTab, setActiveTab] = useState<AdminNavKey>('inicio')
  const [menuOpen, setMenuOpen] = useState(false)
  const [noticeOpen, setNoticeOpen] = useState(false)
  const [health, setHealth] = useState<SystemHealth>({ api: 'unknown', database: 'unknown' })
  const [realTechData, setRealTechData] = useState<TechDashboardData | undefined>(techData)
  const [realMspData, setRealMspData] = useState<MspDashboardData | undefined>(mspData)
  const [loadError, setLoadError] = useState('')

  const isMsp = kind === 'msp'
  const title = isMsp ? 'Administrador MSP' : 'Administrador técnico'
  const navList = isMsp ? MSP_NAV : TECH_NAV
  const selected = navList.find(item => item.key === activeTab)?.label ?? 'Resumen'

  const loadData = useCallback(() => {
    if (isPreview) return
    setLoadError('')
    if (kind === 'tecnico') {
      Promise.all([
        adminApi.listUsers(),
        adminApi.listAuditLogs().catch(() => ({ logs: [] })),
      ]).then(([usersRes, logsRes]) => {
        const users: AdminUserRow[] = (Array.isArray(usersRes) ? usersRes : []).map(u => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          active: u.isActive,
        }))
        const audit: AuditRow[] = (logsRes.logs || []).map((l: any) => {
          const rawDate = l.timestamp || l.createdAt
          const dateStr = rawDate ? new Date(rawDate).toLocaleString('es-EC') : '—'
          return {
            id: l.id,
            date: dateStr !== 'Invalid Date' ? dateStr : '—',
            actor: l.actor?.name || l.actor?.email || 'Sistema',
            action: l.action || 'ACCION',
            detail: formatAuditDetail(l.details, l.targetResource, l.targetId),
          }
        })
        setRealTechData({
          accountsTotal: users.length,
          rolesTotal: new Set(users.map(u => u.role)).size,
          auditEvents: audit.length,
          users,
          audit,
        })
      }).catch(err => setLoadError(err instanceof Error ? err.message : 'No se pudieron cargar los usuarios del sistema.'))
    } else if (kind === 'msp') {
      Promise.all([
        adminApi.listCommunities(),
        adminApi.listActivities(),
        adminApi.listEvents().catch(() => ({ events: [] })),
        adminApi.listResources().catch(() => ({ resources: [] })),
      ]).then(([commRes, actRes, eventsRes, resRes]) => {
        const communities = commRes.communities || []
        const activities = actRes.activities || []
        const events = eventsRes.events || []
        const resources = resRes.resources || []
        const approvedCount = communities.filter((c: any) => c.status === 'APPROVED').length
        const pendingCommCount = communities.filter((c: any) => c.status === 'PENDING' || c.status === 'NEEDS_CHANGES').length
        const pendingActCount = activities.filter((a: any) => a.reviewStatus === 'PENDING' || a.reviewStatus === 'NEEDS_CHANGES').length
        setRealMspData({
          communitiesTotal: communities.length,
          communitiesApproved: approvedCount,
          moderationPending: pendingCommCount + pendingActCount,
          activities,
          activeEvents: events.length,
          educationalResources: resources.length,
          events: events.map((e: any) => ({
            id: e.id,
            name: e.name,
            date: e.date,
            province: e.province,
            scope: e.scope || 'NACIONAL',
          })),
          resources: resources.map((r: any) => ({
            id: r.id,
            title: r.title,
            kind: r.kind || 'GUIA',
            published: r.published ?? true,
          })),
          communities: communities.map((c: any) => {
            const garden = Array.isArray(c.gardens) ? c.gardens.find((g: any) => g?.province) ?? c.gardens[0] : undefined
            return {
              id: c.id,
              name: c.name,
              province: c.province || garden?.province || 'Sin provincia',
              canton: c.canton || garden?.canton || undefined,
              state: c.status || 'PENDING',
              responsibleName: c.responsible || c.creator?.name || undefined,
              description: c.description || undefined,
              createdAt: c.createdAt,
              memberCount: c._count?.members,
              gardensCount: c._count?.gardens,
              reviewReason: c.reviewReason || undefined,
              latitude: typeof garden?.latitude === 'number' ? garden.latitude : null,
              longitude: typeof garden?.longitude === 'number' ? garden.longitude : null,
            }
          }),
        })
      }).catch(err => setLoadError(err instanceof Error ? err.message : 'No se pudieron cargar los datos del MSP.'))
    }
  }, [kind, isPreview])

  useEffect(() => {
    loadData()
  }, [loadData])

  const checkHealth = () => {
    if (isMsp) return
    setHealth({ api: 'unknown', database: 'unknown' })
    fetch('/api/health')
      .then(async response => {
        if (!response.ok) throw new Error('API no disponible')
        return response.json() as Promise<{ status?: string; db?: string }>
      })
      .then(data => setHealth({ api: data.status === 'ok' ? 'online' : 'offline', database: data.db === 'connected' ? 'online' : 'offline' }))
      .catch(() => setHealth({ api: 'offline', database: 'unknown' }))
  }
  useEffect(() => {
    if (isMsp) return
    const controller = new AbortController()
    fetch('/api/health', { signal: controller.signal })
      .then(async response => { if (!response.ok) throw new Error('API no disponible'); return response.json() as Promise<{ status?: string; db?: string }> })
      .then(data => { if (!controller.signal.aborted) setHealth({ api: data.status === 'ok' ? 'online' : 'offline', database: data.db === 'connected' ? 'online' : 'offline' }) })
      .catch(() => { if (!controller.signal.aborted) setHealth({ api: 'offline', database: 'unknown' }) })
    return () => controller.abort()
  }, [isMsp])
  useEffect(() => { document.title = `${title} · Kawsapacha`; return () => { document.title = 'Kawsapacha · Mi Huerto Vivo' } }, [title])

  const mspReviewCommunities = (realMspData?.communities ?? mspData?.communities ?? [])
    .filter(c => c.state === 'PENDING' || c.state === 'NEEDS_CHANGES').length
  const mspReviewActivities = (realMspData?.activities ?? mspData?.activities ?? [])
    .filter(a => a.reviewStatus === 'PENDING' || a.reviewStatus === 'NEEDS_CHANGES').length

  return <div className={`kap-admin-root kap-admin-${kind}`}>
    {menuOpen && <button aria-label="Cerrar menú" type="button" className="kap-mobile-backdrop" onClick={() => setMenuOpen(false)}/>}
    <aside className={`kap-sidebar${menuOpen ? ' is-open' : ''}`}>
      <button className="kap-logo-lockup" type="button" onClick={() => { setActiveTab('inicio'); setMenuOpen(false) }} aria-label="Kawsapacha, ir al resumen">
        <img src={brandLogo} alt="" className="kap-logo-art"/><strong>Kawsapacha</strong><span>SABERES ANCESTRALES<br/>DEL ECUADOR</span>
        <i aria-hidden="true" className="kap-flag-tricolor"/>
      </button>
      <NavList kind={kind} selected={activeTab} onSelect={setActiveTab} onClose={() => setMenuOpen(false)}/>
      <div className="kap-sidebar-art" aria-hidden="true"><svg viewBox="0 0 240 120"><path d="M0 116 58 44l24 28 34-52 48 54 30-25 46 67"/><path d="M37 116 86 76 101 90 114 67 145 98 167 79 206 116"/></svg><AdminIcon name="leaf" size={26}/></div>
      <p className="kap-sidebar-caption">Proyecto educativo Kawsapacha · EPN</p>
    </aside>
    <div className="kap-workspace">
      <header className="kap-topbar">
        <div className="kap-title-block">
          <button type="button" className="kap-menu-toggle" aria-label="Abrir navegación" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}><AdminIcon name="menu"/></button>
          <span className="kap-topbar-seal"><img src={brandLogo} alt=""/></span>
          <span><strong>{title}</strong><small>{isMsp ? 'MINISTERIO DE SALUD PÚBLICA DEL ECUADOR' : 'GESTIÓN TÉCNICA Y SEGURIDAD DEL SISTEMA'}</small><em>{isMsp ? 'Gestión de comunidades, saberes y recursos de Kawsapacha' : 'Operación y administración de la plataforma Kawsapacha'}</em></span>
        </div>
        <div className="kap-topbar-right">
          {isMsp && <div className="kap-government-mark"><img src={ecuadorInsignia} alt="Insignia ilustrativa del Ecuador"/><span>República<br/>del Ecuador</span><i/><span>Ministerio<br/>de Salud Pública</span></div>}
          <div className="kap-notification-wrap">
            <button className="kap-top-icon" type="button" aria-label={isMsp ? 'Alertas de moderación' : 'Notificaciones'} aria-expanded={noticeOpen} onClick={() => setNoticeOpen(open => !open)}><AdminIcon name="bell" size={21}/></button>
            {noticeOpen && <div className="kap-notification-popover" role="status">
              {isMsp ? <>
                <strong>Alertas de revisión</strong>
                {loadError ? <p>No se pudo actualizar la bandeja. Reintenta la carga de datos.</p> : <>
                  <p>Comunidades por revisar: <strong>{mspReviewCommunities}</strong></p>
                  <p>Actividades y evidencias por revisar: <strong>{mspReviewActivities}</strong></p>
                  <button type="button" className="kap-text-button" onClick={() => { setActiveTab('moderacion'); setNoticeOpen(false); }}>Abrir bandeja de moderación</button>
                </>}
              </> : 'Notificaciones administrativas pendientes de integración con el backend.'}
            </div>}
          </div>
          <span className="kap-header-separator"/>
          <div className="kap-identity"><span className="kap-avatar"><AdminIcon name="users" size={19}/></span><span className="kap-identity-label"><strong>{userName || (isMsp ? 'Administrador MSP' : 'Administrador técnico')}</strong><small>{isPreview ? 'Vista previa' : selected}</small></span></div>
          <button type="button" className="kap-top-icon" aria-label="Cerrar sesión de administración" title="Cerrar sesión" onClick={onLogout}><AdminIcon name="logout" size={20}/></button>
        </div>
      </header>
      <div className="kap-woven-strip" aria-hidden="true"/>
      <main className="kap-content">
        {isPreview && <div className="kap-preview-strip"><AdminIcon name="eye" size={16}/><span>Vista previa de diseño · Datos administrativos aún no conectados</span><button type="button" onClick={onBack}>Volver a Kawsapacha</button></div>}
        {loadError && <div role="alert" style={{ margin: '0 0 1rem', padding: '0.75rem 1rem', background: '#fff5f5', border: '1px solid #feb2b2', borderRadius: '8px', color: '#c53030', fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <span>⚠️ No se pudieron cargar los datos del servidor: {loadError}</span>
          <button type="button" className="kap-primary-action" onClick={loadData}>Reintentar</button>
        </div>}
        {activeTab === 'inicio' ? isMsp ? <MspHome data={realMspData ?? mspData} setTab={setActiveTab}/> : <TechnicalHome data={realTechData ?? techData} health={health} setTab={setActiveTab} onRefresh={() => { checkHealth(); loadData(); }}/> :
          isMsp ? <MspDetail tab={activeTab} data={realMspData ?? mspData} setTab={setActiveTab} onRefresh={loadData}/> : <TechnicalDetail tab={activeTab} data={realTechData ?? techData} health={health} setTab={setActiveTab} onRefresh={() => { checkHealth(); loadData(); }}/>}
        <footer className="kap-dashboard-footer"><span>Kawsapacha · Proyecto académico EPN · No constituye una plataforma oficial del MSP</span><span>Fase 4.5 · {isPreview ? 'Vista previa' : 'Interfaz administrativa'}</span></footer>
      </main>
    </div>
  </div>
}
