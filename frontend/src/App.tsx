import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import EcuadorMap from './EcuadorMap'
import AuthPage from './features/auth/AuthPage'
import MyGardenPage from './features/my-garden/MyGardenPage'
import GardenNavigation from './features/my-garden/GardenNavigation'
import GardenHistory from './features/my-garden/GardenHistory'
import PlantPassport from './features/my-garden/PlantPassport'
import { PLOT_COUNT, type GardenAction, type GardenDestination, type GardenPlant } from './features/my-garden/garden'

type Screen = 'Bienvenida' | 'Inicio' | 'Usuarios' | 'Comunidades' | 'Huertos reales' | 'Plantas medicinales' | 'Huerto virtual' | 'Mi historia'
type Plant = GardenPlant
const SPECIES = [
  {name:'Romero', latin:'Salvia rosmarinus', icon:'🌿'},
  {name:'Manzanilla', latin:'Matricaria chamomilla', icon:'🌼'},
  {name:'Menta', latin:'Mentha sp.', icon:'🌱'},
  {name:'Toronjil', latin:'Melissa officinalis', icon:'🍃'},
  {name:'Hierbabuena', latin:'Mentha spicata', icon:'🌿'},
  {name:'Lavanda', latin:'Lavandula sp.', icon:'💜'},
  {name:'Orégano', latin:'Origanum vulgare', icon:'🌱'},
  {name:'Llantén', latin:'Plantago major', icon:'🌾'}
]
const SCREENS: {name:Screen; icon:string; subtitle:string}[] = [
  {name:'Inicio',icon:'⌂',subtitle:'Tu huerto real y tu huerto digital'},
  {name:'Usuarios',icon:'♙',subtitle:'Acceso y perfiles'},
  {name:'Comunidades',icon:'♧',subtitle:'Personas que cultivan'},
  {name:'Huertos reales',icon:'⌖',subtitle:'Ubicación y terreno'},
  {name:'Plantas medicinales',icon:'❃',subtitle:'Explora el catálogo'},
  {name:'Huerto virtual',icon:'✿',subtitle:'Una fotografía real para tu parcela digital'},
  {name:'Mi historia',icon:'▤',subtitle:'Bitácora de cultivo y Mi camino verde'}
]

