import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import AuthPage from './features/auth/AuthPage'
import MyGardenPage from './features/my-garden/MyGardenPage'
import GardenNavigation from './features/my-garden/GardenNavigation'
import GardenHistory from './features/my-garden/GardenHistory'
import PlantPassport from './features/my-garden/PlantPassport'
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
  getUser,
  type UserSession,
} from './services/api'

type Screen = 'Bienvenida' | 'Inicio' | 'Usuarios' | 'Comunidades' | 'Huertos reales' | 'Plantas medicinales' | 'Huerto virtual' | 'Mi historia'
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
  { name: 'Usuarios', icon: '♙', subtitle: 'Acceso y perfiles' },
  { name: 'Comunidades', icon: '♧', subtitle: 'Personas que cultivan' },
  { name: 'Huertos reales', icon: '⌖', subtitle: 'Ubicación y terreno' },
  { name: 'Plantas medicinales', icon: '❃', subtitle: 'Explora el catálogo' },
  { name: 'Huerto virtual', icon: '✿', subtitle: 'Una fotografía real para tu parcela digital' },
  { name: 'Mi historia', icon: '▤', subtitle: 'Bitácora de cultivo y Mi camino verde' },
]

export default function App() {
  const [user, setUser] = useState<UserSession | null>(() => getUser())
  const [screen, setScreen] = useState<Screen>('Bienvenida')
  const [speciesCatalog, setSpeciesCatalog] = useState(STATIC_SPECIES)
  const [activeGardenId, setActiveGardenId] = useState<string | null>(null)

  const [communityRecord, setCommunityRecord] = useState<Community | null>(null)
  const community = communityRecord?.name ?? ''
  const [realGarden, setRealGarden] = useState<RealGarden | null>(null)
  const [realGardenDraft, setRealGardenDraft] = useState<RealGardenDraft>(() => toGardenDraft(null))
  const garden = realGarden?.name ?? ''
  const savedProvince = realGarden?.location.province ?? ''
  const [plants, setPlants] = useState<Plant[]>([])
  const [species, setSpecies] = useState(STATIC_SPECIES[0].name)
  const [picture, setPicture] = useState<File | null>(null)
  const [preview, setPreview] = useState('')
  const [detail, setDetail] = useState<Plant | null>(null)
  const [query, setQuery] = useState('')
  const [feedback, setFeedback] = useState('')
  const [selectedPlot, setSelectedPlot] = useState<number | null>(null)

  // Desplazar al encabezado al cambiar de pantalla
  useEffect(() => {
    if (screen === 'Bienvenida' || screen === 'Usuarios') return
    document.querySelector<HTMLElement>('[data-screen-heading]')?.focus({ preventScroll: true })
    window.scrollTo(0, 0)
  }, [screen])

  // Cargar especies desde el catálogo SQLite
  useEffect(() => {
    catalogApi.list().then(items => {
      if (items && items.length > 0) {
        setSpeciesCatalog(items.map(s => ({ name: s.name, latin: s.latinName, icon: s.icon || '🌿' })))
      }
    }).catch(() => {})
  }, [])

  // Cargar datos persistentes del usuario desde SQLite
  useEffect(() => {
    if (!user) return

    // Cargar comunidades del usuario
    communityApi.list().then(list => {
      if (list && list.length > 0) {
        setCommunityRecord(list[0])
      }
    }).catch(() => {})

    // Cargar huertos del usuario
    gardenApi.list().then(async (gardensList) => {
      if (gardensList && gardensList.length > 0) {
        const g = gardensList[0] as unknown as (RealGarden & { id: string })
        setActiveGardenId(g.id)
        setRealGarden(g)
        setRealGardenDraft(toGardenDraft(g))

        // Cargar plantas del huerto virtual
        try {
          const apiPlants = await plantApi.listByGarden(g.id)
          if (apiPlants && apiPlants.length > 0) {
            setPlants(apiPlants.map(p => ({
              id: p.id,
              name: p.species?.name || p.speciesId,
              latin: p.species?.latinName || '',
              photo: p.photoUrl,
              date: new Date(p.plantingDate).toLocaleDateString('es-EC'),
              plot: p.plotIndex,
            })))
          }
        } catch {}
      }
    }).catch(() => {})
  }, [user])

  function goto(next: Screen) {
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
    setRealGarden(null)
    setActiveGardenId(null)
    setPlants([])
    goto('Bienvenida')
  }

  async function saveCommunity(next: Community) {
    setCommunityRecord(next)
    setRealGarden(current => current ? { ...current, communityName: next.name } : current)
    if (user) {
      try {
        await communityApi.create(next)
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
        const created = await gardenApi.create(next, communityRecord?.name) as unknown as (RealGarden & { id: string })
        if (created?.id) setActiveGardenId(created.id)
        setFeedback('¡Huerto real guardado con éxito en la base de datos!')
      } catch (err: unknown) {
        setFeedback(err instanceof Error ? err.message : 'Error al guardar el huerto')
      }
    }
  }

  function choosePicture(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 3 * 1024 * 1024) {
      setFeedback('Usa JPG, PNG o WebP de hasta 3 MB.')
      setPicture(null)
      setPreview('')
      return
    }
    setPicture(file)
    setPreview(URL.createObjectURL(file))
    setFeedback('')
  }

  async function addPlant(e: FormEvent) {
    e.preventDefault()
    if (!community || !garden) {
      setFeedback('Primero crea una comunidad y su huerto.')
      return
    }
    if (!picture || !preview) {
      setFeedback('Selecciona una fotografía válida para registrar la planta.')
      return
    }
    const nextPlot = selectedPlot !== null && !plants.some(plant => plant.plot === selectedPlot)
      ? selectedPlot
      : Array.from({ length: PLOT_COUNT }, (_, plotIndex) => plotIndex).find(plotIndex => !plants.some(plant => plant.plot === plotIndex))

    if (nextPlot === undefined) {
      setFeedback('Las seis parcelas están ocupadas. Puedes consultar sus Pasaportes Vivos.')
      return
    }
    const s = speciesCatalog.find(x => x.name === species) || STATIC_SPECIES[0]

    // Si el usuario está autenticado y tenemos huerto persistido en BD:
    if (user && activeGardenId) {
      try {
        setFeedback('Subiendo fotografía y guardando en SQLite...')
        const apiPlant = await plantApi.register(activeGardenId, {
          file: picture,
          speciesId: s.name,
          plotIndex: nextPlot,
          customName: s.name,
          notes: 'Registrada desde el huerto virtual Kawsapacha',
        })

        const record: Plant = {
          id: apiPlant.id,
          name: apiPlant.species?.name || s.name,
          latin: apiPlant.species?.latinName || s.latin,
          photo: apiPlant.photoUrl,
          date: new Date(apiPlant.plantingDate).toLocaleDateString('es-EC'),
          plot: apiPlant.plotIndex,
        }
        setPlants(existing => [...existing, record])
        setDetail(record)
        setPicture(null)
        setPreview('')
        setSelectedPlot(null)
        setFeedback('¡Fotografía y planta guardadas exitosamente en el servidor!')
        const input = document.getElementById('plant-photo') as HTMLInputElement | null
        if (input) input.value = ''
        return
      } catch (err: unknown) {
        setFeedback(err instanceof Error ? err.message : 'Error al registrar la planta en el servidor.')
        return
      }
    }

    // Modo visitante / demostración en memoria:
    const record: Plant = {
      id: `${Date.now()}-${Math.random()}`,
      name: s.name,
      latin: s.latin,
      photo: preview,
      date: new Date().toLocaleDateString('es-EC'),
      plot: nextPlot,
    }
    setPlants(existing => [...existing, record])
    setDetail(record)
    setPicture(null)
    setPreview('')
    setSelectedPlot(null)
    setFeedback('¡Tu planta aparece en el huerto! (Modo visitante; inicia sesión para persistirla).')
    const input = document.getElementById('plant-photo') as HTMLInputElement | null
    if (input) input.value = ''
  }

  function beginCultivation(name: string) {
    setSpecies(name)
    setDetail(null)
    goto('Huerto virtual')
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

  function registerInPlot(plot?: number) {
    setSelectedPlot(plot ?? null)
    setDetail(null)
    goto('Huerto virtual')
  }

  function gardenAction(action: GardenAction) {
    if (action === 'register') registerInPlot()
    else if (action === 'real-garden') goto('Huertos reales')
    else if (action === 'logbook') goto('Mi historia')
    else if (plants.length) setDetail(plants[plants.length - 1])
    else {
      registerInPlot()
      setFeedback('Tu Pasaporte Vivo comienza con una fotografía. Registra tu primera planta para consultarlo.')
    }
  }

  const visible = speciesCatalog.filter(s => `${s.name} ${s.latin}`.toLocaleLowerCase().includes(query.toLocaleLowerCase()))
  const ready = Boolean(community && garden)
  const title = screen === 'Comunidades' ? 'Comunidad' : screen === 'Plantas medicinales' ? 'Descubrir plantas' : screen === 'Huerto virtual' ? 'Registrar planta' : screen
  const activeNavigation: GardenDestination = screen === 'Comunidades' ? 'community' : screen === 'Huertos reales' ? 'real-garden' : screen === 'Plantas medicinales' ? 'plants' : screen === 'Mi historia' ? 'history' : 'garden'

  if (screen === 'Bienvenida' || screen === 'Usuarios') {
    return <AuthPage onExploreDemo={(destination = 'Inicio') => goto(destination)} onSubmit={handleAuth} />
  }

  return (
    <div className="garden-shell">
      <GardenNavigation active={activeNavigation} onNavigate={navigateGarden} onWelcome={() => goto('Bienvenida')} user={user} onLogout={handleLogout} />
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
        />
      ) : screen === 'Comunidades' ? (
        <CommunitiesPage
          community={communityRecord}
          garden={garden}
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
        />
      ) : (
        <main className="main garden-module">
          <header className="topbar">
            <span className="breadcrumbs">Kawsapacha <span> / </span> {screen}</span>
            <span className="user-pill">
              <span className="user-dot" aria-hidden="true">{user ? '●' : 'V'}</span>
              {user ? ` ${user.name} · ${user.role}` : ' Modo visitante · Sin sesión'}
            </span>
          </header>
          <div className="page">
            {user ? (
              <div className="prototype-alert" style={{ background: 'rgba(56, 161, 105, 0.15)', borderColor: '#38a169', color: '#2f855a' }}>
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
                <h1 tabIndex={-1} data-screen-heading>{title}</h1>
                <p>{SCREENS.find(s => s.name === screen)?.subtitle}</p>
              </div>
              <button className="cta small" onClick={() => goto('Inicio')}>Volver a Mi jardín <span aria-hidden>↗</span></button>
            </div>
            {feedback ? <div className="feedback" role="status">{feedback}</div> : null}

            {screen === 'Mi historia' && (
              <GardenHistory plants={plants} onRegister={() => registerInPlot()} onSelect={setDetail} onRealGarden={() => goto('Huertos reales')} />
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
                    <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar por nombre…" aria-label="Buscar plantas" />
                  </label>
                </div>
                <div className="catalog-grid">
                  {visible.map((s, i) => (
                    <article className="species-card" key={s.name}>
                      <div className={`species-art tone-${i % 4}`}><span>{s.icon}</span></div>
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

            {screen === 'Huerto virtual' && (
              <>
                <section className="garden-header">
                  <div>
                    <span className="eyebrow">04 · MI HUERTO VIVO</span>
                    <h2>{garden || 'Tu jardín está esperando'}</h2>
                    <p>{ready ? `${community} · ${savedProvince}` : 'Primero registra tu comunidad y tu huerto para empezar.'}</p>
                  </div>
                  <div className="garden-count">{plants.length} <span>plantas registradas</span></div>
                </section>
                <div className="two-col garden-layout">
                  <section className="card garden-card">
                    <div className="garden-sky"><span>☀</span><span>Un lugar para crecer</span></div>
                    <div className="plot-grid">
                      {Array.from({ length: PLOT_COUNT }, (_, i) => {
                        const plant = plants.find(record => record.plot === i)
                        return (
                          <button
                            key={i}
                            className={`plot ${plant ? 'occupied' : ''}`}
                            onClick={() => plant ? setDetail(plant) : setSelectedPlot(i)}
                            aria-label={plant ? `Abrir ficha de ${plant.name}` : `Parcela vacía ${i + 1}`}
                          >
                            {plant ? (
                              <>
                                <img src={plant.photo} alt={plant.name} />
                                <span className="plot-title">{plant.name}</span>
                              </>
                            ) : (
                              <>
                                <span className="plot-empty">＋</span>
                                <small>Parcela {i + 1}</small>
                              </>
                            )}
                          </button>
                        )
                      })}
                    </div>
                    <div className="garden-footer">✿ Fotografías reales + parcelas interactivas · persistencia activa</div>
                  </section>
                  <div className="garden-side">
                    <section className="card">
                      <span className="eyebrow">REGISTRA UNA PLANTA</span>
                      <h2>Haz florecer tu jardín</h2>
                      <p>{selectedPlot === null ? 'Se utilizará la primera parcela disponible.' : `Destino: parcela ${selectedPlot + 1}.`}</p>
                      <form onSubmit={addPlant}>
                        <label className="field">
                          Especie medicinal
                          <select value={species} onChange={e => setSpecies(e.target.value)}>
                            {speciesCatalog.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                          </select>
                        </label>
                        <label className="field">
                          Fotografía de tu planta <span className="muted">(JPG, PNG, WebP · máx. 3 MB)</span>
                          <input id="plant-photo" type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" onChange={choosePicture} />
                        </label>
                        {preview ? <img className="preview-image" src={preview} alt="Vista previa de planta seleccionada" /> : null}
                        <button type="submit" className="cta" disabled={!ready || plants.length >= PLOT_COUNT}>Añadir a mi huerto ↗</button>
                        {!ready && (
                          <div className="garden-registration-steps">
                            <span>Primero vincula tu comunidad y un huerto real para registrar la planta.</span>
                            <button type="button" className="outline" onClick={() => goto(community ? 'Huertos reales' : 'Comunidades')}>
                              {community ? 'Registrar mi huerto real' : 'Crear mi comunidad'} →
                            </button>
                          </div>
                        )}
                        {plants.length >= PLOT_COUNT && <p className="tiny">Las seis parcelas iniciales están ocupadas.</p>}
                      </form>
                    </section>
                  </div>
                </div>
              </>
            )}
          </div>
        </main>
      )}
      <PlantPassport plant={detail} onClose={() => setDetail(null)} onHistory={() => { setDetail(null); goto('Mi historia') }} />
    </div>
  )
}
