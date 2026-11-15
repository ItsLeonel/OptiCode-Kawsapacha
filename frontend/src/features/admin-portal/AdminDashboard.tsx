import { useCallback, useEffect, useState, type FormEvent } from 'react'
import AdminIcon, { type AdminIconName } from './AdminIcon'
import type {
  AdminNavKey, AdminPanelKind, MspDashboardData, TechDashboardData,
  SystemHealth, AdminUserRow, AuditRow,
} from './admin-types'
import { adminApi } from '../../services/api'
import brandLogo from './assets/kawsapacha-marca.svg'
import ecuadorInsignia from './assets/ecuador-insignia.svg'
import './admin-portal.css'
import { formatAuditAction, roleLabel, formatAuditDetail } from './admin-formatters'
import { AdminMetric, AdminPanel, ActionLink, ValueBadge, NavList, SectionHead, ServiceStatus } from './admin-ui'
import { MspHome, MspDetail } from './AdminMspViews'
export { ACTIVITY_TYPE_MAP, formatActivityType, formatAuditAction, roleLabel } from './admin-formatters'

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
        const pendingActCount = activities.filter((a: any) => (a.reviewStatus === 'APPROVED' && !a.reviewedAt) || a.reviewStatus === 'PENDING' || a.reviewStatus === 'NEEDS_CHANGES').length
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