export default function App() {
  const [screen,setScreen] = useState<Screen>('Bienvenida')
  const [community,setCommunity] = useState('')
  const [contact,setContact] = useState('')
  const [draftCommunity,setDraftCommunity] = useState('Comunidad Jardín Andino')
  const [draftContact,setDraftContact] = useState('')
  const [garden,setGarden] = useState('')
  const [gardenDraft,setGardenDraft] = useState('Mi Huerto Medicinal')
  const [province,setProvince] = useState('')
  const [area,setArea] = useState('24')
  const [type,setType] = useState('En piso / macetas')
  const [savedProvince,setSavedProvince] = useState('')
  const [plants,setPlants] = useState<Plant[]>([])
  const [species,setSpecies] = useState(SPECIES[0].name)
  const [picture,setPicture] = useState<File|null>(null)
  const [preview,setPreview] = useState('')
  const [detail,setDetail] = useState<Plant|null>(null)
  const [query,setQuery] = useState('')
  const [feedback,setFeedback] = useState('')
  const [selectedPlot,setSelectedPlot] = useState<number|null>(null)

  useEffect(() => {
    if (screen === 'Bienvenida' || screen === 'Usuarios') return
    document.querySelector<HTMLElement>('[data-screen-heading]')?.focus({ preventScroll: true })
    window.scrollTo(0, 0)
  }, [screen])

  function goto(next: Screen) {setScreen(next);setFeedback('')}
  function saveCommunity(e:FormEvent) {
    e.preventDefault()
    if (!draftCommunity.trim()) return
    setCommunity(draftCommunity.trim());setContact(draftContact.trim())
    setFeedback('Comunidad registrada en esta sesión de demostración.')
  }
  function saveGarden(e:FormEvent) {
    e.preventDefault()
    if (!province || !gardenDraft.trim()) {setFeedback('Selecciona una provincia y escribe un nombre de huerto.');return}
    setGarden(gardenDraft.trim());setSavedProvince(province)
    setFeedback('Huerto registrado temporalmente en el prototipo frontend.')
  }
  function choosePicture(e:ChangeEvent<HTMLInputElement>) {
    const file=e.target.files?.[0] ?? null
    if (!file) return
    if (!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size>3*1024*1024) {
      setFeedback('Usa JPG, PNG o WebP de hasta 3 MB.');setPicture(null);setPreview('');return
    }
    setPicture(file);setPreview(URL.createObjectURL(file));setFeedback('')
  }
  function addPlant(e:FormEvent) {
    e.preventDefault()
    if (!community || !garden) {setFeedback('Primero crea una comunidad y su huerto.');return}
    if (!picture || !preview) {setFeedback('Selecciona una fotografía válida para registrar la planta.');return}
    const nextPlot = selectedPlot !== null && !plants.some(plant => plant.plot === selectedPlot)
      ? selectedPlot
      : Array.from({ length: PLOT_COUNT }, (_, plotIndex) => plotIndex).find(plotIndex => !plants.some(plant => plant.plot === plotIndex))
    if (nextPlot === undefined) {setFeedback('Las seis parcelas están ocupadas. Puedes consultar sus Pasaportes Vivos.');return}
    const s=SPECIES.find(x=>x.name===species)!
    const record:Plant={id:`${Date.now()}-${Math.random()}`,name:s.name,latin:s.latin,photo:preview,date:new Date().toLocaleDateString('es-EC'),plot:nextPlot}
    setPlants(existing=>[...existing,record]);setDetail(record);setPicture(null);setPreview('')
    setSelectedPlot(null)
    setFeedback('¡Tu planta aparece en el huerto! Registro temporal; falta conectarlo al backend.')
    const input=document.getElementById('plant-photo') as HTMLInputElement|null
    if(input) input.value=''
  }
  function beginCultivation(name:string) {setSpecies(name);setDetail(null);goto('Huerto virtual')}
  function navigateGarden(destination: GardenDestination) {
    const destinations = { garden: 'Inicio', community: 'Comunidades', plants: 'Plantas medicinales', history: 'Mi historia' } as const
    goto(destinations[destination])
  }
  function registerInPlot(plot?: number) {setSelectedPlot(plot ?? null);setDetail(null);goto('Huerto virtual')}
  function gardenAction(action: GardenAction) {
    if (action === 'register') registerInPlot()
    else if (action === 'real-garden') goto('Huertos reales')
    else if (action === 'logbook') goto('Mi historia')
    else if (plants.length) setDetail(plants[plants.length - 1])
    else {registerInPlot();setFeedback('Tu Pasaporte Vivo comienza con una fotografía. Registra tu primera planta para consultarlo.')}
  }
  const visible=SPECIES.filter(s=>`${s.name} ${s.latin}`.toLocaleLowerCase().includes(query.toLocaleLowerCase()))
  const ready=Boolean(community && garden)
  const title=screen==='Comunidades'?'Comunidad':screen==='Plantas medicinales'?'Descubrir plantas':screen==='Huerto virtual'?'Registrar planta':screen
  const activeNavigation: GardenDestination = screen === 'Comunidades' ? 'community' : screen === 'Plantas medicinales' ? 'plants' : screen === 'Mi historia' ? 'history' : 'garden'

  if (screen === 'Bienvenida' || screen === 'Usuarios') {
    return <AuthPage onExploreDemo={(destination = 'Inicio') => goto(destination)}/>
  }

  return <div className="garden-shell">
    <GardenNavigation active={activeNavigation} onNavigate={navigateGarden} onWelcome={() => goto('Bienvenida')}/>
    {screen === 'Inicio' ? <MyGardenPage plants={plants} community={community} garden={garden} province={savedProvince} selectedPlot={selectedPlot} onSelect={setDetail} onRegister={registerInPlot} onAction={gardenAction} onNavigate={navigateGarden}/>
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
        {feedback?<div className="feedback" role="status">{feedback}</div>:null}

        {screen === 'Mi historia' && <GardenHistory plants={plants} onRegister={() => registerInPlot()} onSelect={setDetail} onRealGarden={() => goto('Huertos reales')}/>}

        {screen==='Comunidades'&&<div className="two-col">
          <section className="card"><span className="eyebrow">01 · PERSONAS</span><h2>Crear una comunidad</h2><p>Una familia, un grupo de vecinos o un colectivo puede formar una comunidad de siembra.</p>
            <form onSubmit={saveCommunity}>
              <label className="field">Nombre de la comunidad<input value={draftCommunity} onChange={e=>setDraftCommunity(e.target.value)} required placeholder="Ej.: Jardín Andino"/></label>
              <label className="field">Nombre del responsable<input value={draftContact} onChange={e=>setDraftContact(e.target.value)} placeholder="Responsable del huerto"/></label>
              <button className="cta" type="submit">Guardar comunidad ↗</button>
            </form>
          </section>
          <section className="card surface"><span className="eyebrow">TU COMUNIDAD</span><div className="community-art">♧</div>
            <h2>{community||'Aún no tienes una comunidad'}</h2><p>{community?(contact?`Responsable: ${contact}`:'Comunidad creada en el prototipo'):'Crea tu primera comunidad para comenzar a cultivar.'}</p>
            {community&&<button className="outline" onClick={()=>goto('Huertos reales')}>Siguiente: registrar huerto →</button>}
          </section>
        </div>}

        {screen==='Huertos reales'&&<div className="two-col map-layout">
          <section className="card"><span className="eyebrow">02 · TERRITORIO</span><h2>Ubica tu huerto en Ecuador</h2><p>Selecciona una provincia directamente en el mapa, o utiliza la lista accesible.</p>
            <EcuadorMap value={province} onChange={setProvince}/>
          </section>
          <section className="card"><span className="eyebrow">CONFIGURACIÓN</span><h2>Características del huerto</h2>
            <form onSubmit={saveGarden}>
              <label className="field">Nombre del huerto<input required value={gardenDraft} onChange={e=>setGardenDraft(e.target.value)}/></label>
              <div className="input-row">
                <label className="field">Área aproximada (m²)<input type="number" min="1" value={area} onChange={e=>setArea(e.target.value)}/></label>
                <label className="field">Tipo de huerto<select value={type} onChange={e=>setType(e.target.value)}><option>En piso / macetas</option><option>En tierra</option><option>Vertical</option><option>Colgante</option></select></label>
              </div>
              <label className="field">Provincia seleccionada<input readOnly value={province} placeholder="Elige en el mapa"/></label>
              <button className="cta" type="submit">Registrar huerto ↗</button>
            </form>
            {garden&&<div className="saved-summary"><strong>✓ {garden}</strong><p>{savedProvince} · {type} · {area||'?'} m²</p><button className="text-action" onClick={()=>goto('Plantas medicinales')}>Continuar al catálogo →</button></div>}
          </section>
        </div>}

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

        {screen==='Huerto virtual'&& <>
          <section className="garden-header"><div><span className="eyebrow">04 · MI HUERTO VIVO</span><h2>{garden||'Tu jardín está esperando'}</h2><p>{ready?`${community} · ${savedProvince}`:'Primero registra tu comunidad y tu huerto para empezar.'}</p></div><div className="garden-count">{plants.length} <span>plantas registradas</span></div></section>
          <div className="two-col garden-layout">
            <section className="card garden-card">
              <div className="garden-sky"><span>☀</span><span>Un lugar para crecer</span></div>
              <div className="plot-grid">
                {Array.from({length:PLOT_COUNT},(_,i)=>{const plant=plants.find(record=>record.plot===i);return <button key={i} className={`plot ${plant?'occupied':''}`} onClick={()=>plant?setDetail(plant):setSelectedPlot(i)}
                  aria-label={plant?`Abrir ficha de ${plant.name}`:`Parcela vacía ${i+1}`}>
                  {plant?<><img src={plant.photo} alt={plant.name}/><span className="plot-title">{plant.name}</span></>:<><span className="plot-empty">＋</span><small>Parcela {i+1}</small></>}
                </button>})}
              </div>
              <div className="garden-footer">✿ Fotografías reales + parcelas interactivas · vista preliminar</div>
            </section>
            <div className="garden-side">
              <section className="card"><span className="eyebrow">REGISTRA UNA PLANTA</span><h2>Haz florecer tu jardín</h2>
                <p>{selectedPlot === null ? 'Se utilizará la primera parcela disponible.' : `Destino: parcela ${selectedPlot + 1}.`}</p>
                <form onSubmit={addPlant}>
                  <label className="field">Especie medicinal<select value={species} onChange={e=>setSpecies(e.target.value)}>{SPECIES.map(s=><option key={s.name} value={s.name}>{s.name}</option>)}</select></label>
                  <label className="field">Fotografía de tu planta <span className="muted">(JPG, PNG, WebP · máx. 3 MB)</span>
                    <input id="plant-photo" type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" onChange={choosePicture}/>
                  </label>
                  {preview?<img className="preview-image" src={preview} alt="Vista previa de planta seleccionada"/>:null}
                  <button type="submit" className="cta" disabled={!ready||plants.length>=PLOT_COUNT}>Añadir a mi huerto ↗</button>
                  {!ready&&<div className="garden-registration-steps"><span>Primero vincula tu comunidad y un huerto real para registrar la planta.</span><button type="button" className="outline" onClick={() => goto(community ? 'Huertos reales' : 'Comunidades')}>{community ? 'Registrar mi huerto real' : 'Crear mi comunidad'} →</button></div>}
                  {plants.length>=PLOT_COUNT&&<p className="tiny">Las seis parcelas iniciales están ocupadas.</p>}
                </form>
              </section>
            </div>
          </div>
        </>}
      </div>
    </main>}
    <PlantPassport plant={detail} onClose={() => setDetail(null)} onHistory={() => {setDetail(null);goto('Mi historia')}}/>
  </div>
}
