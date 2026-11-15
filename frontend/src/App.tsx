import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import AuthPage from './features/auth/AuthPage'
import type { AuthSubmitHandler } from './features/auth/auth'
import MyGardenPage from './features/my-garden/MyGardenPage'
import GardenNavigation from './features/my-garden/GardenNavigation'
import GardenHistory from './features/my-garden/GardenHistory'
import PlantPassport from './features/my-garden/PlantPassport'
import NotificationsModal from './features/notifications/NotificationsModal'
import PlantEditor from './features/my-garden/PlantEditor'
import GardenPlants from './features/my-garden/GardenPlants'
import PlantRegistrationModal, { type PlantRegistrationDraft } from './features/my-garden/PlantRegistrationModal'
import { PLANT_SPECIES as SPECIES, type PlantRegistration, type PlantRegistrationResult } from './features/my-garden/plant-species'
import RegionalCatalog from './features/medicinal-catalog/RegionalCatalog'
import regionalSpecies from './features/medicinal-catalog/regional-species.json'
import CommunitiesPage, { type CommunityEntryAction } from './features/communities/CommunitiesPage'
import type { Community } from './features/communities/communities'
import RealGardenPage from './features/real-gardens/RealGardenPage'
import { parseRealGarden, toGardenDraft, type RealGarden, type RealGardenDraft } from './features/real-gardens/real-garden'
import { PLOT_COUNT, type GardenAction, type GardenDestination, type GardenPlant } from './features/my-garden/garden'
import type { AuthSubmission } from './features/auth/auth'
import {
  authApi,
  communityApi,
  gardenApi,
  catalogApi,
  plantApi,
  careApi,
  harvestApi,
  activityApi,
  invitationApi,
  notificationApi,
  memberApi,
  getUser,
  resolveMediaUrl,
  type UserSession,
  type CommunityInvitationItem,
  type BackendActivity,
  type CatalogSpecies,
  normalizeCatalogSpecies,
  rewardsApi,
  type RewardsSummary,
} from './services/api'
import type { AuthoritativeRewards, RewardBadgeId, RewardMissionId, RewardLevel } from './features/my-garden/rewards/rewards-types'
import { regionForProvince } from './features/real-gardens/garden-region'
import { matchesCommunityLocation, withCommunityLocation } from './features/real-gardens/garden-community-location'
import type { GardenSceneRenderer } from './features/my-garden/garden-scene-renderer'
import { localDate, recordId, validatePlantUpdate, validDate, type PlantUpdate } from './features/my-garden/plant-record'
import { isGrowthStage } from './features/my-garden/growth-stages'
import { useGardenJournal } from './features/my-garden/journal/useGardenJournal'
import type { GardenJournal } from './features/my-garden/journal/journal'
import ActivityModal from './features/my-garden/journal/ActivityModal'
import { type ActivityDraft, type ActivityType, type GardenActivity } from './features/my-garden/journal/activities'
import './features/my-garden/garden-journal.css'
import GardenProgress from './features/my-garden/GardenProgress'
import { calculateProgress } from './features/my-garden/journal/progress'

type Screen = 'Bienvenida' | 'Inicio' | 'Usuarios' | 'Comunidades' | 'Mi terreno' | 'Plantas medicinales' | 'Mis plantas' | 'Bitácora' | 'Mi historia' | 'Mi camino verde'

const SCREEN_PATHS: Record<Screen, string> = {
  Bienvenida: '#bienvenida',
  Inicio: '#mi-jardin',
  Usuarios: '#usuarios',
  Comunidades: '#comunidades',
  'Mi terreno': '#mi-jardin/terreno',
  'Plantas medicinales': '#plantas',
  'Mis plantas': '#mis-plantas',
  'Bitácora': '#bitacora',
  'Mi historia': '#mi-historia',
  'Mi camino verde': '#progreso',
}

function currentScreen(): Screen {
  if (window.location.hash.startsWith('#plantas/')) return 'Plantas medicinales'
  if (window.location.hash === '#huerto-real') return 'Mi terreno'
  return (Object.keys(SCREEN_PATHS) as Screen[]).find(key => SCREEN_PATHS[key] === window.location.hash) ?? 'Bienvenida'
}

const draftKey = (draft: RealGardenDraft) =>
  JSON.stringify({ ...draft, photo: draft.photo ? [draft.photo.name, draft.photo.size, draft.photo.lastModified] : null })

function photoExtension(blob: Blob): string {
  const mime = (blob.type || '').toLowerCase()
  if (mime === 'image/png') return 'png'
  if (mime === 'image/webp') return 'webp'
  return 'jpg'
}

