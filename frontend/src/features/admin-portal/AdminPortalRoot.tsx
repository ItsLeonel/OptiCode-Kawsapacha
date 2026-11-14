import { lazy, Suspense, useEffect, useState, type FormEvent, type ChangeEvent } from 'react'
import App from '../../App'
import { authApi, getToken, type UserSession } from '../../services/api'
import AdminIcon from './AdminIcon'
import type { AdminPanelKind } from './admin-types'
import './admin-portal.css'

const Dashboard = lazy(() => import('./AdminDashboard'))
type Route = { kind: AdminPanelKind; preview: boolean } | null
type Access = 'checking' | 'login' | 'allowed' | 'forbidden'

function currentRoute(): Route {
  const hash = window.location.hash
  if (hash === '#admin-msp') return { kind: 'msp', preview: false }
  if (hash === '#admin-tecnico') return { kind: 'tecnico', preview: false }
  if (import.meta.env.DEV && hash === '#vista-previa-msp') return { kind: 'msp', preview: true }
  if (import.meta.env.DEV && hash === '#vista-previa-tecnico') return { kind: 'tecnico', preview: true }
  return null
}
function matchesRole(user: UserSession, kind: AdminPanelKind) {
  // El servidor confirma el rol al consultar /api/auth/me; no confiar en localStorage.
  return String(user.role) === (kind === 'msp' ? 'ADMIN_MSP' : 'ADMIN_TECNICO')
}
function adminHome() { window.location.hash = '#bienvenida' }

function AdminLogin({ kind, onSuccess, error, onError }: {
  kind: AdminPanelKind; onSuccess: (user: UserSession) => void; error: string; onError: (message: string) => void
}) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    onError('')
    try {
      await authApi.login({ email, password })
      const response = await authApi.me()
      if (!matchesRole(response.user, kind)) {
        authApi.logout()
        onError('La cuenta no tiene autorización para este panel administrativo.')
      } else onSuccess(response.user)
    } catch (e) {
      onError(e instanceof Error ? e.message : 'No fue posible iniciar sesión.')
    } finally { setLoading(false) }
  }
  return <div className="kap-access-page"><div className="kap-access-card">
    <div className="kap-access-header"><AdminIcon name="lock" size={29}/><span>Kawsapacha · Acceso protegido</span></div>
    <h1>{kind === 'msp' ? 'Administrador MSP' : 'Administrador técnico'}</h1>
    <p>Solo las cuentas autorizadas y verificadas por el servidor pueden acceder a este panel.</p>
    <form onSubmit={submit} className="kap-access-form">
      <label>Correo electrónico<input type="email" value={email} onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)} autoComplete="username" required/></label>
      <label>Contraseña<input type="password" value={password} onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)} autoComplete="current-password" required/></label>
      {error && <p role="alert" className="kap-access-error">{error}</p>}
      <button type="submit" disabled={loading} className="kap-primary-action"><AdminIcon name="lock" size={18}/>{loading ? 'Verificando acceso…' : 'Iniciar sesión'}</button>
    </form>
    <button className="kap-text-button" type="button" onClick={adminHome}>Volver a Kawsapacha</button>
  </div></div>
}

export default function AdminPortalRoot() {
  const [route, setRoute] = useState<Route>(currentRoute)
  const [access, setAccess] = useState<Access>('checking')
  const [verifiedUser, setVerifiedUser] = useState<UserSession | null>(null)
  const [error, setError] = useState('')
  useEffect(() => {
    const onNavigation = () => setRoute(currentRoute())
    window.addEventListener('hashchange', onNavigation)
    window.addEventListener('popstate', onNavigation)
    return () => { window.removeEventListener('hashchange', onNavigation); window.removeEventListener('popstate', onNavigation) }
  }, [])
  useEffect(() => {
    if (!route || route.preview) return
    let current = true
    setAccess('checking')
    setError('')
    setVerifiedUser(null)
    if (!getToken()) { setAccess('login'); return }
    authApi.me().then(({ user }) => {
      if (!current) return
      if (matchesRole(user, route.kind)) { setVerifiedUser(user); setAccess('allowed') }
      else { setAccess('forbidden'); setError('Tu cuenta no tiene permiso para este panel.') }
    }).catch(() => { if (current) { setAccess('login'); setError('No se pudo verificar la sesión. Vuelve a iniciar sesión.') } })
    return () => { current = false }
  }, [route?.kind, route?.preview])
  if (!route) return <App/>
  if (route.preview) return <Suspense fallback={<main className="kap-access-page">Cargando panel…</main>}><Dashboard kind={route.kind} isPreview onLogout={adminHome} onBack={adminHome}/></Suspense>
  if (access === 'checking') return <main className="kap-access-page" role="status"><div className="kap-access-card"><AdminIcon name="shield" size={35}/><h1>Verificando permisos</h1><p>Consultando el rol vigente con el servidor…</p></div></main>
  if (access === 'forbidden') return <main className="kap-access-page"><div className="kap-access-card"><AdminIcon name="shield" size={37}/><h1>Acceso restringido</h1><p role="alert">{error}</p><button className="kap-primary-action" type="button" onClick={() => { authApi.logout(); setError(''); setAccess('login') }}>Ingresar con otra cuenta</button><button className="kap-text-button" type="button" onClick={adminHome}>Volver a Kawsapacha</button></div></main>
  if (access === 'login') return <AdminLogin kind={route.kind} error={error} onError={setError} onSuccess={user => { setVerifiedUser(user); setAccess('allowed') }}/>
  return <Suspense fallback={<main className="kap-access-page">Cargando panel administrativo…</main>}><Dashboard kind={route.kind} userName={verifiedUser?.name} onBack={adminHome} onLogout={() => { authApi.logout(); adminHome() }}/></Suspense>
}
