import { useEffect, useMemo, useState } from 'react'
import GardenIcon from '../my-garden/GardenIcon'
import { regionForProvince, type GardenRegion } from '../real-gardens/garden-region'
import type { CatalogSpecies } from '../../services/api'
import mortar from './botanical-mortar.svg'
import botanicalFallback from './botanical-placeholder.svg'
import './regional-catalog.css'

type RegionChoice = GardenRegion | 'mine' | 'all'
const REGION_LABELS: Record<GardenRegion, string> = {
  costa: 'Costa', sierra: 'Sierra', oriente: 'Amazonía', galapagos: 'Galápagos',
}
const REGIONS: GardenRegion[] = ['costa', 'sierra', 'oriente', 'galapagos']
const USES = ['Todas', 'Digestivas', 'Respiratorias', 'Calmantes', 'Aromáticas', 'Tradicional'] as const

function BotanicalPhoto({ plant, className = '' }: { plant: CatalogSpecies; className?: string }) {
  const [failed, setFailed] = useState(false)
  useEffect(() => setFailed(false), [plant.defaultPhotoUrl])
  return <div className={'mc-photo ' + className}>
    <img className="mc-photo-fallback" src={botanicalFallback} alt="" aria-hidden="true"/>
    {plant.defaultPhotoUrl && !failed && <img
      className="mc-photo-real" src={plant.defaultPhotoUrl} alt={'Fotografía botánica de ' + plant.name}
      loading="lazy" referrerPolicy="no-referrer" onError={() => setFailed(true)}
    />}
    {(!plant.defaultPhotoUrl || failed) && <span className="mc-photo-symbol" aria-hidden="true">{plant.icon || '🌿'}</span>}
    {(!plant.defaultPhotoUrl || failed) && <span className="mc-photo-note">Ilustración referencial</span>}
  </div>
}

