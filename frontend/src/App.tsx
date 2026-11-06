import { useEffect, useRef, useState } from 'react'
import AuthPage from './features/auth/AuthPage'
import MyGardenPage from './features/my-garden/MyGardenPage'
import GardenNavigation from './features/my-garden/GardenNavigation'
import GardenHistory from './features/my-garden/GardenHistory'
import PlantPassport from './features/my-garden/PlantPassport'
import NotificationsModal from './features/notifications/NotificationsModal'
import PlantRegistrationModal from './features/my-garden/PlantRegistrationModal'
import { PLANT_SPECIES as SPECIES, type PlantRegistration, type PlantRegistrationResult } from './features/my-garden/plant-species'
import CommunitiesPage from './features/communities/CommunitiesPage'
import type { Community } from './features/communities/communities'
import RealGardenPage from './features/real-gardens/RealGardenPage'
import { toGardenDraft, type RealGarden, type RealGardenDraft } from './features/real-gardens/real-garden'
import { PLOT_COUNT, type GardenAction, type GardenDestination, type GardenPlant } from './features/my-garden/garden'
import type { AuthSubmission } from './features/auth/auth'
import {
  authApi,
  communityApi,
  gardenApi,
  catalogApi,
  plantApi,
  invitationApi,
  memberApi,
  getUser,
  type UserSession,
  type CommunityInvitationItem,
} from './services/api'

type Screen = 'Bienvenida' | 'Inicio' | 'Usuarios' | 'Comunidades' | 'Huertos reales' | 'Plantas medicinales' | 'Mi historia'
type Plant = GardenPlant

const STATIC_SPECIES = [
  { name: 'Romero', latin: 'Salvia rosmarinus', icon: '🌿' },
  { name: 'Manzanilla', latin: 'Matricaria chamomilla', icon: '🌼' },
  { name: 'Menta', latin: 'Mentha sp.', icon: '🌱' },
  { name: 'Toronjil', latin: 'Melissa officinalis', icon: '🍃' },
  { name: 'Hierbabuena', latin: 'Mentha spicata', icon: '🌿' },
  { name: 'Lavanda', latin: 'Lavandula sp.', icon: '💜' },
  { name: 'Orégano', latin: 'Origanum vulgare', icon: '🌱' },
  { name: 'Llantén', latin: 'Plantago major', icon: '🌾' },
]

const SCREENS: { name: Screen; icon: string; subtitle: string }[] = [
  { name: 'Inicio', icon: '⌂', subtitle: 'Tu huerto real y tu huerto digital' },
  { name: 'Usuarios', icon: '♟', subtitle: 'Acceso y perfiles' },
  { name: 'Comunidades', icon: '§', subtitle: 'Personas que cultivan' },
  { name: 'Huertos reales', icon: '⌖', subtitle: 'Ubicación y terreno' },
  { name: 'Plantas medicinales', icon: '⁂', subtitle: 'Explora el catálogo' },
  { name: 'Mi historia', icon: '▤', subtitle: 'Bitácora de cultivo y Mi camino verde' },
]

