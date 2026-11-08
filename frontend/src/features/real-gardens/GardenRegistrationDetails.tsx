import { useEffect, useRef, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import GardenIcon from '../my-garden/GardenIcon'
import RealGardenField from './RealGardenField'
import type { RealGardenDraft, RealGardenErrors } from './real-garden'

export default function GardenRegistrationDetails({ values, errors, onChange, onConfirm, onClose }: {
  values: RealGardenDraft; errors: RealGardenErrors
  onChange: <K extends keyof RealGardenDraft>(field: K, value: RealGardenDraft[K]) => void
  onConfirm: (event: FormEvent<HTMLFormElement>) => void; onClose: () => void
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
  }, [])
  function close() { dialogRef.current?.close(); onClose() }

  return createPortal(<dialog className="rg-map-dialog rg-registration-details" ref={dialogRef} aria-labelledby="rg-registration-details-title" aria-describedby="rg-registration-details-hint" onCancel={event => { event.preventDefault(); close() }}>
    <header><div><h2 id="rg-registration-details-title">Confirma el registro de tu terreno</h2><p id="rg-registration-details-hint">Completa estos datos obligatorios para guardar tu espacio de cultivo.</p></div><button type="button" className="rg-outline-button" aria-label="Volver al terreno" onClick={close}><GardenIcon name="close"/></button></header>
    <form onSubmit={event => { event.stopPropagation(); onConfirm(event) }} noValidate>
      <div className="rg-essential-fields"><RealGardenField id="rg-name" label="Nombre del huerto" required error={errors.name}>{props => <input {...props} autoFocus name="gardenName" minLength={3} maxLength={100} value={values.name} onChange={event => onChange('name', event.target.value)} placeholder="Mi Huerto Andino"/>}</RealGardenField><RealGardenField id="rg-areaM2" label="Superficie aproximada (m²)" required error={errors.areaM2}>{props => <input {...props} type="number" name="areaM2" min="0.01" step="any" inputMode="decimal" value={values.areaM2} onChange={event => onChange('areaM2', event.target.value)} placeholder="Ej. 25"/>}</RealGardenField></div>
      <footer><button type="button" className="rg-outline-button" onClick={close}>Volver</button><button type="submit" className="rg-primary-button"><GardenIcon name="seed"/>Guardar mi terreno</button></footer>
    </form>
  </dialog>, document.body)
}