export default function RegionalCatalog({
  species, province, serverLoaded, onRegister, onHome,
}: {
  species: CatalogSpecies[]
  province: string | null
  serverLoaded: boolean
  onRegister: (name: string) => void
  onHome: () => void
}) {
  const [search, setSearch] = useState('')
  const [choice, setChoice] = useState<RegionChoice>('mine')
  const [onlyMine, setOnlyMine] = useState(Boolean(province))
  const [use, setUse] = useState<(typeof USES)[number]>('Todas')
  const [sort, setSort] = useState('relevance')
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const value: unknown = JSON.parse(localStorage.getItem('kawsapacha_catalog_favs') || '[]')
      return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : []
    } catch { return [] }
  })
  const [selectedId, setSelectedId] = useState<string | null>(() => {
    const hash = window.location.hash
    return hash.startsWith('#plantas/') ? decodeURIComponent(hash.slice('#plantas/'.length)) : null
  })
  const gardenRegion = province ? regionForProvince(province) : null
  const regionChoice = choice === 'mine' ? gardenRegion : choice === 'all' ? null : choice

  useEffect(() => setOnlyMine(Boolean(province)), [province])

  useEffect(() => {
    const syncHash = () => {
      const hash = window.location.hash
      setSelectedId(hash.startsWith('#plantas/') ? decodeURIComponent(hash.slice('#plantas/'.length)) : null)
    }
    window.addEventListener('popstate', syncHash)
    window.addEventListener('hashchange', syncHash)
    return () => {
      window.removeEventListener('popstate', syncHash)
      window.removeEventListener('hashchange', syncHash)
    }
  }, [])

  const filtered = useMemo(() => {
    const normalized = search.trim().toLocaleLowerCase('es')
    const items = species.filter(plant => {
      if (regionChoice && !plant.regions.includes(regionChoice)) return false
      if (onlyMine && gardenRegion && !plant.regions.includes(gardenRegion)) return false
      if (use !== 'Todas' && !plant.usageTags.includes(use)) return false
      if (!normalized) return true
      const searchText = [plant.name, plant.latinName, plant.family, plant.description, ...plant.otherNames, ...plant.usageTags].join(' ').toLocaleLowerCase('es')
      return searchText.includes(normalized)
    })
    if (sort === 'alphabet') return [...items].sort((a,b) => a.name.localeCompare(b.name, 'es'))
    if (sort === 'scientific') return [...items].sort((a,b) => a.latinName.localeCompare(b.latinName, 'es'))
    return [...items].sort((a,b) => {
      const aRegion = gardenRegion && a.regions.includes(gardenRegion) ? 1 : 0
      const bRegion = gardenRegion && b.regions.includes(gardenRegion) ? 1 : 0
      return bRegion - aRegion || a.name.localeCompare(b.name, 'es')
    })
  }, [species, regionChoice, onlyMine, gardenRegion, use, search, sort])
  const selected = selectedId ? species.find(plant => plant.id === selectedId) : null
  const shownLabel = regionChoice ? REGION_LABELS[regionChoice] : 'Todas las regiones'

  function openDetail(id: string) {
    window.history.pushState(null, '', '#plantas/' + encodeURIComponent(id))
    setSelectedId(id)
    window.scrollTo({ top: 0, behavior: 'instant' })
  }
  function closeDetail() {
    window.history.pushState(null, '', '#plantas')
    setSelectedId(null)
    window.scrollTo({ top: 0, behavior: 'instant' })
  }
  function toggleFavorite(id: string) {
    setFavorites(previous => {
      const next = previous.includes(id) ? previous.filter(value => value !== id) : [...previous, id]
      try { localStorage.setItem('kawsapacha_catalog_favs', JSON.stringify(next)) } catch { /* navegación disponible sin almacenamiento */ }
      return next
    })
  }
  function registerPlant(plant: CatalogSpecies) {
    if (plant.registerStatus === 'INFORMATIVA') return
    if (gardenRegion && !plant.regions.includes(gardenRegion)) return
    onRegister(plant.name)
  }
  function regionalStatus(plant: CatalogSpecies) {
    if (plant.registerStatus === 'INFORMATIVA') return 'Solo consulta'
    if (gardenRegion === 'galapagos') return 'Presencia documentada; revisar bioseguridad'
    if (gardenRegion && plant.regions.includes(gardenRegion)) return 'Documentada en tu región'
    return 'Referencia botánica regional'
  }
  const galapagosNotice = gardenRegion === 'galapagos'
  const registrationLabel = galapagosNotice ? 'Registrar planta existente' : 'Registrar en mi huerto'

  if (selected) {
    const registerAllowed = selected.registerStatus !== 'INFORMATIVA' && (!gardenRegion || selected.regions.includes(gardenRegion))
    return <section className="mc-detail" aria-label={'Ficha botánica de ' + selected.name}>
      <div className="mc-detail-backline">
        <button type="button" className="mc-link" onClick={closeDetail}><GardenIcon name="back"/> Volver al catálogo</button>
        <button type="button" className="mc-outline" onClick={onHome}>Mi Huerto Vivo</button>
      </div>
      <div className="mc-detail-heading">
        <div>
          <span className="mc-kicker">PASAPORTE BOTÁNICO · FICHA DE ESPECIE</span>
          <h1 data-screen-heading tabIndex={-1}>{selected.name}</h1>
          <p className="mc-latin">{selected.latinName}</p>
          <p className="mc-detail-intro">{selected.description}</p>
        </div>
        <div className="mc-pill-row">
          {selected.regions.map(region => <span className="mc-region-pill" key={region}>⛰ {REGION_LABELS[region as GardenRegion] || region}</span>)}
        </div>
      </div>
      <div className="mc-detail-grid">
        <div className="mc-detail-media">
          <BotanicalPhoto plant={selected} className="mc-detail-photo"/>
          {selected.photoSourceUrl && <p className="mc-credit">{selected.photoCredit}. <a href={selected.photoSourceUrl} target="_blank" rel="noopener noreferrer">Imagen y licencia</a></p>}
          {!selected.photoSourceUrl && <p className="mc-credit">Imagen botánica pendiente de verificar. Ilustración genérica, no fotografía identificativa.</p>}
          <div className="mc-detail-register">
            <strong>{regionalStatus(selected)}</strong>
            {galapagosNotice && <p>El registro documenta una planta existente. No equivale a permiso de importación, propagación o introducción en Galápagos.</p>}
            <button className="mc-primary" type="button" onClick={() => registerPlant(selected)} disabled={!registerAllowed}>{registrationLabel}</button>
            {!registerAllowed && <p>Esta ficha es informativa o no corresponde a la región del huerto registrado.</p>}
          </div>
        </div>
        <div className="mc-detail-content">
          <section className="mc-info-section"><h2>🌿 Identificación botánica</h2>
            <dl className="mc-facts">
              <div><dt>Nombre común</dt><dd>{selected.name}</dd></div>
              <div><dt>Nombre científico</dt><dd><i>{selected.latinName}</i></dd></div>
              <div><dt>Familia botánica</dt><dd>{selected.family || 'Por verificar'}</dd></div>
              <div><dt>Otros nombres</dt><dd>{selected.otherNames.length ? selected.otherNames.join(', ') : 'Sin otros nombres documentados'}</dd></div>
              <div><dt>Altitud</dt><dd>{selected.altitude || 'No documentada'}</dd></div>
              <div><dt>Distribución provincial</dt><dd>{selected.provinces || 'Por verificar'}</dd></div>
              <div><dt>Ciclo</dt><dd>{selected.cycleCategory || 'Por verificar'}</dd></div>
              <div><dt>Clasificación tradicional caliente/fría</dt><dd>{selected.traditionalClassification || 'Por documentar'}</dd></div>
            </dl>
          </section>
          <section className="mc-info-section"><h2>🍃 Saberes y usos tradicionales</h2>
            <div className="mc-tags">{selected.usageTags.map(tag => <span key={tag}>{tag}</span>)}</div>
            <p>{selected.medicinalProperties}</p>
            <p className="mc-muted">{selected.preparation}</p>
          </section>
          <section className="mc-info-section mc-safety"><h2>⚠️ Precauciones y contraindicaciones</h2><p>{selected.contraindications}</p>
            <small>Contenido educativo. Los saberes tradicionales no equivalen a evidencia clínica ni a prescripción médica.</small>
          </section>
          <section className="mc-info-section"><h2>🌱 Cultivo y contexto regional</h2><p>{selected.careNotes}</p><p>{selected.regionalNote}</p></section>
          <section className="mc-info-section mc-source"><h2>📚 Fuentes y trazabilidad</h2>
            <p>{selected.sourceLabel || 'Fuente pendiente de identificación'}</p>
            {selected.sourceUrl && <a href={selected.sourceUrl} target="_blank" rel="noopener noreferrer">Consultar documento de referencia</a>}
            <p>Las regiones reflejan ejemplos y presencia documentada, no una autorización fitosanitaria universal. Provincia, altitud y clasificación cultural se marcan como pendientes si no hay evidencia suficiente.</p>
          </section>
        </div>
      </div>
    </section>
  }

  return <section className="mc-catalog" aria-label="Catálogo regional medicinal">
    <div className="mc-title-row">
      <img className="mc-mortar" src={mortar} alt="Mortero tradicional con hojas de plantas"/>
      <div className="mc-heading-copy">
        <span className="mc-kicker">BOTÁNICA · SABERES DEL ECUADOR</span>
        <h1 tabIndex={-1} data-screen-heading>Catálogo de plantas medicinales</h1>
        <p>Explora especies, usos tradicionales y su presencia documentada según la región de tu huerto.</p>
      </div>
      <div className="mc-context">
        <span className="mc-region-pill"><GardenIcon name="mountain"/> {gardenRegion ? 'Región: ' + REGION_LABELS[gardenRegion] : 'Región no configurada'}</span>
        <span className="mc-region-pill"><GardenIcon name="map"/> {province ? 'Provincia: ' + province : 'Registra tu huerto'}</span>
        <button type="button" className="mc-outline mc-home" onClick={onHome}><GardenIcon name="back"/> Volver a Mi Huerto Vivo</button>
      </div>
    </div>
    <div className="mc-filters">
      <div className="mc-filters-title"><GardenIcon name="leaf"/> Filtrar catálogo</div>
      <label className="mc-search"><span>⌕</span><input value={search} onChange={event=>setSearch(event.target.value)} placeholder="Buscar por nombre, familia o uso..." aria-label="Buscar plantas"/></label>
      <label className="mc-region-select">Región
        <select value={choice} onChange={event=>{setChoice(event.target.value as RegionChoice); if(event.target.value!=='mine') setOnlyMine(false)}}>
          <option value="mine">Mi región</option><option value="all">Todas las regiones</option>
          {REGIONS.map(region=><option key={region} value={region}>{REGION_LABELS[region]}</option>)}
        </select>
      </label>
      <div className="mc-uses" aria-label="Filtros por uso tradicional">
        {USES.map(tag => <button type="button" key={tag} aria-pressed={use===tag} className={use===tag ? 'mc-chip is-active' : 'mc-chip'} onClick={()=>setUse(tag)}>{tag}</button>)}
      </div>
      <label className="mc-toggle"><input type="checkbox" disabled={!gardenRegion} checked={onlyMine&&Boolean(gardenRegion)} onChange={event=>{setOnlyMine(event.target.checked); if(event.target.checked) setChoice('mine')}}/> Solo mi región</label>
    </div>
    <div className="mc-context-note" role="note"><GardenIcon name="leaf"/>
      <p>{gardenRegion
        ? 'Catálogo adaptado a ' + REGION_LABELS[gardenRegion] + ' (' + province + '). Se muestran especies documentadas, no permisos automáticos de cultivo.'
        : 'Registra un huerto para obtener una selección regional. Puedes explorar especies de todo el Ecuador.'}
        {galapagosNotice && ' Galápagos exige especial revisión de bioseguridad para cualquier ingreso o movimiento de plantas.'}
      </p>
    </div>
    {!serverLoaded && <div role="status" className="mc-offline">Vista informativa local: no se ha confirmado la sincronización de fichas con el servidor.</div>}
    <div className="mc-list-heading"><div><h2>Plantas medicinales <span>({filtered.length} especies)</span></h2><p>Selección: {shownLabel}</p></div>
      <label>Ordenar por <select value={sort} onChange={e=>setSort(e.target.value)}><option value="relevance">Más relevantes</option><option value="alphabet">Nombre común</option><option value="scientific">Nombre científico</option></select></label>
    </div>
    <div className="mc-grid">
      {filtered.map(plant=>{
        const eligible = plant.registerStatus !== 'INFORMATIVA' && (!gardenRegion || plant.regions.includes(gardenRegion))
        return <article className="mc-card" key={plant.id}>
          <div className="mc-card-art"><BotanicalPhoto plant={plant}/>
            <button type="button" className={'mc-heart'+(favorites.includes(plant.id)?' is-on':'')} aria-label={(favorites.includes(plant.id)?'Quitar de':'Añadir a')+' favoritos: '+plant.name} aria-pressed={favorites.includes(plant.id)} onClick={()=>toggleFavorite(plant.id)}>{favorites.includes(plant.id)?'♥':'♡'}</button>
          </div>
          <div className="mc-card-content">
            <h3>{plant.name}</h3><em>{plant.latinName}</em>
            <div className="mc-tags">{plant.usageTags.slice(0,2).map(tag=><span key={tag}>♧ {tag}</span>)}</div>
            <div className="mc-card-regions">{plant.regions.map(r=><span key={r}>{REGION_LABELS[r as GardenRegion]??r}</span>)}</div>
            <p className={'mc-status'+(!eligible?' mc-status-muted':'')}>{regionalStatus(plant)}</p>
            <div className="mc-actions"><button type="button" className="mc-primary" onClick={()=>openDetail(plant.id)}><GardenIcon name="book"/> Ver ficha</button>
              <button type="button" className="mc-secondary" disabled={!eligible} onClick={()=>registerPlant(plant)}><GardenIcon name="plus"/> {registrationLabel}</button></div>
          </div>
        </article>
      })}
    </div>
    {!filtered.length && <div className="mc-empty"><GardenIcon name="leaf"/><h3>No hay especies que coincidan</h3><p>Prueba otra búsqueda o cambia los filtros. No añadiremos plantas ficticias.</p><button type="button" className="mc-secondary" onClick={()=>{setSearch('');setUse('Todas');setChoice('all');setOnlyMine(false)}}>Limpiar filtros</button></div>}
    <p className="mc-disclaimer">Fotografías botánicas: Wikimedia Commons, con atribución en cada ficha. Los registros de especies no implican autorización para introducirlas, especialmente en Galápagos. Favoritos guardados solo en este navegador.</p>
  </section>
}
