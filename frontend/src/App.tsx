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
  invitationApi,
  memberApi,
  getUser,
  type UserSession,
  type CommunityInvitationItem,
} from './services/api'
import { regionForProvince } from './features/real-gardens/garden-region'
import { matchesCommunityLocation, withCommunityLocation } from './features/real-gardens/garden-community-location'
import type { GardenSceneRenderer } from './features/my-garden/garden-scene-renderer'
import { localDate, recordId, validatePlantUpdate, validDate, type PlantUpdate } from './features/my-garden/plant-record'
import { useGardenJournal } from './features/my-garden/journal/useGardenJournal'
import ActivityModal from './features/my-garden/journal/ActivityModal'
import ActivityList from './features/my-garden/journal/ActivityList'
import type { ActivityDraft, ActivityType, GardenActivity } from './features/my-garden/journal/activities'
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
  if (window.location.hash === '#huerto-real') return 'Mi terreno'
  return (Object.keys(SCREEN_PATHS) as Screen[]).find(key => SCREEN_PATHS[key] === window.location.hash) ?? 'Bienvenida'
}

const draftKey = (draft: RealGardenDraft) =>
  JSON.stringify({ ...draft, photo: draft.photo ? [draft.photo.name, draft.photo.size, draft.photo.lastModified] : null })

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
  const journal = useGardenJournal()

  // Estado del backend cuando hay usuario con sesión activa
  const [backendCommunity, setBackendCommunity] = useState<Community | null>(null)
  const [activeCommunityId, setActiveCommunityId] = useState<string | null>(null)
  const [userCommunities, setUserCommunities] = useState<Community[]>([])
  const [currentCommunityRole, setCurrentCommunityRole] = useState<'RESPONSABLE' | 'PARTICIPANTE' | null>(null)
  const [activeCommunityMembers, setActiveCommunityMembers] = useState<any[]>([])
  const [backendGarden, setBackendGarden] = useState<RealGarden | null>(null)
  const [activeGardenId, setActiveGardenId] = useState<string | null>(null)
  const [backendPlants, setBackendPlants] = useState<GardenPlant[]>([])
  const [pendingInvitations, setPendingInvitations] = useState<CommunityInvitationItem[]>([])
  const [isNotificationsOpen, setNotificationsOpen] = useState(false)
  const [speciesCatalog, setSpeciesCatalog] = useState<Array<{ name: string; latin: string; icon: string }>>(() => [...SPECIES])

  // Selección unificada de datos según modo (Backend o Visitante)
  const communityRecord = user ? backendCommunity : journal.data.community
  const realGarden = user ? backendGarden : journal.data.terrain
  const plants = user ? backendPlants : journal.plants
  const activePlants = plants.filter(plant => !plant.archivedAt)

  const [screen, setScreen] = useState<Screen>(currentScreen)
  const [communityEntry, setCommunityEntry] = useState<CommunityEntryAction | null>(null)
  const [realGardenDraft, setRealGardenDraft] = useState<RealGardenDraft>(() => toGardenDraft(null))
  const previousTerrain = useRef<RealGarden | null>(null)
  const initializedDraft = useRef(false)
  const [registration, setRegistration] = useState<PlantRegistrationDraft | null>(null)
  const [pendingRegistration, setPendingRegistration] = useState<PlantRegistrationDraft | null>(null)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [activityForm, setActivityForm] = useState<{ plantId?: string; plot?: number | null } | null>(null)
  const [feedback, setFeedback] = useState<{ id: string; type: ActivityType; plot: number | null } | null>(null)
  const [query, setQuery] = useState('')
  const [notice, setNotice] = useState('')
  const [selectedPlot, setSelectedPlot] = useState<number | null>(null)

  const detail = plants.find(plant => plant.id === detailId) ?? null
  const editingPlant = plants.find(plant => plant.id === editingId)
  const progress = useMemo(() => calculateProgress(journal.data, communityRecord?.responsible), [journal.data, communityRecord?.responsible])

  // Cargar catálogo de especies
  useEffect(() => {
    catalogApi
      .list()
      .then(items => {
        if (items && items.length > 0) {
          setSpeciesCatalog(items.map(s => ({ name: s.name, latin: s.latinName, icon: s.icon || '🌿' })))
        }
      })
      .catch(() => {})
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

  // Cargar invitaciones pendientes
  async function loadPendingInvitations() {
    if (!user) {
      setPendingInvitations([])
      return
    }
    try {
      const list = await invitationApi.getMyInvitations()
      setPendingInvitations(list || [])
    } catch {
      setPendingInvitations([])
    }
  }

  useEffect(() => {
    loadPendingInvitations()
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
              name: p.species?.name || p.speciesId,
              latin: p.species?.latinName || '',
              photo: p.photoUrl,
              date: new Date(p.plantingDate).toLocaleDateString('es-EC'),
              plot: p.plotIndex ?? -1,
              createdAt: (p as any).createdAt || new Date(p.plantingDate).toISOString(),
              state: 'observed',
              archivedAt: p.archivedAt ? new Date(p.archivedAt).toISOString() : (p.lifecycleStatus === 'ARCHIVED' ? new Date().toISOString() : undefined),
            }))
          )
        } else {
          setBackendPlants([])
        }
      } else {
        setActiveGardenId(null)
        setBackendGarden(null)
        setRealGardenDraft(toGardenDraft(null))
        setBackendPlants([])
      }
    } catch {
      setActiveGardenId(null)
      setBackendGarden(null)
      setRealGardenDraft(toGardenDraft(null))
      setBackendPlants([])
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
    setPendingInvitations([])
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
        const file = new File([input.photo], `${input.species.name.toLowerCase().replace(/\s+/g, '-')}.jpg`, {
          type: input.photo.type || 'image/jpeg',
        })
        const apiPlant = await plantApi.register(activeGardenId, {
          file,
          speciesId: input.species.name,
          plotIndex: input.plot,
          customName: input.species.name,
          notes: input.plantedOn ? `Sembrada el ${input.plantedOn}` : 'Registrada con cámara Kawsapacha',
        })

        const record: GardenPlant = {
          id: apiPlant.id,
          name: apiPlant.species?.name || input.species.name,
          latin: apiPlant.species?.latinName || input.species.latin,
          photo: apiPlant.photoUrl,
          date: new Date(apiPlant.plantingDate).toLocaleDateString('es-EC'),
          plot: apiPlant.plotIndex ?? 0,
          plantedOn: input.plantedOn,
          createdAt: (apiPlant as any).createdAt || new Date(apiPlant.plantingDate).toISOString(),
          state: 'observed',
        }
        setBackendPlants(existing => [...existing, record])
        setRegistration(null)
        setDetailId(record.id)
        setSelectedPlot(null)
        setNotice('¡Fotografía y planta guardadas exitosamente en el servidor!')
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
      ...(input.plantedOn ? { plantedOn: input.plantedOn } : {}),
      evidences: [{ id: 'initial-' + id, date: localDate(), notes: 'Fotografía de registro', photoId }],
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
    setNotice('Observación y evidencias guardadas.')
  }

  async function archivePlant() {
    if (!detail) return
    if (user && currentCommunityRole && currentCommunityRole !== 'RESPONSABLE') {
      setNotice('Solo las personas con rol Responsable pueden archivar plantas y liberar parcelas.')
      return
    }
    if (user && !detail.id.includes('-')) {
      try {
        await plantApi.archive(detail.id)
        setBackendPlants(prev =>
          prev.map(p =>
            p.id === detail.id
              ? { ...p, plot: -1, archivedAt: new Date().toISOString() }
              : p
          )
        )
      } catch (err: unknown) {
        setNotice(err instanceof Error ? err.message : 'Error al archivar la planta')
        return
      }
    }
    await journal.commit({ id: recordId('archive'), type: 'plant-archive', plantId: detail.id, at: new Date().toISOString() })
    setDetailId(null)
    setNotice('📦 Planta archivada. La parcela ha quedado libre para un nuevo cultivo.')
  }

  async function restorePlant() {
    if (!detail) return null
    try {
      await journal.commit({ id: recordId('restore'), type: 'plant-restore', plantId: detail.id, at: new Date().toISOString() })
      return null
    } catch (cause) {
      return cause instanceof Error ? cause.message : 'No se pudo restaurar la ficha.'
    }
  }

  function openActivity(plant?: GardenPlant) {
    if (!realGarden || !communityRecord) {
      const hasPlants = plants.length > 0
      const hasCommunity = Boolean(backendCommunity || activeCommunityId)
      if (!hasPlants && !hasCommunity) {
        goto('Mi terreno')
        return
      }
    }
    setDetailId(null)
    setActivityForm({ plantId: plant?.id, plot: plant?.plot ?? selectedPlot })
  }

  async function saveActivity(draft: ActivityDraft) {
    if (user && draft.target.kind === 'plant' && draft.target.plantId) {
      const targetPlantId = draft.target.plantId
      try {
        if (draft.type === 'watering') {
          await careApi.add(targetPlantId, 'WATERING', draft.notes || 'Riego aplicado desde diario')
        } else if (draft.type === 'fertilizing') {
          await careApi.add(targetPlantId, 'FERTILIZER', draft.notes || 'Abono aplicado desde diario')
        } else if (draft.type === 'harvest') {
          const qty = draft.details?.quantity ? `${draft.details.quantity}${draft.details.unit || 'g'}` : '250g'
          await harvestApi.harvest(targetPlantId, qty, draft.notes || 'Cosecha registrada desde diario')
        }
      } catch (err: unknown) {
        setNotice(err instanceof Error ? err.message : 'Error al registrar cuidado en backend')
      }
    }
    const photoId = draft.photo ? recordId('photo') : undefined
    const activity: GardenActivity = {
      id: draft.id,
      gardenId: journal.data.gardenId || activeGardenId || '',
      type: draft.type,
      date: draft.date,
      responsible: draft.responsible || user?.name || 'Comunidad',
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
    setNotice(actual ? (user ? 'Actividad guardada y sincronizada.' : 'Actividad guardada en este navegador.') : 'Esta actividad ya estaba guardada.')
    if (actual && screen === 'Inicio') {
      setFeedback({ id: actual.id, type: actual.type, plot: actual.details.destinationPlot ?? (actual.target.kind === 'garden' ? null : actual.target.plot) })
    }
  }

  async function voidActivity(id: string, reason: string) {
    await journal.commit({ id: recordId('activity-void'), type: 'activity-void', activityId: id, reason, at: new Date().toISOString() })
    setNotice('Actividad anulada; la evidencia y el historial se conservan.')
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
      : screen === 'Mi historia'
      ? 'history'
      : screen === 'Mi camino verde'
      ? 'progress'
      : screen === 'Mi terreno'
      ? 'real-garden'
      : 'garden'

  const immersiveGarden = screen === 'Inicio' && Boolean(realGarden)
  const visible = speciesCatalog.filter(species => `${species.name} ${species.latin}`.toLocaleLowerCase().includes(query.toLocaleLowerCase()))

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
        pendingInvitationsCount={pendingInvitations.length}
        onOpenNotifications={() => setNotificationsOpen(true)}
        region={regionForProvince(realGarden?.location?.province ?? communityRecord?.province ?? '')}
        progress={user ? undefined : {
          points: progress.points,
          level: progress.level,
          progressPercent: progress.progressPercent,
          nextLevel: progress.nextLevel,
          badges: progress.badges,
        }}
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
          pendingInvitationsCount={pendingInvitations.length}
          onOpenNotifications={() => setNotificationsOpen(true)}
          renderGardenScene={renderGardenScene}
          activities={journal.data.activities}
          feedback={feedback}
          progress={user ? undefined : { points: progress.points, level: progress.level, responsible: communityRecord?.responsible }}
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
            {user ? (
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
            )}
            <div className="heading">
              <div>
                <span className="eyebrow">
                  Kawsapacha ·{' '}
                  {screen === 'Mi historia' || screen === 'Mi camino verde' ? 'Mi camino verde' : 'Mi Huerto Vivo'}
                </span>
                <h1 tabIndex={-1} data-screen-heading>
                  {screen === 'Plantas medicinales'
                    ? 'Catálogo de plantas medicinales'
                    : screen === 'Bitácora'
                    ? 'Bitácora agrícola'
                    : screen === 'Mi historia' || screen === 'Mi camino verde'
                    ? 'Mi camino verde'
                    : screen}
                </h1>
              </div>
              <button className="cta small" onClick={() => goto('Inicio')}>
                Volver a Mi Huerto Vivo <span aria-hidden>↗</span>
              </button>
            </div>

            {(screen === 'Plantas medicinales' || screen === 'Mis plantas' || screen === 'Bitácora') && (
              <nav className="garden-internal-nav" aria-label="Secciones de Mi Huerto Vivo">
                <button type="button" onClick={() => goto('Inicio')}>
                  Jardín
                </button>
                <button type="button" onClick={() => goto('Mi terreno')}>
                  Editar terreno
                </button>
                <button
                  type="button"
                  aria-current={screen === 'Plantas medicinales' ? 'page' : undefined}
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
                <GardenProgress journal={journal.data} region={regionForProvince(realGarden?.location?.province ?? communityRecord?.province ?? '')} authenticated={Boolean(user)} />

              </>
            )}
            {screen === 'Mis plantas' && (
              <GardenPlants plants={plants} onRegister={() => registerInPlot()} onSelect={selectPlant} />
            )}
            {(screen === 'Bitácora' || screen === 'Mi historia') && (
              <GardenHistory
                plants={plants}
                activities={journal.data.activities}
                onActivity={() => openActivity()}
                onVoid={voidActivity}
                onRegister={() => registerInPlot()}
                onSelect={selectPlant}
                onRealGarden={() => goto('Mi terreno')}
              />
            )}
            {screen === 'Plantas medicinales' && (
              <section className="section">
                <div className="catalog-header">
                  <div>
                    <span className="eyebrow">BOTÁNICA</span>
                    <h2>Explora las especies</h2>
                    <p>Catálogo botánico medicinal tradicional andino conectado con la base de datos.</p>
                  </div>
                  <label className="search-label">
                    <span>⌕</span>
                    <input
                      value={query}
                      onChange={event => setQuery(event.target.value)}
                      placeholder="Buscar por nombre…"
                      aria-label="Buscar plantas"
                    />
                  </label>
                </div>
                <div className="catalog-grid">
                  {visible.map((species, index) => (
                    <article className="species-card" key={species.name}>
                      <div className={`species-art tone-${index % 4}`}>
                        <span>{species.icon}</span>
                      </div>
                      <div className="species-copy">
                        <strong>{species.name}</strong>
                        <em>{species.latin}</em>
                        <button onClick={() => registerInPlot(undefined, species.name)}>Registrar en mi huerto ↗</button>
                      </div>
                    </article>
                  ))}
                </div>
                {!visible.length && <p>No se encontraron especies con ese nombre.</p>}
              </section>
            )}
          </div>
        </main>
      )}

      {registration && (
        <PlantRegistrationModal
          plants={activePlants}
          initialPlot={registration.plot}
          initialSpecies={registration.species}
          initialPhoto={registration.photo}
          initialPlantedOn={registration.plantedOn}
          initialSowing={registration.recordSowing}
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
      )}

      {editingPlant && (
        <PlantEditor
          plant={editingPlant}
          plants={plants}
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
          gardenId={journal.data.gardenId}
          responsible={communityRecord?.responsible ?? ''}
          initialPlant={plants.find(plant => plant.id === activityForm.plantId)}
          initialPlot={activityForm.plot}
          onSave={saveActivity}
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
                    responsible: communityRecord?.responsible ?? '',
                  }
                : current
            )
          }}
        />
      )}

      <PlantPassport
        plant={detail}
        user={user}
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
        onRestore={detail ? restorePlant : undefined}
        onActivity={detail ? () => openActivity(detail) : undefined}
        activityItems={
          detail ? (
            <section aria-label="Actividades de esta planta">
              <h3>Actividades de esta planta</h3>
              <ActivityList
                activities={journal.data.activities.filter(
                  activity => activity.target.kind === 'plant' && activity.target.plantId === detail.id
                )}
                plants={plants}
              />
            </section>
          ) : undefined
        }
      />

      {isNotificationsOpen && (
        <NotificationsModal
          onClose={() => setNotificationsOpen(false)}
          onAccepted={handleInvitationAccepted}
        />
      )}

      {journal.failure || (journal.saving ? 'Guardando en este navegador…' : notice || (!user ? 'Guardado local · Solo en este navegador' : '')) ? (
        <div
          className="garden-storage-status"
          role="status"
          aria-label="Estado de guardado"
          data-state={journal.failure ? 'error' : journal.saving ? 'saving' : 'saved'}
        >
          {journal.failure || (journal.saving ? 'Guardando en este navegador…' : notice || (!user ? 'Guardado local · Solo en este navegador' : ''))}
        </div>
      ) : null}
    </div>
  )
}
