import { useEffect, useRef, useState, type DragEvent, type FormEvent } from 'react'
import GardenIcon from '../GardenIcon'
import { PLANT_STATES, type GardenPlant, type PlantState } from '../garden'
import { GROWTH_STAGES, type GrowthStage } from '../growth-stages'
import { localDate, recordId } from '../plant-record'
import { useGardenDialog } from '../useGardenDialog'
import { useJournalPhoto } from './useJournalPhoto'
import { usePlantVisualAnalysis } from '../usePlantVisualAnalysis'
import PlantVisualAnalysis from '../PlantVisualAnalysis'
import { careApi } from '../../../services/api'
import { PHOTO_ACCEPT } from '../../../shared/photo-validation'
import AgriculturalCycleFields from './AgriculturalCycleFields'
import { nextPostharvestStep } from './postharvest-cycle'
import {
  ACTIVITY_TYPES,
  validateActivity,
  type ActivityDraft,
  type ActivityTarget,
  type ActivityType,
  type ActivityDetails,
  type GardenActivity,
} from './activities'
import wateringArt from './activity-art/watering.png'
import sowingArt from './activity-art/sowing.png'
import fertilizingArt from './activity-art/fertilizing.png'
import harvestArt from './activity-art/harvest.png'
import '../garden-journal.css'
import './activity-modal-v2.css'

type Category = 'all' | 'cultivo' | 'cuidado' | 'seguimiento' | 'cosecha'

type ActivityCard = {
  short: string
  emoji: string
  art?: string
  category: Exclude<Category, 'all'>
}

const ACTIVITY_CARDS: Record<ActivityType, ActivityCard> = {
  watering: { emoji: '💧', art: wateringArt, short: 'Riego', category: 'cuidado' },
  sowing: { emoji: '🌱', art: sowingArt, short: 'Siembra', category: 'cultivo' },
  fertilizing: { emoji: '🪴', art: fertilizingArt, short: 'Abonado', category: 'cuidado' },
  observation: { emoji: '🔎', short: 'Seguimiento', category: 'seguimiento' },
  harvest: { emoji: '🧺', art: harvestArt, short: 'Cosecha', category: 'cosecha' },
  preparation: { emoji: '🌾', short: 'Preparación', category: 'cultivo' },
  weeding: { emoji: '🌿', short: 'Deshierbe', category: 'cuidado' },
  hilling: { emoji: '⛰️', short: 'Aporque', category: 'cultivo' },
  sowing_ritual: { emoji: '🌅', short: 'Ritual de siembra', category: 'cultivo' },
  gratitude_ritual: { emoji: '🌞', short: 'Ritual de gratitud', category: 'cosecha' },
  signage: { emoji: '🏷️', short: 'Señalética', category: 'cultivo' },
  postharvest: { emoji: '📦', short: 'Poscosecha', category: 'cosecha' },
}

const FEATURED: ActivityType[] = ['watering', 'sowing', 'fertilizing', 'observation', 'harvest']

const CATEGORIES: { id: Category; label: string; symbol: string }[] = [
  { id: 'all', label: 'Todas', symbol: '✦' },
  { id: 'cultivo', label: 'Cultivo', symbol: '🌱' },
  { id: 'cuidado', label: 'Cuidados', symbol: '🍃' },
  { id: 'seguimiento', label: 'Crecimiento', symbol: '🌿' },
  { id: 'cosecha', label: 'Cosecha', symbol: '🧺' },
]

