import { useRef, useState, type FormEvent } from 'react'
import { PLANT_STATES, type GardenPlant, type PlantState } from './garden'
import { localDate, recordId, validatePlantUpdate, type PlantUpdate } from './plant-record'
import { useGardenDialog } from './useGardenDialog'
import { useJournalPhoto } from './journal/useJournalPhoto'
import './garden-journal.css'

export default function PlantEditor({ plant, plants, onSave, onClose }: { plant: GardenPlant; plants: GardenPlant[]; onSave: (draft: PlantUpdate) => void | Promise<void>; onClose: () => void }) {
  const dialog = useGardenDialog(), request = useRef(recordId('plant-update')), photo = useJournalPhoto()
  const [draft, setDraft] = useState<PlantUpdate>({ name: plant.name, latin: plant.latin, plantedOn: plant.plantedOn ?? '', plot: plant.plot, observations: plant.observations ?? '', state: plant.state ?? 'not-documented', date: localDate() })
  const [busy, setBusy] = useState(false), [error, setError] = useState('')
  function field<K extends keyof PlantUpdate>(key: K, value: PlantUpdate[K]) { setDraft(current => ({ ...current, [key]: value })) }
  async function submit(event: FormEvent) {
    event.preventDefault(); if (busy || photo.reading || photo.error) return
    const invalid = validatePlantUpdate(draft, plant, plants)
    if (invalid) { setError(invalid); return }
    setBusy(true); setError('')
    try { await onSave({ ...draft, photo: photo.photo, requestId: request.current }) } catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo guardar la ficha.'); setBusy(false) }
  }
  return <dialog ref={dialog} className="garden-journal-dialog" aria-labelledby="plant-edit-title" onCancel={event => { event.preventDefault(); if (!busy) onClose() }}>
    <header><div><small>PASAPORTE VIVO</small><h2 id="plant-edit-title">Actualizar planta</h2></div><button type="button" autoFocus disabled={busy} onClick={onClose} aria-label="Cerrar edición de planta">×</button></header>
    <form onSubmit={submit}>
      <div className="journal-fields">
        <label>Nombre común<input required value={draft.name} maxLength={100} onChange={event => field('name', event.target.value)}/></label>
        <label>Nombre científico<input value={draft.latin} maxLength={150} onChange={event => field('latin', event.target.value)}/></label>
        <label>Espacio de cultivo<select aria-label="Espacio de cultivo" value={draft.plot} onChange={event => field('plot', Number(event.target.value))}>{Array.from({ length: 6 }, (_, plot) => <option key={plot} value={plot} disabled={!plant.archivedAt && plants.some(item => item.id !== plant.id && !item.archivedAt && item.plot === plot)}>Espacio {plot + 1}</option>)}</select></label>
        <label>Fecha de siembra<input type="date" max={localDate()} value={draft.plantedOn} onChange={event => field('plantedOn', event.target.value)}/></label>
        <label>Fecha de la observación<input required type="date" max={localDate()} value={draft.date} onChange={event => field('date', event.target.value)}/></label>
        <label>Estado documentado<select aria-label="Estado documentado" value={draft.state} onChange={event => field('state', event.target.value as PlantState)}>{Object.entries(PLANT_STATES).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
        <label>Altura medida (cm, opcional)<input type="number" min="0" max="100000" step="0.1" value={draft.heightCm ?? ''} onChange={event => field('heightCm', event.target.value === '' ? undefined : Number(event.target.value))}/></label>
        <label>Nueva fotografía (opcional)<input type="file" accept="image/jpeg,image/png,image/webp" onChange={photo.choose}/></label>
        <label className="journal-wide">Observaciones<textarea value={draft.observations} maxLength={2000} onChange={event => field('observations', event.target.value)}/></label>
      </div>
      <p className="journal-note">Se conserva la fotografía anterior en las evidencias. Solo se muestra el estado que documentes.</p>
      {(error || photo.error) && <p role="alert" className="journal-error">{error || photo.error}</p>}
      <footer><button type="button" disabled={busy} onClick={onClose}>Cancelar</button><button type="submit" disabled={busy || photo.reading || Boolean(photo.error)}>{busy ? 'Guardando…' : 'Guardar observación'}</button></footer>
    </form>
  </dialog>
}
