import type { ReactNode } from 'react'
import AdminIcon, { type AdminIconName } from './AdminIcon'
import type { AdminNavKey, AdminPanelKind } from './admin-types'

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


export function FormattedCount({ value, suffix = '' }: { value?: number; suffix?: string }) {
  return <>{typeof value === 'number' ? value.toLocaleString('es-EC') + suffix : '—'}</>
}
export function AdminMetric({ icon, label, value, tone = 'green', note }: {
  icon: AdminIconName; label: string; value?: number; tone?: 'green' | 'gold' | 'brown' | 'red'; note?: string
}) {
  return <article className={`kap-metric kap-metric-${tone}`}>
    <div className="kap-metric-icon"><AdminIcon name={icon} size={29}/></div>
    <div className="kap-metric-body"><span>{label}</span><strong><FormattedCount value={value}/></strong><small>{typeof value === 'number' ? (note ?? 'Datos del servidor') : 'Pendiente de sincronización'}</small></div>
  </article>
}
export function AdminPanel({ title, subtitle, icon, children, action, className = '' }: {
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
export function ActionLink({ children, onClick, icon = 'arrow' }: { children: ReactNode; onClick: () => void; icon?: AdminIconName }) {
  return <button className="kap-outline-action" type="button" onClick={onClick}>{children}<AdminIcon name={icon} size={15}/></button>
}
export function EmptyState({ title, detail, illustration }: { title: string; detail?: string; illustration?: string }) {
  return <div className="kap-empty">
    {illustration && <img className="kap-empty-image" src={illustration} alt="" loading="lazy"/>}
    <div className="kap-empty-text"><AdminIcon name="leaf" size={25}/><strong>{title}</strong>{detail && <p>{detail}</p>}</div>
  </div>
}
export function ValueBadge({ children, tone }: { children: ReactNode; tone?: 'green' | 'red' | 'gold' | 'blue' | 'purple' | 'gray' }) {
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
export function NavList({ kind, selected, onSelect, onClose }: { kind: AdminPanelKind; selected: AdminNavKey; onSelect: (next: AdminNavKey) => void; onClose: () => void }) {
  const navigation = kind === 'msp' ? MSP_NAV : TECH_NAV
  return <nav className="kap-nav" aria-label="Navegación administrativa">
    {navigation.map(item => <button key={item.key} type="button" className={`kap-nav-item${selected === item.key ? ' is-active' : ''}`}
      aria-current={selected === item.key ? 'page' : undefined} onClick={() => { onSelect(item.key); onClose() }}>
      <AdminIcon name={item.icon} size={18}/><span>{item.label}</span>
    </button>)}
  </nav>
}
export function SectionHead({ title, subtitle, onBack }: { title: string; subtitle: string; onBack: () => void }) {
  return <div className="kap-section-heading"><div><h2>{title}</h2><p>{subtitle}</p></div><ActionLink icon="home" onClick={onBack}>Volver al resumen</ActionLink></div>
}

export function ServiceStatus({ label, state, detail, icon }: { label: string; state: 'online' | 'offline' | 'unknown'; detail?: string; icon: AdminIconName }) {
  return <div className="kap-service-row"><AdminIcon name={icon} size={22}/><strong>{label}</strong><span className={`kap-service-status status-${state}`}><span className="kap-status-dot"/>{state === 'online' ? 'Operativo' : state === 'offline' ? 'No disponible' : 'Sin comprobar'}</span>{detail && <small>{detail}</small>}</div>
}

