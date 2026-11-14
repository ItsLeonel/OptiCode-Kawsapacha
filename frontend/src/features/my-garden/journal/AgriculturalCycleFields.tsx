import type { ActivityDetails, ActivityType, GardenActivity } from './activities'
import {
  HARVEST_PARTS, POSTHARVEST_STEPS, SOWING_METHODS,
  nextPostharvestStep, dryingElapsedDays, type PostHarvestStep,
} from './postharvest-cycle'

type Props = {
  type: ActivityType
  date: string
  details: ActivityDetails
  events: readonly GardenActivity[]
  busy: boolean
  onDetails: (next: ActivityDetails) => void
}

export default function AgriculturalCycleFields({ type, date, details, events, busy, onDetails }: Props) {
  const set = <K extends keyof ActivityDetails>(key: K, value: ActivityDetails[K]) => {
    onDetails({ ...details, [key]: value })
  }
  const harvests = events.filter(x => x.type === 'harvest' && !x.voidedAt).sort((a, b) => b.date.localeCompare(a.date))
  const selectedHarvest = harvests.find(x => x.id === details.sourceHarvestId)
  const next = selectedHarvest ? nextPostharvestStep(events, selectedHarvest.id) : null
  const step = details.postharvestStep
  const field = 'activity-garden-field'
  return <>
    {type === 'preparation' && <label className={field}><span>Preparación del terreno realizada</span>
      <select disabled={busy} aria-label="Método de preparación" value={details.method ?? ''} onChange={e => set('method', e.target.value || undefined)}>
        <option value="">No documentado</option>
        <option value="weeding">Retiro de maleza</option><option value="compost">Abono y reposo del suelo</option>
        <option value="furrows">Surcos</option><option value="beds">Camadas</option>
        <option value="raisedBeds">Camellones</option><option value="terraces">Terrazas</option>
        <option value="other">Otra labor documentada</option>
      </select>
      <small>Documenta el trabajo real y sus fechas; la aplicación no supone que el reposo de 15 días ya transcurrió.</small>
    </label>}
    {type === 'sowing' && <label className={field}><span>Método real de siembra</span>
      <select disabled={busy} aria-label="Método de siembra" value={details.sowingMethod ?? ''} onChange={e => set('sowingMethod', e.target.value ? e.target.value as ActivityDetails['sowingMethod'] : undefined)}>
        <option value="">No documentado</option>
        {Object.entries(SOWING_METHODS).map(([key, name]) => <option key={key} value={key}>{name}</option>)}
      </select>
    </label>}
    {type === 'harvest' && <label className={field}><span>Parte de la planta cosechada</span>
      <select disabled={busy} aria-label="Parte cosechada" value={details.harvestedPart ?? ''} onChange={e => set('harvestedPart', e.target.value ? e.target.value as ActivityDetails['harvestedPart'] : undefined)}>
        <option value="">No documentada</option>
        {Object.entries(HARVEST_PARTS).map(([key, name]) => <option key={key} value={key}>{name}</option>)}
      </select>
    </label>}
    {type === 'signage' && <label className={field}><span>Cualidad tradicional de la señalética</span>
      <select disabled={busy} aria-label="Clasificación tradicional" value={details.traditionalTemperature ?? 'unknown'} onChange={e => set('traditionalTemperature', e.target.value as ActivityDetails['traditionalTemperature'])}>
        <option value="unknown">Sin clasificación documentada</option><option value="hot">Caliente (rojo)</option><option value="cold">Fresca/fría (verde o blanco)</option>
      </select>
      <small>Debe estar respaldada por fuentes de la especie. No se deduce de la fotografía.</small>
    </label>}
    {['sowing_ritual','gratitude_ritual'].includes(type) && <p className="activity-garden-storage-note">
      Registra la práctica cultural realmente realizada, sus participantes y evidencias. Se respeta la diversidad de tradiciones de la comunidad.
    </p>}
    {type === 'postharvest' && <>
      <p className="activity-garden-storage-note">Poscosecha por etapas, vinculada a una cosecha real. Cada paso se registra por separado y no crea cantidades ni existencias automáticamente.</p>
      <label className={field}><span>Cosecha documentada de origen</span>
        <select required disabled={busy} aria-label="Cosecha de origen" value={details.sourceHarvestId ?? ''} onChange={e => {
          const id = e.target.value
          const step = nextPostharvestStep(events, id)
          onDetails({ sourceHarvestId: id, postharvestStep: step ?? undefined,
            method: step === 'drying-start' ? 'shade' : undefined, packageDate: step === 'packaging' ? date : undefined })
        }}>
          <option value="">Selecciona una cosecha</option>
          {harvests.map(h => <option key={h.id} value={h.id}>{h.date} · {h.target.kind === 'garden' ? 'Todo el huerto' : 'Espacio ' + (h.target.plot + 1)}</option>)}
        </select>
      </label>
      {!harvests.length && <p role="note" className="journal-error">Primero registra una cosecha real en la Bitácora.</p>}
      <label className={field}><span>Etapa actual de poscosecha</span>
        <select required disabled={busy || !selectedHarvest} aria-label="Etapa de poscosecha" value={step ?? ''} onChange={e => {
          const value = e.target.value as PostHarvestStep
          onDetails({ ...details, postharvestStep: value, method: value === 'drying-start' ? 'shade' : undefined,
            packageDate: value === 'packaging' ? date : undefined })
        }}>
          <option value="">Selecciona el siguiente paso</option>
          {next && <option value={next}>{POSTHARVEST_STEPS[next]}</option>}
        </select>
      </label>
      {step === 'drying-start' && <p className="activity-garden-storage-note">El documento del cliente recomienda secado a la sombra durante 10 a 15 días. Registra cuándo comenzó realmente.</p>}
      {step === 'drying-end' && selectedHarvest && <p className="activity-garden-storage-note">
        {(() => {
          const days = dryingElapsedDays(events, selectedHarvest.id, date)
          return days === null ? 'Primero documenta el inicio del secado.' : 'Días documentados desde el inicio: ' + days + '. Referencia orientativa: 10–15 días a la sombra.'
        })()}
      </p>}
      {step === 'packaging' && <>
        <label className={field}><span>Código de lote</span><input required maxLength={100} disabled={busy} value={details.batchCode ?? ''} onChange={e => set('batchCode', e.target.value)} placeholder="Ej. MAN-2026-01"/></label>
        <label className={field}><span>Fecha de empaquetado</span><input type="date" required max={date} disabled={busy} value={details.packageDate ?? ''} onChange={e => set('packageDate', e.target.value)}/></label>
        <label className={field}><span>Fecha de caducidad verificada</span><input type="date" required min={date} disabled={busy} value={details.expiryDate ?? ''} onChange={e => set('expiryDate', e.target.value)}/><small>No se calcula automáticamente ni se supone una vida útil sin verificar.</small></label>
        <label className={field}><span>Indicaciones, precauciones y contraindicaciones de la etiqueta</span><textarea rows={2} required maxLength={400} disabled={busy} value={details.storageLabel ?? ''} onChange={e => set('storageLabel', e.target.value)} placeholder="Texto de fuente validada; no indicar dosis sin aval profesional"/></label>
      </>}
      {step === 'storage' && <label className={field}><span>Ubicación real del lote en bodega</span><input required maxLength={180} disabled={busy} value={details.storagePlace ?? ''} onChange={e => set('storagePlace', e.target.value)} placeholder="Estante ventilado y seco"/></label>}
    </>}
  </>
}
