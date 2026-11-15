// Cliente API para conexión con el backend Kawsapacha V1 (Node.js + Express + SQLite)
// Responsable: Ronny Veloz (#13 INT-001)

import type { AuthSubmission } from '../contracts/api-models'
import type { Community } from '../contracts/api-models'
import type { RealGarden } from '../contracts/api-models'
import { toGardenFeatures, type GardenFeatures } from '../contracts/garden-features'
import { communityProvince } from '../geo/community-province'
import { validatePhoto } from '../photo-validation'

import { request, setToken, setUser, clearSession } from './transport'
import type { UserSession } from './transport'
export { resolveMediaUrl, getToken, setToken, getUser, setUser, clearSession } from './transport'
export type { UserSession } from './transport'

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

// ─── Módulo de Búsqueda y Validación de Usuarios ──────────────────────────────

export interface UserLookupResult {
  found: boolean
  user?: {
    id: string
    name: string
    email: string
  }
  isMember?: boolean
  isPending?: boolean
  roleInCommunity?: string | null
  message?: string
}

export const userApi = {
  async lookup(email: string, communityId?: string): Promise<UserLookupResult> {
    const params = new URLSearchParams({ email })
    if (communityId) params.append('communityId', communityId)
    return request<UserLookupResult>(`/api/users/lookup?${params.toString()}`)
  },
}

// ─── Módulo de Comunidades ───────────────────────────────────────────────────

function photoBody(payload: Record<string, unknown>, file?: File, removePhoto?: boolean): string | FormData {
  const fields = { ...payload, ...(removePhoto ? { removePhoto: true } : {}) }
  if (!file) return JSON.stringify(fields)
  const error = validatePhoto(file)
  if (error) throw new Error(error)
  const body = new FormData()
  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined) body.append(key, value === null ? '' : typeof value === 'object' ? JSON.stringify(value) : String(value))
  }
  body.append('picture', file)
  return body
}

function communityBody(community: Partial<Community>) {
  const { name, responsible, location, description, type, province, cantonCode, parishCode, sector } = community
  return photoBody({ name, responsible, location, description, type, province, cantonCode, parishCode, sector }, community.coverPhoto, community.removePhoto)
}

function normalizeCommunity<T extends Community>(community: T): T {
  return { ...community, province: communityProvince(community) }
}

