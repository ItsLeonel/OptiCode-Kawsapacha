import { useEffect, useId, useMemo, useState } from 'react'
import { regionForProvince } from './features/real-gardens/garden-region'
import './styles/ecuador-game-map.css'

type Geometry = { type: 'Polygon' | 'MultiPolygon'; coordinates: unknown }
type Feature = { type: 'Feature'; properties: Record<string, unknown>; geometry: Geometry }
type Collection = { type: 'FeatureCollection'; features: Feature[] }
type Position = [number, number]

const SOURCE = new URL('./assets/ecuador-provincias.geojson', import.meta.url).href
const LICENSE = new URL('./assets/ecuador-provincias.LICENSE.txt', import.meta.url).href
const PROVINCIAS = [
  'Azuay', 'Bolívar', 'Cañar', 'Carchi', 'Chimborazo', 'Cotopaxi',
  'El Oro', 'Esmeraldas', 'Galápagos', 'Guayas', 'Imbabura', 'Loja',
  'Los Ríos', 'Manabí', 'Morona Santiago', 'Napo', 'Orellana', 'Pastaza',
  'Pichincha', 'Santa Elena', 'Santo Domingo de los Tsáchilas', 'Sucumbíos',
  'Tungurahua', 'Zamora Chinchipe'
]
const clean = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/[^A-Z]/g, '')
function provinceName(p: Record<string, unknown>): string {
  const values = ['provincia','PROVINCIA','DPA_DESPRO','dpa_despro','NAME_1','name','nombre','PRO_DESCRI','DPA_PROVIN', ...Object.keys(p)]
    .map(k => p[k]).filter((v): v is string => typeof v === 'string')
    .map(value => clean(value) === 'SANTODOMINGO' ? 'Santo Domingo de los Tsáchilas' : value)
  const match = values.find(v => PROVINCIAS.some(name => clean(name) === clean(v)))
  return PROVINCIAS.find(name => match && clean(name) === clean(match)) ?? ''
}
function polygonsOf(f: Feature): Position[][][] {
  const coordinates = f.geometry.coordinates
  if (!Array.isArray(coordinates) || !coordinates.length) return []
  const isPosition = (value: unknown): value is Position => Array.isArray(value) && typeof value[0] === 'number' && typeof value[1] === 'number'
  // The source marks Guayas as MultiPolygon but stores a Polygon's nesting.
  if (Array.isArray(coordinates[0]) && isPosition(coordinates[0][0])) return [coordinates as Position[][]]
  if (Array.isArray(coordinates[0]?.[0]) && isPosition(coordinates[0][0][0])) return coordinates as Position[][][]
  return []
}
function regionCoordinates(f: Feature): Position[] {
  return polygonsOf(f).flat(2)
}
function projection(galapagos: boolean, compact: boolean, game: boolean) {
  const xs = galapagos ? [-92, -89] : [-81.4, -75]
  const ys = galapagos ? [-1.5, 1.2] : [-5.2, 1.7]
  const rect = game ? galapagos ? {x:28,y:72,w:128,h:115} : {x:177,y:24,w:410,h:442} : compact
    ? galapagos ? {x:10,y:333,w:95,h:100} : {x:90,y:28,w:340,h:445}
    : galapagos ? {x:36,y:318,w:140,h:135} : {x:208,y:28,w:500,h:445}
  const x = (lon:number) => rect.x + ((lon-xs[0])/(xs[1]-xs[0]))*rect.w
  const y = (lat:number) => rect.y + ((ys[1]-lat)/(ys[1]-ys[0]))*rect.h
  return ([lon, lat]: Position): Position => [x(lon), y(lat)]
}
function projectPath(f: Feature, galapagos: boolean, compact: boolean, game: boolean) {
  const project = projection(galapagos, compact, game)
  return polygonsOf(f).map(poly => poly.map(ring => ring.map(([lon,lat],i) =>
    `${i===0?'M':'L'}${project([lon,lat]).map(n => n.toFixed(1)).join(',')}`).join(' ')+' Z').join(' ')).join(' ')
}
// Find an interior point in the largest island/polygon, including concave provinces.
function interiorPoint(f: Feature): Position {
  const area = (ring: Position[]) => Math.abs(ring.reduce((sum, p, i) => { const q = ring[(i + 1) % ring.length]; return sum + p[0] * q[1] - q[0] * p[1] }, 0))
  const polygon = [...polygonsOf(f)].sort((a, b) => area(b[0]) - area(a[0]))[0]
  const ring = polygon[0]
  const inside = ([x, y]: Position, points: Position[]) => {
    let result = false
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      const a = points[i], b = points[j]
      if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) result = !result
    }
    return result
  }
  const xs = ring.map(p => p[0]), ys = ring.map(p => p[1])
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys)
  let best = ring[0], distance = Infinity
  for (let i = 1; i < 20; i++) for (let j = 1; j < 20; j++) {
    const point: Position = [minX + (maxX - minX) * i / 20, minY + (maxY - minY) * j / 20]
    const score = (i - 10) ** 2 + (j - 10) ** 2
    if (score < distance && inside(point, ring) && !polygon.slice(1).some(hole => inside(point, hole))) { best = point; distance = score }
  }
  return best
}
const MAP_REGIONS = {
  costa: { label: 'Costa', colors: ['#fff4a2', '#f4bc30', '#bc7517'] },
  sierra: { label: 'Sierra', colors: ['#e4b7ff', '#a65bdd', '#6c339e'] },
  oriente: { label: 'Amazonía', colors: ['#bbef5e', '#38b84d', '#08734a'] },
  galapagos: { label: 'Galápagos', colors: ['#b5fff3', '#25c7d1', '#087ca0'] },
}
export const provinces = PROVINCIAS

