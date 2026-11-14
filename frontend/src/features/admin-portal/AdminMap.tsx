import { useEffect, useMemo, useState, type ChangeEvent } from 'react'
import AdminIcon from './AdminIcon'

const sourceUrl = new URL('../../assets/ecuador-provincias.geojson', import.meta.url).href
const PROVINCES = [
  'Azuay', 'Bolívar', 'Cañar', 'Carchi', 'Chimborazo', 'Cotopaxi', 'El Oro',
  'Esmeraldas', 'Galápagos', 'Guayas', 'Imbabura', 'Loja', 'Los Ríos', 'Manabí',
  'Morona Santiago', 'Napo', 'Orellana', 'Pastaza', 'Pichincha', 'Santa Elena',
  'Santo Domingo de los Tsáchilas', 'Sucumbíos', 'Tungurahua', 'Zamora Chinchipe',
]

type Position = [number, number]
type Geometry = { type: string; coordinates: unknown }
type Feature = { type: string; properties: Record<string, unknown>; geometry: Geometry }
type GeoCollection = { type: string; features: Feature[] }
const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z]/g, '')

function nameOf(props: Record<string, unknown>) {
  const candidates = ['provincia', 'PROVINCIA', 'DPA_DESPRO', 'dpa_despro', 'NAME_1', 'name', 'nombre', 'PRO_DESCRI', 'DPA_PROVIN', ...Object.keys(props)]
    .map(k => props[k]).filter((x): x is string => typeof x === 'string')
  return PROVINCES.find(p => candidates.some(c => normalize(c) === normalize(p) || normalize(c) === 'santodomingo' && p.startsWith('Santo Domingo'))) ?? ''
}
const isPos = (value: unknown): value is Position => Array.isArray(value) && typeof value[0] === 'number' && typeof value[1] === 'number'
function polygonsOf(feature: Feature): Position[][][] {
  const c = feature.geometry.coordinates
  if (!Array.isArray(c) || !c.length) return []
  // Algunos polígonos de la fuente histórica tienen tipo MultiPolygon y anidamiento Polygon.
  if (Array.isArray(c[0]) && isPos(c[0][0])) return [c as Position[][]]
  if (Array.isArray(c[0]?.[0]) && isPos(c[0][0][0])) return c as Position[][][]
  return []
}
function pathFor(feature: Feature, galapagos: boolean) {
  const xRange = galapagos ? [-92.5, -89] : [-81.6, -74.8]
  const yRange = galapagos ? [-1.7, 1.2] : [-5.3, 1.8]
  const box = galapagos ? { x: 18, y: 286, w: 118, h: 112 } : { x: 142, y: 13, w: 408, h: 399 }
  const project = ([lon, lat]: Position): Position => [
    box.x + ((lon - xRange[0]) / (xRange[1] - xRange[0])) * box.w,
    box.y + ((yRange[1] - lat) / (yRange[1] - yRange[0])) * box.h,
  ]
  return polygonsOf(feature).map(poly => poly.map(ring => ring.map((point, i) => {
    const [x, y] = project(point)
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`
  }).join(' ') + ' Z').join(' ')).join(' ')
}

export default function AdminMap({ province, onProvinceChange }: { province: string; onProvinceChange: (province: string) => void }) {
  const [features, setFeatures] = useState<Feature[]>([])
  const [error, setError] = useState(false)
  useEffect(() => {
    const controller = new AbortController()
    fetch(sourceUrl, { signal: controller.signal })
      .then(async response => { if (!response.ok) throw new Error('Mapa no disponible'); return await response.json() as GeoCollection })
      .then(data => setFeatures(data.features.filter(f => f.geometry && nameOf(f.properties) && polygonsOf(f).length > 0)))
      .catch(() => { if (!controller.signal.aborted) setError(true) })
    return () => controller.abort()
  }, [])
  const mapFeatures = useMemo(() => features.map((f, index) => ({
    name: nameOf(f.properties),
    path: pathFor(f, nameOf(f.properties) === 'Galápagos'),
    palette: ['#7e9842', '#9cad68', '#d0cf91', '#586f35', '#b3bc70', '#748f50'][index % 6],
  })), [features])

  return <div className="kap-map-wrap">
    <div className="kap-map-toolbar">
      <label className="kap-field kap-map-filter">
        <span>Provincia</span>
        <select value={province} onChange={(event: ChangeEvent<HTMLSelectElement>) => onProvinceChange(event.target.value)}>
          <option value="">Todas las provincias</option>
          {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </label>
      {province && <button type="button" className="kap-text-button" onClick={() => onProvinceChange('')}>Limpiar filtro</button>}
    </div>
    {error ? <p role="status" className="kap-map-error">No se pudo cargar el mapa provincial. Puedes seleccionar una provincia en el filtro.</p> :
      <svg className="kap-ecuador-map" viewBox="0 0 570 430" aria-label="Mapa provincial del Ecuador, sin ubicaciones de comunidades cargadas" role="img">
        <rect x="5" y="282" width="133" height="121" rx="14" fill="#f0efdc" stroke="#c3c3a2" strokeDasharray="4 5"/>
        <text x="16" y="300" fill="#6b6d4b" fontSize="12" fontWeight="700">GALÁPAGOS</text>
        {mapFeatures.map(f => <path key={f.name} d={f.path} fill={province === f.name ? '#ce9b46' : f.palette} stroke="#f5efcc" strokeWidth="1.5" strokeLinejoin="round"><title>{f.name}</title></path>)}
        {mapFeatures.length === 0 && <text x="255" y="220" textAnchor="middle" fill="#777a5b" fontSize="14">Cargando mapa de Ecuador…</text>}
        <path d="M522 41v28m-6-21 6-8 6 8" stroke="#50653a" strokeWidth="2" fill="none"/>
        <text x="522" y="33" textAnchor="middle" fill="#50653a" fontSize="12">N</text>
      </svg>}
    <div className="kap-map-foot"><AdminIcon name="info" size={16}/><span>{province ? `Filtro activo: ${province}. ` : ''}Los marcadores aparecerán al conectar el directorio aprobado del MSP.</span></div>
  </div>
}
