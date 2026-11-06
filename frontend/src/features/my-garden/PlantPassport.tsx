import { useEffect, useRef, type KeyboardEvent } from 'react'
import GardenIcon from './GardenIcon'
import type { GardenPlant } from './garden'

export default function PlantPassport({ plant, onClose, onHistory }: {
  plant: GardenPlant | null
  onClose: () => void
  onHistory: () => void
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog || !plant) return
    const active = document.activeElement
    const opener = active instanceof HTMLElement && active !== document.body && !active.closest('dialog')
      ? active : document.querySelector<HTMLElement>(`.garden-parcel[data-plot-index="${plant.plot}"]`)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialog.showModal()
    return () => {
      dialog.close()
      document.body.style.overflow = previousOverflow
      if (opener?.isConnected) opener.focus({ preventScroll: true })
    }
  }, [plant])

  function keepFocus(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key !== 'Tab') return
    const controls = event.currentTarget.querySelectorAll<HTMLButtonElement>('button')
    const first = controls[0]
    const last = controls[controls.length - 1]
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
  }

  return <dialog ref={dialogRef} className="garden-passport" aria-labelledby="plant-passport-title" onKeyDown={keepFocus} onCancel={event => { event.preventDefault(); onClose() }} onClick={event => { if (event.target === event.currentTarget) onClose() }}>
    {plant && <>
      <div className="garden-passport-header"><span><GardenIcon name="history"/> PASAPORTE VIVO</span><button type="button" autoFocus onClick={onClose} aria-label="Cerrar Pasaporte Vivo"><GardenIcon name="close"/></button></div>
      <img className="garden-passport-photo" src={plant.photo} alt={`Fotografía registrada de ${plant.name}`}/>
      <div className="garden-passport-copy"><span className="garden-eyebrow">REGISTRO TEMPORAL · DEMOSTRACIÓN</span><h2 id="plant-passport-title">{plant.name}</h2><p><em>{plant.latin}</em></p>
        <dl><div><dt>Registrada en esta visita</dt><dd>{plant.date}</dd></div><div><dt>Ubicación digital</dt><dd>Parcela {plant.plot + 1}</dd></div>{plant.plantedOn && <div><dt>Fecha de siembra</dt><dd>{new Date(`${plant.plantedOn}T12:00:00`).toLocaleDateString('es-EC')}</dd></div>}</dl>
        <p>Esta fotografía identifica tu planta. El historial de crecimiento y su verificación se integrarán con el servidor.</p>
        <button type="button" className="garden-solid-button" onClick={onHistory}><GardenIcon name="book"/> Ver Bitácora de cultivo</button>
      </div>
    </>}
  </dialog>
}
