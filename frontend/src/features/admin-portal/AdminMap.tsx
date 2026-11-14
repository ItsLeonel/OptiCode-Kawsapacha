import { useEffect, useMemo, useState, type ChangeEvent, type KeyboardEvent } from 'react'
import AdminIcon from './AdminIcon'
import type { CommunityRow } from './admin-types'

const sourceUrl = new URL('../../assets/ecuador-provincias.geojson', import.meta.url).href
export const PROVINCES = [
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
const sameProvince = (a: string, b: string) => normalize(a) === normalize(b)
function nameOf(props: Record<string, unknown>) {
  const candidates = ['provincia', 'PROVINCIA', 'DPA_DESPRO', 'dpa_despro', 'NAME_1', 'name', 'nombre', 'PRO_DESCRI', 'DPA_PROVIN', ...Object.keys(props)]
    .map(k => props[k]).filter((x): x is string => typeof x === 'string')
  return PROVINCES.find(p => candidates.some(c => sameProvince(c, p) || normalize(c) === 'santodomingo' && p.startsWith('Santo Domingo'))) ?? ''
}
const isPos = (value: unknown): value is Position => Array.isArray(value) && typeof value[0] === 'number' && typeof value[1] === 'number'
function polygonsOf(feature: Feature): Position[][][] {
  const c = feature.geometry.coordinates
  if (!Array.isArray(c) || !c.length) return []
  if (Array.isArray(c[0]) && isPos(c[0][0])) return [c as Position[][]]
  if (Array.isArray(c[0]?.[0]) && isPos(c[0][0][0])) return c as Position[][][]
  return []
}
function projection(galapagos: boolean) {
  const xRange = galapagos ? [-92.5, -89] : [-81.6, -74.8]
  const yRange = galapagos ? [-1.7, 1.2] : [-5.3, 1.8]
  const box = galapagos ? { x: 18, y: 286, w: 118, h: 112 } : { x: 142, y: 13, w: 408, h: 399 }
  return ([lon, lat]: Position): Position => [
    box.x + ((lon - xRange[0]) / (xRange[1] - xRange[0])) * box.w,
    box.y + ((yRange[1] - lat) / (yRange[1] - yRange[0])) * box.h,
  ]
}
function pathFor(feature: Feature, galapagos: boolean) {
  const project = projection(galapagos)
  return polygonsOf(feature).map(poly => poly.map(ring => ring.map((point, i) => {
    const [x, y] = project(point)
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`
  }).join(' ') + ' Z').join(' ')).join(' ')
}
function provincePoint(feature: Feature): Position | null {
  const polys = polygonsOf(feature)
  const rings = polys.map(p => p[0]).filter((r): r is Position[] => Array.isArray(r) && r.length >= 3)
  if (!rings.length) return null
  const ring = rings.sort((a, b) => b.length - a.length)[0]
  const xs = ring.map(p => p[0]), ys = ring.map(p => p[1])
  return [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2]
}
function validCoordinates(row: CommunityRow): Position | null {
  const lat = row.latitude ?? row.coordinates?.latitude
  const lon = row.longitude ?? row.coordinates?.longitude
  if (typeof lat !== 'number' || typeof lon !== 'number' || !Number.isFinite(lat) || !Number.isFinite(lon)) return null
  if (lat < -5.5 || lat > 1.9 || lon < -92.6 || lon > -74.6) return null
  return [lon, lat]
}
export default function AdminMap({ province, onProvinceChange, communities, selectedId, onSelectCommunity }: {
  province: string
  onProvinceChange: (province: string) => void
  communities?: CommunityRow[]
  selectedId?: string | null
  onSelectCommunity?: (id: string) => void
}) {
  const [features, setFeatures] = useState<Feature[]>([])
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const controller = new AbortController()
    fetch(sourceUrl, { signal: controller.signal })
      .then(async response => { if (!response.ok) throw new Error('Mapa no disponible'); return await response.json() as GeoCollection })
      .then(data => { if (!controller.signal.aborted) { setFeatures(data.features.filter(f => f.geometry && nameOf(f.properties) && polygonsOf(f).length > 0)); setLoading(false) } })
      .catch(() => { if (!controller.signal.aborted) { setError(true); setLoading(false) } })
    return () => controller.abort()
  }, [])
  const mapFeatures = useMemo(() => features.map((f, index) => ({
    name: nameOf(f.properties),
    path: pathFor(f, nameOf(f.properties) === 'Galápagos'),
    center: provincePoint(f),
    palette: ['#7e9842', '#9cad68', '#d0cf91', '#586f35', '#b3bc70', '#748f50'][index % 6],
  })), [features])
  const available = communities ?? []
  const filtered = available.filter(row => !province || sameProvince(row.province, province))
  const geolocated = filtered.filter(row => validCoordinates(row) !== null)
  const missingLocations = filtered.filter(row => !validCoordinates(row))
  const grouped = PROVINCES.map(name => ({ name, total: missingLocations.filter(row => sameProvince(row.province, name)).length })).filter(group => group.total > 0)
  function activate(event: KeyboardEvent<SVGGElement>, action: () => void) {
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); action() }
  }
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
    {error ? <p role="status" className="kap-map-error">No se pudo cargar el mapa provincial. Utiliza el selector de provincias.</p> :
      <svg className="kap-ecuador-map" viewBox="0 0 570 430" aria-label="Mapa de provincias del Ecuador con comunidades disponibles según la información autorizada" role="img">
        <rect x="5" y="282" width="133" height="121" rx="14" fill="#f0efdc" stroke="#c3c3a2" strokeDasharray="4 5"/>
        <text x="16" y="300" fill="#6b6d4b" fontSize="12" fontWeight="700">GALÁPAGOS</text>
        {mapFeatures.map(f => <path key={f.name} d={f.path} fill={province === f.name ? '#ce9b46' : f.palette} stroke="#f5efcc" strokeWidth="1.5" strokeLinejoin="round"><title>{f.name}</title></path>)}
        {grouped.map(group => {
          const item = mapFeatures.find(f => sameProvince(f.name, group.name))
          if (!item?.center) return null
          const point = projection(group.name === 'Galápagos')(item.center)
          return <g key={`group-${group.name}`} transform={`translate(${point[0]} ${point[1]})`} className="kap-map-marker kap-map-group-marker"
            tabIndex={0} role="button" aria-label={`${group.total} comunidades en ${group.name} sin coordenadas individuales. Filtrar por provincia.`}
            onClick={() => onProvinceChange(group.name)} onKeyDown={(e: KeyboardEvent<SVGGElement>) => activate(e, () => onProvinceChange(group.name))}>
            <circle r="16" fill="#49301c" stroke="#fff5dc" strokeWidth="3"/>
            <text textAnchor="middle" y="5" fontSize="12" fontWeight="700" fill="#fff7e4">{group.total}</text>
            <title>{`${group.name}: ${group.total} comunidad(es) sin ubicación precisa`}</title>
          </g>
        })}
        {geolocated.map(row => {
          const point = validCoordinates(row)
          if (!point) return null
          const projected = projection(row.province === 'Galápagos' || point[0] < -86)(point)
          const selected = selectedId === row.id
          const select = () => onSelectCommunity?.(row.id)
          return <g key={`community-${row.id}`} transform={`translate(${projected[0]} ${projected[1]})`} className={`kap-map-marker${selected ? ' is-selected' : ''}`}
            tabIndex={onSelectCommunity ? 0 : undefined} role={onSelectCommunity ? 'button' : undefined}
            aria-label={`Ver comunidad ${row.name}, ${row.province}`} onClick={select} onKeyDown={(e: KeyboardEvent<SVGGElement>) => activate(e, select)}>
            <circle r={selected ? 10 : 7.5} stroke="#fff8e4" strokeWidth={selected ? 3 : 2} fill={selected ? '#a66a29' : '#2b633b'}/>
            <circle r="2" fill="#fff8df"/>
            <title>{`${row.name} · ${row.province}`}</title>
          </g>
        })}
        {loading && <text x="270" y="220" textAnchor="middle" fill="#777a5b" fontSize="14">Cargando mapa de Ecuador…</text>}
        <path d="M522 41v28m-6-21 6-8 6 8" stroke="#50653a" strokeWidth="2" fill="none"/>
        <text x="522" y="33" textAnchor="middle" fill="#50653a" fontSize="12">N</text>
      </svg>}
    <div className="kap-map-legend" aria-label="Leyenda del mapa">
      <span><i className="kap-legend-pinned"/> Ubicación registrada</span>
      <span><i className="kap-legend-cluster"/> Agrupación provincial</span>
    </div>
    <div className="kap-map-foot"><AdminIcon name="info" size={16}/><span>{province ? `Filtro: ${province}. ` : ''}{communities === undefined ? 'Directorio nacional pendiente de conexión con el backend MSP.' : `${filtered.length} comunidades incluidas en el filtro; los círculos numerados no representan ubicaciones exactas.`}</span></div>
  </div>
}