export default function EcuadorMap({ value, onChange, selectId, selectLabel = 'Provincia seleccionada', disabled = false, required = false, invalid = false, describedBy, compact = false, showAttribution = true, showProvinceSelect = true, variant = 'classic' }: {
  value: string; onChange: (value: string) => void; selectId?: string; selectLabel?: string; disabled?: boolean; required?: boolean; invalid?: boolean; describedBy?: string; compact?: boolean; showAttribution?: boolean; showProvinceSelect?: boolean; variant?: 'classic' | 'game'
}) {
  const game = variant === 'game'
  const id = useId().replace(/[^a-zA-Z0-9]/g, '')
  const [features,setFeatures] = useState<Feature[]>([])
  const [error,setError] = useState('')
  const [loading,setLoading] = useState(true)
  const [highlighted, setHighlighted] = useState('')
  useEffect(() => {
    const controller = new AbortController()
    fetch(SOURCE, {signal:controller.signal})
      .then(async response => { if(!response.ok) throw new Error('No disponible'); return response.json() as Promise<Collection> })
      .then(data => { setFeatures(data.features.filter(f => f.geometry && provinceName(f.properties) && polygonsOf(f).length)); setLoading(false) })
      .catch(() => {if(!controller.signal.aborted){setError('Mapa no disponible. Usa el selector de provincias.');setLoading(false)}})
    return () => controller.abort()
  },[])
  const mapped = useMemo(() => features.map(f => {
    const name = provinceName(f.properties)
    const isGalapagos = name === 'Galápagos' || regionCoordinates(f).some(p => p[0]<-85)
    return {name,path:projectPath(f,isGalapagos,compact,game),point:projection(isGalapagos,compact,game)(interiorPoint(f)),region:regionForProvince(name)}
  }),[features,compact,game])
  const selected = mapped.find(item => item.name === value)

  return <div className={`map-shell ${game ? 'ecuador-game-map' : ''}`}>
    <div className="map-visual">
      {loading ? <p className="map-note">Cargando límites provinciales…</p> :
      mapped.length ? <svg viewBox={game ? '0 0 610 500' : compact ? '0 0 440 500' : '0 0 740 500'} role="group" aria-label="Mapa de provincias de Ecuador seleccionables">
        {game ? <>
          <defs>
            {Object.entries(MAP_REGIONS).map(([key, palette]) => <g key={key}>
              <linearGradient id={`${id}-${key}-color`} x1="0%" y1="0%" x2="70%" y2="100%"><stop stopColor={palette.colors[0]}/><stop offset=".48" stopColor={palette.colors[1]}/><stop offset="1" stopColor={palette.colors[2]}/></linearGradient>
              <pattern id={`${id}-${key}`} width="1" height="1" viewBox="0 0 100 100" preserveAspectRatio="none"><rect width="100" height="100" fill={`url(#${id}-${key}-color)`}/><path d="M0 20 27 0 48 31 73 12 100 37 79 51 51 44 22 65 0 50Z" fill="#fffbcb" opacity=".15"/><path d="M0 84 25 59 46 75 67 49 100 61 100 100 64 83 38 100Z" fill="#194b35" opacity=".09"/><path d="M12 15h2m47 13h2M24 42h2m52 20h2M39 89h2M9 74h2" stroke="#fffbd2" strokeWidth="1" opacity=".35"/></pattern>
            </g>)}
            <filter id={`${id}-land`} x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="5" stdDeviation="3" floodColor="#011e25" floodOpacity=".65"/></filter>
          </defs>
          <g className="map-decoration" aria-hidden="true">
            <ellipse cx="331" cy="260" rx="250" ry="215" fill="#58d8bb" opacity=".05"/>
            <ellipse cx="331" cy="260" rx="264" ry="228" fill="none" stroke="#b8e5c7" strokeDasharray="2 12" opacity=".25"/>
            <rect x="18" y="38" width="148" height="162" rx="22" fill="#073d4c" fillOpacity=".65" stroke="#abf7e3" strokeDasharray="6 5" strokeWidth="2"/>
            <text x="92" y="60" textAnchor="middle" className="map-island-label">GALÁPAGOS</text>
            <text x="92" y="220" textAnchor="middle" className="map-sea-label">Océano Pacífico</text>
            <path d="M40 243q14-12 28 0t28 0t28 0M50 252q14-12 28 0t28 0" fill="none" stroke="#87d4c3" strokeWidth="2" opacity=".5"/>
            <g transform="translate(35 287)"><path d="M0 12Q22 5 44 12L35 22H9Z" fill="#d9b17b" stroke="#f5dfaa"/><path d="M22 10V-25L40 9Z" fill="#fff3cc"/><path d="M19-19 4 9H19Z" fill="#c5e3c2"/><path d="M-6 27q12-6 24 0t24 0t24 0" fill="none" stroke="#86d9c0" strokeWidth="2"/></g>
            <g transform="translate(65 396)"><path d="M0 42Q-12 0 20-30M3 30Q-40 10-27-10Q0-13 3 30M8 12Q9-24 37-18Q37 7 8 12" fill="#7da944" stroke="#cae785" strokeWidth="2"/><path d="M-12 46Q16 13 43 27Q40 47-12 46" fill="#368c5e" stroke="#cae785" strokeWidth="2"/><circle cx="-20" cy="25" r="5" fill="#e7b460"/></g>
            <g transform="translate(558 417)"><circle r="28" fill="#0b443c" stroke="#e9d58e"/><path d="M0-34 8 0 0 34-8 0Z" fill="#f8e5a4"/><path d="M-25 0 0-7 25 0 0 7Z" fill="#cd934e"/><text y="-41" textAnchor="middle" fill="#fff2d0" fontSize="14">N</text></g>
          </g>
        </> : <><rect width={compact ? 440 : 740} height="500" fill="#e8efe5" rx="20"/>{!compact && <path d="M30 300H175V470H30Z" fill="#d5e5d5" rx="14" />}<text x={compact ? 10 : 38} y={compact ? 325 : 304} className="map-label">GALÁPAGOS</text></>}
        <g filter={game ? `url(#${id}-land)` : undefined}>
        {mapped.map(item => <path key={item.name} d={item.path}
          className={game ? 'game-province' : undefined} data-region={item.region} data-highlighted={highlighted === item.name || undefined}
          fill={game ? `url(#${id}-${item.region})` : value===item.name ? '#ce9757' : '#74a17a'}
          style={game ? { fill: `url(#${id}-${item.region})` } : undefined}
          stroke="#f4f5e7" strokeWidth="1.8" strokeLinejoin="round"
          tabIndex={disabled ? -1 : 0} role="button" aria-label={`Seleccionar ${item.name}`} aria-pressed={value === item.name} aria-disabled={disabled || undefined}
          onMouseEnter={() => setHighlighted(item.name)} onMouseLeave={() => setHighlighted('')}
          onFocus={() => setHighlighted(item.name)} onBlur={() => setHighlighted('')}
          onClick={()=>{ if (!disabled) onChange(item.name) }}
          onKeyDown={e=>{if(!disabled && (e.key==='Enter'||e.key===' ')){e.preventDefault();onChange(item.name)}}}>
          <title>{item.name}</title>
        </path>)}
        </g>
        {game && selected && <path d={selected.path} className="game-province-outline" fill="none" stroke="#fffab1" strokeWidth="3" strokeLinejoin="round" pointerEvents="none" aria-hidden="true"/>}
        {game && selected && <g className="map-selection-pin" transform={`translate(${selected.point[0]},${selected.point[1]})`} aria-hidden="true" pointerEvents="none"><ellipse cy="4" rx="9" ry="4" fill="#082b30" opacity=".5"/><path d="M0 0C-3-7-12-13-12-22a12 12 0 0 1 24 0C12-13 3-7 0 0Z" fill="#f16c46" stroke="#fff6ce" strokeWidth="2.5"/><circle cy="-22" r="4" fill="#fff8de"/></g>}
        {!game && <text x={compact ? 300 : 545} y="486" className="map-label">ECUADOR</text>}
      </svg> : <p className="map-note">{error || 'No se pudo interpretar el mapa. Usa el selector.'}</p>}
      {(highlighted || value) && <span className="map-province-tooltip" data-kind={game && highlighted && highlighted !== value ? 'preview' : 'selected'} aria-live="polite">{game && highlighted && highlighted !== value ? `Explorando: ${highlighted}` : highlighted || value}{!highlighted && value ? ' ✓' : ''}</span>}
    </div>
    {game && <div className="map-region-legend" aria-label="Regiones del Ecuador">{Object.entries(MAP_REGIONS).map(([key, palette]) => <span key={key} data-region={key}><i style={{background:palette.colors[1]}} aria-hidden="true"/>{palette.label}</span>)}</div>}
    {showProvinceSelect && <label className="field"><span>{selectLabel}{required && <span aria-hidden="true"> *</span>}</span>
      <select id={selectId} value={value} onChange={e=>onChange(e.target.value)} disabled={disabled} required={required} aria-invalid={invalid || undefined} aria-describedby={describedBy}>
        <option value="">Selecciona una provincia</option>
        {PROVINCIAS.map(name=><option key={name} value={name}>{name}</option>)}
      </select>
    </label>}
    {showAttribution && <p className="tiny">Datos geográficos: <a href="https://github.com/pabl-o-ce/Ecuador-geoJSON" target="_blank" rel="noreferrer">Ecuador-geoJSON</a> (Pablo Carrera Estrada, <a href={LICENSE} target="_blank" rel="noreferrer">licencia MIT</a>). Recurso local; selector alternativo disponible.</p>}
  </div>
}
