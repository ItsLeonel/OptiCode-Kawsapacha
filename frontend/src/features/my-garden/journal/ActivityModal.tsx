import { useRef, useState, type FormEvent } from 'react'
import { PLANT_STATES, type GardenPlant, type PlantState } from '../garden'
import { localDate, recordId } from '../plant-record'
import { useGardenDialog } from '../useGardenDialog'
import { useJournalPhoto } from './useJournalPhoto'
import { ACTIVITY_TYPES, validateActivity, type ActivityDraft, type ActivityTarget, type ActivityType, type ActivityDetails } from './activities'
import '../garden-journal.css'

export default function ActivityModal({ plants, gardenId, responsible, initialPlant, initialPlot, onSave, onRegister, onClose }: {
  plants: GardenPlant[]; gardenId: string; responsible: string; initialPlant?: GardenPlant; initialPlot?: number | null
  onSave: (draft: ActivityDraft) => Promise<void>; onRegister: (plot: number, type: ActivityType) => void; onClose: () => void
}) {
  const dialog = useGardenDialog(), sending = useRef(false), id = useRef(recordId('activity'))
  const [type, setType] = useState<ActivityType>('watering'), [date, setDate] = useState(localDate())
  const [person, setPerson] = useState(responsible), [targetId, setTargetId] = useState(initialPlant ? 'plant:' + initialPlant.id : initialPlot != null ? 'plot:' + initialPlot : 'garden')
  const [notes, setNotes] = useState(''), [details, setDetails] = useState<ActivityDetails>({})
  const [error, setError] = useState(''), [busy, setBusy] = useState(false)
  const photo = useJournalPhoto()
  const plant = targetId.startsWith('plant:') ? plants.find(item => item.id === targetId.slice(6)) : undefined
  const target: ActivityTarget = plant ? { kind: 'plant', plantId: plant.id, plot: plant.plot } : targetId.startsWith('plot:') ? { kind: 'plot', plot: Number(targetId.slice(5)) } : { kind: 'garden' }
  const needsPlant = ['sowing', 'hilling', 'replanting', 'observation', 'harvest'].includes(type)
  function detail<K extends keyof ActivityDetails>(key: K, value: ActivityDetails[K]) { setDetails(current => ({ ...current, [key]: value })) }
  async function submit(event: FormEvent) {
    event.preventDefault(); if (sending.current || photo.reading || photo.error) return
    const draft: ActivityDraft = { id: id.current, type, date, responsible: person, target, notes, details, photo: photo.photo }
    const invalid = validateActivity({ ...draft, gardenId, createdAt: new Date().toISOString(), photoIds: photo.photo ? ['pending-photo'] : [], validation: 'local-v1' }, plants)
    if (invalid) { setError(invalid); return }
    sending.current = true; setBusy(true); setError('')
    try { await onSave(draft) } catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo guardar la actividad.'); sending.current = false; setBusy(false) }
  }
  return <dialog ref={dialog} className="garden-journal-dialog" aria-labelledby="activity-title" onCancel={event => { event.preventDefault(); if (!busy) onClose() }}>
    <header><div><small>BITÁCORA DEL HUERTO REAL</small><h2 id="activity-title">Registrar actividad agrícola</h2></div><button type="button" autoFocus disabled={busy} aria-label="Cerrar actividad" onClick={onClose}>×</button></header>
    <form onSubmit={submit} aria-busy={busy}>
      <div className="journal-fields">
        <label>Actividad<select aria-label="Actividad" value={type} onChange={event => { setType(event.target.value as ActivityType); setDetails(event.target.value === 'harvest' ? { harvestMode: 'partial' } : {}); setError('') }}>{Object.entries(ACTIVITY_TYPES).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
        <label>Fecha de la actividad<input required type="date" value={date} max={localDate()} onChange={event => setDate(event.target.value)}/></label>
        <label>Persona responsable<input required minLength={2} maxLength={100} value={person} onChange={event => setPerson(event.target.value)}/></label>
        <label>Ubicación de la actividad<select aria-label="Ubicación de la actividad" value={targetId} onChange={event => setTargetId(event.target.value)}><option value="garden">Todo el huerto</option>{Array.from({ length: 6 }, (_, plot) => <option key={plot} value={'plot:' + plot}>Espacio {plot + 1}</option>)}{plants.filter(item => !item.archivedAt).map(item => <option key={item.id} value={'plant:' + item.id}>{item.name} · Espacio {item.plot + 1}</option>)}</select></label>
        {needsPlant && !plant && <div className="journal-wide journal-note"><p>Selecciona una planta registrada. Si todavía no existe, su fotografía y ficha se registran antes de documentar esta actividad.</p><button type="button" onClick={() => onRegister(target.kind === 'plot' ? target.plot : 0, type)}>Registrar planta en ese espacio</button></div>}
        {['watering', 'fertilizing', 'harvest'].includes(type) && <><label>Cantidad (opcional)<input type="number" min="0.001" max="1000000" step="any" value={details.quantity ?? ''} onChange={event => detail('quantity', event.target.value === '' ? undefined : Number(event.target.value))}/></label><label>Unidad<select aria-label="Unidad" value={details.unit ?? ''} onChange={event => detail('unit', event.target.value as ActivityDetails['unit'])}><option value="">Sin especificar</option>{['L', 'kg', 'g', 'unidades'].map(value => <option key={value} value={value}>{value}</option>)}</select></label></>}
        {type === 'watering' && <label className="journal-wide">Método utilizado (opcional)<input maxLength={100} value={details.method ?? ''} placeholder="Describe cómo regaste" onChange={event => detail('method', event.target.value)}/></label>}
        {type === 'fertilizing' && <label className="journal-wide">Abono utilizado (opcional)<input maxLength={100} value={details.material ?? ''} onChange={event => detail('material', event.target.value)}/></label>}
        {type === 'replanting' && <label>Espacio de destino<select aria-label="Espacio de destino" required value={details.destinationPlot ?? ''} onChange={event => detail('destinationPlot', Number(event.target.value))}><option value="" disabled>Elige un espacio libre</option>{Array.from({ length: 6 }, (_, plot) => <option key={plot} value={plot} disabled={plants.some(item => !item.archivedAt && item.plot === plot)}>Espacio {plot + 1}</option>)}</select></label>}
        {type === 'observation' && <><label>Estado observado<select aria-label="Estado observado" value={details.state ?? ''} onChange={event => detail('state', event.target.value ? event.target.value as PlantState : undefined)}><option value="">Sin cambio de estado</option>{Object.entries(PLANT_STATES).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label><label>Altura medida (cm, opcional)<input type="number" min="0" step="0.1" value={details.heightCm ?? ''} onChange={event => detail('heightCm', event.target.value === '' ? undefined : Number(event.target.value))}/></label></>}
        {type === 'harvest' && <><label>Tipo de cosecha<select aria-label="Tipo de cosecha" value={details.harvestMode ?? 'partial'} onChange={event => setDetails(current => ({ ...current, harvestMode: event.target.value as 'partial' | 'complete', releasePlot: false }))}><option value="partial">Parcial</option><option value="complete">Completa</option></select></label>{details.harvestMode === 'complete' && <label className="journal-check"><input type="checkbox" checked={details.releasePlot ?? false} onChange={event => detail('releasePlot', event.target.checked)}/>Archivar la ficha y liberar el espacio al guardar</label>}</>}
        <label className="journal-wide">Observaciones de la actividad<textarea maxLength={2000} value={notes} onChange={event => setNotes(event.target.value)}/></label>
        <label className="journal-wide">Evidencia fotográfica (opcional)<input type="file" accept="image/jpeg,image/png,image/webp" onChange={photo.choose}/></label>
      </div>
      <p className="journal-note">Registra una acción que realizaste en el huerto real. Guardado local en este navegador; la animación no es una verificación física ni sincroniza con otras personas.</p>
      {(error || photo.error) && <p role="alert" className="journal-error">{error || photo.error}</p>}
      <footer><button type="button" disabled={busy} onClick={onClose}>Cancelar</button><button type="submit" disabled={busy || photo.reading || Boolean(photo.error)}>{busy ? 'Guardando…' : 'Guardar actividad'}</button></footer>
    </form>
  </dialog>
}
