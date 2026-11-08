import { useEffect, useState } from 'react'
import { divIcon, DomEvent, type LatLng } from 'leaflet'
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import type { GardenCoordinates } from './real-garden'
import 'leaflet/dist/leaflet.css'

const markerIcon = divIcon({
  className: 'rg-map-marker',
  html: '<span aria-hidden="true"></span>',
  iconSize: [32, 42], iconAnchor: [16, 40],
})

function MapInteractions({ coordinates, onChange }: { coordinates: GardenCoordinates | null; onChange: (coordinates: GardenCoordinates) => void }) {
  const map = useMap()
  useEffect(() => {
    const container = map.getContainer()
    const frame = requestAnimationFrame(() => map.invalidateSize())
    const observer = new ResizeObserver(() => map.invalidateSize())
    observer.observe(container)
    return () => { cancelAnimationFrame(frame); observer.disconnect() }
  }, [map])
  function select(latlng: LatLng) { onChange({ latitude: Number(latlng.lat.toFixed(6)), longitude: Number(latlng.wrap().lng.toFixed(6)) }) }
  useMapEvents({ click: event => select(event.latlng) })
  return <>
    {coordinates && <Marker position={[coordinates.latitude, coordinates.longitude]} icon={markerIcon} draggable autoPan
      title="Ubicación elegida para tu huerto" alt="Marcador del huerto: arrastra para corregir la posición"
      eventHandlers={{ dragend: event => select(event.target.getLatLng()) }}/>}
    <div className="rg-map-center-control" ref={element => { if (element) DomEvent.disableClickPropagation(element) }}><button type="button" onClick={() => select(map.getCenter())}>Marcar el centro del mapa</button></div>
  </>
}

export default function ExactLocationMap({ coordinates, province, onChange }: {
  coordinates: GardenCoordinates | null; province: string; onChange: (coordinates: GardenCoordinates) => void
}) {
  const [tileError, setTileError] = useState(false)
  return <>
    <MapContainer className="rg-detail-map" center={coordinates ? [coordinates.latitude, coordinates.longitude] : province === 'Galápagos' ? [-0.6, -90.5] : [-1.5, -78.5]}
      zoom={coordinates ? 16 : province === 'Galápagos' ? 8 : 7} minZoom={3} maxZoom={19}>
      <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" maxZoom={19} noWrap
        attribution={'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors'}
        eventHandlers={{ tileerror: () => setTileError(true), tileload: () => setTileError(false) }}/>
      <MapInteractions coordinates={coordinates} onChange={onChange}/>
    </MapContainer>
    {tileError && <p className="rg-error" role="status">No se pudo cargar parte del mapa. Revisa tu conexión o vuelve a intentarlo más tarde.</p>}
  </>
}
