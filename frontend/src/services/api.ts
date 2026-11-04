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

  async create(community: Community): Promise<Community & { id: string }> {
    const data = await request<{ community: Community & { id: string } }>('/api/communities', {
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

// ─── Módulo de Miembros de Comunidad ─────────────────────────────────────────

export interface CommunityMember {
  id: string
  communityId: string
  userId: string
  roleInCommunity: string
  status: string
  joinedAt: string
  user: {
    id: string
    name: string
    email: string
    role: string
  }
}

export const memberApi = {
  async list(communityId: string): Promise<CommunityMember[]> {
    const data = await request<{ members: CommunityMember[] }>(`/api/communities/${communityId}/members`)
    return data.members
  },

  async invite(communityId: string, email: string, role: string): Promise<unknown> {
    const data = await request<{ invitation: unknown }>(`/api/communities/${communityId}/members/invite`, {
      method: 'POST',
      body: JSON.stringify({ email, role }),
    })
    return data.invitation
  },

  async updateRole(communityId: string, userId: string, role: string): Promise<CommunityMember> {
    const data = await request<{ member: CommunityMember }>(`/api/communities/${communityId}/members/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    })
    return data.member
  },

  async remove(communityId: string, userId: string): Promise<void> {
    await request<unknown>(`/api/communities/${communityId}/members/${userId}`, {
      method: 'DELETE',
    })
  },
}

// ─── Módulo de Huertos Reales ────────────────────────────────────────────────

export const gardenApi = {
  async list(communityId?: string): Promise<RealGarden[]> {
    const query = communityId ? `?communityId=${encodeURIComponent(communityId)}` : ''
    const data = await request<{ gardens: RealGarden[] }>(`/api/gardens${query}`)
    return data.gardens
  },

  async create(garden: RealGarden, communityId?: string | null): Promise<RealGarden & { id: string }> {
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

    const data = await request<{ garden: RealGarden & { id: string } }>('/api/gardens', {
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

export interface CalendarTips {
  wateringFrequencyDays: number
  fertilizerFrequencyDays: number
  growthCycleDays: number
  bestPlantingSeason: string
  lunarPhaseTip: string
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

  async getCalendarTips(speciesId: string): Promise<CalendarTips> {
    const data = await request<{ calendar: CalendarTips }>(`/api/catalog/${speciesId}/calendar`)
    return data.calendar
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
  lifecycleStatus?: string
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

// ─── Módulo de Bitácora de Cuidados ──────────────────────────────────────────

export interface CareLog {
  id: string
  plantId: string
  actionType: string
  notes: string
  performedAt: string
  userId: string
  user?: { id: string; name: string }
}

export interface GrowthData {
  percentage: number
  stage: string
  daysUntilHarvest: number
  needsWatering: boolean
  needsFertilizer: boolean
  lifecycleStatus: string
  plantingDate: string
}

export const careApi = {
  async add(plantId: string, actionType: string, notes?: string): Promise<CareLog> {
    const data = await request<{ log: CareLog }>(`/api/plants/${plantId}/care`, {
      method: 'POST',
      body: JSON.stringify({ actionType, notes: notes ?? '' }),
    })
    return data.log
  },

  async list(plantId: string): Promise<CareLog[]> {
    const data = await request<{ logs: CareLog[] }>(`/api/plants/${plantId}/care`)
    return data.logs
  },

  async getGrowth(plantId: string): Promise<GrowthData> {
    const data = await request<{ growth: GrowthData }>(`/api/plants/${plantId}/care/growth`)
    return data.growth
  },
}

// ─── Módulo de Cosechas ───────────────────────────────────────────────────────

export interface HarvestRecord {
  id: string
  speciesName: string
  speciesLatinName: string
  quantity: string
  harvestDate: string
  notes: string
  harvestedById: string
  harvestedBy?: { id: string; name: string }
  realGarden?: { id: string; name: string }
}

export const harvestApi = {
  async harvest(plantId: string, quantity: string, notes?: string): Promise<HarvestRecord> {
    const data = await request<{ harvest: HarvestRecord }>(`/api/plants/${plantId}/harvest`, {
      method: 'POST',
      body: JSON.stringify({ quantity, notes: notes ?? '' }),
    })
    return data.harvest
  },

  async listByGarden(gardenId: string): Promise<HarvestRecord[]> {
    const data = await request<{ harvests: HarvestRecord[] }>(`/api/gardens/${gardenId}/harvests`)
    return data.harvests
  },

  async listByCommunity(communityId: string): Promise<HarvestRecord[]> {
    const data = await request<{ harvests: HarvestRecord[] }>(`/api/communities/${communityId}/harvests`)
    return data.harvests
  },
}

// ─── Módulo de Bodega y Recursos Comunitarios ─────────────────────────────────

export interface CommunityResource {
  id: string
  communityId: string
  name: string
  category: string
  quantity: number
  unit: string
  status: string
  description: string
  createdAt: string
  updatedAt: string
}

export interface CreateResourceData {
  name: string
  category: string
  quantity?: number
  unit?: string
  status?: string
  description?: string
}

export const resourceApi = {
  async list(communityId: string): Promise<CommunityResource[]> {
    const data = await request<{ resources: CommunityResource[] }>(`/api/communities/${communityId}/resources`)
    return data.resources
  },

  async create(communityId: string, resourceData: CreateResourceData): Promise<CommunityResource> {
    const data = await request<{ resource: CommunityResource }>(`/api/communities/${communityId}/resources`, {
      method: 'POST',
      body: JSON.stringify(resourceData),
    })
    return data.resource
  },

  async update(communityId: string, resourceId: string, resourceData: Partial<CreateResourceData>): Promise<CommunityResource> {
    const data = await request<{ resource: CommunityResource }>(`/api/communities/${communityId}/resources/${resourceId}`, {
      method: 'PATCH',
      body: JSON.stringify(resourceData),
    })
    return data.resource
  },

  async remove(communityId: string, resourceId: string): Promise<void> {
    await request<unknown>(`/api/communities/${communityId}/resources/${resourceId}`, {
      method: 'DELETE',
    })
  },
}