export default function App({
  onAuthenticate,
  renderGardenScene,
}: {
  onAuthenticate?: AuthSubmitHandler
  renderGardenScene?: GardenSceneRenderer
} = {}) {
  const [user, setUser] = useState<UserSession | null>(() => getUser())
  const [authenticated, setAuthenticated] = useState<boolean>(() => Boolean(getUser()))

  // Bitácora local IndexedDB (modo visitante)
  const journal = useGardenJournal(!user)
  const [serverActivityRevision, setServerActivityRevision] = useState(0)

  // Estado del backend cuando hay usuario con sesión activa
  const [backendCommunity, setBackendCommunity] = useState<Community | null>(null)
  const [activeCommunityId, setActiveCommunityId] = useState<string | null>(null)
  const [userCommunities, setUserCommunities] = useState<Community[]>([])
  const [currentCommunityRole, setCurrentCommunityRole] = useState<'RESPONSABLE' | 'PARTICIPANTE' | null>(null)
  const [activeCommunityMembers, setActiveCommunityMembers] = useState<any[]>([])
  const [backendGarden, setBackendGarden] = useState<RealGarden | null>(null)
  const [activeGardenId, setActiveGardenId] = useState<string | null>(null)
  const [backendPlants, setBackendPlants] = useState<GardenPlant[]>([])
  const [backendActivities, setBackendActivities] = useState<GardenActivity[]>([])
  const [pendingInvitations, setPendingInvitations] = useState<CommunityInvitationItem[]>([])
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0)
  const [isNotificationsOpen, setNotificationsOpen] = useState(false)
  const [speciesCatalog, setSpeciesCatalog] = useState<CatalogSpecies[]>(() => regionalSpecies.map(normalizeCatalogSpecies))
  const [catalogServerLoaded, setCatalogServerLoaded] = useState(false)
  const [serverRewards, setServerRewards] = useState<RewardsSummary | null>(null)

  // Selección unificada de datos según modo (Backend o Visitante)
  const communityRecord = user ? backendCommunity : journal.data.community
  const realGarden = user ? backendGarden : journal.data.terrain
  // En la sesión las evidencias reales provienen de la Bitácora SQLite,
  // no de IndexedDB de visitante ni solo de la última foto de la planta.
  const serverPlantsWithEvidence = useMemo(() => backendPlants.map(plant => {
    const evidences = backendActivities
      .filter(activity =>
        !activity.voidedAt &&
        activity.gardenId === activeGardenId &&
        (activity.type === 'sowing' || activity.type === 'observation') &&
        activity.target.kind === 'plant' && activity.target.plantId === plant.id
      )
      .flatMap(activity => (activity.photos ?? []).map((photo, index) => ({
        id: `${activity.id}-evidence-${index}`,
        date: activity.date,
        notes: activity.notes,
        photo,
        photoId: activity.photoIds[index],
        growthStage: isGrowthStage(activity.details.growthStage) ? activity.details.growthStage : undefined,
        heightCm: typeof activity.details.heightCm === 'number' ? activity.details.heightCm : undefined,
        reviewStatus: activity.reviewStatus,
      })))
      .sort((a, b) => a.date.localeCompare(b.date))
    return { ...plant, evidences }
  }), [backendPlants, backendActivities, activeGardenId])
  const plants = user ? serverPlantsWithEvidence : journal.plants
  const activePlants = plants.filter(plant => !plant.archivedAt)
  const activities = user && activeGardenId ? backendActivities : journal.data.activities

  const effectiveJournal: GardenJournal = useMemo(() => {
    if (user && activeGardenId) {
      return {
        version: 1,
        revision: 1,
        gardenId: activeGardenId,
        community: backendCommunity,
        terrain: backendGarden,
        plants: serverPlantsWithEvidence,
        activities: backendActivities,
        appliedCommands: [],
      }
    }
    return journal.data
  }, [user, activeGardenId, backendCommunity, backendGarden, serverPlantsWithEvidence, backendActivities, journal.data])

  const [screen, setScreen] = useState<Screen>(currentScreen)
  const [communityEntry, setCommunityEntry] = useState<CommunityEntryAction | null>(null)
  const [realGardenDraft, setRealGardenDraft] = useState<RealGardenDraft>(() => toGardenDraft(null))
  const previousTerrain = useRef<RealGarden | null>(null)
  const initializedDraft = useRef(false)
  const [registration, setRegistration] = useState<PlantRegistrationDraft | null>(null)
  const [pendingRegistration, setPendingRegistration] = useState<PlantRegistrationDraft | null>(null)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [activityForm, setActivityForm] = useState<{ plantId?: string; plot?: number | null; type?: ActivityType } | null>(null)
  const [feedback, setFeedback] = useState<{ id: string; type: ActivityType; plot: number | null } | null>(null)
  const [notice, setNotice] = useState('')
  const [selectedPlot, setSelectedPlot] = useState<number | null>(null)

  const detail = plants.find(plant => plant.id === detailId) ?? null
  const editingPlant = plants.find(plant => plant.id === editingId)
  const activeUser = user?.name || communityRecord?.responsible
  const progress = useMemo(() => calculateProgress(effectiveJournal, activeUser), [effectiveJournal, activeUser])

  // El API es la fuente de verdad; la lista local solo permite consultar en ausencia de servidor.
  useEffect(() => {
    let mounted = true
    catalogApi.list()
      .then(items => {
        if (!mounted) return
        if (items && items.length > 0) {
          setSpeciesCatalog(items.map(normalizeCatalogSpecies))
          setCatalogServerLoaded(true)
        }
      })
      .catch(() => { if (mounted) setCatalogServerLoaded(false) })
    return () => { mounted = false }
  }, [])

  // Resolver rol del usuario y miembros de la comunidad activa
  const refreshActiveCommunityMembers = useCallback(async () => {
    if (!user || !activeCommunityId) {
      setCurrentCommunityRole(null)
      setActiveCommunityMembers([])
      return
    }
    try {
      const members = await memberApi.list(activeCommunityId)
      setActiveCommunityMembers(members || [])
      const mine = (members || []).find(m => m.userId === user.id && m.status === 'ACCEPTED')
      if (mine) {
        setCurrentCommunityRole(mine.roleInCommunity === 'RESPONSABLE' ? 'RESPONSABLE' : 'PARTICIPANTE')
      } else if (communityRecord && (communityRecord as any).creatorId === user.id) {
        setCurrentCommunityRole('RESPONSABLE')
      } else {
        setCurrentCommunityRole(user.role === 'RESPONSABLE' ? 'RESPONSABLE' : 'PARTICIPANTE')
      }
    } catch {
      setActiveCommunityMembers([])
      if (communityRecord && (communityRecord as any).creatorId === user.id) {
        setCurrentCommunityRole('RESPONSABLE')
      } else {
        setCurrentCommunityRole(null)
      }
    }
  }, [activeCommunityId, communityRecord, user])

  const refreshCommunities = useCallback(async () => {
    if (!user) return
    try {
      const list = await communityApi.list()
      setUserCommunities(list || [])
      if (activeCommunityId && list) {
        const found = list.find((c: any) => c.id === activeCommunityId)
        if (found) setBackendCommunity(found as unknown as Community & { id: string })
      }
    } catch {}
  }, [user, activeCommunityId])

  const handleMembersUpdated = useCallback(async () => {
    await refreshActiveCommunityMembers()
    await refreshCommunities()
  }, [refreshActiveCommunityMembers, refreshCommunities])

  useEffect(() => {
    refreshActiveCommunityMembers()
  }, [refreshActiveCommunityMembers])

  const acceptedMembersCount = useMemo(() => {
    if (!user) return (communityRecord?.members?.length ?? 0) + 1
    const accepted = activeCommunityMembers.filter(m => m.status === 'ACCEPTED').length
    return accepted > 0 ? accepted : (communityRecord ? 1 : 0)
  }, [user, activeCommunityMembers, communityRecord])

  const pendingCommunityInvitationsCount = useMemo(() => {
    if (!user) return 0
    return activeCommunityMembers.filter(m => m.status === 'PENDING').length
  }, [user, activeCommunityMembers])

  // Cargar invitaciones pendientes y notificaciones no leídas
  async function loadPendingInvitations() {
    if (!user) {
      setPendingInvitations([])
      setUnreadNotificationsCount(0)
      return
    }
    try {
      const [list, notifRes] = await Promise.all([
        invitationApi.getMyInvitations().catch(() => []),
        notificationApi.list().catch(() => ({ notifications: [], unreadCount: 0 })),
      ])
      setPendingInvitations(list || [])
      setUnreadNotificationsCount(notifRes.unreadCount || 0)
    } catch {
      setPendingInvitations([])
      setUnreadNotificationsCount(0)
    }
  }

  const totalNotificationsCount = pendingInvitations.length + unreadNotificationsCount

  useEffect(() => {
    void loadPendingInvitations()
    if (user) void reloadServerRewards()
  }, [user])

  useEffect(() => {
    if (!user) return
    const refresh = () => {
      void loadPendingInvitations()
      void reloadServerRewards()
    }
    const interval = window.setInterval(refresh, 30000)
    window.addEventListener('focus', refresh)
    return () => {
      window.clearInterval(interval)
      window.removeEventListener('focus', refresh)
    }
  }, [user])

  // Cargar datos persistentes del usuario desde SQLite
  useEffect(() => {
    if (!user) return
    communityApi
      .list()
      .then(list => {
        const comms = list || []
        setUserCommunities(comms)
        if (comms.length > 0) {
          const own = comms.find((c: any) => c.creatorId === user.id)
          const active = (own || comms[0]) as unknown as Community & { id: string }
          setBackendCommunity(active)
          if (active.id) {
            setActiveCommunityId(active.id)
            loadGardenForCommunity(active.id)
          }
        } else {
          setBackendCommunity(null)
          setActiveCommunityId(null)
          setActiveGardenId(null)
          setBackendGarden(null)
          setRealGardenDraft(toGardenDraft(null))
          setBackendPlants([])
        }
      })
      .catch(() => {
        setUserCommunities([])
        setBackendCommunity(null)
        setActiveCommunityId(null)
        setActiveGardenId(null)
        setBackendGarden(null)
        setRealGardenDraft(toGardenDraft(null))
        setBackendPlants([])
      })
  }, [user])

  function mapBackendActivity(b: BackendActivity): GardenActivity {
    let detailsObj: any = {}
    try {
      detailsObj = typeof b.details === 'string' ? JSON.parse(b.details || '{}') : (b.details || {})
    } catch {
      detailsObj = {}
    }
    const target: GardenActivity['target'] =
      b.targetKind === 'plant' && b.plantId
        ? { kind: 'plant', plantId: b.plantId, plot: b.plotIndex ?? 0 }
        : b.targetKind === 'plot'
        ? { kind: 'plot', plot: b.plotIndex ?? 0 }
        : { kind: 'garden' }

    const photoUrls = b.evidences?.map(e => resolveMediaUrl(e.fileUrl)) || []

    return {
      id: b.id,
      gardenId: b.gardenId,
      type: b.type as any,
      date: b.performedDate,
      responsible: b.actorUser?.name || 'Comunidad',
      target,
      notes: b.notes || '',
      photoIds: photoUrls.map((_, i) => `${b.id}-photo-${i}`),
      photos: photoUrls,
      details: detailsObj,
      createdAt: b.createdAt,
      validation: 'local-v1',
      voidedAt: b.voidedAt ?? undefined,
      voidReason: b.voidReason ?? undefined,
      reviewStatus: b.reviewStatus ?? undefined,
      reviewedById: b.reviewedById ?? undefined,
      reviewReason: b.reviewReason ?? undefined,
      reviewedAt: b.reviewedAt ?? undefined,
      careLogId: b.careLogId ?? null,
      harvestRecordId: b.harvestRecordId ?? null,
    }
  }

  function toAuthoritativeRewards(summary: RewardsSummary): AuthoritativeRewards {
    const badgeMap: Record<string, RewardBadgeId> = {
      FIRST_SOWING: 'first-sowing',
      'first-sowing': 'first-sowing',
      CARE_EXCELLENCE: 'care',
      care: 'care',
      MINDFUL_OBSERVER: 'observer',
      observer: 'observer',
      BOUNTIFUL_HARVEST: 'harvest',
      harvest: 'harvest',
    }
    const missionMap: Record<string, RewardMissionId> = {
      ROOT_CARE: 'care',
      care: 'care',
      OBSERVATION_JOURNAL: 'observer',
      observer: 'observer',
      LUNAR_RHYTHM: 'lunar',
      'lunar-cycle': 'lunar',
      lunar: 'lunar',
    }
    return {
      source: 'server',
      seeds: summary.points,
      level: (['Aprendiz', 'Oficial', 'Maestro'].includes(summary.level) ? summary.level : 'Aprendiz') as RewardLevel,
      nextLevel: (summary.nextLevel && ['Aprendiz', 'Oficial', 'Maestro'].includes(summary.nextLevel) ? summary.nextLevel : undefined) as RewardLevel | undefined,
      progressPercent: summary.progressPercent,
      remaining: summary.remaining,
      badges: (['first-sowing', 'care', 'observer', 'harvest'] as RewardBadgeId[]).map(id => {
        const match = summary.badges.find(b => {
          const rawCode = (b as any).badgeId || (b as any).code
          return badgeMap[rawCode] === id
        })
        return { id, earned: Boolean(match), earnedAt: match?.earnedAt }
      }),
      missions: (['care', 'observer', 'lunar'] as RewardMissionId[]).map(id => {
        const match = summary.missions.find(m => {
          const rawCode = (m as any).missionId || (m as any).code
          return missionMap[rawCode] === id
        })
        return {
          id,
          current: match ? (match as any).currentValue ?? (match as any).progress ?? 0 : 0,
          target: match ? (match as any).targetValue ?? (match as any).targetCount ?? 3 : 3,
          completed: match ? Boolean((match as any).completed || (match as any).status === 'COMPLETED') : false,
          rewardSeeds: (match as any)?.rewardPoints ?? 20,
        }
      }),
    }
  }

  async function reloadServerRewards() {
    if (!user) {
      setServerRewards(null)
      return
    }
    try {
      const summary = await rewardsApi.getSummary()
      setServerRewards(summary)
    } catch {
      // Si falla la sincronización, el estado fallback usa la bitácora
    }
  }

  async function reloadBackendActivities(gId: string) {
    try {
      // Recuperar también las anuladas: conservan enlaces a cuidados/cosechas
      // y evitan que la Bitácora vuelva a mostrarlas como registros legados activos.
      const list = await activityApi.list(gId, { includeVoided: true })
      if (list && Array.isArray(list)) {
        setBackendActivities(list.map(mapBackendActivity))
      }
      void reloadServerRewards()
    } catch (err) {
      console.error('Error cargando actividades del servidor:', err)
    }
  }

  async function loadGardenForCommunity(cId: string) {
    try {
      const gardensList = await gardenApi.list(cId)
      if (gardensList && gardensList.length > 0) {
        const g = gardensList[0] as unknown as RealGarden & { id: string }
        setActiveGardenId(g.id)
        setBackendGarden(g)
        setRealGardenDraft(toGardenDraft(g))

        const apiPlants = await plantApi.listByGarden(g.id)
        if (apiPlants && apiPlants.length > 0) {
          const activeList = apiPlants.filter(p => p.lifecycleStatus !== 'REMOVED')
          setBackendPlants(
            activeList.map(p => ({
              id: p.id,
              name: p.customName || p.species?.name || p.speciesId,
              latin: p.species?.latinName || '',
              photo: resolveMediaUrl(p.photoUrl),
              date: new Date(p.createdAt ?? p.plantingDate).toLocaleDateString('es-EC'),
              plantedOn: p.plantingDate.slice(0, 10),
              plot: p.plotIndex ?? -1,
              createdAt: (p as any).createdAt || new Date(p.plantingDate).toISOString(),
              state: (p as any).observedState || (p.lifecycleStatus === 'READY_TO_HARVEST' ? 'mature' : 'growing'),
              growthStage: isGrowthStage(p.growthStage) ? p.growthStage : undefined,
              observations: p.notes || '',
              archivedAt: p.archivedAt ? new Date(p.archivedAt).toISOString() : (p.lifecycleStatus === 'ARCHIVED' ? new Date().toISOString() : undefined),
              reviewStatus: p.reviewStatus ?? 'APPROVED', // Propagar estado de aprobación de siembra al frontend
            }))
          )
        } else {
          setBackendPlants([])
        }
        await reloadBackendActivities(g.id)
      } else {
        setActiveGardenId(null)
        setBackendGarden(null)
        setRealGardenDraft(toGardenDraft(null))
        setBackendPlants([])
        setBackendActivities([])
      }
    } catch {
      setActiveGardenId(null)
      setBackendGarden(null)
      setRealGardenDraft(toGardenDraft(null))
      setBackendPlants([])
      setBackendActivities([])
    }
  }

  async function selectActiveCommunity(comm: Community) {
    setBackendCommunity(comm)
    const cId = (comm as any).id
    if (cId) {
      setActiveCommunityId(cId)
      await loadGardenForCommunity(cId)
    }
  }

  async function handleInvitationAccepted(communityId: string) {
    try {
      const list = await communityApi.list()
      setUserCommunities(list || [])
      const found = list.find((c: any) => c.id === communityId)
      if (found) {
        await selectActiveCommunity(found)
      } else if (list && list.length > 0 && !backendCommunity) {
        await selectActiveCommunity(list[0])
      }
      await loadPendingInvitations()
      await handleMembersUpdated()
    } catch {}
  }

  // Sincronización de borrador de huerto
  useEffect(() => {
    if (!user && !journal.ready) return
    const previous = previousTerrain.current
    setRealGardenDraft(current => {
      if (!initializedDraft.current || draftKey(current) === draftKey(toGardenDraft(previous))) {
        return realGarden ? toGardenDraft(realGarden) : communityRecord ? withCommunityLocation(current, communityRecord) : current
      }
      return current
    })
    initializedDraft.current = true
    previousTerrain.current = realGarden
  }, [user, journal.ready, realGarden, communityRecord])

  // Desplazar al encabezado al cambiar de pantalla
  useEffect(() => {
    if (screen === 'Bienvenida' || screen === 'Usuarios') return
    document.querySelector<HTMLElement>('[data-screen-heading]')?.focus({ preventScroll: true })
    window.scrollTo(0, 0)
  }, [screen])

  // Gestión de URLs mediante hash
  useEffect(() => {
    if (!window.location.hash) window.history.replaceState(null, '', SCREEN_PATHS.Bienvenida)
    const restore = () => {
      setRegistration(null)
      setDetailId(null)
      setEditingId(null)
      setActivityForm(null)
      setFeedback(null)
      setCommunityEntry(null)
      setScreen(currentScreen())
    }
    window.addEventListener('popstate', restore)
    window.addEventListener('hashchange', restore)
    return () => {
      window.removeEventListener('popstate', restore)
      window.removeEventListener('hashchange', restore)
    }
  }, [])

  useEffect(() => {
    if (!feedback) return
    const timeout = setTimeout(() => setFeedback(null), 2200)
    return () => clearTimeout(timeout)
  }, [feedback])

  useEffect(() => {
    if (!notice) return
    const timeout = setTimeout(() => setNotice(''), 4000)
    return () => clearTimeout(timeout)
  }, [notice])

  function goto(next: Screen) {
    if (window.location.hash !== SCREEN_PATHS[next]) window.history.pushState(null, '', SCREEN_PATHS[next])
    setRegistration(null)
    setDetailId(null)
    setEditingId(null)
    setActivityForm(null)
    setFeedback(null)
    setNotice('')
    setCommunityEntry(null)
    setScreen(next)
  }

  function openCommunity(action: CommunityEntryAction) {
    goto('Comunidades')
    setCommunityEntry(action)
  }

  function connectGarden() {
    goto('Inicio')
    if (pendingRegistration) {
      setRegistration(pendingRegistration)
      setPendingRegistration(null)
    }
  }

  async function handleAuth(submission: AuthSubmission): Promise<{ message: string; authenticated?: boolean }> {
    try {
      if (onAuthenticate) {
        const result = await onAuthenticate(submission)
        setAuthenticated(true)
        setNotice(result.message)
        setTimeout(() => goto('Inicio'), 500)
        return result
      }
      const result = await authApi.handleSubmission(submission)
      setUser(result.user)
      setAuthenticated(true)

      // Redirección estricta para roles administrativos — no deben ver la interfaz comunitaria
      if (result.user.role === 'ADMIN_MSP') {
        window.location.hash = '#admin-msp'
        return { message: 'Bienvenido al Portal de Supervisión MSP.', authenticated: true }
      }
      if (result.user.role === 'ADMIN_TECNICO') {
        window.location.hash = '#admin-tecnico'
        return { message: 'Bienvenido al Portal de Administración Técnica.', authenticated: true }
      }

      setNotice(result.message)
      setTimeout(() => goto('Inicio'), 500)
      return { message: result.message, authenticated: true }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al conectar con el servidor.'
      throw new Error(msg)
    }
  }

  function handleLogout() {
    authApi.logout()
    setUser(null)
    setAuthenticated(false)
    setBackendCommunity(null)
    setActiveCommunityId(null)
    setCurrentCommunityRole(null)
    setBackendGarden(null)
    setActiveGardenId(null)
    setBackendPlants([])
    setBackendActivities([])
    setPendingInvitations([])
    setUnreadNotificationsCount(0)
    setUserCommunities([])
    setNotificationsOpen(false)
    goto('Bienvenida')
  }

  async function saveCommunity(next: Community) {
    if (user) {
      try {
        const targetId = (next as any).id || activeCommunityId || (communityRecord as any)?.id
        let savedCommunity: Community & { id: string }
        const isEditing = Boolean(targetId)

        if (isEditing) {
          savedCommunity = await communityApi.update(targetId, next)
          setNotice('¡Comunidad actualizada con éxito!')
        } else {
          savedCommunity = await communityApi.create(next)
          setActiveCommunityId(savedCommunity.id)
          setNotice('¡Comunidad guardada con éxito en la base de datos!')
        }

        setBackendCommunity(savedCommunity)
        const list = await communityApi.list()
        setUserCommunities(list || [])

        // Si se editó la comunidad y hay huerto real asociado, sincronizar ubicación si cambió
        if (isEditing && activeGardenId && backendGarden && matchesCommunityLocation(toGardenDraft(backendGarden), communityRecord) &&
          (next.province !== communityRecord?.province || next.cantonCode !== communityRecord?.cantonCode || next.parishCode !== communityRecord?.parishCode)) {
          try {
            const parsed = parseRealGarden(withCommunityLocation(toGardenDraft(backendGarden), savedCommunity), savedCommunity.name)
            if (parsed.ok) {
              const updatedGarden = await gardenApi.update(activeGardenId, parsed.garden, savedCommunity.id)
              setBackendGarden(updatedGarden)
              setRealGardenDraft(toGardenDraft(updatedGarden))
            }
          } catch {}
        }

        const membersToInvite = (next.members || []).filter(
          m => m.email && m.email.trim() && (m.inviteStatus === 'ready_to_send' || (m.inviteStatus !== 'sent' && m.inviteStatus !== 'already_member' && m.inviteStatus !== 'pending'))
        )
        if (membersToInvite.length > 0) {
          const results = await Promise.allSettled(
            membersToInvite.map(m =>
              memberApi.invite(
                savedCommunity.id,
                m.email!.trim().toLowerCase(),
                m.role || 'PARTICIPANTE'
              )
            )
          )
          const successful = results.filter(r => r.status === 'fulfilled').length
          const rejected = results.filter(r => r.status === 'rejected') as PromiseRejectedResult[]
          if (successful > 0 && rejected.length === 0) {
            setNotice(`¡Comunidad guardada y se enviaron ${successful} solicitud(es) de integrante!`)
          } else if (successful > 0 && rejected.length > 0) {
            setNotice(`¡Comunidad guardada! Se enviaron ${successful} invitación(es) (${rejected.length} fallaron o usuario no registrado).`)
          } else if (rejected.length > 0) {
            const errMsg = rejected[0].reason instanceof Error ? rejected[0].reason.message : 'Verifica que los correos existan'
            setNotice(`¡Comunidad guardada! No se pudieron enviar solicitudes: ${errMsg}`)
          }
        }

        if (savedCommunity.id) {
          try {
            await handleMembersUpdated()
          } catch {}
        }

        if (communityEntry === 'create') goto('Inicio')
      } catch (err: unknown) {
        setNotice(err instanceof Error ? err.message : 'Error al guardar la comunidad')
        throw err
      }
    } else {
      const saved = await journal.commit({ id: recordId('community-save'), type: 'community', community: next })
      if (!saved.terrain) {
        setRealGardenDraft(current => {
          if (matchesCommunityLocation(current, next) || (current.province && !matchesCommunityLocation(current, communityRecord))) return current
          return { ...withCommunityLocation(current, next), reference: current.reference && current.reference !== communityRecord?.sector ? current.reference : next.sector ?? '' }
        })
      }
      setNotice('Comunidad guardada en este navegador.')
      if (communityEntry === 'create') goto('Inicio')
    }
  }

  async function saveGarden(next: RealGarden) {
    if (user) {
      try {
        let saved: RealGarden & { id: string }
        if (activeGardenId) {
          saved = await gardenApi.update(activeGardenId, next, activeCommunityId)
        } else {
          saved = await gardenApi.create(next, activeCommunityId)
        }
        if (saved?.id) setActiveGardenId(saved.id)
        setBackendGarden(saved)
        setRealGardenDraft(toGardenDraft(saved))
        if (activeCommunityId) {
          await loadGardenForCommunity(activeCommunityId)
        }
        setNotice('¡Huerto real guardado y sincronizado con la comunidad!')
        return saved
      } catch (err: unknown) {
        setNotice(err instanceof Error ? err.message : 'Error al guardar el huerto')
        throw err
      }
    } else {
      const saved = await journal.commit({ id: recordId('terrain-save'), type: 'terrain', terrain: next })
      setRealGardenDraft(toGardenDraft(saved.terrain))
      setNotice('Terreno guardado en este navegador.')
      return saved.terrain ?? undefined
    }
  }

  async function addPlant(input: PlantRegistration): Promise<PlantRegistrationResult> {
    if (user) {
      if (!activeGardenId) {
        return { ok: false, error: 'Primero vincula tu comunidad y registra tu huerto real.' }
      }
      if (!Number.isInteger(input.plot) || input.plot < 0 || input.plot >= PLOT_COUNT) {
        return { ok: false, error: 'Selecciona un espacio de cultivo válido.' }
      }
      if (activePlants.some(plant => plant.plot === input.plot)) {
        return { ok: false, error: 'Ese espacio ya tiene una planta. Elige otro espacio disponible.' }
      }

      try {
        const ext = photoExtension(input.photo)
        const file = new File([input.photo], `${input.species.name.toLowerCase().replace(/\s+/g, '-')}.${ext}`, {
          type: input.photo.type || 'image/jpeg',
        })
        const apiPlant = await plantApi.register(activeGardenId, {
          file,
          speciesId: input.species.id ?? input.species.name,
          plotIndex: input.plot,
          customName: input.species.name,
          notes: input.plantedOn ? `Sembrada el ${input.plantedOn}` : 'Registrada con cámara Kawsapacha',
          plantedOn: input.plantedOn || undefined,
          growthStage: input.growthStage || undefined,
        })

        const record: GardenPlant = {
          id: apiPlant.id,
          name: apiPlant.species?.name || input.species.name,
          latin: apiPlant.species?.latinName || input.species.latin,
          photo: resolveMediaUrl(apiPlant.photoUrl),
          date: new Date(apiPlant.plantingDate).toLocaleDateString('es-EC'),
          plot: apiPlant.plotIndex ?? 0,
          plantedOn: input.plantedOn,
          createdAt: (apiPlant as any).createdAt || new Date(apiPlant.plantingDate).toISOString(),
          state: 'observed',
          growthStage: isGrowthStage(apiPlant.growthStage) ? apiPlant.growthStage : input.growthStage,
          reviewStatus: apiPlant.reviewStatus || 'PENDING',
        }
        setBackendPlants(existing => [...existing, record])
        setRegistration(null)
        setDetailId(record.id)
        setSelectedPlot(null)
        setServerActivityRevision(r => r + 1)
        if (activeGardenId) {
          void reloadBackendActivities(activeGardenId)
        }
        setNotice('🌱 ¡Siembra registrada! La planta está pendiente de aprobación por el MSP. No se podrán realizar cuidados hasta su verificación oficial.')
        goto('Inicio')
        return { ok: true }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error al registrar la planta en el servidor.'
        return { ok: false, error: msg }
      }
    }

    // Modo visitante (sin sesión)
    if (!communityRecord || !realGarden) return { ok: false, error: 'Primero registra tu comunidad y tu terreno.' }
    if (!Number.isInteger(input.plot) || input.plot < 0 || input.plot >= PLOT_COUNT || activePlants.some(plant => plant.plot === input.plot)) {
      return { ok: false, error: 'Selecciona un espacio disponible. No se sustituirá ninguna planta.' }
    }
    if (input.plantedOn && !validDate(input.plantedOn)) return { ok: false, error: 'Indica una fecha de siembra válida, hasta hoy.' }
    if (input.recordSowing && (!input.plantedOn || !input.responsible?.trim())) return { ok: false, error: 'Indica la fecha de siembra y su responsable.' }
    const id = input.requestId ? 'plant-' + input.requestId : recordId('plant'), photoId = recordId('photo'), now = new Date().toISOString()
    const plant: GardenPlant = {
      id,
      name: input.species.name,
      latin: input.species.latin,
      photo: '',
      photoId,
      date: new Date().toLocaleDateString('es-EC'),
      plot: input.plot,
      createdAt: now,
      state: 'not-documented',
      ...(input.growthStage ? { growthStage: input.growthStage } : {}),
      ...(input.visualProfile ? { visualProfile: input.visualProfile } : {}),
      ...(input.plantedOn ? { plantedOn: input.plantedOn } : {}),
      evidences: [{ id: 'initial-' + id, date: localDate(), notes: 'Fotografía de registro', photoId, ...(input.growthStage ? { growthStage: input.growthStage } : {}), ...(input.visualProfile ? { visualProfile: input.visualProfile } : {}) }],
    }
    const sowing: GardenActivity | undefined = input.recordSowing
      ? {
          id: 'sowing-' + id,
          gardenId: journal.data.gardenId,
          type: 'sowing',
          date: input.plantedOn!,
          responsible: input.responsible!.trim(),
          target: { kind: 'plant', plantId: id, plot: input.plot },
          notes: 'Siembra documentada junto con la ficha y su fotografía.',
          photoIds: [photoId],
          details: {},
          createdAt: now,
          validation: 'local-v1',
        }
      : undefined
    try {
      await journal.commit({ id: input.requestId ?? id, type: 'plant-add', plant, sowing }, [{ id: photoId, blob: input.photo }])
      goto('Inicio')
      setDetailId(id)
      setSelectedPlot(null)
      setNotice('Planta y fotografía guardadas en este navegador.')
      return { ok: true }
    } catch (cause) {
      return { ok: false, error: cause instanceof Error ? cause.message : 'No se pudo guardar la planta. Tu fotografía sigue disponible.' }
    }
  }

  function selectPlant(plant: GardenPlant) {
    setDetailId(plant.id)
  }

  function registerInPlot(plot?: number, speciesName: string = SPECIES[0].name, message?: string) {
    if (plot !== undefined) {
      const occupant = activePlants.find(item => item.plot === plot)
      if (occupant) {
        const isPending = occupant.reviewStatus === 'PENDING' || occupant.reviewStatus === 'NEEDS_CHANGES'
        setNotice(
          isPending
            ? `⏳ El Espacio ${plot + 1} ya tiene a «${occupant.name}» pendiente de aprobación por el MSP y no puede utilizarse.`
            : `El Espacio ${plot + 1} ya está ocupado por «${occupant.name}».`
        )
        setDetailId(occupant.id)
        return
      }
    }
    setSelectedPlot(plot ?? null)
    setDetailId(null)
    setEditingId(null)
    setPendingRegistration(null)
    setRegistration({
      plot: plot ?? null,
      species: speciesName,
      notice: message,
      photo: null,
      plantedOn: '',
      responsible: communityRecord?.responsible ?? '',
    })
  }

  async function updatePlant(draft: PlantUpdate) {
    if (!editingPlant) throw new Error('No se encontró la ficha de la planta.')
    const invalid = validatePlantUpdate(draft, editingPlant, plants)
    if (invalid) throw new Error(invalid)

    if (user) {
      const formData = new FormData()
      formData.append('name', draft.name)
      formData.append('customName', draft.name)
      formData.append('latin', draft.latin)
      formData.append('plotIndex', String(draft.plot))
      if (draft.plantedOn) formData.append('plantedOn', draft.plantedOn)
      if (draft.state) formData.append('state', draft.state)
      if (draft.growthStage) formData.append('growthStage', draft.growthStage)
      if (draft.observations) formData.append('observations', draft.observations)
      if (draft.heightCm !== undefined) formData.append('heightCm', String(draft.heightCm))
      if (draft.photo) formData.append('picture', draft.photo, `plant.${photoExtension(draft.photo)}`)

      const updated = await plantApi.update(editingPlant.id, formData)

      setBackendPlants(prev =>
        prev.map(p => {
          if (p.id === editingPlant.id) {
            const fullPhoto = resolveMediaUrl(updated.photoUrl || p.photo)
            return {
              ...p,
              name: updated.customName || p.name,
              latin: updated.species?.latinName || p.latin,
              plot: updated.plotIndex ?? p.plot,
              plantedOn: updated.plantingDate ? updated.plantingDate.slice(0, 10) : p.plantedOn,
              state: (updated as any).observedState || draft.state || p.state,
              growthStage: isGrowthStage((updated as any).growthStage) ? (updated as any).growthStage : (draft.growthStage ?? p.growthStage),
              observations: updated.notes || draft.observations || p.observations,
              photo: fullPhoto,
            }
          }
          return p
        })
      )

      setServerActivityRevision(r => r + 1)
      if (activeGardenId) {
        void reloadBackendActivities(activeGardenId)
      }
      setEditingId(null)
      setDetailId(editingPlant.id)
      setNotice('Observación, estado y evidencias guardadas en el servidor.')
      return
    }

    const photoId = draft.photo ? recordId('photo') : undefined
    const { photo, ...fields } = draft
    await journal.commit(
      {
        id: draft.requestId ?? recordId('plant-update'),
        type: 'plant-update',
        plantId: editingPlant.id,
        draft: fields,
        evidenceId: 'evidence-' + (draft.requestId ?? recordId('update')),
        photoId,
        retainedPhotoId: editingPlant.photoId,
        at: new Date().toISOString(),
      },
      photo && photoId ? [{ id: photoId, blob: photo }] : []
    )

    setEditingId(null)
    setDetailId(editingPlant.id)
    setNotice('Observación, estado y evidencias guardadas.')
  }

  async function archivePlant() {
    if (!detail) return
    if (user) {
      if (currentCommunityRole && currentCommunityRole !== 'RESPONSABLE') {
        setNotice('Solo las personas con rol Responsable pueden archivar plantas y liberar parcelas.')
        return
      }
      await plantApi.archive(detail.id)
      setBackendPlants(prev =>
        prev.map(p =>
          p.id === detail.id
            ? { ...p, plot: -1, archivedAt: new Date().toISOString() }
            : p
        )
      )
      setServerActivityRevision(r => r + 1)
      setDetailId(null)
      setNotice('📦 Planta archivada en el servidor. La parcela ha quedado libre para un nuevo cultivo.')
      return
    }
    await journal.commit({ id: recordId('archive'), type: 'plant-archive', plantId: detail.id, at: new Date().toISOString() })
    setDetailId(null)
    setNotice('📦 Planta archivada. La parcela ha quedado libre para un nuevo cultivo.')
  }

  async function restorePlant() {
    if (!detail) return null
    if (user) return 'La restauración en servidor requiere una solicitud autorizada.'
    try {
      await journal.commit({ id: recordId('restore'), type: 'plant-restore', plantId: detail.id, at: new Date().toISOString() })
      return null
    } catch (cause) {
      return cause instanceof Error ? cause.message : 'No se pudo restaurar la ficha.'
    }
  }

  function openActivity(plant?: GardenPlant, type?: ActivityType) {
    if (user && (activeGardenId || backendPlants.length > 0)) {
      setDetailId(null)
      setActivityForm({ plantId: plant?.id, plot: plant?.plot ?? selectedPlot, type })
      return
    }
    if (!realGarden || !communityRecord) {
      const hasPlants = plants.length > 0
      const hasCommunity = Boolean(backendCommunity || activeCommunityId)
      if (!hasPlants && !hasCommunity) {
        goto('Mi terreno')
        return
      }
    }
    setDetailId(null)
    setActivityForm({ plantId: plant?.id, plot: plant?.plot ?? selectedPlot, type })
  }

  async function saveActivity(draft: ActivityDraft) {
    if (user) {
      if (backendCommunity && backendCommunity.status !== 'APPROVED') {
        setNotice('⚠️ Tu comunidad aún no ha sido aprobada por el MSP. No es posible registrar actividades agrícolas hasta contar con la verificación oficial.')
        setActivityForm(null)
        return
      }

      if (activeGardenId) {
        const formData = new FormData()
        formData.append('type', draft.type)
        formData.append('performedDate', draft.date)
        formData.append('targetKind', draft.target.kind)
        if (draft.target.kind === 'plant') {
          formData.append('plantId', draft.target.plantId)
          formData.append('plotIndex', String(draft.target.plot))
        } else if (draft.target.kind === 'plot') {
          formData.append('plotIndex', String(draft.target.plot))
        }
        formData.append('notes', draft.notes || '')
        formData.append('details', JSON.stringify(draft.details || {}))
        formData.append('clientActivityId', draft.id)
        if (draft.photo) {
          formData.append('photo', draft.photo, `activity.${photoExtension(draft.photo)}`)
        }
        await activityApi.create(activeGardenId, formData)
        await reloadBackendActivities(activeGardenId)

        if (activeCommunityId) {
          await loadGardenForCommunity(activeCommunityId)
        }
        await Promise.all([reloadServerRewards(), loadPendingInvitations()])
      } else if (draft.target.kind === 'plant' && draft.target.plantId) {
        const targetPlantId = draft.target.plantId
        if (draft.type === 'watering') {
          await careApi.add(targetPlantId, 'WATERING', draft.notes || 'Riego aplicado desde diario')
        } else if (draft.type === 'fertilizing') {
          await careApi.add(targetPlantId, 'FERTILIZER', draft.notes || 'Abono aplicado desde diario')
        } else if (draft.type === 'harvest') {
          const qty = draft.details?.quantity ? `${draft.details.quantity}${draft.details.unit || 'g'}` : '250g'
          await harvestApi.harvest(targetPlantId, qty, draft.notes || 'Cosecha registrada desde diario')
        }
      }

      setActivityForm(null)
      setServerActivityRevision(r => r + 1)
      setNotice('✅ Actividad registrada — pendiente de aprobación por el MSP para acreditar tus Semillas de vida 🌱')
      if (screen === 'Inicio') {
        setFeedback({ id: draft.id, type: draft.type, plot: draft.details.destinationPlot ?? (draft.target.kind === 'garden' ? null : draft.target.plot) })
      }
      return
    }

    const photoId = draft.photo ? recordId('photo') : undefined
    const activity: GardenActivity = {
      id: draft.id,
      gardenId: journal.data.gardenId,
      type: draft.type,
      date: draft.date,
      responsible: draft.responsible || 'Comunidad',
      target: draft.target,
      notes: draft.notes,
      details: draft.details,
      createdAt: new Date().toISOString(),
      validation: 'local-v1',
      photoIds: photoId ? [photoId] : [],
    }
    const saved = await journal.commit({ id: draft.id, type: 'activity', activity }, draft.photo && photoId ? [{ id: photoId, blob: draft.photo }] : [])
    const actual = saved.activities.find(item => item.id === draft.id)
    setActivityForm(null)
    if (!actual) {
      setNotice('Esta actividad ya estaba guardada. El registro permanece solo en este navegador.')
      return
    }
    setNotice('Actividad guardada en este navegador.')
    if (screen === 'Inicio') {
      setFeedback({ id: actual.id, type: actual.type, plot: actual.details.destinationPlot ?? (actual.target.kind === 'garden' ? null : actual.target.plot) })
    }
  }

  async function voidActivity(id: string, reason: string) {
    if (user) {
      if (activeGardenId) {
        await activityApi.void(activeGardenId, id, reason)
        await reloadBackendActivities(activeGardenId)
        setServerActivityRevision(r => r + 1)
      }
      setNotice('Actividad anulada en el servidor; se conserva el historial.')
      return
    }
    await journal.commit({ id: recordId('activity-void'), type: 'activity-void', activityId: id, reason, at: new Date().toISOString() })
    setNotice('Actividad anulada en este navegador; se conserva el historial.')
  }

  function handlePlantHarvested(_plantId: string) {
    setDetailId(null)
    setNotice('🌾 ¡Cosecha recolectada e ingresada al almacén! La planta permanece sembrada y ha iniciado un nuevo ciclo de rebrote.')
    if (activeGardenId) {
      loadGardenForCommunity(activeCommunityId || '')
    }
  }

  function handlePlantRemoved(plantId: string) {
    setBackendPlants(prev => prev.filter(p => p.id !== plantId))
    setDetailId(null)
    setNotice('🗑️ Planta desarraigada. La parcela ha quedado libre para un nuevo cultivo.')
  }

  function navigateGarden(destination: GardenDestination) {
    const destinations: Record<GardenDestination, Screen> = {
      garden: 'Inicio',
      community: 'Comunidades',
      'real-garden': 'Mi terreno',
      plants: 'Plantas medicinales',
      'my-plants': 'Mis plantas',
      history: 'Bitácora',
      progress: 'Mi camino verde',
    }
    goto(destinations[destination])
  }

  function gardenAction(action: GardenAction) {
    if (action === 'register') registerInPlot()
    else if (action === 'activity') openActivity()
    else if (action === 'real-garden') goto('Mi terreno')
    else if (action === 'logbook') goto('Bitácora')
    else if (action === 'my-plants') goto('Mis plantas')
    else if (action === 'progress') goto('Mi camino verde')
    else if (activePlants.length) setDetailId(activePlants[activePlants.length - 1].id)
    else registerInPlot(undefined, speciesCatalog[0].name, 'Tu Pasaporte Vivo comienza con una fotografía. Registra tu primera planta para consultarlo.')
  }

  const ready = user ? Boolean(communityRecord && activeGardenId) : Boolean(communityRecord && realGarden)
  const activeNavigation: GardenDestination =
    screen === 'Comunidades'
      ? 'community'
      : screen === 'Plantas medicinales'
      ? 'plants'
      : screen === 'Mis plantas'
      ? 'my-plants'
      : screen === 'Mi historia' || screen === 'Bitácora'
      ? 'history'
      : screen === 'Mi camino verde'
      ? 'progress'
      : screen === 'Mi terreno'
      ? 'real-garden'
      : 'garden'

  const immersiveGarden = screen === 'Inicio' && Boolean(realGarden)

  if (screen === 'Bienvenida' || screen === 'Usuarios') {
    return (
      <AuthPage
        onSubmit={handleAuth}
        onAuthenticated={() => {
          setAuthenticated(true)
          goto('Inicio')
        }}
        onExploreDemo={(destination = 'Inicio') => {
          setAuthenticated(false)
          goto(destination)
        }}
      />
    )
  }

  // Guardia estricto de roles administrativos: si un administrador con sesión activa
  // intenta ingresar a los menús de comunidad o huerto, redirigirlo a su interfaz oficial
  // para que jamás vea ni interactúe con los menús de usuarios comunes.
  if (user?.role === 'ADMIN_MSP' || user?.role === 'ADMIN_TECNICO') {
    const adminHash = user.role === 'ADMIN_MSP' ? '#admin-msp' : '#admin-tecnico'
    if (window.location.hash !== adminHash) {
      window.location.hash = adminHash
    }
    return null
  }

  if (!user && (journal.loading || (journal.ready && !initializedDraft.current))) {
    return <main className="journal-loading" role="status">Recuperando tu jardín y sus fotografías…</main>
  }

  if (!user && !journal.ready) {
    return (
      <main className="journal-loading">
        <h1>No se pudo abrir el jardín guardado</h1>
        <p role="alert">{journal.failure}</p>
        <p>Los datos existentes no se han sobrescrito.</p>
        <button type="button" onClick={journal.retry}>Volver a intentar</button>
        <button type="button" onClick={() => goto('Bienvenida')}>Volver a bienvenida</button>
      </main>
    )
  }

  return (
    <div className={`garden-shell${immersiveGarden ? ' garden-shell--immersive' : ''}`}>
      <GardenNavigation key={immersiveGarden ? 'immersive' : 'standard'} overlayMode={immersiveGarden}
        active={activeNavigation}
        onNavigate={navigateGarden}
        onWelcome={() => goto('Bienvenida')}
        user={user}
        onLogout={handleLogout}
        pendingInvitationsCount={totalNotificationsCount}
        onOpenNotifications={() => setNotificationsOpen(true)}
        region={regionForProvince(realGarden?.location?.province ?? communityRecord?.province ?? '')}
        progress={
          user
            ? (serverRewards
                ? {
                    points: serverRewards.points,
                    level: serverRewards.level,
                    progressPercent: serverRewards.progressPercent,
                    nextLevel: serverRewards.nextLevel ?? undefined,
                    badges: (['first-sowing', 'care', 'observer', 'harvest'] as const).map(id => {
                      const meta: Record<string, { label: string; criterion: string }> = {
                        'first-sowing': { label: 'La primera semilla', criterion: 'Una siembra registrada con fotografía' },
                        care: { label: 'Raíces cuidadas', criterion: 'Riego documentado en tres fechas distintas' },
                        observer: { label: 'Mirada atenta', criterion: 'Seguimiento con foto en tres fechas distintas' },
                        harvest: { label: 'Cosecha con memoria', criterion: 'Una cosecha registrada con evidencia fotográfica' },
                      }
                      const badgeMap: Record<string, string> = {
                        FIRST_SOWING: 'first-sowing',
                        'first-sowing': 'first-sowing',
                        CARE_ROOTS: 'care',
                        care: 'care',
                        OBSERVATION_JOURNAL: 'observer',
                        observer: 'observer',
                        HARVEST_MEMORY: 'harvest',
                        harvest: 'harvest',
                      }
                      const earned = serverRewards.badges.some(b => badgeMap[(b as any).badgeId || (b as any).code] === id)
                      return {
                        id,
                        label: meta[id].label,
                        criterion: meta[id].criterion,
                        earned,
                      }
                    }),
                  }
                : undefined)
            : {
                points: progress.points,
                level: progress.level,
                progressPercent: progress.progressPercent,
                nextLevel: progress.nextLevel,
                badges: progress.badges,
              }
        }
        onRetryRewards={reloadServerRewards}
      />

      {screen === 'Inicio' || screen === 'Mi terreno' ? (
        <MyGardenPage fullScreenGarden={immersiveGarden}
          demo={!user && !authenticated}
          plants={activePlants}
          community={communityRecord}
          garden={realGarden?.name ?? ''}
          province={realGarden?.location?.province ?? communityRecord?.province ?? ''}
          realGarden={realGarden}
          selectedPlot={selectedPlot}
          onCreateCommunity={() => openCommunity('create')}
          onJoinCommunity={() => openCommunity('join')}
          onSelect={selectPlant}
          onRegister={registerInPlot}
          onAction={gardenAction}
          onNavigate={navigateGarden}
          user={user}
          pendingInvitationsCount={totalNotificationsCount}
          onOpenNotifications={() => setNotificationsOpen(true)}
          officialRewards={serverRewards ? toAuthoritativeRewards(serverRewards) : null}
          renderGardenScene={renderGardenScene}
          activities={activities}
          feedback={feedback}
          progress={
            serverRewards
              ? {
                  points: serverRewards.points,
                  level: serverRewards.level,
                  responsible: user?.name || communityRecord?.responsible,
                }
              : {
                  points: progress.points,
                  level: progress.level,
                  responsible: communityRecord?.responsible,
                }
          }
          interactionBlocked={Boolean(registration || detail || editingPlant || activityForm)}
          terrainProvince={realGardenDraft.province}
          terrainView={
            screen === 'Mi terreno' ? (
              <RealGardenPage
                garden={realGarden}
                draft={realGardenDraft}
                onDraftChange={setRealGardenDraft}
                community={communityRecord}
                communityName={communityRecord?.name ?? null}
                onSave={saveGarden}
                onConnect={connectGarden}
                plantRegistrationPending={Boolean(pendingRegistration)}
                onCommunity={() => goto('Comunidades')}
                user={user}
                currentCommunityRole={currentCommunityRole}
              />
            ) : undefined
          }
        />
      ) : screen === 'Comunidades' ? (
        <CommunitiesPage
          community={communityRecord}
          communityId={activeCommunityId}
          acceptedMembersCount={acceptedMembersCount}
          pendingCommunityInvitationsCount={pendingCommunityInvitationsCount}
          onMembersUpdated={handleMembersUpdated}
          garden={realGarden?.name ?? ''}
          user={user}
          currentCommunityRole={currentCommunityRole}
          userCommunities={userCommunities}
          onSelectCommunity={selectActiveCommunity}
          hasCreatedOwnCommunity={userCommunities.some(c => (c as any).creatorId === user?.id)}
          onSave={saveCommunity}
          onGarden={() => goto('Mi terreno')}
          onHome={() => goto('Inicio')}
          entryAction={communityEntry}
        />
      ) : (
        <main className="main garden-module">
          <header className="topbar">
            <span className="breadcrumbs">
              Kawsapacha /{' '}
              {screen === 'Mi historia' || screen === 'Mi camino verde'
                ? 'Mi camino verde'
                : screen === 'Bitácora' || screen === 'Mis plantas' || screen === 'Plantas medicinales'
                ? 'Mi Huerto Vivo'
                : screen}
            </span>
            <span className="user-pill">
              {user ? `● ${user.name} · ${user.role}` : authenticated ? 'Sesión confirmada' : 'Modo visitante · Sin sesión'}
            </span>
          </header>
          <div className="page">
            {screen !== 'Plantas medicinales' && (user ? (
              <div
                className="prototype-alert"
                style={{ background: 'rgba(56, 161, 105, 0.15)', borderColor: '#38a169', color: '#2f855a' }}
              >
                <strong>Sesión activa ({user.name}):</strong> Tus datos, comunidades, huertos y fotografías se guardan y persisten en el servidor de Kawsapacha.
              </div>
            ) : (
              <div className="prototype-alert">
                Guardado en este navegador · No sincronizado con otras personas ni con una cuenta.
              </div>
            ))}
            {screen !== 'Plantas medicinales' && <div className="heading">
              <div>
                <span className="eyebrow">
                  Kawsapacha ·{' '}
                  {screen === 'Mi historia' || screen === 'Mi camino verde' ? 'Mi camino verde' : 'Mi Huerto Vivo'}
                </span>
                <h1 tabIndex={-1} data-screen-heading>
                  {screen === 'Bitácora'
                    ? 'Bitácora agrícola'
                    : screen === 'Mi historia' || screen === 'Mi camino verde'
                    ? 'Mi camino verde'
                    : screen}
                </h1>
              </div>
              <button className="cta small" onClick={() => goto('Inicio')}>
                Volver a Mi Huerto Vivo <span aria-hidden>↗</span>
              </button>
            </div>}

            {(screen === 'Mis plantas' || screen === 'Bitácora') && (
              <nav className="garden-internal-nav" aria-label="Secciones de Mi Huerto Vivo">
                <button type="button" onClick={() => goto('Inicio')}>
                  Jardín
                </button>
                <button type="button" onClick={() => goto('Mi terreno')}>
                  Editar terreno
                </button>
                <button
                  type="button"
                  aria-label="Abrir catálogo medicinal"
                  onClick={() => goto('Plantas medicinales')}
                >
                  Catálogo
                </button>
                <button
                  type="button"
                  aria-current={screen === 'Mis plantas' ? 'page' : undefined}
                  onClick={() => goto('Mis plantas')}
                >
                  Mis plantas
                </button>
                <button
                  type="button"
                  aria-current={screen === 'Bitácora' ? 'page' : undefined}
                  onClick={() => goto('Bitácora')}
                >
                  Bitácora
                </button>
              </nav>
            )}

            {(screen === 'Mi camino verde' || screen === 'Mi historia') && (
              <>
                <GardenProgress
                  journal={effectiveJournal}
                  region={regionForProvince(realGarden?.location?.province ?? communityRecord?.province ?? '')}
                  authenticated={Boolean(user)}
                  official={serverRewards ? toAuthoritativeRewards(serverRewards) : null}
                  review={serverRewards?.review ?? null}
                  currentUser={user?.name || communityRecord?.responsible}
                />
              </>
            )}
            {screen === 'Mis plantas' && (
              <GardenPlants plants={plants} onRegister={() => registerInPlot()} onSelect={selectPlant} />
            )}
            {(screen === 'Bitácora' || screen === 'Mi historia') && (
              <GardenHistory
                key={user ? `${user.id}:${activeGardenId ?? 'none'}` : 'visitor'}
                plants={plants}
                activities={activities}
                onActivity={() => openActivity()}
                onVoid={voidActivity}
                authenticated={Boolean(user)}
                gardenId={activeGardenId}
                refreshKey={serverActivityRevision}
                onRegister={() => registerInPlot()}
                onSelect={selectPlant}
                onRealGarden={() => goto('Mi terreno')}
              />
            )}
            {screen === 'Plantas medicinales' && (
              <RegionalCatalog
                species={speciesCatalog}
                province={realGarden?.location?.province ?? communityRecord?.province ?? null}
                serverLoaded={catalogServerLoaded}
                onRegister={name => registerInPlot(undefined, name)}
                onHome={() => goto('Inicio')}
              />
            )}
          </div>
        </main>
      )}

      {registration && (() => {
        const currentProvince = realGarden?.location?.province ?? communityRecord?.province
        const currentRegion = currentProvince ? regionForProvince(currentProvince) : null
        const cultivableSpecies = speciesCatalog.filter(p => p.registerStatus !== 'INFORMATIVA')
        const regionalFiltered = currentRegion
          ? cultivableSpecies.filter(p => !p.regions || p.regions.length === 0 || p.regions.includes(currentRegion))
          : cultivableSpecies
        const finalSpeciesOptions = (regionalFiltered.length > 0 ? regionalFiltered : cultivableSpecies).map(plant => ({
          id: plant.id,
          name: plant.name,
          latin: plant.latinName,
          icon: plant.icon,
        }))

        return (
          <PlantRegistrationModal
            plants={activePlants}
            speciesOptions={finalSpeciesOptions}
            initialPlot={registration.plot}
            initialSpecies={registration.species}
            initialPhoto={registration.photo}
            initialPlantedOn={registration.plantedOn}
            initialSowing={registration.recordSowing}
            initialGrowthStage={registration.growthStage}
            growthStageEnabled={true}
            initialResponsible={registration.responsible ?? communityRecord?.responsible ?? ''}
            initialRequestId={registration.requestId}
            notice={registration.notice}
            ready={ready}
            onConfirm={addPlant}
            onClose={() => setRegistration(null)}
            onSetup={draft => {
              setPendingRegistration(draft)
              goto('Mi terreno')
            }}
          />
        )
      })()}

      {editingPlant && (
        <PlantEditor
          plant={editingPlant}
          plants={plants}
          growthStageEnabled={true}
          onSave={updatePlant}
          onClose={() => {
            setEditingId(null)
            setDetailId(editingPlant.id)
          }}
        />
      )}

      {activityForm && (
        <ActivityModal
          plants={activePlants}
          gardenId={user && activeGardenId ? activeGardenId : journal.data.gardenId}
          responsible={user?.name || communityRecord?.responsible || 'Comunidad'}
          initialPlant={plants.find(plant => plant.id === activityForm.plantId)}
          initialPlot={activityForm.plot}
          initialActivityType={activityForm.type}
          existingActivities={activities}
          onSave={saveActivity}
          growthStageEnabled={true}
          onClose={() => setActivityForm(null)}
          onRegister={(plot, type) => {
            setActivityForm(null)
            registerInPlot(plot)
            setRegistration(current =>
              current
                ? {
                    ...current,
                    recordSowing: type === 'sowing',
                    plantedOn: type === 'sowing' ? localDate() : '',
                    responsible: user?.name || communityRecord?.responsible || '',
                  }
                : current
            )
          }}
        />
      )}

      <PlantPassport
        plant={detail}
        user={user}
        activeGardenId={activeGardenId}
        activities={activities}
        onActivityCreated={() => {
          setServerActivityRevision(r => r + 1)
          if (activeGardenId) void reloadBackendActivities(activeGardenId)
          if (activeCommunityId) void loadGardenForCommunity(activeCommunityId)
          void reloadServerRewards()
          void loadPendingInvitations()
        }}
        currentCommunityRole={currentCommunityRole}
        onClose={() => setDetailId(null)}
        onHistory={() => goto('Bitácora')}
        onPlantHarvested={handlePlantHarvested}
        onPlantRemoved={handlePlantRemoved}
        onEdit={
          detail
            ? () => {
                setEditingId(detail.id)
                setDetailId(null)
              }
            : undefined
        }
        onArchive={detail ? archivePlant : undefined}
        onRestore={!user && detail ? restorePlant : undefined}
        onActivity={detail ? (type?: ActivityType) => openActivity(detail, type) : undefined}
      />

      {isNotificationsOpen && (
        <NotificationsModal
          onClose={() => setNotificationsOpen(false)}
          onAccepted={handleInvitationAccepted}
          onNotificationsUpdated={loadPendingInvitations}
        />
      )}

      {(!user && journal.failure) || (!user && journal.saving) || notice || !user ? (
        <div
          className="garden-storage-status"
          role="status"
          aria-label="Estado de guardado"
          data-state={!user && journal.failure ? 'error' : !user && journal.saving ? 'saving' : 'saved'}
        >
          {user ? notice : journal.failure || (journal.saving ? 'Guardando en este navegador…' : notice || 'Guardado local · Solo en este navegador')}
        </div>
      ) : null}
    </div>
  )
}
