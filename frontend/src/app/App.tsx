import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import AuthPage from '../features/auth/AuthPage'
import type { AuthSubmitHandler } from '../features/auth/auth'
import MyGardenPage from '../features/my-garden/MyGardenPage'
import GardenNavigation from '../features/my-garden/GardenNavigation'
import GardenHistory from '../features/my-garden/GardenHistory'
import PlantPassport from '../features/my-garden/PlantPassport'
import NotificationsModal from '../features/notifications/NotificationsModal'
import PlantEditor from '../features/my-garden/PlantEditor'
import GardenPlants from '../features/my-garden/GardenPlants'
import PlantRegistrationModal, { type PlantRegistrationDraft } from '../features/my-garden/PlantRegistrationModal'
import RegionalCatalog from '../features/medicinal-catalog/RegionalCatalog'
import CommunitiesPage, { type CommunityEntryAction } from '../features/communities/CommunitiesPage'
import type { Community } from '../features/communities/communities'
import RealGardenPage from '../features/real-gardens/RealGardenPage'
import { toGardenDraft, type RealGarden, type RealGardenDraft } from '../features/real-gardens/real-garden'
import { type GardenAction, type GardenDestination, type GardenPlant } from '../features/my-garden/garden'
import type { AuthSubmission } from '../features/auth/auth'
import {
  authApi,
  communityApi,
  gardenApi,
  invitationApi,
  notificationApi,
  memberApi,
  getUser,
  type UserSession,
  type CommunityInvitationItem,
  rewardsApi,
  type RewardsSummary,
} from '../shared/api/client'
import { regionForProvince } from '../features/real-gardens/garden-region'
import { withCommunityLocation } from '../features/real-gardens/garden-community-location'
import type { GardenSceneRenderer } from '../features/my-garden/garden-scene-renderer'
import { localDate, recordId } from '../features/my-garden/plant-record'
import { useGardenJournal } from '../features/my-garden/journal/useGardenJournal'
import type { GardenJournal } from '../features/my-garden/journal/journal'
import ActivityModal from '../features/my-garden/journal/ActivityModal'
import { type ActivityType, type GardenActivity } from '../features/my-garden/journal/activities'
import '../features/my-garden/garden-journal.css'
import GardenProgress from '../features/my-garden/GardenProgress'
import { calculateProgress } from '../features/my-garden/journal/progress'
import { toAuthoritativeRewards } from '../features/my-garden/rewards/map-backend-rewards'
import { attachServerEvidence } from '../features/my-garden/selectors/server-plant-evidence'
import { currentScreen, SCREEN_PATHS, type Screen } from './navigation'
import { draftKey } from '../features/real-gardens/draft-key'
import { createActivityActions } from '../features/my-garden/journal/activity-actions'
import { createPlantActions } from '../features/my-garden/plant-actions'
import { createGardenSetupActions } from '../features/real-gardens/setup-actions'
import { useSpeciesCatalog } from '../features/medicinal-catalog/useSpeciesCatalog'
import { useActiveCommunityMembers } from '../features/communities/useActiveCommunityMembers'
import { createBackendGardenLoader } from './load-backend-garden'





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
  const [backendGarden, setBackendGarden] = useState<RealGarden | null>(null)
  const [activeGardenId, setActiveGardenId] = useState<string | null>(null)
  const [backendPlants, setBackendPlants] = useState<GardenPlant[]>([])
  const [backendActivities, setBackendActivities] = useState<GardenActivity[]>([])
  const [pendingInvitations, setPendingInvitations] = useState<CommunityInvitationItem[]>([])
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0)
  const [isNotificationsOpen, setNotificationsOpen] = useState(false)
  const { speciesCatalog, catalogServerLoaded } = useSpeciesCatalog()
  const [serverRewards, setServerRewards] = useState<RewardsSummary | null>(null)

  // Selección unificada de datos según modo (Backend o Visitante)
  const communityRecord = user ? backendCommunity : journal.data.community
  const realGarden = user ? backendGarden : journal.data.terrain
  // En la sesión las evidencias reales provienen de la Bitácora SQLite,
  // no de IndexedDB de visitante ni solo de la última foto de la planta.
  const serverPlantsWithEvidence = useMemo(() => attachServerEvidence(backendPlants, backendActivities, activeGardenId), [backendPlants, backendActivities, activeGardenId])
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

  const {
    currentCommunityRole, setCurrentCommunityRole,
    acceptedMembersCount, pendingCommunityInvitationsCount, refreshActiveCommunityMembers,
  } = useActiveCommunityMembers({ user, activeCommunityId, communityRecord })

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

  const { reloadBackendActivities, loadGardenForCommunity } = createBackendGardenLoader({
    setActiveGardenId, setBackendGarden, setRealGardenDraft,
    setBackendPlants, setBackendActivities, reloadServerRewards,
  })

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

  const { saveCommunity, saveGarden } = createGardenSetupActions({
    user, activeCommunityId, communityRecord, activeGardenId, backendGarden, communityEntry, journal, setActiveCommunityId, setActiveGardenId, setBackendCommunity, setBackendGarden, setRealGardenDraft, setUserCommunities, setNotice, loadGardenForCommunity, handleMembersUpdated, goto
  })

  const { addPlant, selectPlant, registerInPlot, updatePlant, archivePlant, restorePlant,
    handlePlantHarvested, handlePlantRemoved } = createPlantActions({
    user, activeGardenId, activeCommunityId, activePlants, plants, communityRecord, realGarden, journal, editingPlant, detail, currentCommunityRole, setNotice, setBackendPlants, setRegistration, setDetailId, setSelectedPlot, setServerActivityRevision, setEditingId, setPendingRegistration, reloadBackendActivities, loadGardenForCommunity, goto
  })

  const { openActivity, saveActivity, voidActivity } = createActivityActions({
    user, activeGardenId, backendPlants, realGarden, communityRecord, plants, backendCommunity, activeCommunityId, selectedPlot, setDetailId, setActivityForm, goto, setNotice, reloadBackendActivities, loadGardenForCommunity, reloadServerRewards, loadPendingInvitations, setServerActivityRevision, screen, setFeedback, journal
  })

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
  // Las subpantallas del jardín siguen perteneciendo a Mi Huerto.
  const activeNavigation: GardenDestination =
    screen === 'Comunidades'
      ? 'community'
      : screen === 'Mi camino verde' || screen === 'Mi historia'
      ? 'progress'
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
            {screen !== 'Plantas medicinales' && screen !== 'Mis plantas' && (user ? (
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

            {screen === 'Bitácora' && (
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
                  onRetryRewards={reloadServerRewards}
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
