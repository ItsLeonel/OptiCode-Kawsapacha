import { useState, type ChangeEvent, type FormEvent } from 'react'
import EcuadorMap from './EcuadorMap'

type Screen = 'Inicio' | 'Usuarios' | 'Comunidades' | 'Huertos reales' | 'Plantas medicinales' | 'Huerto virtual'
type Plant = { id: string; name: string; latin: string; photo: string; date: string }
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
  {name:'Inicio',icon:'⌂',subtitle:'Resumen general'},
  {name:'Usuarios',icon:'♙',subtitle:'Acceso y perfiles'},
  {name:'Comunidades',icon:'♧',subtitle:'Personas que cultivan'},
  {name:'Huertos reales',icon:'⌖',subtitle:'Ubicación y terreno'},
  {name:'Plantas medicinales',icon:'❃',subtitle:'Explora el catálogo'},
  {name:'Huerto virtual',icon:'✿',subtitle:'Tu jardín interactivo'}
]

export default function App() {
  const [screen,setScreen] = useState<Screen>('Inicio')
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
    const s=SPECIES.find(x=>x.name===species)!
    const record:Plant={id:`${Date.now()}-${Math.random()}`,name:s.name,latin:s.latin,photo:preview,date:new Date().toLocaleDateString('es-EC')}
    setPlants(existing=>[...existing,record]);setDetail(record);setPicture(null);setPreview('')
    setFeedback('¡Tu planta aparece en el huerto! Registro temporal; falta conectarlo al backend.')
    const input=document.getElementById('plant-photo') as HTMLInputElement|null
    if(input) input.value=''
  }
  function beginCultivation(name:string) {setSpecies(name);setDetail(null);goto('Huerto virtual')}
  const visible=SPECIES.filter(s=>`${s.name} ${s.latin}`.toLocaleLowerCase().includes(query.toLocaleLowerCase()))
  const ready=Boolean(community && garden)
  const title=screen==='Inicio'?'Tu espacio para cultivar':screen

  return <div className="shell">
    <aside className="sidebar">
      <button className="identity" onClick={()=>goto('Inicio')} aria-label="Ir al inicio">
        <span className="brand-mark">✺</span><span><strong>Kawsapacha</strong><small>MI HUERTO VIVO</small></span>
      </button>
      <div className="nav-caption">TU ESPACIO</div>
      <nav aria-label="Navegación principal">
        {SCREENS.map(item=><button key={item.name} type="button"
          className={`nav-item ${screen===item.name?'active':''}`}
          aria-current={screen===item.name?'page':undefined}
          onClick={()=>goto(item.name)}>
          <span className="nav-icon">{item.icon}</span><span>{item.name}</span>
          {item.name==='Huerto virtual'&&plants.length>0?<span className="nav-count">{plants.length}</span>:null}
        </button>)}
      </nav>
      <div className="sidebar-bottom">
        <div className="leaf-illustration">🌱</div>
        <strong>La vida florece en comunidad</strong>
        <p>La historia de cada planta comienza con una acción real.</p>
      </div>
      <p className="sidebar-footer">OptiCode · EPN 2026B</p>
    </aside>

    <main className="main">
      <header className="topbar">
        <span className="breadcrumbs">Kawsapacha <span> / </span> {screen}</span>
        <span className="user-pill"><span className="user-dot">O</span> OptiCode · Demo</span>
      </header>
      <div className="page">
        <div className="prototype-alert"><strong>Prototipo frontend inicial:</strong> los registros y las imágenes solo viven en esta sesión. Aún no hay autenticación real, API ni base de datos conectadas.</div>
        <div className="heading"><div><span className="eyebrow">Kawsapacha · Versión 1</span><h1>{title}</h1><p>{SCREENS.find(s=>s.name===screen)?.subtitle}</p></div>
          {screen!=='Huerto virtual'?<button className="cta small" onClick={()=>goto('Huerto virtual')}>Explorar mi huerto <span aria-hidden>↗</span></button>:null}
        </div>
        {feedback?<div className="feedback" role="status">{feedback}</div>:null}

        {screen==='Inicio'&& <>
          <section className="hero">
            <div><span className="hero-tag">🌱 Cultiva · Aprende · Comparte</span><h2>La naturaleza tiene<br/>una historia que contar.</h2><p>Construye un huerto medicinal, documenta tus plantas con fotografías reales y descubre cómo florece tu jardín digital.</p>
              <button className="cta light" onClick={()=>goto(community?'Huertos reales':'Comunidades')}>{community?'Continuar mi huerto':'Crear mi comunidad'} <span aria-hidden>↗</span></button>
            </div><div className="hero-art" aria-hidden="true"><span>🌿</span><span>🌼</span><span>🪴</span></div>
          </section>
          <section className="stats">
            <div className="stat"><span>Comunidades</span><strong>{community?1:0}</strong><small>Tu participación</small></div>
            <div className="stat"><span>Huertos</span><strong>{garden?1:0}</strong><small>Espacios registrados</small></div>
            <div className="stat"><span>Plantas</span><strong>{plants.length}</strong><small>Registradas con foto</small></div>
          </section>
          <section className="section"><div className="section-heading"><div><span className="eyebrow">TU CAMINO VERDE</span><h2>Comienza en tres pasos</h2></div></div>
            <div className="three-steps">
              {([{label:'01',icon:'♧',title:'Forma tu comunidad',text:'Registra a las personas que cultivarán contigo.',action:'Comunidades'},
                  {label:'02',icon:'⌖',title:'Ubica tu huerto',text:'Selecciona tu provincia en el mapa del Ecuador.',action:'Huertos reales'},
                  {label:'03',icon:'✿',title:'Hazlo florecer',text:'Fotografía tu planta y colócala en una parcela.',action:'Huerto virtual'}] as const)
                .map(card=><button className="step-card" key={card.label} onClick={()=>goto(card.action)}><span className="step-top"><span>{card.label}</span><span>{card.icon}</span></span><strong>{card.title}</strong><p>{card.text}</p><span className="step-arrow">Explorar ↗</span></button>)}
            </div>
          </section>
        </>}

        {screen==='Usuarios'&&<section className="card narrow">
          <div className="card-icon">♙</div><h2>Usuarios y acceso</h2>
          <p>Este módulo utilizará autenticación real y autorización desde el backend. El prototipo no simula credenciales ni almacena contraseñas.</p>
          <div className="info-row"><span>Responsables</span><strong>Leonel · Ronny</strong></div>
          <div className="info-row"><span>Estado</span><strong>Interfaz pendiente de integración</strong></div>
          <p className="muted">Se implementarán registro, inicio/cierre de sesión y roles definidos en las historias de usuario.</p>
        </section>}

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
                {Array.from({length:6},(_,i)=>{const plant=plants[i];return <button key={i} className={`plot ${plant?'occupied':''}`} onClick={()=>plant?setDetail(plant):setDetail(null)}
                  aria-label={plant?`Abrir ficha de ${plant.name}`:`Parcela vacía ${i+1}`}>
                  {plant?<><img src={plant.photo} alt={plant.name}/><span className="plot-title">{plant.name}</span></>:<><span className="plot-empty">＋</span><small>Parcela {i+1}</small></>}
                </button>})}
              </div>
              <div className="garden-footer">✿ Fotografías reales + parcelas interactivas · vista preliminar</div>
            </section>
            <div className="garden-side">
              <section className="card"><span className="eyebrow">REGISTRA UNA PLANTA</span><h2>Haz florecer tu jardín</h2>
                <form onSubmit={addPlant}>
                  <label className="field">Especie medicinal<select value={species} onChange={e=>setSpecies(e.target.value)}>{SPECIES.map(s=><option key={s.name} value={s.name}>{s.name}</option>)}</select></label>
                  <label className="field">Fotografía de tu planta <span className="muted">(JPG, PNG, WebP · máx. 3 MB)</span>
                    <input id="plant-photo" type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" onChange={choosePicture}/>
                  </label>
                  {preview?<img className="preview-image" src={preview} alt="Vista previa de planta seleccionada"/>:null}
                  <button type="submit" className="cta" disabled={!ready||plants.length>=6}>Añadir a mi huerto ↗</button>
                  {!ready&&<p className="tiny">Primero crea comunidad y huerto. Después podrás añadir plantas.</p>}
                  {plants.length>=6&&<p className="tiny">Las seis parcelas iniciales están ocupadas.</p>}
                </form>
              </section>
              {detail&&<section className="card passport"><span className="eyebrow">PASAPORTE VIVO · PRELIMINAR</span><h2>{detail.name}</h2><img src={detail.photo} alt={`Fotografía registrada de ${detail.name}`}/><p><em>{detail.latin}</em></p><p>Registrada: {detail.date}</p><p className="tiny">El historial de crecimiento y su persistencia se integrarán en los siguientes desarrollos.</p></section>}
            </div>
          </div>
        </>}
      </div>
    </main>
  </div>
}
