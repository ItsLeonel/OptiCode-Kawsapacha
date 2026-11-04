import { useEffect, useRef, useState } from 'react'
import AuthPage from './features/auth/AuthPage'
import MyGardenPage from './features/my-garden/MyGardenPage'
import GardenNavigation from './features/my-garden/GardenNavigation'
import GardenHistory from './features/my-garden/GardenHistory'
import PlantPassport from './features/my-garden/PlantPassport'
import PlantRegistrationModal from './features/my-garden/PlantRegistrationModal'
import { PLANT_SPECIES as SPECIES, type PlantRegistration, type PlantRegistrationResult } from './features/my-garden/plant-species'
import CommunitiesPage from './features/communities/CommunitiesPage'
import type { Community } from './features/communities/communities'
import RealGardenPage from './features/real-gardens/RealGardenPage'
import { toGardenDraft, type RealGarden, type RealGardenDraft } from './features/real-gardens/real-garden'
import { PLOT_COUNT, type GardenAction, type GardenDestination, type GardenPlant } from './features/my-garden/garden'

type Screen = 'Bienvenida' | 'Inicio' | 'Usuarios' | 'Comunidades' | 'Huertos reales' | 'Plantas medicinales' | 'Mi historia'
type Plant = GardenPlant
const SCREENS: {name:Screen; icon:string; subtitle:string}[] = [
  {name:'Inicio',icon:'⌂',subtitle:'Tu huerto real y tu huerto digital'},
  {name:'Usuarios',icon:'♙',subtitle:'Acceso y perfiles'},
  {name:'Comunidades',icon:'♧',subtitle:'Personas que cultivan'},
  {name:'Huertos reales',icon:'⌖',subtitle:'Ubicación y terreno'},
  {name:'Plantas medicinales',icon:'❃',subtitle:'Explora el catálogo'},
  {name:'Mi historia',icon:'▤',subtitle:'Bitácora de cultivo y Mi camino verde'}
]

