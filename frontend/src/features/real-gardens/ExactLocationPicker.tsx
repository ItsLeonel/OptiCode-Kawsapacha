import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import GardenIcon from '../my-garden/GardenIcon'
import type { GardenCoordinates } from './real-garden'

const ExactLocationMap = lazy(() => import('./ExactLocationMap'))

export const formatCoordinates = (coordinates: GardenCoordinates) => `${coordinates.latitude.toFixed(6)}, ${coordinates.longitude.toFixed(6)}`

export default function ExactLocationPicker({ coordinates, province, disabled, error, onChange }: {
  coordinates: GardenCoordinates | null; province: string; disabled: boolean; error?: string
  onChange: (coordinates: GardenCoordinates | null) => void
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState({ latitude: '', longitude: '' })
  const latitude = Number(position.latitude)
  const longitude = Number(position.longitude)
  const candidate = position.latitude.trim() && position.longitude.trim() && Number.isFinite(latitude) && Math.abs(latitude) <= 90 && Number.isFinite(longitude) && Math.abs(longitude) <= 180 ? { latitude, longitude } : null
  const coordinateError = Boolean(position.latitude || position.longitude) && !candidate

  useEffect(() => {
    if (!open) return
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
  }, [open])

  function selectPosition(next: GardenCoordinates) { setPosition({ latitude: String(next.latitude), longitude: String(next.longitude) }) }
  function showMap() {
    setPosition({ latitude: coordinates ? String(coordinates.latitude) : '', longitude: coordinates ? String(coordinates.longitude) : '' })
    setOpen(true)
  }
  function close() { dialogRef.current?.close(); setOpen(false) }

  return <div className="rg-exact-location" id="rg-coordinates" tabIndex={-1}>
    <button type="button" className="rg-outline-button rg-mark-button" onClick={showMap} disabled={disabled}>
      <GardenIcon name="map"/>{coordinates ? 'Ajustar ubicación en el mapa' : 'Marcar mi huerto en el mapa'}
    </button>
    {coordinates && <div className="rg-coordinate-value"><span>Latitud, longitud: {formatCoordinates(coordinates)}</span><button type="button" className="rg-text-button" disabled={disabled} onClick={() => onChange(null)}>Quitar ubicación</button></div>}
    <small className="rg-hint">Opcional · Coordenadas elegidas por ti, sin verificar.</small>
    {error && <p className="rg-error">{error}</p>}
    {open && createPortal(<dialog ref={dialogRef} className="rg-map-dialog" aria-labelledby="rg-map-dialog-title" aria-describedby="rg-map-dialog-hint" onCancel={event => { event.preventDefault(); close() }} onClose={() => setOpen(false)}>
      <header><div><h2 id="rg-map-dialog-title">¿Dónde está tu huerto?</h2><p id="rg-map-dialog-hint">Acerca y desplaza el mapa. Haz clic o toca para marcar; arrastra el marcador para corregir.</p></div><button type="button" className="rg-outline-button" aria-label="Cerrar mapa" onClick={close} autoFocus>✕</button></header>
      <Suspense fallback={<p className="rg-map-loading" role="status">Cargando mapa…</p>}><ExactLocationMap coordinates={candidate} province={province} onChange={selectPosition}/></Suspense>
      <p className="rg-hint">Con teclado: enfoca el mapa, desplázate con las flechas y usa + / − para el zoom. Luego elige «Marcar el centro del mapa».</p>
      <div className="rg-map-coordinate-fields" role="group" aria-label="Coordenadas de tu terreno">
        <label htmlFor="rg-map-latitude">Latitud<input id="rg-map-latitude" type="number" min="-90" max="90" step="any" inputMode="decimal" value={position.latitude} onChange={event => setPosition(current => ({ ...current, latitude: event.target.value }))} aria-describedby="rg-map-coordinate-hint"/></label>
        <label htmlFor="rg-map-longitude">Longitud<input id="rg-map-longitude" type="number" min="-180" max="180" step="any" inputMode="decimal" value={position.longitude} onChange={event => setPosition(current => ({ ...current, longitude: event.target.value }))} aria-describedby="rg-map-coordinate-hint"/></label>
      </div>
      <p className={coordinateError ? 'rg-error' : 'rg-hint'} id="rg-map-coordinate-hint">{coordinateError ? 'Completa una latitud entre −90 y 90 y una longitud entre −180 y 180.' : 'Puedes seleccionar en el mapa o escribir las coordenadas que conoces de tu terreno.'}</p>
      <p className="rg-map-selection" role="status">{candidate ? `Latitud, longitud: ${formatCoordinates(candidate)}` : 'Aún no has marcado una ubicación.'}</p>
      <footer><button type="button" className="rg-outline-button" onClick={close}>Cancelar</button><button type="button" className="rg-primary-button" disabled={!candidate} onClick={() => { onChange(candidate); close() }}>Usar esta ubicación</button></footer>
    </dialog>, document.body)}
  </div>
}