export default function App() {
  const [user, setUser] = useState<UserSession | null>(() => getUser())
  const [screen, setScreen] = useState<Screen>('Bienvenida')
  const [speciesCatalog, setSpeciesCatalog] = useState(STATIC_SPECIES)
  const [activeGardenId, setActiveGardenId] = useState<string | null>(null)
  const [activeCommunityId, setActiveCommunityId] = useState<string | null>(null)

  const [communityRecord, setCommunityRecord] = useState<Community | null>(null)
  const community = communityRecord?.name ?? ''
  // Rol del usuario actual dentro de la comunidad activa
  const [currentCommunityRole, setCurrentCommunityRole] = useState<'RESPONSABLE' | 'PARTICIPANTE' | null>(null)
  const [userCommunities, setUserCommunities] = useState<Community[]>([])
  const [realGarden, setRealGarden] = useState<RealGarden | null>(null)
  const [realGardenDraft, setRealGardenDraft] = useState<RealGardenDraft>(() => toGardenDraft(null))
  const garden = realGarden?.name ?? ''
  const savedProvince = realGarden?.location?.province ?? ''
  const [plants, setPlants] = useState<Plant[]>([])
  const [registration, setRegistration] = useState<{ plot: number | null; species: string; notice?: string } | null>(null)
  const savedPhotos = useRef<string[]>([])
  const nextPlantId = useRef(0)
  const [detail, setDetail] = useState<Plant | null>(null)
  const [query, setQuery] = useState('')
  const [feedback, setFeedback] = useState('')
  const [selectedPlot, setSelectedPlot] = useState<number | null>(null)
  const [isNotificationsOpen, setNotificationsOpen] = useState(false)
  const [pendingInvitations, setPendingInvitations] = useState<CommunityInvitationItem[]>([])

  // Resolver el rol del usuario actual en la comunidad activa
  useEffect(() => {
    if (!user || !activeCommunityId) {
      setCurrentCommunityRole(null)
      return
    }
    memberApi
      .list(activeCommunityId)
      .then(members => {
        const mine = members.find(m => m.userId === user.id && m.status === 'ACCEPTED')
        if (mine) {
          setCurrentCommunityRole(mine.roleInCommunity === 'RESPONSABLE' ? 'RESPONSABLE' : 'PARTICIPANTE')
        } else if (communityRecord && (communityRecord as any).creatorId === user.id) {
          setCurrentCommunityRole('RESPONSABLE')
        } else {
          setCurrentCommunityRole(user.role === 'RESPONSABLE' ? 'RESPONSABLE' : 'PARTICIPANTE')
        }
      })
      .catch(() => {
        if (communityRecord && (communityRecord as any).creatorId === user.id) {
          setCurrentCommunityRole('RESPONSABLE')
        } else {
          setCurrentCommunityRole(null)
        }
      })
  }, [activeCommunityId, communityRecord, user])

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

  useEffect(() => () => {
    savedPhotos.current.forEach(url => URL.revokeObjectURL(url))
  }, [])

  async function handleInvitationAccepted(communityId: string) {
    try {
      const list = await communityApi.list()
      setUserCommunities(list || [])
      const found = list.find((c: any) => c.id === communityId)
      if (found) {
        await selectActiveCommunity(found)
      } else if (list && list.length > 0 && !communityRecord) {
        await selectActiveCommunity(list[0])
      }
      await loadPendingInvitations()
    } catch {}
  }

  // Desplazar al encabezado al cambiar de pantalla
  useEffect(() => {
    if (screen === 'Bienvenida' || screen === 'Usuarios') return
    document.querySelector<HTMLElement>('[data-screen-heading]')?.focus({ preventScroll: true })
    window.scrollTo(0, 0)
  }, [screen])

  // Cargar especies desde el catálogo SQLite
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

  // Cargar datos persistentes del usuario desde SQLite
  useEffect(() => {
    if (!user) return

    // Cargar comunidades del usuario (filtradas por membresía en backend)
    communityApi
      .list()
      .then(list => {
        const comms = list || []
        setUserCommunities(comms)
        if (comms.length > 0) {
          // Preferir la comunidad creada por el propio usuario (donde es creador) si existe
          const own = comms.find((c: any) => c.creatorId === user.id)
          const active = (own || comms[0]) as unknown as Community & { id: string }
          setCommunityRecord(active)
          if (active.id) {
            setActiveCommunityId(active.id)
            loadGardenForCommunity(active.id)
          }
        } else {
          // Usuario nuevo sin comunidad: estado limpio y sin datos ajenos
          setCommunityRecord(null)
          setActiveCommunityId(null)
          setActiveGardenId(null)
          setRealGarden(null)
          setRealGardenDraft(toGardenDraft(null))
          setPlants([])
        }
      })
      .catch(() => {
        setUserCommunities([])
        setCommunityRecord(null)
        setActiveCommunityId(null)
        setActiveGardenId(null)
        setRealGarden(null)
        setRealGardenDraft(toGardenDraft(null))
        setPlants([])
      })
  }, [user])

  async function loadGardenForCommunity(cId: string) {
    try {
      const gardensList = await gardenApi.list(cId)
      if (gardensList && gardensList.length > 0) {
        const g = gardensList[0] as unknown as RealGarden & { id: string }
        setActiveGardenId(g.id)
        setRealGarden(g)
        setRealGardenDraft(toGardenDraft(g))

        const apiPlants = await plantApi.listByGarden(g.id)
        if (apiPlants && apiPlants.length > 0) {
          const activePlants = apiPlants.filter(p => p.lifecycleStatus !== 'HARVESTED')
          setPlants(
            activePlants.map(p => ({
              id: p.id,
              name: p.species?.name || p.speciesId,
              latin: p.species?.latinName || '',
              photo: p.photoUrl,
              date: new Date(p.plantingDate).toLocaleDateString('es-EC'),
              plot: p.plotIndex,
            }))
          )
        } else {
          setPlants([])
        }
      } else {
        setActiveGardenId(null)
        setRealGarden(null)
        setRealGardenDraft(toGardenDraft(null))
        setPlants([])
      }
    } catch {
      setActiveGardenId(null)
      setRealGarden(null)
      setRealGardenDraft(toGardenDraft(null))
      setPlants([])
    }
  }

  async function selectActiveCommunity(comm: Community) {
    setCommunityRecord(comm)
    const cId = (comm as any).id
    if (cId) {
      setActiveCommunityId(cId)
      await loadGardenForCommunity(cId)
    }
  }

  function goto(next: Screen) {
    setRegistration(null)
    setScreen(next)
    setFeedback('')
  }

  async function handleAuth(submission: AuthSubmission): Promise<{ message: string }> {
    try {
      const result = await authApi.handleSubmission(submission)
      setUser(result.user)
      setFeedback(result.message)
      setTimeout(() => {
        goto('Inicio')
      }, 700)
      return { message: result.message }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al conectar con el servidor.'
      throw new Error(msg)
    }
  }

  function handleLogout() {
    authApi.logout()
    setUser(null)
    setCommunityRecord(null)
    setActiveCommunityId(null)
    setCurrentCommunityRole(null)
    setRealGarden(null)
    setActiveGardenId(null)
    setPlants([])
    setPendingInvitations([])
    setUserCommunities([])
    setNotificationsOpen(false)
    goto('Bienvenida')
  }

  async function saveCommunity(next: Community) {
    setCommunityRecord(next)
    setRealGarden(current => (current ? { ...current, communityName: next.name } : current))
    if (user) {
      try {
        const created = await communityApi.create(next)
        if (created?.id) {
          setActiveCommunityId(created.id)
          const list = await communityApi.list()
          setUserCommunities(list || [])
        }
        setFeedback('¡Comunidad guardada con éxito en la base de datos!')
      } catch (err: unknown) {
        setFeedback(err instanceof Error ? err.message : 'Error al guardar la comunidad')
      }
    }
  }

  async function saveGarden(next: RealGarden) {
    setRealGarden(next)
    if (user) {
      try {
        let saved: RealGarden & { id: string }
        if (activeGardenId) {
          saved = await gardenApi.update(activeGardenId, next, activeCommunityId)
        } else {
          saved = await gardenApi.create(next, activeCommunityId)
        }
        if (saved?.id) setActiveGardenId(saved.id)
        setRealGarden(saved)
        setRealGardenDraft(toGardenDraft(saved))
        if (activeCommunityId) {
          await loadGardenForCommunity(activeCommunityId)
        }
        setFeedback('¡Huerto real guardado y sincronizado con la comunidad!')
      } catch (err: unknown) {
        setFeedback(err instanceof Error ? err.message : 'Error al guardar el huerto')
      }
    }
  }

  async function addPlant({ photo, species, plot, plantedOn }: PlantRegistration): Promise<PlantRegistrationResult> {
    if (user) {
      if (!activeGardenId) {
        return { ok: false, error: 'Primero vincula tu comunidad y registra tu huerto real.' }
      }
      if (!Number.isInteger(plot) || plot < 0 || plot >= PLOT_COUNT) {
        return { ok: false, error: 'Selecciona un espacio de cultivo válido.' }
      }
      if (plants.some(plant => plant.plot === plot)) {
        return { ok: false, error: 'Ese espacio ya tiene una planta. Elige otro espacio disponible.' }
      }

      try {
        const file = new File([photo], `${species.name.toLowerCase().replace(/\s+/g, '-')}.jpg`, {
          type: photo.type || 'image/jpeg',
        })
        const apiPlant = await plantApi.register(activeGardenId, {
          file,
          speciesId: species.name,
          plotIndex: plot,
          customName: species.name,
          notes: plantedOn ? `Sembrada el ${plantedOn}` : 'Registrada con cámara Kawsapacha',
        })

        const record: Plant = {
          id: apiPlant.id,
          name: apiPlant.species?.name || species.name,
          latin: apiPlant.species?.latinName || species.latin,
          photo: apiPlant.photoUrl,
          date: new Date(apiPlant.plantingDate).toLocaleDateString('es-EC'),
          plot: apiPlant.plotIndex,
          plantedOn,
        }
        setPlants(existing => [...existing, record])
        setRegistration(null)
        setDetail(record)
        setSelectedPlot(null)
        setFeedback('¡Fotografía y planta guardadas exitosamente en el servidor!')
        return { ok: true }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error al registrar la planta en el servidor.'
        return { ok: false, error: msg }
      }
    }

    // Modo visitante
    if (!realGarden) return { ok: false, error: 'Primero registra tu huerto' }
    if (!Number.isInteger(plot) || plot < 0 || plot >= PLOT_COUNT) {
      return { ok: false, error: 'Selecciona un espacio de cultivo válido.' }
    }
    if (plants.some(plant => plant.plot === plot)) {
      return { ok: false, error: 'Ese espacio ya tiene una planta. Elige otro espacio disponible.' }
    }

    const id = `plant-${++nextPlantId.current}`
    const date = new Date().toLocaleDateString('es-EC')
    const photoUrl = URL.createObjectURL(photo)
    savedPhotos.current.push(photoUrl)
    const record: Plant = {
      id,
      name: species.name,
      latin: species.latin,
      photo: photoUrl,
      date,
      plot,
      ...(plantedOn ? { plantedOn } : {}),
    }
    setPlants(existing => [...existing, record])
    setRegistration(null)
    setDetail(record)
    setSelectedPlot(null)
    return { ok: true }
  }

  function handlePlantHarvested(_plantId: string) {
    setDetail(null)
    setFeedback('🌾 ¡Cosecha recolectada e ingresada al almacén! La planta permanece sembrada y ha iniciado un nuevo ciclo de rebrote.')
    if (activeGardenId) {
      plantApi
        .listByGarden(activeGardenId)
        .then(apiPlants => {
          const activePlants = apiPlants.filter(p => p.lifecycleStatus !== 'REMOVED')
          setPlants(
            activePlants.map(p => ({
              id: p.id,
              name: p.species?.name || p.speciesId,
              latin: p.species?.latinName || '',
              photo: p.photoUrl,
              date: new Date(p.plantingDate).toLocaleDateString('es-EC'),
              plot: p.plotIndex,
            }))
          )
        })
        .catch(() => {})
    }
  }

  function handlePlantRemoved(plantId: string) {
    setPlants(prev => prev.filter(p => p.id !== plantId))
    setDetail(null)
    setFeedback('🗑️ Planta desarraigada. La parcela ha quedado libre para un nuevo cultivo.')
  }

  function registerInPlot(plot?: number, speciesName: string = SPECIES[0].name, notice?: string) {
    setSelectedPlot(plot ?? null)
    setDetail(null)
    setRegistration({ plot: plot ?? null, species: speciesName, notice })
  }

  function beginCultivation(speciesName: string) {
    registerInPlot(undefined, speciesName)
  }

  function gardenAction(action: GardenAction) {
    if (action === 'register') {
      registerInPlot()
    } else if (action === 'real-garden') {
      goto('Huertos reales')
    } else if (action === 'logbook') {
      goto('Mi historia')
    } else if (action === 'passport') {
      if (plants.length > 0) {
        setDetail(plants[plants.length - 1])
      } else {
        registerInPlot(undefined, SPECIES[0].name, 'Tu Pasaporte Vivo comienza con una fotografía. Registra tu primera planta para consultarlo.')
      }
    }
  }

  function navigateGarden(destination: GardenDestination) {
    const destinations = {
      garden: 'Inicio',
      community: 'Comunidades',
      'real-garden': 'Huertos reales',
      plants: 'Plantas medicinales',
      history: 'Mi historia',
    } as const
    goto(destinations[destination])
  }

  const visible = speciesCatalog.filter(
    s =>
      s.name.toLowerCase().includes(query.toLowerCase()) ||
      s.latin.toLowerCase().includes(query.toLowerCase())
  )

  const ready = user ? Boolean(community && activeGardenId) : Boolean(realGarden)
  const title =
    screen === 'Comunidades'
      ? 'Comunidad'
      : screen === 'Plantas medicinales'
      ? 'Descubrir plantas'
      : screen
  const activeNavigation: GardenDestination =
    screen === 'Comunidades'
      ? 'community'
      : screen === 'Huertos reales'
      ? 'real-garden'
      : screen === 'Plantas medicinales'
      ? 'plants'
      : screen === 'Mi historia'
      ? 'history'
      : 'garden'

  if (screen === 'Bienvenida' || screen === 'Usuarios') {
    return <AuthPage onExploreDemo={(destination = 'Inicio') => goto(destination)} onSubmit={handleAuth} />
  }

  return (
    <div className="garden-shell">
      <GardenNavigation
        active={activeNavigation}
        onNavigate={navigateGarden}
        onWelcome={() => goto('Bienvenida')}
        user={user}
        onLogout={handleLogout}
        pendingInvitationsCount={pendingInvitations.length}
        onOpenNotifications={() => setNotificationsOpen(true)}
      />
      {screen === 'Inicio' ? (
        <MyGardenPage
          plants={plants}
          community={community}
          garden={garden}
          province={savedProvince}
          realGarden={realGarden}
          selectedPlot={selectedPlot}
          onSelect={setDetail}
          onRegister={registerInPlot}
          onAction={gardenAction}
          onNavigate={navigateGarden}
          user={user}
          pendingInvitationsCount={pendingInvitations.length}
          onOpenNotifications={() => setNotificationsOpen(true)}
        />
      ) : screen === 'Comunidades' ? (
        <CommunitiesPage
          community={communityRecord}
          communityId={activeCommunityId}
          garden={garden}
          user={user}
          currentCommunityRole={currentCommunityRole}
          userCommunities={userCommunities}
          onSelectCommunity={selectActiveCommunity}
          hasCreatedOwnCommunity={userCommunities.some(c => (c as any).creatorId === user?.id)}
          onSave={saveCommunity}
          onGarden={() => goto('Huertos reales')}
          onHome={() => goto('Inicio')}
        />
      ) : screen === 'Huertos reales' ? (
        <RealGardenPage
          garden={realGarden}
          draft={realGardenDraft}
          onDraftChange={setRealGardenDraft}
          communityName={communityRecord?.name ?? null}
          onSave={saveGarden}
          onConnect={() => goto('Inicio')}
          onHome={() => goto('Inicio')}
          onCommunity={() => goto('Comunidades')}
          user={user}
          currentCommunityRole={currentCommunityRole}
        />
      ) : (
        <main className="main garden-module">
          <header className="topbar">
            <span className="breadcrumbs">
              Kawsapacha <span> / </span> {screen}
            </span>
            <span className="user-pill">
              <span className="user-dot" aria-hidden="true">
                {user ? '●' : 'V'}
              </span>
              {user ? ` ${user.name} · ${user.role}` : ' Modo visitante · Sin sesión'}
            </span>
          </header>
          <div className="page">
            {user ? (
              <div
                className="prototype-alert"
                style={{ background: 'rgba(56, 161, 105, 0.15)', borderColor: '#38a169', color: '#2f855a' }}
              >
                <strong>Sesión activa ({user.name}):</strong> Tus datos, comunidades, huertos y fotografías se guardan y persisten en la base de datos SQLite.
              </div>
            ) : (
              <div className="prototype-alert">
                <strong>Modo visitante, sin sesión iniciada:</strong> Los registros viven temporalmente. Inicia sesión o crea tu cuenta para guardar en la base de datos.
              </div>
            )}
            <div className="heading">
              <div>
                <span className="eyebrow">Kawsapacha · Versión 1</span>
                <h1 tabIndex={-1} data-screen-heading>
                  {title}
                </h1>
                <p>{SCREENS.find(s => s.name === screen)?.subtitle}</p>
              </div>
              <button className="cta small" onClick={() => goto('Inicio')}>
                Volver a Mi jardín <span aria-hidden>↗</span>
              </button>
            </div>
            {feedback ? (
              <div className="feedback" role="status">
                {feedback}
              </div>
            ) : null}

            {screen === 'Mi historia' && (
              <GardenHistory
                plants={plants}
                onRegister={() => registerInPlot()}
                onSelect={setDetail}
                onRealGarden={() => goto('Huertos reales')}
              />
            )}

            {screen === 'Plantas medicinales' && (
              <section className="section">
                <div className="catalog-header">
                  <div>
                    <span className="eyebrow">03 · BOTÁNICA</span>
                    <h2>Explora las especies</h2>
                    <p>Catálogo botánico medicinal tradicional andino conectado con la base de datos.</p>
                  </div>
                  <label className="search-label">
                    <span>⌕</span>
                    <input
                      value={query}
                      onChange={e => setQuery(e.target.value)}
                      placeholder="Buscar por nombre…"
                      aria-label="Buscar plantas"
                    />
                  </label>
                </div>
                <div className="catalog-grid">
                  {visible.map((s, i) => (
                    <article className="species-card" key={s.name}>
                      <div className={`species-art tone-${i % 4}`}>
                        <span>{s.icon}</span>
                      </div>
                      <div className="species-copy">
                        <strong>{s.name}</strong>
                        <em>{s.latin}</em>
                        <button onClick={() => beginCultivation(s.name)}>Registrar en mi huerto ↗</button>
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
          plants={plants}
          initialPlot={registration.plot}
          initialSpecies={registration.species}
          notice={registration.notice}
          ready={ready}
          onConfirm={addPlant}
          onClose={() => setRegistration(null)}
          onSetup={() => goto('Huertos reales')}
        />
      )}

      <PlantPassport
        plant={detail}
        user={user}
        currentCommunityRole={currentCommunityRole}
        onClose={() => setDetail(null)}
        onHistory={() => {
          setDetail(null)
          goto('Mi historia')
        }}
        onPlantHarvested={handlePlantHarvested}
        onPlantRemoved={handlePlantRemoved}
      />

      {isNotificationsOpen && (
        <NotificationsModal
          onClose={() => setNotificationsOpen(false)}
          onAccepted={handleInvitationAccepted}
        />
      )}
    </div>
  )
}
