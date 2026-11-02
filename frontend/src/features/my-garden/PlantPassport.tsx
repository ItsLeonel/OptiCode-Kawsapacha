import { useEffect, useRef } from 'react'
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
    if (!dialog) return
    if (plant && !dialog.open) dialog.showModal()
    if (!plant && dialog.open) dialog.close()
  }, [plant])

  return <dialog ref={dialogRef} className="garden-passport" aria-labelledby="plant-passport-title" onClose={onClose} onClick={event => { if (event.target === event.currentTarget) dialogRef.current?.close() }}>
    {plant && <>
      <div className="garden-passport-header"><span><GardenIcon name="history"/> PASAPORTE VIVO</span><button type="button" autoFocus onClick={() => dialogRef.current?.close()} aria-label="Cerrar Pasaporte Vivo"><GardenIcon name="close"/></button></div>
      <img className="garden-passport-photo" src={plant.photo} alt={`Fotografía registrada de ${plant.name}`}/>
      <div className="garden-passport-copy"><span className="garden-eyebrow">REGISTRO LOCAL · DEMOSTRACIÓN</span><h2 id="plant-passport-title">{plant.name}</h2><p><em>{plant.latin}</em></p>
        <dl><div><dt>Registrada en esta visita</dt><dd>{plant.date}</dd></div><div><dt>Ubicación digital</dt><dd>Parcela {plant.plot + 1}</dd></div></dl>
        <p>Esta fotografía identifica tu planta. El historial de crecimiento y su verificación se integrarán con el servidor.</p>
        <button type="button" className="garden-solid-button" onClick={onHistory}><GardenIcon name="book"/> Ver Bitácora de cultivo</button>
      </div>
    </>}
  </dialog>
}