export const communityApi = {
  async list(): Promise<Community[]> {
    const data = await request<{ communities: Community[] }>('/api/communities')
    return data.communities.map(normalizeCommunity)
  },

  async create(community: Community): Promise<Community & { id: string }> {
    const data = await request<{ community: Community & { id: string } }>('/api/communities', {
      method: 'POST',
      body: communityBody(community),
    })
    return normalizeCommunity(data.community)
  },

  async getById(id: string): Promise<Community> {
    const data = await request<{ community: Community }>(`/api/communities/${id}`)
    return normalizeCommunity(data.community)
  },

  async update(id: string, community: Partial<Community>): Promise<Community & { id: string }> {
    const data = await request<{ community: Community & { id: string } }>(`/api/communities/${id}`, {
      method: 'PUT',
      body: communityBody(community),
    })
    return normalizeCommunity(data.community)
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

// ─── Módulo de Invitaciones y Notificaciones ─────────────────────────────────

export interface CommunityInvitationItem {
  id: string
  communityId: string
  communityName: string
  communityLocation?: string
  role: string
  invitedById: string
  invitedByName: string
  createdAt: string
  status: string
}

export const invitationApi = {
  async getMyInvitations(): Promise<CommunityInvitationItem[]> {
    const data = await request<{ invitations: CommunityInvitationItem[] }>('/api/invitations/me')
    return data.invitations || []
  },

  async accept(id: string): Promise<{ invitation: unknown; member: unknown; communityId: string }> {
    return request<{ invitation: unknown; member: unknown; communityId: string }>(`/api/invitations/${id}/accept`, {
      method: 'POST',
    })
  },

  async reject(id: string): Promise<void> {
    await request<unknown>(`/api/invitations/${id}/reject`, {
      method: 'POST',
    })
  },
}

// ─── Módulo de Huertos Reales ────────────────────────────────────────────────

interface RawBackendGarden {
  id: string
  name: string
  kind: string
  areaM2: number
  province: string
  provinceCode: string
  canton?: string
  cantonCode?: string | null
  parish?: string
  parishCode?: string | null
  reference?: string
  latitude?: number | null
  longitude?: number | null
  irrigationAvailability: string
  soilType?: string | null
  characteristics?: string | GardenFeatures | null
  communityId?: string | null
  community?: { id: string; name: string; province?: string; location?: string } | null
  photoUrl?: string | null
  location?: RealGarden['location']
  communityName?: string | null
  createdById?: string
}

function parseCharacteristics(chars: unknown): GardenFeatures | undefined {
  if (!chars) return undefined
  if (typeof chars === 'object') return toGardenFeatures(chars as any)
  if (typeof chars === 'string') {
    try {
      const parsed = JSON.parse(chars)
      return toGardenFeatures(parsed)
    } catch {
      return undefined
    }
  }
  return undefined
}

function normalizeGarden(raw: RawBackendGarden): RealGarden & { id: string } {
  const characteristics = parseCharacteristics(raw.characteristics)
  if (raw.location) {
    return {
      ...(raw as RealGarden & { id: string }),
      characteristics: characteristics ?? (raw as any).characteristics,
      createdById: raw.createdById,
    }
  }
  return {
    id: raw.id,
    name: raw.name,
    kind: (raw.kind as RealGarden['kind']) || 'ground',
    areaM2: raw.areaM2,
    location: {
      province: raw.province || '',
      provinceCode: raw.provinceCode || '',
      canton: raw.canton || '',
      cantonCode: raw.cantonCode || null,
      parish: raw.parish || '',
      parishCode: raw.parishCode || null,
      reference: raw.reference || '',
      coordinates: raw.latitude != null && raw.longitude != null ? { latitude: raw.latitude, longitude: raw.longitude } : null,
    },
    irrigationAvailability: (raw.irrigationAvailability as RealGarden['irrigationAvailability']) || 'available',
    soilType: (raw.soilType as RealGarden['soilType']) || null,
    characteristics,
    communityName: raw.community?.name ?? raw.communityName ?? null,
    createdById: raw.createdById,
    photoUrl: raw.photoUrl,
    communityProvince: raw.community ? communityProvince({ province: raw.community.province, location: raw.community.location ?? '' }) : undefined,
  }
}

export const gardenApi = {
  async list(communityId?: string): Promise<(RealGarden & { id: string })[]> {
    const query = communityId ? `?communityId=${encodeURIComponent(communityId)}` : ''
    const data = await request<{ gardens: RawBackendGarden[] }>(`/api/gardens${query}`)
    return (data.gardens || []).map(normalizeGarden)
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
      characteristics: garden.characteristics ? JSON.stringify(garden.characteristics) : null,
      communityId: communityId ?? null,
    }

    const data = await request<{ garden: RawBackendGarden }>('/api/gardens', {
      method: 'POST',
      body: photoBody(payload, garden.photo, garden.removePhoto),
    })
    return normalizeGarden(data.garden)
  },

  async update(id: string, garden: RealGarden, communityId?: string | null): Promise<RealGarden & { id: string }> {
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
      characteristics: garden.characteristics ? JSON.stringify(garden.characteristics) : null,
      communityId: communityId ?? null,
    }

    const data = await request<{ garden: RawBackendGarden }>(`/api/gardens/${id}`, {
      method: 'PUT',
      body: photoBody(payload, garden.photo, garden.removePhoto),
    })
    return normalizeGarden(data.garden)
  },

  async getById(id: string): Promise<RealGarden & { id: string }> {
    const data = await request<{ garden: RawBackendGarden }>(`/api/gardens/${id}`)
    return normalizeGarden(data.garden)
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
  photoSourceUrl: string
  photoCredit: string
  family: string
  otherNames: string[]
  regions: string[]
  usageTags: string[]
  altitude: string
  provinces: string
  cycleCategory: string
  traditionalClassification: string
  careNotes: string
  sourceLabel: string
  sourceUrl: string
  regionalNote: string
  registerStatus: string
  wateringFrequencyDays: number
  fertilizerFrequencyDays: number
  growthCycleDays: number
  bestPlantingSeason: string
  lunarPhaseTip: string
}

function catalogArray(input: string | string[]): string[] {
  if (Array.isArray(input)) return input
  try {
    const parsed: unknown = JSON.parse(input)
    return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === 'string') : []
  } catch { return [] }
}

export function normalizeCatalogSpecies<T extends {
  regions: string | string[]
  otherNames: string | string[]
  usageTags: string | string[]
}>(plant: T): CatalogSpecies {
  return {
    ...plant,
    regions: catalogArray(plant.regions),
    otherNames: catalogArray(plant.otherNames),
    usageTags: catalogArray(plant.usageTags),
  } as unknown as CatalogSpecies
}

