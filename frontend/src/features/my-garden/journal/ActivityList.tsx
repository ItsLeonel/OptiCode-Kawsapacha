import { useState, type FormEvent } from 'react'
import type { GardenPlant } from '../garden'
import { ACTIVITY_TYPES, type GardenActivity } from './activities'

export default function ActivityList({ activities, plants, onSelect, onVoid }: { activities: readonly GardenActivity[]; plants: readonly GardenPlant[]; onSelect?: (plant: GardenPlant) => void; onVoid?: (id: string, reason: string) => Promise<void> }) {
  const [reason, setReason] = useState<Record<string, string>>({}), [error, setError] = useState(''), [busy, setBusy] = useState('')
  async function cancel(event: FormEvent, activity: GardenActivity) {
    event.preventDefault(); if (!onVoid || busy) return
    setError(''); setBusy(activity.id)
    try { await onVoid(activity.id, reason[activity.id] ?? '') } catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo anular el registro.') } finally { setBusy('') }
  }
  if (!activities.length) return <p>No hay actividades registradas para esta selección.</p>
  return <div className="journal-activity-list">{error && <p role="alert" className="journal-error">{error}</p>}{[...activities].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)).map(activity => {
    const target = activity.target, plant = target.kind === 'plant' ? plants.find(item => item.id === target.plantId) : undefined
    return <details key={activity.id} className="journal-activity" data-activity-id={activity.id} data-voided={Boolean(activity.voidedAt)}>
      <summary><strong>{ACTIVITY_TYPES[activity.type]}</strong><span>{activity.date} · {activity.responsible}{activity.voidedAt ? ' · Anulada' : ''}</span></summary>
      <div className="journal-activity-body">
        <p>{target.kind === 'garden' ? 'Todo el huerto' : `${plant?.name ?? 'Espacio de cultivo'} · Espacio ${target.plot + 1} al registrar la actividad`}</p>
        {activity.notes && <p className="journal-observations">{activity.notes}</p>}
        <dl>{activity.details.method && <div><dt>Método</dt><dd>{activity.details.method}</dd></div>}{activity.details.material && <div><dt>Abono</dt><dd>{activity.details.material}</dd></div>}{activity.details.quantity !== undefined && <div><dt>Cantidad</dt><dd>{activity.details.quantity} {activity.details.unit}</dd></div>}{activity.details.heightCm !== undefined && <div><dt>Altura medida</dt><dd>{activity.details.heightCm} cm</dd></div>}{activity.details.destinationPlot !== undefined && <div><dt>Destino del replante</dt><dd>Espacio {activity.details.destinationPlot + 1}</dd></div>}{activity.details.sourceHarvestId && <div><dt>Lote de origen</dt><dd>{activity.details.sourceHarvestId}</dd></div>}{activity.details.sowingMaterial && <div><dt>Material de siembra</dt><dd>{({seed:'Semillas',stake:'Estacas',cutting:'Esquejes',seedling:'Plántulas'} as Record<string,string>)[activity.details.sowingMaterial]}</dd></div>}{activity.details.groundTechnique && <div><dt>Técnica</dt><dd>{({furrows:'Surcos',beds:'Camadas',raisedBeds:'Camellones',terraces:'Terrazas'} as Record<string,string>)[activity.details.groundTechnique]}</dd></div>}{activity.details.labelCommonName && <div><dt>Nombre de etiqueta</dt><dd>{activity.details.labelCommonName}</dd></div>}{activity.details.labelScientificName && <div><dt>Nombre científico</dt><dd>{activity.details.labelScientificName}</dd></div>}{activity.details.labelUse && <div><dt>Uso consignado</dt><dd>{activity.details.labelUse}</dd></div>}{activity.details.labelWarnings && <div><dt>Contraindicaciones consignadas</dt><dd>{activity.details.labelWarnings}</dd></div>}{activity.details.labelDose && <div><dt>Referencia de dosificación</dt><dd>{activity.details.labelDose}</dd></div>}{activity.details.traditionalType && <div><dt>Clasificación declarada</dt><dd>{activity.details.traditionalType === 'hot' ? 'Caliente' : activity.details.traditionalType === 'cool' ? 'Fresca' : 'No documentada'}</dd></div>}{activity.details.packagedOn && <div><dt>Empaquetado</dt><dd>{activity.details.packagedOn}</dd></div>}{activity.details.expiryDate && <div><dt>Caducidad declarada</dt><dd>{activity.details.expiryDate}</dd></div>}{activity.details.storageLocation && <div><dt>Bodega</dt><dd>{activity.details.storageLocation}</dd></div>}{activity.details.harvestMode && <div><dt>Cosecha</dt><dd>{activity.details.harvestMode === 'complete' ? 'Completa' : 'Parcial'}{activity.details.releasePlot ? ' · Espacio liberado' : ''}</dd></div>}</dl>
        {activity.photos?.map((photo, index) => <img key={activity.photoIds[index]} src={photo} loading="lazy" alt={`Evidencia de ${ACTIVITY_TYPES[activity.type]} del ${activity.date}`}/>)}
        {plant && onSelect && <button type="button" onClick={() => onSelect(plant)}>Abrir Pasaporte Vivo</button>}
        <p className="journal-note">Registro local aportado por {activity.responsible}. No cuenta con verificación de un servidor.</p>
        {activity.voidedAt ? <p className="journal-note">Anulada el {activity.voidedAt.slice(0, 10)}: {activity.voidReason}. La evidencia se conserva.</p> : onVoid && <form onSubmit={event => cancel(event, activity)} className="journal-void-form"><label>Motivo de anulación<input required minLength={5} maxLength={300} value={reason[activity.id] ?? ''} onChange={event => setReason(current => ({ ...current, [activity.id]: event.target.value }))}/></label><button type="submit" disabled={Boolean(busy)}>Anular registro conservando evidencia</button></form>}
      </div>
    </details>
  })}</div>
}
