import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import GardenIcon from './GardenIcon'
import { PLANT_STATES, type GardenPlant } from './garden'
import './garden-journal.css'

export default function PlantPassport({ plant, onClose, onHistory, onEdit, onArchive, onRestore, onActivity, activityItems }: {
  plant: GardenPlant | null
  onClose: () => void
  onHistory: () => void
  onEdit?: () => void
  onArchive?: () => void | Promise<void>
  onRestore?: () => string | null | Promise<string | null>
  onActivity?: () => void
  activityItems?: ReactNode
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [actionError, setActionError] = useState('')
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog || !plant) return
    const active = document.activeElement
    const opener = active instanceof HTMLElement && active !== document.body && !active.closest('dialog')
      ? active : document.querySelector<HTMLElement>(`.garden-poc-slot[data-plot-index="${plant.plot}"], .garden-parcel[data-plot-index="${plant.plot}"]`)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    setActionError('')
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
      <div className="garden-passport-copy"><span className="garden-eyebrow">TU HUERTO REAL · ESPEJO DIGITAL</span><h2 id="plant-passport-title">{plant.name}</h2><p><em>{plant.latin}</em></p>
        <dl><div><dt>Registrada el</dt><dd>{plant.date}</dd></div><div><dt>Ubicación digital</dt><dd>Espacio {plant.plot + 1}{plant.archivedAt ? ' · Ficha archivada' : ''}</dd></div>{plant.plantedOn && <div><dt>Fecha de siembra</dt><dd>{new Date(`${plant.plantedOn}T12:00:00`).toLocaleDateString('es-EC')}</dd></div>}<div><dt>Estado documentado</dt><dd>{PLANT_STATES[plant.state ?? 'not-documented']}</dd></div></dl>
        {plant.observations && <p>{plant.observations}</p>}
        <p>Fotografías y observaciones aportadas por ti. El jardín no deduce crecimiento ni estado a partir del riego.</p>
        <div className="journal-passport-actions">
          {onEdit && <button type="button" onClick={onEdit}>Actualizar foto y observaciones</button>}
          {onActivity && !plant.archivedAt && <button type="button" onClick={onActivity}>Registrar actividad</button>}
          {onArchive && !plant.archivedAt && <button type="button" onClick={async () => { try { await onArchive() } catch (cause) { setActionError(cause instanceof Error ? cause.message : 'No se pudo archivar la ficha.') } }}>Archivar ficha y liberar espacio</button>}
          {onRestore && plant.archivedAt && <button type="button" onClick={async () => { const error = await onRestore(); setActionError(error ?? '') }}>Restaurar al espacio</button>}
        </div>
        {actionError && <p role="alert" className="journal-error">{actionError}</p>}
        {!!plant.evidences?.length && <section aria-label="Evidencias de la planta"><h3>Fotos y observaciones</h3><ol className="journal-evidences">{[...plant.evidences].reverse().map(evidence => <li key={evidence.id}><time dateTime={evidence.date}>{evidence.date}</time><p>{evidence.notes}</p>{evidence.state && <small>{PLANT_STATES[evidence.state]}</small>}{evidence.heightCm !== undefined && <p>Altura medida: {evidence.heightCm} cm</p>}{evidence.photo && <img src={evidence.photo} alt={'Evidencia de ' + plant.name + ' del ' + evidence.date}/>}</li>)}</ol></section>}
        {activityItems}
        <button type="button" className="garden-solid-button" onClick={onHistory}><GardenIcon name="book"/> Ver Bitácora de cultivo</button>
      </div>
    </>}
  </dialog>
}
