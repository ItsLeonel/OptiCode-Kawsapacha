// Cliente API para conexión con el backend Kawsapacha V1 (Node.js + Express + SQLite)
// Responsable: Ronny Veloz (#13 INT-001)

import type { AuthSubmission } from '../features/auth/auth'
import type { Community } from '../features/communities/communities'
import type { RealGarden } from '../features/real-gardens/real-garden'

const BASE_URL = '' // Utiliza el proxy de Vite configurado hacia http://localhost:3000

// ─── Gestión de Tokens y Sesión ──────────────────────────────────────────────

const TOKEN_KEY = 'kawsapacha_token'
const USER_KEY = 'kawsapacha_user'

export interface UserSession {
  id: string
  name: string
  email: string
  role: 'RESPONSABLE' | 'PARTICIPANTE'
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

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
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

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })

  const json = await res.json()

  if (!res.ok || json.ok === false) {
    const errorMsg = json.error?.message || json.message || 'Error en la solicitud'
    throw new Error(errorMsg)
  }

  return json.data as T
}

// ─── Módulo de Autenticación ─────────────────────────────────────────────────

export interface AuthResponse {
  token: string
  user: UserSession
}

export const authApi = {
  async register(submission: { name: string; email: string; password: string }): Promise<AuthResponse> {
    const data = await request<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(submission),
    })
    setToken(data.token)
    setUser(data.user)
    return data
  },

  async login(submission: { email: string; password: string }): Promise<AuthResponse> {
    const data = await request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(submission),
    })
    setToken(data.token)
    setUser(data.user)
    return data
  },

  async me(): Promise<{ user: UserSession }> {
    return request<{ user: UserSession }>('/api/auth/me')
  },

  logout(): void {
    clearSession()
  },

  async handleSubmission(submission: AuthSubmission): Promise<{ message: string; user: UserSession }> {
    if (submission.mode === 'register') {
      const data = await this.register({
        name: submission.name,
        email: submission.email,
        password: submission.password,
      })
      return { message: `¡Bienvenido/a a Kawsapacha, ${data.user.name}! Tu cuenta ha sido creada.`, user: data.user }
    } else {
      const data = await this.login({
        email: submission.email,
        password: submission.password,
      })
      return { message: `¡Hola de nuevo, ${data.user.name}! Sesión iniciada.`, user: data.user }
    }
  },
}

// ─── Módulo de Comunidades ───────────────────────────────────────────────────

export const communityApi = {
  async list(): Promise<Community[]> {
    const data = await request<{ communities: Community[] }>('/api/communities')
    return data.communities
  },

  async create(community: Community): Promise<Community> {
    const data = await request<{ community: Community }>('/api/communities', {
      method: 'POST',
      body: JSON.stringify(community),
    })
    return data.community
  },

  async getById(id: string): Promise<Community> {
    const data = await request<{ community: Community }>(`/api/communities/${id}`)
    return data.community
  },
}

// ─── Módulo de Huertos Reales ────────────────────────────────────────────────

export const gardenApi = {
  async list(communityId?: string): Promise<RealGarden[]> {
    const query = communityId ? `?communityId=${encodeURIComponent(communityId)}` : ''
    const data = await request<{ gardens: RealGarden[] }>(`/api/gardens${query}`)
    return data.gardens
  },

  async create(garden: RealGarden, communityId?: string | null): Promise<RealGarden> {
    const payload = {
      name: garden.name,
      kind: garden.kind,
      areaM2: garden.areaM2,
      province: garden.location.province,
      provinceCode: garden.location.provinceCode,
      canton: garden.location.canton,
      cantonCode: garden.location.cantonCode,
      parish: garden.location.parish,
      parishCode: garden.location.parishCode,
      reference: garden.location.reference,
      coordinates: garden.location.coordinates,
      irrigationAvailability: garden.irrigationAvailability,
      soilType: garden.soilType,
      communityId: communityId ?? null,
    }

    const data = await request<{ garden: RealGarden }>('/api/gardens', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    return data.garden
  },

  async getById(id: string): Promise<RealGarden> {
    const data = await request<{ garden: RealGarden }>(`/api/gardens/${id}`)
    return data.garden
  },
}

// ─── Módulo de Catálogo Medicinal ─────────────────────────────────────────────

export interface CatalogSpecies {
  id: string
  name: string
  latinName: string
  icon: string
  description: string
  medicinalProperties: string
  preparation: string
  contraindications: string
  defaultPhotoUrl: string
}

export const catalogApi = {
  async list(query?: string): Promise<CatalogSpecies[]> {
    const q = query ? `?q=${encodeURIComponent(query)}` : ''
    const data = await request<{ species: CatalogSpecies[] }>(`/api/catalog${q}`)
    return data.species
  },

  async getById(id: string): Promise<CatalogSpecies> {
    const data = await request<{ species: CatalogSpecies }>(`/api/catalog/${id}`)
    return data.species
  },
}

// ─── Módulo de Plantas Cultivadas (Huerto 2D y Pasaporte) ─────────────────────

export interface ApiPlant {
  id: string
  plotIndex: number
  speciesId: string
  customName: string
  photoUrl: string
  plantingDate: string
  notes?: string
  species: {
    name: string
    latinName: string
    icon: string
  }
}

export const plantApi = {
  async listByGarden(gardenId: string): Promise<ApiPlant[]> {
    const data = await request<{ plants: ApiPlant[] }>(`/api/gardens/${gardenId}/plants`)
    return data.plants
  },

  async register(
    gardenId: string,
    params: {
      file: File
      speciesId: string
      plotIndex: number
      customName?: string
      notes?: string
    }
  ): Promise<ApiPlant> {
    const formData = new FormData()
    formData.append('picture', params.file)
    formData.append('speciesId', params.speciesId)
    formData.append('plotIndex', String(params.plotIndex))
    if (params.customName) formData.append('customName', params.customName)
    if (params.notes) formData.append('notes', params.notes)

    const data = await request<{ plant: ApiPlant }>(`/api/gardens/${gardenId}/plants`, {
      method: 'POST',
      body: formData,
    })
    return data.plant
  },

  async passport(plantId: string): Promise<unknown> {
    const data = await request<{ passport: unknown }>(`/api/plants/${plantId}/passport`)
    return data.passport
  },
}