export default function ActivityModal({
  plants,
  gardenId,
  responsible,
  initialPlant,
  initialPlot,
  initialDate,
  initialActivityType,
  existingActivities = [],
  onSave,
  onRegister,
  onClose,
  growthStageEnabled = true,
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
  growthStageEnabled?: boolean
}) {
  const dialog = useGardenDialog()
  const sending = useRef(false)
  const id = useRef(recordId('activity'))
  const galleryRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)

  const initialType =
    initialActivityType && Object.hasOwn(ACTIVITY_TYPES, initialActivityType)
      ? initialActivityType
      : 'watering'

  const [type, setType] = useState<ActivityType>(initialType)
  const [date, setDate] = useState(initialDate && initialDate <= localDate() ? initialDate : localDate())
  const [person, setPerson] = useState(responsible)
  const [targetId, setTargetId] = useState(() => {
    if (initialPlant) return `plant:${initialPlant.id}`
    if (initialPlot != null) {
      const occupant = plants.find(item => !item.archivedAt && item.plot === initialPlot)
      return occupant ? `plant:${occupant.id}` : `plot:${initialPlot}`
    }
    return 'garden'
  })
  const [showTargetPicker, setShowTargetPicker] = useState(false)
  const [category, setCategory] = useState<Category>('all')
  const [showMore, setShowMore] = useState(false)
  const [notes, setNotes] = useState('')
  const [details, setDetails] = useState<ActivityDetails>(
    initialType === 'harvest' ? { harvestMode: 'partial' } : {}
  )
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [previewUrl, setPreviewUrl] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [confirmEarlyHarvest, setConfirmEarlyHarvest] = useState(false)
  const [growthData, setGrowthData] = useState<{ percentage: number; daysUntilHarvest: number; stage: string } | null>(null)

  const photo = useJournalPhoto()
  const analysis = usePlantVisualAnalysis(photo.photo)

  const harvests = existingActivities.filter(item => item.type === 'harvest' && !item.voidedAt).sort((a, b) => b.date.localeCompare(a.date))
  const selectedHarvest = harvests.find(item => item.id === details.sourceHarvestId)
  const plant = targetId.startsWith('plant:') ? plants.find(item => item.id === targetId.slice(6)) : undefined
  const originalTarget: ActivityTarget = plant
    ? { kind: 'plant', plantId: plant.id, plot: plant.plot }
    : targetId.startsWith('plot:')
      ? { kind: 'plot', plot: Number(targetId.slice(5)) }
      : { kind: 'garden' }
  const target: ActivityTarget = type === 'postharvest' && selectedHarvest
    ? selectedHarvest.target.kind === 'garden' ? { kind: 'garden' } : { kind: 'plot', plot: selectedHarvest.target.plot }
    : originalTarget

  // La ocupación física de la parcela sí impide una segunda siembra o preparación.
  const plantInPlot = target.kind === 'plot'
    ? plants.find(p => p.plot === target.plot && !p.archivedAt)
    : undefined
  const effectivePlant = plant || plantInPlot
  const isSpaceBlockedForNewPlantOrPrep = Boolean(
    effectivePlant && (type === 'sowing' || type === 'preparation')
  )

  const needsPlant = ['sowing', 'hilling', 'observation', 'harvest', 'signage'].includes(type)
  const types =
    category === 'all'
      ? FEATURED.includes(type)
        ? FEATURED
        : [...FEATURED.slice(0, 4), type]
      : (Object.keys(ACTIVITY_TYPES) as ActivityType[]).filter(item => ACTIVITY_CARDS[item].category === category)
  const extraTypes = (Object.keys(ACTIVITY_TYPES) as ActivityType[]).filter(item => !FEATURED.includes(item))

  useEffect(() => {
    if (!photo.photo) {
      setPreviewUrl('')
      return
    }
    const url = URL.createObjectURL(photo.photo)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [photo.photo])

  // Cargar estado de crecimiento real de la planta para validar cosecha (solo con sesión autenticada en servidor)
  useEffect(() => {
    const hasToken = typeof window !== 'undefined' && Boolean(window.localStorage.getItem('kawsapacha_token'))
    if (!plant?.id || !hasToken || plant.id.startsWith('plant-')) {
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
          setGrowthData(null)
        }
      })
    return () => {
      active = false
    }
  }, [plant?.id, plant?.state])

  // Validaciones de sobrecuidado: cuentan los registros no invalidados del día.
  const isOverWatered =
    type === 'watering' &&
    Boolean(plant) &&
    Boolean(
      existingActivities?.some(
        a => !a.voidedAt && a.reviewStatus !== 'REJECTED' && a.type === 'watering' && a.target.kind === 'plant' && a.target.plantId === plant?.id && a.date === date
      )
    )

  const isOverFertilized =
    type === 'fertilizing' &&
    Boolean(plant) &&
    Boolean(
      existingActivities?.some(
        a => !a.voidedAt && a.reviewStatus !== 'REJECTED' && a.type === 'fertilizing' && a.target.kind === 'plant' && a.target.plantId === plant?.id && a.date === date
      )
    )

  const isPlantReady = (growthData?.percentage ?? 100) >= 75
  const isEarlyHarvest = type === 'harvest' && Boolean(plant) && !isPlantReady

  function chooseType(next: ActivityType) {
    setType(next)
    if (next === 'harvest') setDetails({ harvestMode: 'partial' })
    else if (next === 'postharvest') {
      const first = harvests[0]
      const step = first ? nextPostharvestStep(existingActivities, first.id) : null
      setDetails(first ? {
        sourceHarvestId: first.id,
        postharvestStep: step ?? undefined,
        method: step === 'drying-start' ? 'shade' : undefined,
        packageDate: step === 'packaging' ? date : undefined,
      } : {})
    } else setDetails({})
    setConfirmEarlyHarvest(false)
    setError('')
  }

  function chooseCategory(next: Category) {
    setShowMore(false)
    setCategory(next)
    if (next !== 'all') {
      const candidate = (Object.keys(ACTIVITY_TYPES) as ActivityType[]).find(
        item => ACTIVITY_CARDS[item].category === next
      )
      if (candidate && ACTIVITY_CARDS[type].category !== next) chooseType(candidate)
    }
  }

  function detail<K extends keyof ActivityDetails>(key: K, value: ActivityDetails[K]) {
    setDetails(current => ({ ...current, [key]: value }))
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setDragOver(false)
    if (!busy && !photo.reading && event.dataTransfer.files.length) {
      void photo.chooseFile(event.dataTransfer.files[0])
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (sending.current || photo.reading || photo.error || (type === 'observation' && analysis.status === 'analyzing')) return

    if (isOverWatered) {
      setError('⚠️ Esta planta ya cuenta con un riego registrado en la fecha indicada. Regar en exceso daña sus raíces.')
      return
    }
    if (isOverFertilized) {
      setError('⚠️ Esta planta ya tiene un abonado registrado recientemente. Abonar con demasiada frecuencia puede quemar sus raíces.')
      return
    }
    if (isEarlyHarvest && !confirmEarlyHarvest) {
      setError('⚠️ Confirma que deseas realizar la cosecha anticipada antes de guardar.')
      return
    }
    if (isSpaceBlockedForNewPlantOrPrep) {
      setError(`⚠️ El Espacio ${(effectivePlant?.plot ?? 0) + 1} ya está ocupado por «${effectivePlant?.name ?? 'una planta'}». Elige un espacio disponible para realizar esta acción.`)
      return
    }
    const observedDetails = type === 'observation' && analysis.status === 'ready' && analysis.profile
      ? { ...details, visualProfile: analysis.profile }
      : details

    const draft: ActivityDraft = {
      id: id.current,
      type,
      date,
      responsible: person,
      target,
      notes,
      details: observedDetails,
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
      plants,
      existingActivities
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
      setSubmitted(true)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo guardar la actividad.')
      sending.current = false
      setBusy(false)
    }
  }

  return (
    <dialog
      ref={dialog}
      className="garden-journal-dialog activity-garden-modal"
      aria-labelledby="activity-title"
      onCancel={event => {
        event.preventDefault()
        if (!busy) onClose()
      }}
    >
      <header className="activity-garden-header">
        <div className="activity-garden-header-mark" aria-hidden="true">
          <GardenIcon name="book" />
        </div>
        <div className="activity-garden-header-text">
          <small>KAWSAPACHA · MI HUERTO VIVO</small>
          <h2 id="activity-title">Registrar actividad</h2>
          <p>Registra el cuidado de tus plantas y mantén vivo tu huerto.</p>
        </div>
        <span className="activity-garden-header-moon" aria-hidden="true">
          ☾
        </span>
        <button
          type="button"
          autoFocus
          disabled={busy}
          className="activity-garden-close"
          aria-label="Cerrar registro"
          onClick={onClose}
        >
          ×
        </button>
      </header>

      {submitted ? (
        <div className="activity-submitted-notice" style={{ padding: '36px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: '3.2rem', marginBottom: '14px' }}>🕐</div>
          <h3 style={{ margin: '0 0 10px', color: '#276749', fontSize: '1.4rem', fontWeight: 700 }}>
            Actividad registrada
          </h3>
          <p style={{ margin: '0 auto 24px', maxWidth: '440px', color: '#4a5568', fontSize: '0.98rem', lineHeight: '1.6' }}>
            Tu actividad ya forma parte de la Bitácora. Las Semillas de vida elegibles se acreditan al registrarla.
            El MSP puede comprobar la evidencia posteriormente e invalidar registros incorrectos.
          </p>
          <button
            type="button"
            className="garden-solid-button"
            onClick={onClose}
            style={{ margin: '0 auto', padding: '10px 28px', fontSize: '1rem', borderRadius: '10px', fontWeight: 600 }}
          >
            Entendido
          </button>
        </div>
      ) : (
        <form onSubmit={submit} aria-busy={busy} className="activity-garden-form">
          <section className="activity-garden-plant-section" aria-label="Planta o lugar de la actividad">
            <div className="activity-garden-section-label">
              <GardenIcon name="seed" /> Planta seleccionada
            </div>
            <div className="activity-garden-plant-card">
              {plant?.photo ? (
                <img src={plant.photo} alt={`Fotografía de ${plant.name}`} />
              ) : (
                <span className="activity-garden-plant-placeholder" aria-hidden="true">
                  🌿
                </span>
              )}
              <div className="activity-garden-plant-details">
                <strong>
                  {effectivePlant ? effectivePlant.name : target.kind === 'plot' ? `Espacio ${target.plot + 1}` : 'Todo el huerto'}
                </strong>
                <span>
                  {effectivePlant
                    ? effectivePlant.latin || `Espacio ${effectivePlant.plot + 1}`
                    : target.kind === 'plot'
                      ? 'Espacio disponible'
                      : 'Puedes seleccionar un espacio o planta.'}
                </span>
                {effectivePlant && (
                  <small>
                    <GardenIcon name="leaf" /> {`Planta vinculada · Espacio ${effectivePlant.plot + 1}`}
                  </small>
                )}
              </div>
              <button
                type="button"
                className="activity-garden-change"
                disabled={busy || type === 'postharvest'}
                aria-expanded={showTargetPicker}
                onClick={() => setShowTargetPicker(current => !current)}
              >
                <GardenIcon name="seed" /> {plant ? 'Cambiar planta' : 'Elegir ubicación'}
              </button>
            </div>
            {showTargetPicker && (
              <div className="activity-garden-picker-popover">
                <label className="activity-garden-field activity-garden-target">
                  <span>Planta o ubicación</span>
                  <select
                    aria-label="Ubicación de la actividad"
                    autoFocus
                    value={targetId}
                    onChange={event => {
                      setTargetId(event.target.value)
                      setError('')
                      setShowTargetPicker(false)
                    }}
                    disabled={busy}
                  >
                    <option value="garden">Todo el huerto</option>
                    {Array.from({ length: 6 }, (_, plot) => {
                      const occupant = plants.find(item => !item.archivedAt && item.plot === plot)
                      if (occupant) {
                        return (
                          <option key={plot} value={`plant:${occupant.id}`}>
                            {occupant.name} · Espacio {plot + 1}
                          </option>
                        )
                      }
                      return (
                        <option key={plot} value={`plot:${plot}`}>
                          Espacio {plot + 1} (Disponible)
                        </option>
                      )
                    })}
                  </select>
                </label>
                <button
                  type="button"
                  className="activity-garden-picker-done"
                  onClick={() => setShowTargetPicker(false)}
                >
                  Cerrar
                </button>
              </div>
            )}
            {needsPlant && !effectivePlant && (
              <div className="activity-garden-attention" role="note">
                <span>Esta actividad necesita una planta registrada.</span>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    const firstFreePlot = Array.from({ length: 6 }, (_, idx) => idx).find(
                      idx => !plants.some(p => !p.archivedAt && p.plot === idx)
                    ) ?? 0
                    onRegister(target.kind === 'plot' ? target.plot : firstFreePlot, type)
                  }}
                >
                  Registrar planta
                </button>
              </div>
            )}
            {isSpaceBlockedForNewPlantOrPrep && (
              <div
                style={{
                  marginTop: '10px',
                  background: '#fef2f2',
                  border: '2px solid #f87171',
                  color: '#991b1b',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  fontSize: '0.86rem',
                }}
              >
                <strong>⚠️ Espacio {(effectivePlant?.plot ?? 0) + 1} ocupado:</strong>
                <div style={{ marginTop: '2px', fontSize: '0.82rem', fontWeight: 400 }}>
                  Ya existe una planta activa («{effectivePlant?.name}») en este espacio. Selecciona otro espacio disponible.
                </div>
              </div>
            )}
          </section>

          <section className="activity-garden-choose" aria-label="Selecciona la actividad realizada">
            <div className="activity-garden-section-label">
              <GardenIcon name="seed" /> Actividad realizada
            </div>
            <div className="activity-garden-cards">
              {types.map(item => (
                <button
                  type="button"
                  key={item}
                  className="activity-garden-card"
                  data-selected={type === item}
                  aria-pressed={type === item}
                  disabled={busy}
                  title={ACTIVITY_TYPES[item]}
                  onClick={() => chooseType(item)}
                >
                  {type === item && <span className="activity-garden-card-check" aria-hidden="true">✓</span>}
                  <span className="activity-garden-card-icon" aria-hidden="true">
                    {ACTIVITY_CARDS[item].art ? (
                      <img src={ACTIVITY_CARDS[item].art} alt="" />
                    ) : (
                      <span>{ACTIVITY_CARDS[item].emoji}</span>
                    )}
                  </span>
                  <span>{ACTIVITY_CARDS[item].short}</span>
                </button>
              ))}
              {category === 'all' && (
                <button
                  type="button"
                  className="activity-garden-card activity-garden-more"
                  aria-expanded={showMore}
                  disabled={busy}
                  onClick={() => setShowMore(current => !current)}
                >
                  <span className="activity-garden-card-icon" aria-hidden="true">
                    •••
                  </span>
                  <span>{showMore ? 'Cerrar' : 'Otras'}</span>
                </button>
              )}
            </div>
            {showMore && category === 'all' && (
              <div className="activity-garden-extra-picker" role="group" aria-label="Otras actividades agrícolas">
                {extraTypes.map(item => (
                  <button
                    type="button"
                    key={item}
                    disabled={busy}
                    onClick={() => {
                      chooseType(item)
                      setShowMore(false)
                    }}
                  >
                    <span aria-hidden="true">{ACTIVITY_CARDS[item].emoji}</span> {ACTIVITY_TYPES[item]}
                  </button>
                ))}
              </div>
            )}
            <div className="activity-garden-categories" aria-label="Filtrar actividades por categoría">
              {CATEGORIES.map(item => (
                <button
                  key={item.id}
                  type="button"
                  data-active={category === item.id}
                  aria-pressed={category === item.id}
                  disabled={busy}
                  onClick={() => chooseCategory(item.id)}
                >
                  {item.symbol} {item.label}
                </button>
              ))}
            </div>
          </section>

          {isEarlyHarvest && (
            <div
              style={{
                margin: '12px 0',
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

          <div className="activity-garden-input-grid">
            <label className="activity-garden-field activity-garden-field-date">
              <span>
                <span aria-hidden="true">📅</span> Fecha de la actividad
              </span>
              <input
                type="date"
                required
                value={date}
                max={localDate()}
                disabled={busy}
                onChange={event => setDate(event.target.value)}
              />
            </label>
            <label className="activity-garden-field activity-garden-field-person">
              <span>
                <span aria-hidden="true">👤</span> Responsable
              </span>
              <input
                type="text"
                required
                minLength={2}
                maxLength={100}
                value={person}
                disabled={busy}
                onChange={event => setPerson(event.target.value)}
                placeholder="Persona responsable"
              />
            </label>
            {['watering', 'fertilizing', 'harvest', 'postharvest'].includes(type) && (
              <>
                <label className="activity-garden-field activity-garden-field-quantity">
                  <span>
                    Cantidad <em>(opcional)</em>
                  </span>
                  <input
                    type="number"
                    min="0.001"
                    max="1000000"
                    step="any"
                    value={details.quantity ?? ''}
                    disabled={busy}
                    onChange={event =>
                      detail('quantity', event.target.value === '' ? undefined : Number(event.target.value))
                    }
                    placeholder="Ej. 2"
                  />
                </label>
                <label className="activity-garden-field activity-garden-field-unit">
                  <span>Unidad</span>
                  <select
                    aria-label="Unidad"
                    value={details.unit ?? ''}
                    disabled={busy}
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
              <label className="activity-garden-field activity-garden-field-method">
                <span>
                  ¿Cómo realizaste el riego? <em>(opcional)</em>
                </span>
                <input
                  maxLength={100}
                  disabled={busy}
                  value={details.method ?? ''}
                  onChange={event => detail('method', event.target.value)}
                  placeholder="Ej. Con regadera, manguera…"
                />
              </label>
            )}
            {type === 'fertilizing' && (
              <label className="activity-garden-field activity-garden-field-method">
                <span>
                  Abono utilizado <em>(opcional)</em>
                </span>
                <input
                  maxLength={100}
                  disabled={busy}
                  value={details.material ?? ''}
                  onChange={event => detail('material', event.target.value)}
                  placeholder="Ej. Compost orgánico"
                />
              </label>
            )}
            {type === 'observation' && (
              <>
                <label className="activity-garden-field activity-garden-field-observed">
                  <span>Estado observado</span>
                  <select
                    aria-label="Estado observado"
                    disabled={busy}
                    value={details.state ?? ''}
                    onChange={event =>
                      detail('state', event.target.value ? (event.target.value as PlantState) : undefined)
                    }
                  >
                    <option value="">Sin cambio de estado</option>
                    {Object.entries(PLANT_STATES).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="activity-garden-field activity-garden-field-observed">
                  <span>Etapa ilustrada a partir de evidencia</span>
                  <select
                    aria-label="Etapa de crecimiento observada"
                    disabled={busy || !growthStageEnabled}
                    value={details.growthStage ?? ''}
                    onChange={event =>
                      detail('growthStage', event.target.value ? (event.target.value as GrowthStage) : undefined)
                    }
                  >
                    <option value="">Sin cambio de etapa</option>
                    {Object.entries(GROWTH_STAGES).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <small>
                    {growthStageEnabled
                      ? 'Para cambiar la ilustración del jardín debes adjuntar una fotografía real de la etapa observada.'
                      : 'La sincronización de etapas con el servidor estará disponible tras integrar la API de evidencias #43.'}
                  </small>
                </label>
                <label className="activity-garden-field activity-garden-field-height">
                  <span>
                    Altura (cm) <em>(opcional)</em>
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    disabled={busy}
                    value={details.heightCm ?? ''}
                    onChange={event =>
                      detail('heightCm', event.target.value === '' ? undefined : Number(event.target.value))
                    }
                  />
                </label>
              </>
            )}
            {type === 'harvest' && (
              <>
                <label className="activity-garden-field activity-garden-field-harvest">
                  <span>Tipo de cosecha</span>
                  <select
                    aria-label="Tipo de cosecha"
                    disabled={busy}
                    value={details.harvestMode ?? 'partial'}
                    onChange={event =>
                      setDetails(current => ({
                        ...current,
                        harvestMode: event.target.value as 'partial' | 'complete',
                        releasePlot: false,
                      }))
                    }
                  >
                    <option value="partial">Parcial</option>
                    <option value="complete">Completa</option>
                  </select>
                </label>
                {details.harvestMode === 'complete' && (
                  <label className="activity-garden-check">
                    <input
                      type="checkbox"
                      disabled={busy}
                      checked={details.releasePlot ?? false}
                      onChange={event => detail('releasePlot', event.target.checked)}
                    />{' '}
                    Archivar ficha y liberar espacio
                  </label>
                )}
              </>
            )}
            <AgriculturalCycleFields type={type} date={date} details={details} events={existingActivities} busy={busy} onDetails={setDetails}/>
          </div>

          <div className="activity-garden-evidence-grid">
            <div className="activity-garden-photo-area">
              <div className="activity-garden-section-label">
                <GardenIcon name="camera" /> Evidencia fotográfica{' '}
                <em>
                  {type === 'observation' && details.growthStage && details.growthStage !== plant?.growthStage
                    ? '(obligatoria para cambiar etapa)'
                    : '(opcional)'}
                </em>
              </div>
              <div
                className="activity-garden-photo-drop"
                data-drag-over={dragOver}
                onDragOver={event => {
                  event.preventDefault()
                  setDragOver(true)
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
              >
                <input
                  ref={cameraRef}
                  className="activity-garden-sr-only"
                  type="file"
                  accept={PHOTO_ACCEPT}
                  capture="environment"
                  aria-label="Tomar foto con cámara"
                  disabled={busy}
                  onChange={photo.choose}
                />
                <input
                  ref={galleryRef}
                  className="activity-garden-sr-only"
                  type="file"
                  accept={PHOTO_ACCEPT}
                  aria-label="Seleccionar imagen de galería"
                  disabled={busy}
                  onChange={photo.choose}
                />
                <div className="activity-garden-photo-placeholder">
                  <GardenIcon name="camera" />
                  <span>{photo.reading ? 'Preparando fotografía…' : 'Toma una foto o elige un archivo'}</span>
                </div>
                <div className="activity-garden-photo-controls">
                  <button type="button" disabled={busy || photo.reading} onClick={() => cameraRef.current?.click()}>
                    <GardenIcon name="camera" /> Cámara
                  </button>
                  <button type="button" disabled={busy || photo.reading} onClick={() => galleryRef.current?.click()}>
                    <GardenIcon name="gallery" /> Galería
                  </button>
                </div>
                {previewUrl && (
                  <div className="activity-garden-photo-preview">
                    <img src={previewUrl} alt="Fotografía elegida" />
                    <button
                      type="button"
                      aria-label="Quitar fotografía"
                      title="Quitar fotografía"
                      disabled={busy}
                      onClick={photo.clear}
                    >
                      ×
                    </button>
                  </div>
                )}
                {type === 'observation' && <PlantVisualAnalysis analysis={analysis} previous={plant?.visualProfile}/>}
                <small>JPG, PNG o WebP · hasta 3 MB</small>
              </div>
            </div>
            <label className="activity-garden-field activity-garden-observations">
              <span>
                <span aria-hidden="true">📝</span> Observaciones
              </span>
              <textarea
                maxLength={2000}
                disabled={busy}
                value={notes}
                onChange={event => setNotes(event.target.value)}
                placeholder="Cuenta qué hiciste y cómo encontraste la planta…"
                rows={3}
              />
              <small>{notes.length} / 2000</small>
            </label>
          </div>

          <p className="activity-garden-storage-note">
            <span aria-hidden="true">ⓘ</span> Actividad real documentada · Sincronización con verificación MSP.
          </p>
          {(error || photo.error) && (
            <p role="alert" className="journal-error">
              {error || photo.error}
            </p>
          )}
          <footer className="activity-garden-footer">
            <button type="button" disabled={busy} onClick={onClose}>
              Cancelar
            </button>
            <button
              type="submit"
              disabled={
                busy ||
                photo.reading ||
                Boolean(photo.error) ||
                (type === 'observation' && analysis.status === 'analyzing') ||
                isOverWatered ||
                isOverFertilized ||
                (isEarlyHarvest && !confirmEarlyHarvest) ||
                isSpaceBlockedForNewPlantOrPrep
              }
            >
              <GardenIcon name="book" /> {busy ? 'Guardando…' : (isSpaceBlockedForNewPlantOrPrep ? 'Espacio ocupado' : 'Registrar actividad')}
            </button>
          </footer>
        </form>
      )}
    </dialog>
  )
}
