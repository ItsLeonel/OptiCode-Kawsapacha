import { useEffect, useState, type ReactNode, type ChangeEvent } from 'react'
import AdminIcon, { type AdminIconName } from './AdminIcon'
import AdminMap from './AdminMap'
import type {
  AdminNavKey, AdminPanelKind, MspDashboardData, TechDashboardData,
  SystemHealth, CommunityRow, AdminUserRow,
} from './admin-types'
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
function ValueBadge({ children }: { children: ReactNode }) { return <span className="kap-status-pill">{children}</span> }
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
    <div className="kap-section-heading"><div><h2>Panel de gestión institucional</h2><p>Supervisión, acompañamiento y fortalecimiento de Kawsapacha a nivel nacional</p></div><span className="kap-info-chip"><AdminIcon name="clock" size={14}/> Sin actualización oficial</span></div>
    <div className="kap-metrics">
      <AdminMetric icon="users" label="Comunidades registradas" value={data?.communitiesTotal}/>
      <AdminMetric icon="calendar" label="Eventos activos" value={data?.activeEvents} tone="gold"/>
      <AdminMetric icon="book" label="Recursos educativos" value={data?.educationalResources} tone="brown"/>
      <AdminMetric icon="shield" label="Contenidos en moderación" value={data?.moderationPending} tone="red"/>
    </div>
    <div className="kap-msp-primary-grid">
      <AdminPanel icon="pin" title="Cobertura de comunidades" subtitle="Distribución de comunidades en el territorio nacional" action={<ActionLink onClick={() => setTab('comunidades')}>Ver cobertura territorial</ActionLink>}>
        <div className="kap-map-panel">
          <AdminMap province={province} onProvinceChange={setProvince}/>
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
          {([['Comunidades','users'], ['Evidencias fotográficas','image'], ['Foros y publicaciones','message']] as [string, AdminIconName][]).map(([label, icon]) => <button type="button" key={label} onClick={() => setTab('moderacion')}><AdminIcon name={icon} size={18}/><span>{label}</span><span className="kap-review-pending">Por sincronizar</span></button>)}
        </div>
      </AdminPanel>
      <AdminPanel icon="chart" title="Reportes rápidos" subtitle="Indicadores del programa" action={<ActionLink onClick={() => setTab('reportes')}>Ver reportes</ActionLink>}>
        <div className="kap-report-list">{['Actividad de comunidades', 'Resultados de eventos', 'Uso de recursos educativos'].map(label => <button type="button" key={label} onClick={() => setTab('reportes')}><AdminIcon name="chart" size={18}/>{label}<AdminIcon name="right" size={17}/></button>)}</div>
      </AdminPanel>
    </div>
  </>
}
function MspDetail({ tab, data, setTab }: { tab: AdminNavKey; data?: MspDashboardData; setTab: (next: AdminNavKey) => void }) {
  const [query, setQuery] = useState('')
  const [province, setProvince] = useState('')
  const definitions: Record<string, { title: string; description: string; icon: AdminIconName }> = {
    comunidades: { title: 'Comunidades del Ecuador', description: 'Registro y estados de verificación de comunidades.', icon: 'users' },
    eventos: { title: 'Eventos y mingas institucionales', description: 'Ferias y encuentros coordinados por el MSP.', icon: 'calendar' },
    recursos: { title: 'Biblioteca educativa', description: 'Publicación y validación de recursos para las comunidades.', icon: 'book' },
    moderacion: { title: 'Moderación y verificaciones', description: 'Revisión de comunidades, fotografías y publicaciones.', icon: 'shield' },
    reportes: { title: 'Reportes institucionales', description: 'Indicadores de comunidades, eventos y contenido educativo.', icon: 'chart' },
  }
  const definition = definitions[tab] ?? definitions.comunidades
  const communities = (data?.communities ?? []).filter(c => (!province || c.province === province) && `${c.name} ${c.province}`.toLocaleLowerCase().includes(query.toLocaleLowerCase()))
  return <>
    <SectionHead title={definition.title} subtitle={definition.description} onBack={() => setTab('inicio')}/>
    {tab === 'comunidades' && <div className="kap-detail-layout">
      <AdminPanel title="Mapa nacional" subtitle="Cobertura provincial de comunidades" icon="map"><AdminMap province={province} onProvinceChange={setProvince}/></AdminPanel>
      <AdminPanel title="Directorio de comunidades" subtitle="Sin datos ficticios" icon="users"><label className="kap-search"><AdminIcon name="search" size={17}/><input value={query} onChange={(e: ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)} placeholder="Buscar comunidad o provincia" aria-label="Buscar comunidad"/></label>
        {communities.length ? <div className="kap-table-scroll"><table className="kap-table"><thead><tr><th>Comunidad</th><th>Provincia</th><th>Estado</th></tr></thead><tbody>{communities.map(c => <tr key={c.id}><td>{c.name}</td><td>{c.province}</td><td><ValueBadge>{stateLabel(c)}</ValueBadge></td></tr>)}</tbody></table></div> : <EmptyState title="No hay comunidades para mostrar" detail="El listado se cargará desde el backend autorizado del MSP."/>}
      </AdminPanel></div>}
    {tab === 'eventos' && <AdminPanel icon="calendar" title="Eventos institucionales" subtitle="Publicación y coordinación por provincia/cantón"><EmptyState title="Todavía no hay eventos conectados" detail="El formulario de creación se habilitará cuando la API y el rol ADMIN_MSP estén implementados." illustration={communityEvents}/></AdminPanel>}
    {tab === 'recursos' && <AdminPanel icon="book" title="Recursos educativos" subtitle="Contenido validado y propuestas comunitarias"><EmptyState title="Biblioteca pendiente de sincronización" detail="No se presentarán contenidos como avalados por el MSP antes de la revisión." illustration={communityLearning}/></AdminPanel>}
    {tab === 'moderacion' && <div className="kap-moderation-grid">{([['Comunidades pendientes','users'], ['Fotografías por revisar','image'], ['Foro y experiencias','message']] as [string, AdminIconName][]).map(([label, icon]) => <AdminPanel key={label} title={label} icon={icon}><EmptyState title="Pendiente de conectar" detail="Las decisiones de verificación y su auditoría se registrarán en el servidor; no se simulan aprobaciones." illustration={icon === 'message' ? communityForum : undefined}/></AdminPanel>)}</div>}
    {tab === 'reportes' && <AdminPanel icon="chart" title="Indicadores y reportes" subtitle="Consulta de resultados nacionales y territoriales"><EmptyState title="Sin indicadores oficiales disponibles" detail="Los reportes se habilitarán cuando existan datos agregados y validados por el backend."/></AdminPanel>}
  </>
}
function stateLabel(c: CommunityRow) {
  return ({ PENDING: 'Pendiente', APPROVED: 'Verificada', NEEDS_CHANGES: 'Requiere correcciones', REJECTED: 'Rechazada' } as const)[c.state]
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
          {data?.users?.length ? data.users.slice(0, 4).map(user => <tr key={user.id}><td>{user.name}</td><td>{user.email}</td><td><ValueBadge>{user.role}</ValueBadge></td><td>{user.active ? 'Activo' : 'Inactivo'}</td></tr>) : <tr><td colSpan={4} className="kap-no-rows">Sin cuentas administrativas sincronizadas.</td></tr>}
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
  const definitions: Record<string, { title: string; subtitle: string; icon: AdminIconName }> = {
    usuarios: { title: 'Usuarios y roles', subtitle: 'Cuentas MSP, asignación y revocación de permisos.', icon: 'users' },
    configuracion: { title: 'Configuración y sistema', subtitle: 'Seguridad, respaldos y estado de los servicios.', icon: 'settings' },
    auditoria: { title: 'Registro de actividad', subtitle: 'Trazabilidad de acciones administrativas.', icon: 'clipboard' },
  }
  const d = definitions[tab] ?? definitions.usuarios
  return <>
    <SectionHead title={d.title} subtitle={d.subtitle} onBack={() => setTab('inicio')}/>
    <AdminPanel title={d.title} subtitle={d.subtitle} icon={d.icon}>
      {tab === 'usuarios' && <><div className="kap-detail-note"><AdminIcon name="lock"/> La creación y desactivación de cuentas se habilitarán exclusivamente con la API del administrador técnico.</div>
        <div className="kap-table-scroll"><table className="kap-table"><thead><tr><th>Nombre</th><th>Correo</th><th>Rol global</th><th>Estado</th></tr></thead><tbody>
          {data?.users?.length ? data.users.map((user: AdminUserRow) => <tr key={user.id}><td>{user.name}</td><td>{user.email}</td><td>{user.role}</td><td>{user.active ? 'Activo' : 'Inactivo'}</td></tr>) : <tr><td colSpan={4} className="kap-no-rows">No hay usuarios sincronizados.</td></tr>}
        </tbody></table></div></>}
      {tab === 'configuracion' && <>
        <div className="kap-detail-note"><AdminIcon name="lock" size={19}/> Las opciones de seguridad, parámetros y respaldos estarán disponibles cuando el backend habilite sus permisos administrativos.</div>
        <div className="kap-services">
          <ServiceStatus label="Backend (API)" state={health.api} icon="server"/>
          <ServiceStatus label="Base de datos" state={health.database} icon="database"/>
          <ServiceStatus label="Almacenamiento de fotografías" state="unknown" icon="image" detail="Pendiente de API de monitoreo"/>
          <ServiceStatus label="Copias de respaldo" state="unknown" icon="refresh" detail="Pendiente de API de monitoreo"/>
          <button className="kap-primary-action" type="button" onClick={onRefresh}><AdminIcon name="refresh" size={17}/> Verificar conexión API</button>
        </div>
      </>}
      {tab === 'auditoria' && <div className="kap-table-scroll"><table className="kap-table"><thead><tr><th>Fecha</th><th>Actor</th><th>Acción</th><th>Detalle</th></tr></thead><tbody>
        {data?.audit?.length ? data.audit.map(row => <tr key={row.id}><td>{row.date}</td><td>{row.actor}</td><td>{row.action}</td><td>{row.detail}</td></tr>) : <tr><td colSpan={4} className="kap-no-rows">Sin registros de auditoría proporcionados por el servidor.</td></tr>}
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
  const isMsp = kind === 'msp'
  const title = isMsp ? 'Administrador MSP' : 'Administrador técnico'
  const navList = isMsp ? MSP_NAV : TECH_NAV
  const selected = navList.find(item => item.key === activeTab)?.label ?? 'Resumen'
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
          <div className="kap-notification-wrap"><button className="kap-top-icon" type="button" aria-label="Notificaciones" aria-expanded={noticeOpen} onClick={() => setNoticeOpen(open => !open)}><AdminIcon name="bell" size={21}/></button>{noticeOpen && <div className="kap-notification-popover" role="status">Notificaciones administrativas pendientes de integración con el backend.</div>}</div>
          <span className="kap-header-separator"/>
          <div className="kap-identity"><span className="kap-avatar"><AdminIcon name="users" size={19}/></span><span className="kap-identity-label"><strong>{userName || (isMsp ? 'Administrador MSP' : 'Administrador técnico')}</strong><small>{isPreview ? 'Vista previa' : selected}</small></span></div>
          <button type="button" className="kap-top-icon" aria-label="Cerrar sesión de administración" title="Cerrar sesión" onClick={onLogout}><AdminIcon name="logout" size={20}/></button>
        </div>
      </header>
      <div className="kap-woven-strip" aria-hidden="true"/>
      <main className="kap-content">
        {isPreview && <div className="kap-preview-strip"><AdminIcon name="eye" size={16}/><span>Vista previa de diseño · Datos administrativos aún no conectados</span><button type="button" onClick={onBack}>Volver a Kawsapacha</button></div>}
        {activeTab === 'inicio' ? isMsp ? <MspHome data={mspData} setTab={setActiveTab}/> : <TechnicalHome data={techData} health={health} setTab={setActiveTab} onRefresh={checkHealth}/> :
          isMsp ? <MspDetail tab={activeTab} data={mspData} setTab={setActiveTab}/> : <TechnicalDetail tab={activeTab} data={techData} health={health} setTab={setActiveTab} onRefresh={checkHealth}/>}
        <footer className="kap-dashboard-footer"><span>Kawsapacha · Proyecto académico EPN · No constituye una plataforma oficial del MSP</span><span>Fase 4.5 · {isPreview ? 'Vista previa' : 'Interfaz administrativa'}</span></footer>
      </main>
    </div>
  </div>
}
