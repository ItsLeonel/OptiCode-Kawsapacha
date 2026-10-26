import { useEffect, useMemo, useState } from 'react'

type Geometry = { type: 'Polygon' | 'MultiPolygon'; coordinates: unknown }
type Feature = { type: 'Feature'; properties: Record<string, unknown>; geometry: Geometry }
type Collection = { type: 'FeatureCollection'; features: Feature[] }
type Position = [number, number]

const SOURCE = 'https://raw.githubusercontent.com/pabl-o-ce/Ecuador-geoJSON/master/geojson/provinces.geojson'
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
  const match = values.find(v => PROVINCIAS.some(name => clean(name) === clean(v)))
  return PROVINCIAS.find(name => match && clean(name) === clean(match)) ?? ''
}
function polygonsOf(f: Feature): Position[][][] {
  if (f.geometry.type === 'Polygon') return [f.geometry.coordinates as Position[][]]
  return f.geometry.coordinates as Position[][][]
}
function regionCoordinates(f: Feature): Position[] {
  return polygonsOf(f).flat(2)
}
function projectPath(f: Feature, galapagos: boolean) {
  const xs = galapagos ? [-92, -89] : [-81.4, -75]
  const ys = galapagos ? [-1.5, 1.2] : [-5.2, 1.7]
  const rect = galapagos ? {x:36,y:318,w:140,h:135} : {x:208,y:28,w:500,h:445}
  const x = (lon:number) => rect.x + ((lon-xs[0])/(xs[1]-xs[0]))*rect.w
  const y = (lat:number) => rect.y + ((ys[1]-lat)/(ys[1]-ys[0]))*rect.h
  return polygonsOf(f).map(poly => poly.map(ring => ring.map(([lon,lat],i) =>
    `${i===0?'M':'L'}${x(lon).toFixed(1)},${y(lat).toFixed(1)}`).join(' ')+' Z').join(' ')).join(' ')
}
export const provinces = PROVINCIAS

export default function EcuadorMap({ value, onChange }: {value: string; onChange:(value:string)=>void}) {
  const [features,setFeatures] = useState<Feature[]>([])
  const [error,setError] = useState('')
  const [loading,setLoading] = useState(true)
  useEffect(() => {
    const controller = new AbortController()
    fetch(SOURCE, {signal:controller.signal})
      .then(async response => { if(!response.ok) throw new Error('No disponible'); return response.json() as Promise<Collection> })
      .then(data => { setFeatures(data.features.filter(f => f.geometry && provinceName(f.properties))); setLoading(false) })
      .catch(() => {if(!controller.signal.aborted){setError('Mapa no disponible. Usa el selector de provincias.');setLoading(false)}})
    return () => controller.abort()
  },[])
  const mapped = useMemo(() => features.map(f => {
    const name = provinceName(f.properties)
    const isGalapagos = name === 'Galápagos' || regionCoordinates(f).some(p => p[0]<-85)
    return {name,path:projectPath(f,isGalapagos)}
  }),[features])

  return <div className="map-shell">
    <div className="map-visual">
      {loading ? <p className="map-note">Cargando límites provinciales…</p> :
      mapped.length ? <svg viewBox="0 0 740 500" role="img" aria-label="Mapa de provincias de Ecuador seleccionables">
        <rect width="740" height="500" fill="#e8efe5" rx="20"/>
        <path d="M30 300H175V470H30Z" fill="#d5e5d5" rx="14" />
        <text x="38" y="304" className="map-label">GALÁPAGOS</text>
        {mapped.map(item => <path key={item.name} d={item.path}
          fill={value===item.name ? '#ce9757' : '#74a17a'}
          stroke="#f4f5e7" strokeWidth="1.8" strokeLinejoin="round"
          tabIndex={0} role="button" aria-label={`Seleccionar ${item.name}`}
          onClick={()=>onChange(item.name)}
          onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onChange(item.name)}}}>
          <title>{item.name}</title>
        </path>)}
        <text x="545" y="486" className="map-label">ECUADOR</text>
      </svg> : <p className="map-note">{error || 'No se pudo interpretar el mapa. Usa el selector.'}</p>}
    </div>
    <label className="field">Provincia seleccionada
      <select value={value} onChange={e=>onChange(e.target.value)}>
        <option value="">Selecciona una provincia</option>
        {PROVINCIAS.map(name=><option key={name} value={name}>{name}</option>)}
      </select>
    </label>
    <p className="tiny">Datos geográficos: <a href="https://github.com/pabl-o-ce/Ecuador-geoJSON" target="_blank" rel="noreferrer">Ecuador-geoJSON</a> (Pablo Carrera Estrada, licencia MIT). Selector alternativo disponible si falla la red.</p>
  </div>
}
