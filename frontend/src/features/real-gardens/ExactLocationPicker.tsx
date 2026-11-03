import { lazy, Suspense, useRef, useState } from 'react'
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
  const [candidate, setCandidate] = useState(coordinates)

  function showMap() { setCandidate(coordinates); setOpen(true); dialogRef.current?.showModal() }
  function close() { dialogRef.current?.close(); setOpen(false) }

  return <div className="rg-exact-location" id="rg-coordinates" tabIndex={-1}>
    <button type="button" className="rg-outline-button rg-mark-button" onClick={showMap} disabled={disabled}>
      <GardenIcon name="map"/>{coordinates ? 'Ajustar ubicación en el mapa' : 'Marcar mi huerto en el mapa'}
    </button>
    {coordinates && <div className="rg-coordinate-value"><span>Latitud, longitud: {formatCoordinates(coordinates)}</span><button type="button" className="rg-text-button" disabled={disabled} onClick={() => onChange(null)}>Quitar ubicación</button></div>}
    <small className="rg-hint">Opcional · Coordenadas elegidas por ti, sin verificar.</small>
    {error && <p className="rg-error">{error}</p>}
    <dialog ref={dialogRef} className="rg-map-dialog" aria-labelledby="rg-map-dialog-title" aria-describedby="rg-map-dialog-hint" onCancel={close} onClose={() => setOpen(false)}>
      <header><div><h2 id="rg-map-dialog-title">¿Dónde está tu huerto?</h2><p id="rg-map-dialog-hint">Acerca y desplaza el mapa. Haz clic o toca para marcar; arrastra el marcador para corregir.</p></div><button type="button" className="rg-outline-button" aria-label="Cerrar mapa" onClick={close} autoFocus>✕</button></header>
      {open && <Suspense fallback={<p className="rg-map-loading" role="status">Cargando mapa…</p>}><ExactLocationMap coordinates={candidate} province={province} onChange={setCandidate}/></Suspense>}
      <p className="rg-hint">Con teclado: enfoca el mapa, desplázate con las flechas y usa + / − para el zoom. Luego elige «Marcar el centro del mapa».</p>
      <p className="rg-map-selection" role="status">{candidate ? `Latitud, longitud: ${formatCoordinates(candidate)}` : 'Aún no has marcado una ubicación.'}</p>
      <footer><button type="button" className="rg-outline-button" onClick={close}>Cancelar</button><button type="button" className="rg-primary-button" disabled={!candidate} onClick={() => { onChange(candidate); close() }}>Usar esta ubicación</button></footer>
    </dialog>
  </div>
}