export default function App() {
  const [screen,setScreen] = useState<Screen>('Bienvenida')
  const [communityRecord,setCommunityRecord] = useState<Community | null>(null)
  const community = communityRecord?.name ?? ''
  const [realGarden,setRealGarden] = useState<RealGarden | null>(null)
  const [realGardenDraft, setRealGardenDraft] = useState<RealGardenDraft>(() => toGardenDraft(null))
  const garden = realGarden?.name ?? ''
  const savedProvince = realGarden?.location.province ?? ''
  const [plants,setPlants] = useState<Plant[]>([])
  const [registration, setRegistration] = useState<{ plot: number | null; species: string; notice?: string } | null>(null)
  const savedPhotos = useRef<string[]>([])
  const nextPlantId = useRef(0)
  const [detail,setDetail] = useState<Plant|null>(null)
  const [query,setQuery] = useState('')
  const [selectedPlot,setSelectedPlot] = useState<number|null>(null)

  useEffect(() => {
    if (screen === 'Bienvenida' || screen === 'Usuarios') return
    document.querySelector<HTMLElement>('[data-screen-heading]')?.focus({ preventScroll: true })
    window.scrollTo(0, 0)
  }, [screen])

  useEffect(() => () => { savedPhotos.current.forEach(url => URL.revokeObjectURL(url)) }, [])

  function goto(next: Screen) {setRegistration(null);setScreen(next)}
  function saveCommunity(next: Community) {
    setCommunityRecord(next)
    setRealGarden(current => current ? { ...current, communityName: next.name } : current)
  }
  function addPlant({ photo, species, plot, plantedOn }: PlantRegistration): PlantRegistrationResult {
    if (!realGarden) return { ok: false, error: 'Primero registra tu huerto' }
    if (!Number.isInteger(plot) || plot < 0 || plot >= PLOT_COUNT) return { ok: false, error: 'Selecciona un espacio de cultivo válido.' }
    if (plants.some(plant => plant.plot === plot)) return { ok: false, error: 'Ese espacio ya tiene una planta. Elige otro espacio disponible.' }
    // IDs only identify records in this visit; they do not require a secure-context API.
    const id = `plant-${++nextPlantId.current}`
    const date = new Date().toLocaleDateString('es-EC')
    const photoUrl = URL.createObjectURL(photo)
    savedPhotos.current.push(photoUrl)
    const record: Plant = { id, name: species.name, latin: species.latin, photo: photoUrl, date, plot, ...(plantedOn ? { plantedOn } : {}) }
    setPlants(existing => [...existing, record])
    setRegistration(null)
    setScreen('Inicio')
    setDetail(record)
    setSelectedPlot(null)
    return { ok: true }
  }
  function beginCultivation(name:string) {registerInPlot(undefined, name)}
  function navigateGarden(destination: GardenDestination) {
    const destinations = { garden: 'Inicio', community: 'Comunidades', 'real-garden': 'Huertos reales', plants: 'Plantas medicinales', history: 'Mi historia' } as const
    goto(destinations[destination])
  }
  function registerInPlot(plot?: number, species: string = SPECIES[0].name, notice?: string) {
    setSelectedPlot(plot ?? null)
    setDetail(null)
    setRegistration({ plot: plot ?? null, species, notice })
  }
  function gardenAction(action: GardenAction) {
    if (action === 'register') registerInPlot()
    else if (action === 'real-garden') goto('Huertos reales')
    else if (action === 'logbook') goto('Mi historia')
    else if (plants.length) setDetail(plants[plants.length - 1])
    else registerInPlot(undefined, SPECIES[0].name, 'Tu Pasaporte Vivo comienza con una fotografía. Registra tu primera planta para consultarlo.')
  }
  const visible=SPECIES.filter(s=>`${s.name} ${s.latin}`.toLocaleLowerCase().includes(query.toLocaleLowerCase()))
  const ready=Boolean(realGarden)
  const title=screen==='Comunidades'?'Comunidad':screen==='Plantas medicinales'?'Descubrir plantas':screen
  const activeNavigation: GardenDestination = screen === 'Comunidades' ? 'community' : screen === 'Huertos reales' ? 'real-garden' : screen === 'Plantas medicinales' ? 'plants' : screen === 'Mi historia' ? 'history' : 'garden'

  if (screen === 'Bienvenida' || screen === 'Usuarios') {
    return <AuthPage onExploreDemo={(destination = 'Inicio') => goto(destination)}/>
  }

  return <div className="garden-shell">
    <GardenNavigation active={activeNavigation} onNavigate={navigateGarden} onWelcome={() => goto('Bienvenida')}/>
    {screen === 'Inicio' ? <MyGardenPage plants={plants} community={community} garden={garden} province={savedProvince} realGarden={realGarden} selectedPlot={selectedPlot} onSelect={setDetail} onRegister={registerInPlot} onAction={gardenAction} onNavigate={navigateGarden}/>
      : screen === 'Comunidades' ? <CommunitiesPage community={communityRecord} garden={garden} onSave={saveCommunity} onGarden={() => goto('Huertos reales')} onHome={() => goto('Inicio')}/>
      : screen === 'Huertos reales' ? <RealGardenPage garden={realGarden} draft={realGardenDraft} onDraftChange={setRealGardenDraft} communityName={communityRecord?.name ?? null} onSave={setRealGarden} onConnect={() => goto('Inicio')} onHome={() => goto('Inicio')} onCommunity={() => goto('Comunidades')}/>
      : <main className="main garden-module">
      <header className="topbar">
        <span className="breadcrumbs">Kawsapacha <span> / </span> {screen}</span>
        <span className="user-pill"><span className="user-dot" aria-hidden="true">V</span> Modo visitante · Sin sesión</span>
      </header>
      <div className="page">
        <div className="prototype-alert"><strong>Modo visitante, sin sesión iniciada:</strong> los registros y las imágenes solo viven en esta visita. Aún no hay autenticación real, API ni base de datos conectadas.</div>
        <div className="heading"><div><span className="eyebrow">Kawsapacha · Versión 1</span><h1 tabIndex={-1} data-screen-heading>{title}</h1><p>{SCREENS.find(s=>s.name===screen)?.subtitle}</p></div>
          <button className="cta small" onClick={()=>goto('Inicio')}>Volver a Mi jardín <span aria-hidden>↗</span></button>
        </div>

        {screen === 'Mi historia' && <GardenHistory plants={plants} onRegister={() => registerInPlot()} onSelect={setDetail} onRealGarden={() => goto('Huertos reales')}/>}

        {screen==='Plantas medicinales'&&<section className="section">
          <div className="catalog-header"><div><span className="eyebrow">03 · BOTÁNICA</span><h2>Explora las especies</h2><p>Selección inicial para definir la experiencia visual. Leonardo incorporará las fichas botánicas verificadas.</p></div>
            <label className="search-label"><span>⌕</span><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar por nombre…" aria-label="Buscar plantas"/></label></div>
          <div className="catalog-grid">
            {visible.map((s,i)=><article className="species-card" key={s.name}><div className={`species-art tone-${i%4}`}><span>{s.icon}</span></div>
              <div className="species-copy"><strong>{s.name}</strong><em>{s.latin}</em><button onClick={()=>beginCultivation(s.name)}>Registrar en mi huerto ↗</button></div>
            </article>)}
          </div>
          {!visible.length&&<p>No se encontraron especies con ese nombre.</p>}
        </section>}


      </div>
    </main>}
    {registration && <PlantRegistrationModal plants={plants} initialPlot={registration.plot} initialSpecies={registration.species} notice={registration.notice} ready={ready} onConfirm={addPlant} onClose={() => setRegistration(null)} onSetup={() => goto('Huertos reales')}/>}
    <PlantPassport plant={detail} onClose={() => setDetail(null)} onHistory={() => {setDetail(null);goto('Mi historia')}}/>
  </div>
}
