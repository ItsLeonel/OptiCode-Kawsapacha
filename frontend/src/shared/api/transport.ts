/** Transporte HTTP y sesión; sin dependencias de vistas o features. */
const BASE_URL = '' // Utiliza el proxy de Vite configurado hacia http://localhost:3000

export function resolveMediaUrl(url?: string | null): string {
  if (!url) return ''
  if (url.startsWith('blob:') || url.startsWith('data:')) return url
  if (url.startsWith('http://') || url.startsWith('https://')) {
    if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      return url.replace(/http:\/\/localhost:3000/g, `${window.location.protocol}//${window.location.hostname}:3000`)
    }
    return url
  }
  return url.startsWith('/') ? url : `/${url}`
}

// ─── Gestión de Tokens y Sesión ──────────────────────────────────────────────

const TOKEN_KEY = 'kawsapacha_token'
const USER_KEY = 'kawsapacha_user'

export interface UserSession {
  id: string
  name: string
  email: string
  role: 'ADMIN_TECNICO' | 'ADMIN_MSP' | 'USUARIO' | 'RESPONSABLE' | 'PARTICIPANTE' | string
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function getUser(): UserSession | null {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as UserSession
  } catch {
    return null
  }
}

export function setUser(user: UserSession): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

// ─── Utilidad Genérica de Fetch ──────────────────────────────────────────────

export async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  // Si no es FormData, fijamos Content-Type a JSON
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json'
  }

  let res: Response
  try {
    res = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
    })
  } catch {
    throw new Error('No se pudo conectar con el servidor backend (http://localhost:3000). Asegúrate de tenerlo encendido ejecutando "npm run dev" en la carpeta backend.')
  }

  let json: { ok?: boolean; data?: T; message?: string; error?: { message?: string } } | null = null
  try {
    json = await res.json()
  } catch {
    if (!res.ok) {
      throw new Error(`El servidor backend respondió con error (${res.status} ${res.statusText}). Revisa que el backend esté ejecutándose en http://localhost:3000.`)
    }
    throw new Error('Respuesta inválida del servidor backend.')
  }

  if (!res.ok || json?.ok === false) {
    const errorMsg = json?.error?.message || json?.message || `Error en la solicitud (${res.status})`
    throw new Error(errorMsg)
  }

  return json?.data as T
}