export interface CalendarTips {
  wateringFrequencyDays: number
  fertilizerFrequencyDays: number
  growthCycleDays: number
  bestPlantingSeason: string
  lunarPhaseTip: string
}

export const catalogApi = {
  async list(query?: string, region?: 'costa' | 'sierra' | 'oriente' | 'galapagos'): Promise<CatalogSpecies[]> {
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    if (region) params.set('region', region)
    const suffix = params.size ? `?${params.toString()}` : ''
    const data = await request<{ species: CatalogSpecies[] }>(`/api/catalog${suffix}`)
    return data.species.map(normalizeCatalogSpecies)
  },

  async getById(id: string): Promise<CatalogSpecies> {
    const data = await request<{ species: CatalogSpecies }>(`/api/catalog/${id}`)
    return normalizeCatalogSpecies(data.species)
  },

  async getCalendarTips(speciesId: string): Promise<CalendarTips> {
    const data = await request<{ calendar: CalendarTips }>(`/api/catalog/${speciesId}/calendar`)
    return data.calendar
  },
}

// ─── Módulo de Plantas Cultivadas (Huerto 2D y Pasaporte) ─────────────────────

export interface ApiPlant {
  id: string
  plotIndex: number | null
  speciesId: string
  customName: string
  photoUrl: string
  plantingDate: string
  createdAt?: string
  notes?: string
  lifecycleStatus?: string
  observedState?: string
  growthStage?: string | null
  archivedAt?: string | null
  reviewStatus?: string   // Estado de aprobación de la siembra: PENDING | APPROVED | NEEDS_CHANGES | REJECTED
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
      plantedOn?: string
      growthStage?: string
    }
  ): Promise<ApiPlant> {
    const formData = new FormData()
    formData.append('picture', params.file)
    formData.append('speciesId', params.speciesId)
    formData.append('plotIndex', String(params.plotIndex))
    if (params.customName) formData.append('customName', params.customName)
    if (params.notes) formData.append('notes', params.notes)
    if (params.plantedOn) formData.append('plantedOn', params.plantedOn)
    if (params.growthStage) formData.append('growthStage', params.growthStage)

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

  async update(
    plantId: string,
    formData: FormData | Record<string, unknown>
  ): Promise<ApiPlant> {
    const isFormData = typeof FormData !== 'undefined' && formData instanceof FormData
    const data = await request<{ plant: ApiPlant }>(`/api/plants/${plantId}`, {
      method: 'PATCH',
      body: isFormData ? formData : JSON.stringify(formData),
    })
    return data.plant
  },

  async archive(plantId: string): Promise<ApiPlant> {
    const data = await request<{ plant: ApiPlant }>(`/api/plants/${plantId}/archive`, {
      method: 'PATCH',
    })
    return data.plant
  },

  async remove(plantId: string): Promise<void> {
    await request<unknown>(`/api/plants/${plantId}`, { method: 'DELETE' })
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

export type HealthStatus =
  | 'VIGOROSA'
  | 'EXCESO_AGUA'
  | 'EXCESO_ABONO'
  | 'ESTRES_PODA'
  | 'REQUIERE_RIEGO'
  | 'REQUIERE_ABONO'

export interface GrowthData {
  percentage: number
  stage: string
  daysUntilHarvest: number
  needsWatering: boolean
  needsFertilizer: boolean
  healthStatus?: HealthStatus
  overWatered?: boolean
  overFertilized?: boolean
  overPruned?: boolean
  lifecycleStatus: string
  plantingDate: string
  lastHarvestDate?: string | null
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

// ─── Módulo de Calendario Lunar Dinámico MSP ─────────────────────────────────

export interface LunarDayInfo {
  date: string
  timezone: string
  phase: 'dark' | 'waxing' | 'full' | 'waning'
  phaseName: string
  kichwaName: string
  fraction: number
  illuminationPercent: number
  recommendations: Array<{
    activityType: string
    title: string
    description: string
    source: string
    advisory: boolean
  }>
  advisory: boolean
}

export interface LunarMonthResponse {
  month: string
  timezone: string
  days: LunarDayInfo[]
}

export const lunarApi = {
  async getDay(date?: string, timezone = 'America/Guayaquil'): Promise<LunarDayInfo> {
    const params = new URLSearchParams()
    if (date) params.set('date', date)
    if (timezone) params.set('timezone', timezone)
    const qs = params.toString() ? `?${params.toString()}` : ''
    return await request<LunarDayInfo>(`/api/lunar-calendar${qs}`)
  },

  async getMonth(month: string, timezone = 'America/Guayaquil'): Promise<LunarMonthResponse> {
    const params = new URLSearchParams({ month, timezone })
    return await request<LunarMonthResponse>(`/api/lunar-calendar?${params.toString()}`)
  },
}

// ─── Módulo de Bitácora Viva y Actividades Agrícolas ──────────────────────────

export interface BackendActivityEvidence {
  id: string
  activityId: string
  filePath: string
  fileUrl: string
  mimeType: string
  fileSize: number
  createdAt: string
}

export interface BackendActivity {
  id: string
  gardenId: string
  actorUserId: string
  type: string
  performedDate: string
  targetKind: string
  plantId?: string | null
  plotIndex?: number | null
  notes: string
  details: string
  clientActivityId?: string | null
  voidedAt?: string | null
  voidReason?: string | null
  careLogId?: string | null
  harvestRecordId?: string | null
  createdAt: string
  evidences: BackendActivityEvidence[]
  actorUser?: { id: string; name: string; email: string }
  plant?: { id: string; customName: string; plotIndex: number | null; species: unknown }
  reviewStatus?: string | null
  reviewedById?: string | null
  reviewReason?: string | null
  reviewedAt?: string | null
}

export const activityApi = {
  async create(gardenId: string, formData: FormData | Record<string, unknown>): Promise<{ activity: BackendActivity; reward: any }> {
    const isFormData = typeof FormData !== 'undefined' && formData instanceof FormData
    return await request<{ activity: BackendActivity; reward: any }>(`/api/gardens/${gardenId}/activities`, {
      method: 'POST',
      body: isFormData ? formData : JSON.stringify(formData),
    })
  },

  async list(
    gardenId: string,
    params?: { plantId?: string; type?: string; from?: string; to?: string; includeVoided?: boolean }
  ): Promise<BackendActivity[]> {
    const query = new URLSearchParams()
    if (params?.plantId) query.set('plantId', params.plantId)
    if (params?.type) query.set('type', params.type)
    if (params?.from) query.set('from', params.from)
    if (params?.to) query.set('to', params.to)
    if (params?.includeVoided) query.set('includeVoided', 'true')
    const qs = query.toString() ? `?${query.toString()}` : ''
    return await request<BackendActivity[]>(`/api/gardens/${gardenId}/activities${qs}`)
  },

  async get(gardenId: string, activityId: string): Promise<BackendActivity> {
    return await request<BackendActivity>(`/api/gardens/${gardenId}/activities/${activityId}`)
  },

  async void(gardenId: string, activityId: string, reason: string): Promise<{ activity: BackendActivity; pointsReverted: number }> {
    return await request<{ activity: BackendActivity; pointsReverted: number }>(
      `/api/gardens/${gardenId}/activities/${activityId}/void`,
      {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }
    )
  },
}

// ─── Módulo de Recompensas: Semillas de Vida y Misiones ───────────────────────

export interface RewardsSummary {
  userId: string
  points: number
  level: string
  nextLevel: string | null
  remaining: number
  progressPercent: number
  ledger: Array<{
    id: string
    eventType: string
    sourceId: string
    pointsDelta: number
    reason: string
    awardedAt: string
  }>
  badges: Array<{
    badgeId: string
    earnedAt: string
  }>
  missions: Array<{
    missionId: string
    currentValue: number
    targetValue: number
    completed: boolean
    completedAt?: string | null
    rewardPoints?: number
  }>
  review?: {
    source: 'server'
    updatedAt: string
    totals: {
      provisional: number
      confirmed: number
      reverted: number
    }
    entries: Array<{
      id: string
      evidenceId: string
      activityName: string
      status: 'PENDING' | 'NEEDS_CHANGES' | 'APPROVED' | 'REJECTED'
      submittedAt: string
      reviewedAt?: string | null
      plantName?: string | null
      gardenName?: string | null
      reviewerNote?: string | null
      effect: 'provisional' | 'confirmed' | 'reverted' | 'none'
      points?: number | null
    }>
  } | null
}

export const rewardsApi = {
  async getSummary(): Promise<RewardsSummary> {
    return await request<RewardsSummary>('/api/users/me/rewards')
  },
}

// ─── Módulo de Notificaciones Oficiales ──────────────────────────────────────

export interface UserNotification {
  id: string
  userId: string
  type: string
  title: string
  message: string
  resourceId?: string | null
  isRead: boolean
  createdAt: string
}

export const notificationApi = {
  async list(): Promise<{ notifications: UserNotification[]; unreadCount: number }> {
    return await request<{ notifications: UserNotification[]; unreadCount: number }>('/api/notifications')
  },
  async markRead(id: string): Promise<void> {
    await request(`/api/notifications/${id}/read`, { method: 'PATCH' })
  },
  async markAllRead(): Promise<void> {
    await request('/api/notifications/read-all', { method: 'PATCH' })
  },
  async clearRead(): Promise<{ deleted: number }> {
    return await request<{ deleted: number }>('/api/notifications/read', { method: 'DELETE' })
  },
}

// ─── Módulo de Administración (Técnico y MSP) ────────────────────────────────

export interface AdminUserItem {
  id: string
  name: string
  email: string
  role: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface AuditLogItem {
  id: string
  actorId: string
  action: string
  targetEntity: string
  targetId: string | null
  details: string | null
  createdAt: string
  actor: {
    id: string
    name: string
    email: string
    role: string
  }
}

/** Recorre todas las páginas del backend MSP; nunca ocultar registros posteriores al primero. */
async function listAllMspRecords<T>(collection: 'communities' | 'activities'): Promise<T[]> {
  const records: T[] = []
  let page = 1
  let totalPages = 1
  do {
    const response = await request<Record<string, unknown>>(`/api/admin/msp/${collection}?limit=100&page=${page}`)
    const items = response[collection]
    if (!Array.isArray(items)) throw new Error(`Respuesta inválida del listado MSP: ${collection}.`)
    records.push(...items as T[])
    totalPages = typeof response.totalPages === 'number' && Number.isFinite(response.totalPages)
      ? Math.max(1, response.totalPages) : 1
    page += 1
  } while (page <= totalPages)
  return records
}

export const adminApi = {
  // Técnico
  async listUsers(): Promise<AdminUserItem[]> {
    // El backend devuelve ok(res, users) → data = users (array directo)
    return await request<AdminUserItem[]>('/api/admin/technical/users')
  },

  async createMspUser(data: { name: string; email: string; password: string }): Promise<AdminUserItem> {
    // El backend devuelve ok(res, user) → data = user (objeto directo)
    return await request<AdminUserItem>('/api/admin/technical/msp-users', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async toggleUserStatus(id: string, isActive: boolean): Promise<AdminUserItem> {
    // Backend: ok(res, updated) → data = objeto user directo
    return await request<AdminUserItem>(`/api/admin/technical/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    })
  },

  async listAuditLogs(): Promise<{ logs: AuditLogItem[] }> {
    return await request<{ logs: AuditLogItem[] }>('/api/admin/technical/audit-logs?limit=100')
  },

  // MSP
  async listCommunities(): Promise<{ communities: any[] }> {
    return { communities: await listAllMspRecords<any>('communities') }
  },

  async reviewCommunity(id: string, data: { action: 'APPROVED' | 'NEEDS_CHANGES' | 'REJECTED'; reason?: string }): Promise<{ message: string; community: any }> {
    return await request<{ message: string; community: any }>(`/api/admin/msp/communities/${id}/review`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async listActivities(): Promise<{ activities: any[] }> {
    return { activities: await listAllMspRecords<any>('activities') }
  },

  async reviewActivity(id: string, data: { action: 'APPROVED' | 'NEEDS_CHANGES' | 'REJECTED'; reason?: string }): Promise<{ activity: any; reward?: { pointsAwarded: number } | null; pointsReverted?: number }> {
    return await request<{ activity: any; reward?: { pointsAwarded: number } | null; pointsReverted?: number }>(`/api/admin/msp/activities/${id}/review`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  // Eventos Institucionales MSP
  async listEvents(): Promise<{ events: any[] }> {
    return await request<{ events: any[] }>('/api/admin/msp/events')
  },
  async createEvent(data: { name: string; date: string; province?: string; canton?: string; scope?: string; description?: string }): Promise<{ event: any }> {
    return await request<{ event: any }>('/api/admin/msp/events', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
  async deleteEvent(id: string): Promise<{ deleted: boolean }> {
    return await request<{ deleted: boolean }>(`/api/admin/msp/events/${id}`, {
      method: 'DELETE',
    })
  },

  // Recursos Educativos MSP
  async listResources(): Promise<{ resources: any[] }> {
    return await request<{ resources: any[] }>('/api/admin/msp/resources')
  },
  async createResource(data: { title: string; kind?: string; description?: string; fileUrl?: string; published?: boolean }): Promise<{ resource: any }> {
    return await request<{ resource: any }>('/api/admin/msp/resources', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
  async deleteResource(id: string): Promise<{ deleted: boolean }> {
    return await request<{ deleted: boolean }>(`/api/admin/msp/resources/${id}`, {
      method: 'DELETE',
    })
  },
}

