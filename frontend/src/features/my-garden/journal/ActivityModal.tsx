import { useEffect, useRef, useState, type FormEvent } from 'react'
import { type GardenPlant } from '../garden'
import { localDate, recordId } from '../plant-record'
import { useGardenDialog } from '../useGardenDialog'
import { useJournalPhoto } from './useJournalPhoto'
import { careApi } from '../../../services/api'
import {
  validateActivity,
  type ActivityDraft,
  type ActivityTarget,
  type ActivityType,
  type ActivityDetails,
  type GardenActivity,
} from './activities'
import '../garden-journal.css'

export const ALLOWED_MODAL_ACTIVITIES: Array<{ key: ActivityType; label: string }> = [
  { key: 'watering', label: 'Riego' },
  { key: 'fertilizing', label: 'Abonado' },
  { key: 'weeding', label: 'Limpieza y mantenimiento' },
  { key: 'hilling', label: 'Aporque' },
  { key: 'harvest', label: 'Cosecha' },
]

export default function ActivityModal({
  plants,
  gardenId,
  responsible,
  initialPlant,
  initialPlot,
  initialDate,
  initialActivityType,
  existingActivities,
  onSave,
  onRegister,
  onClose,
}: {
  plants: GardenPlant[]
  gardenId: string
  responsible: string
  initialPlant?: GardenPlant
  initialPlot?: number | null
  initialDate?: string
  initialActivityType?: ActivityType
  existingActivities?: GardenActivity[]
  onSave: (draft: ActivityDraft) => Promise<void>
  onRegister: (plot: number, type: ActivityType) => void
  onClose: () => void
}) {
  const dialog = useGardenDialog()
  const sending = useRef(false)
  const id = useRef(recordId('activity'))

  const initialType: ActivityType =
    initialActivityType && ALLOWED_MODAL_ACTIVITIES.some(a => a.key === initialActivityType)
      ? initialActivityType
      : 'watering'

  const [type, setType] = useState<ActivityType>(initialType)
  const [date, setDate] = useState(initialDate && initialDate <= localDate() ? initialDate : localDate())
  const person = responsible || 'Usuario activo'

  const [targetId, setTargetId] = useState(
    initialPlant
      ? 'plant:' + initialPlant.id
      : initialPlot != null
      ? 'plot:' + initialPlot
      : plants.length > 0 && !plants[0].archivedAt
      ? 'plant:' + plants[0].id
      : 'garden'
  )

  const [notes, setNotes] = useState('')
  const [details, setDetails] = useState<ActivityDetails>({})
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [confirmEarlyHarvest, setConfirmEarlyHarvest] = useState(false)
  const [growthData, setGrowthData] = useState<{ percentage: number; daysUntilHarvest: number; stage: string } | null>(null)

  const photo = useJournalPhoto()

  const plant = targetId.startsWith('plant:') ? plants.find(item => item.id === targetId.slice(6)) : undefined
  const target: ActivityTarget = plant
    ? { kind: 'plant', plantId: plant.id, plot: plant.plot }
    : targetId.startsWith('plot:')
    ? { kind: 'plot', plot: Number(targetId.slice(5)) }
    : { kind: 'garden' }

  // Cargar estado de crecimiento real de la planta para validar cosecha
  useEffect(() => {
    if (!plant?.id) {
      setGrowthData(null)
      return
    }
    let active = true
    careApi
      .getGrowth(plant.id)
      .then(g => {
        if (active && g) {
          setGrowthData({
            percentage: g.percentage,
            daysUntilHarvest: g.daysUntilHarvest,
            stage: g.stage,
          })
        }
      })
      .catch(() => {
        if (active) {
          const isMature = plant.state === 'mature'
          setGrowthData({
            percentage: isMature ? 90 : 45,
            daysUntilHarvest: isMature ? 0 : 15,
            stage: isMature ? 'Madura' : 'En crecimiento',
          })
        }
      })
    return () => {
      active = false
    }
  }, [plant?.id, plant?.state])

  // Validaciones de sobrecuidado según tipo de actividad
  const isOverWatered =
    type === 'watering' &&
    Boolean(plant) &&
    Boolean(
      existingActivities?.some(
        a => !a.voidedAt && a.type === 'watering' && a.target.kind === 'plant' && a.target.plantId === plant?.id && a.date === date
      )
    )

  const isOverFertilized =
    type === 'fertilizing' &&
    Boolean(plant) &&
    Boolean(
      existingActivities?.some(
        a => !a.voidedAt && a.type === 'fertilizing' && a.target.kind === 'plant' && a.target.plantId === plant?.id && a.date === date
      )
    )

  const isAlreadyWeeded =
    type === 'weeding' &&
    Boolean(plant) &&
    Boolean(
      existingActivities?.some(a => {
        if (a.voidedAt || a.target.kind !== 'plant' || a.target.plantId !== plant?.id) return false
        if (a.type !== 'weeding') return false
        const diffDays = Math.abs((new Date(date).getTime() - new Date(a.date).getTime()) / (1000 * 3600 * 24))
        return diffDays < 7
      })
    )

  const isAlreadyHilled =
    type === 'hilling' &&
    Boolean(plant) &&
    Boolean(
      existingActivities?.some(a => {
        if (a.voidedAt || a.target.kind !== 'plant' || a.target.plantId !== plant?.id) return false
        if (a.type !== 'hilling') return false
        const diffDays = Math.abs((new Date(date).getTime() - new Date(a.date).getTime()) / (1000 * 3600 * 24))
        return diffDays < 7
      })
    )

  const isPlantReady = (growthData?.percentage ?? 100) >= 75
  const isEarlyHarvest = type === 'harvest' && Boolean(plant) && !isPlantReady

  function detail<K extends keyof ActivityDetails>(key: K, value: ActivityDetails[K]) {
    setDetails(current => ({ ...current, [key]: value }))
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (sending.current || photo.reading || photo.error) return

    if (isOverWatered) {
      setError('⚠️ Esta planta ya cuenta con suficiente humedad y un riego registrado en la fecha indicada. Regar en exceso daña sus raíces.')
      return
    }
    if (isOverFertilized) {
      setError('⚠️ Esta planta ya tiene un abonado registrado recientemente. Abonar con demasiada frecuencia puede quemar sus raíces.')
      return
    }
    if (isAlreadyWeeded) {
      setError('⚠️ La planta ya se encuentra con limpieza y mantenimiento al día. Realizarlo con demasiada frecuencia puede estresar el cultivo.')
      return
    }
    if (isAlreadyHilled) {
      setError('⚠️ La planta ya cuenta con aporque reciente en su base. El exceso de aporque puede compactar la tierra o cubrir tallos tiernos.')
      return
    }
    if (isEarlyHarvest && !confirmEarlyHarvest) {
      setError('⚠️ Confirma que deseas realizar la cosecha anticipada antes de guardar.')
      return
    }

    const draft: ActivityDraft = {
      id: id.current,
      type,
      date,
      responsible: person,
      target,
      notes,
      details,
      photo: photo.photo,
    }

    const invalid = validateActivity(
      {
        ...draft,
        gardenId,
        createdAt: new Date().toISOString(),
        photoIds: photo.photo ? ['pending-photo'] : [],
        validation: 'local-v1',
      },
      plants
    )

    if (invalid) {
      setError(invalid)
      return
    }

    sending.current = true
    setBusy(true)
    setError('')

    try {
      await onSave(draft)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo guardar la actividad.')
      sending.current = false
      setBusy(false)
    }
  }

  return (
    <dialog
      ref={dialog}
      className="garden-journal-dialog"
      aria-labelledby="activity-title"
      onCancel={event => {
        event.preventDefault()
        if (!busy) onClose()
      }}
    >
      <header>
        <div>
          <small>BITÁCORA DEL HUERTO REAL</small>
          <h2 id="activity-title">Registrar actividad agrícola</h2>
        </div>
        <button type="button" autoFocus disabled={busy} aria-label="Cerrar actividad" onClick={onClose}>
          ×
        </button>
      </header>

      <form onSubmit={submit} aria-busy={busy}>
        <div className="journal-fields">
          <label>
            Actividad
            <select
              aria-label="Actividad"
              value={type}
              onChange={event => {
                const nextType = event.target.value as ActivityType
                setType(nextType)
                setDetails(nextType === 'harvest' ? { harvestMode: 'partial' } : {})
                setConfirmEarlyHarvest(false)
                setError('')
              }}
            >
              {ALLOWED_MODAL_ACTIVITIES.map(item => (
                <option key={item.key} value={item.key}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Fecha de la actividad
            <input required type="date" value={date} max={localDate()} onChange={event => setDate(event.target.value)} />
          </label>

          <label>
            Persona responsable
            <input
              required
              minLength={2}
              maxLength={100}
              value={person}
              readOnly
              title="Usuario activo en esta sesión"
              style={{ background: '#f7fafc', cursor: 'not-allowed', color: '#4a5568' }}
            />
          </label>

          <label>
            Ubicación de la actividad
            <select
              aria-label="Ubicación de la actividad"
              value={targetId}
              onChange={event => {
                setTargetId(event.target.value)
                setConfirmEarlyHarvest(false)
                setError('')
              }}
            >
              <option value="garden">Todo el huerto</option>
              {Array.from({ length: 6 }, (_, plot) => (
                <option key={plot} value={'plot:' + plot}>
                  Espacio {plot + 1}
                </option>
              ))}
              {plants
                .filter(item => !item.archivedAt)
                .map(item => (
                  <option key={item.id} value={'plant:' + item.id}>
                    {item.name} · Espacio {item.plot + 1}
                  </option>
                ))}
            </select>
          </label>

          {/* Banners informativos de sobrecuidado */}
          {isOverWatered && (
            <div
              className="journal-wide"
              style={{
                background: '#fff5f5',
                border: '1px solid #feb2b2',
                color: '#9b2c2c',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '0.88rem',
              }}
            >
              ⚠️ Esta planta ya tiene un riego registrado en la fecha seleccionada ({date}). Regar en exceso puede causar asfixia radicular y pudrir sus raíces.
            </div>
          )}

          {isOverFertilized && (
            <div
              className="journal-wide"
              style={{
                background: '#fffaf0',
                border: '1px solid #fbd38d',
                color: '#9c4221',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '0.88rem',
              }}
            >
              ⚠️ Esta planta ya tiene un abonado registrado en la fecha seleccionada ({date}). Abonar con demasiada frecuencia puede quemar sus raíces.
            </div>
          )}

          {isAlreadyWeeded && (
            <div
              className="journal-wide"
              style={{
                background: '#f0fff4',
                border: '1px solid #9ae6b4',
                color: '#22543d',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '0.88rem',
              }}
            >
              🌿 La planta ya se encuentra con limpieza y mantenimiento al día. Realizarlo con demasiada frecuencia puede estresar el cultivo.
            </div>
          )}

          {isAlreadyHilled && (
            <div
              className="journal-wide"
              style={{
                background: '#fffff0',
                border: '1px solid #faf089',
                color: '#744210',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '0.88rem',
              }}
            >
              ⛰️ La planta ya cuenta con aporque reciente en su base. El exceso de aporque puede compactar la tierra o cubrir tallos tiernos.
            </div>
          )}

          {/* Alerta de Cosecha Anticipada */}
          {isEarlyHarvest && (
            <div
              className="journal-wide"
              style={{
                background: '#fffaf0',
                border: '2px solid #dd6b20',
                color: '#7b341e',
                padding: '12px 14px',
                borderRadius: '8px',
                fontSize: '0.9rem',
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: '6px' }}>
                🌾 La planta aún no se encuentra lista para ser cosechada (Progreso actual: {growthData?.percentage ?? 0}%, faltan aprox. {growthData?.daysUntilHarvest ?? 'unos'} días según el sistema).
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginTop: '6px' }}>
                <input
                  type="checkbox"
                  checked={confirmEarlyHarvest}
                  onChange={e => {
                    setConfirmEarlyHarvest(e.target.checked)
                    setError('')
                  }}
                />
                <span>¿Estás seguro de cosecharla anticipadamente? (La barra de progreso se reiniciará a un nuevo ciclo de rebrote).</span>
              </label>
            </div>
          )}

          {type === 'harvest' && !plant && (
            <div className="journal-wide journal-note">
              <p>Selecciona una planta registrada para documentar la cosecha.</p>
              <button type="button" onClick={() => onRegister(target.kind === 'plot' ? target.plot : 0, type)}>
                Registrar planta en ese espacio
              </button>
            </div>
          )}

          {['watering', 'fertilizing', 'harvest'].includes(type) && (
            <>
              <label>
                Cantidad (opcional)
                <input
                  type="number"
                  min="0.001"
                  max="1000000"
                  step="any"
                  value={details.quantity ?? ''}
                  onChange={event => detail('quantity', event.target.value === '' ? undefined : Number(event.target.value))}
                />
              </label>
              <label>
                Unidad
                <select
                  aria-label="Unidad"
                  value={details.unit ?? ''}
                  onChange={event => detail('unit', event.target.value as ActivityDetails['unit'])}
                >
                  <option value="">Sin especificar</option>
                  {['L', 'kg', 'g', 'unidades'].map(value => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </label>
            </>
          )}

          {type === 'watering' && (
            <label className="journal-wide">
              Método utilizado (opcional)
              <input
                maxLength={100}
                value={details.method ?? ''}
                placeholder="Describe cómo regaste"
                onChange={event => detail('method', event.target.value)}
              />
            </label>
          )}

          {type === 'fertilizing' && (
            <label className="journal-wide">
              Abono utilizado (opcional)
              <input
                maxLength={100}
                value={details.material ?? ''}
                placeholder="Describe el abono o compost utilizado"
                onChange={event => detail('material', event.target.value)}
              />
            </label>
          )}

          {type === 'harvest' && (
            <>
              <label>
                Tipo de cosecha
                <select
                  aria-label="Tipo de cosecha"
                  value={details.harvestMode ?? 'partial'}
                  onChange={event =>
                    setDetails(current => ({
                      ...current,
                      harvestMode: event.target.value as 'partial' | 'complete',
                      releasePlot: false,
                    }))
                  }
                >
                  <option value="partial">Parcial (conserva la planta para rebrote)</option>
                  <option value="complete">Completa (cosecha total)</option>
                </select>
              </label>
              {details.harvestMode === 'complete' && (
                <label className="journal-check">
                  <input
                    type="checkbox"
                    checked={details.releasePlot ?? false}
                    onChange={event => detail('releasePlot', event.target.checked)}
                  />
                  Archivar la ficha y liberar el espacio al guardar
                </label>
              )}
            </>
          )}

          <label className="journal-wide">
            Observaciones de la actividad
            <textarea maxLength={2000} value={notes} onChange={event => setNotes(event.target.value)} />
          </label>

          <label className="journal-wide">
            Evidencia fotográfica (opcional)
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={photo.choose} />
          </label>
        </div>

        <p className="journal-note">
          Registra una acción que realizaste en el huerto real. Guardado y sincronizado con tu progreso en Kawsapacha.
        </p>

        {(error || photo.error) && <p role="alert" className="journal-error">{error || photo.error}</p>}

        <footer>
          <button type="button" disabled={busy} onClick={onClose}>
            Cancelar
          </button>
          <button
            type="submit"
            disabled={
              busy ||
              photo.reading ||
              Boolean(photo.error) ||
              isOverWatered ||
              isOverFertilized ||
              isAlreadyWeeded ||
              isAlreadyHilled ||
              (isEarlyHarvest && !confirmEarlyHarvest)
            }
          >
            {busy ? 'Guardando…' : 'Guardar actividad'}
          </button>
        </footer>
      </form>
    </dialog>
  )
}
