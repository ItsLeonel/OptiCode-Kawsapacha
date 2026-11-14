import { useEffect, useRef, useState, type DragEvent, type FormEvent } from 'react'
import GardenIcon from '../GardenIcon'
import { PLANT_STATES, type GardenPlant, type PlantState } from '../garden'
import { GROWTH_STAGES, type GrowthStage } from '../growth-stages'
import { localDate, recordId } from '../plant-record'
import { useGardenDialog } from '../useGardenDialog'
import { useJournalPhoto } from './useJournalPhoto'
import { ACTIVITY_TYPES, validateActivity, type ActivityDraft, type ActivityTarget, type ActivityType, type ActivityDetails, type GardenActivity } from './activities'
import { isPostharvestStep, listHarvestLots, statusForHarvestLot, validatePostharvestDraft } from './postharvest'
import wateringArt from './activity-art/watering.png'
import sowingArt from './activity-art/sowing.png'
import fertilizingArt from './activity-art/fertilizing.png'
import harvestArt from './activity-art/harvest.png'
import '../garden-journal.css'
import './activity-modal-v2.css'

type Category = 'all' | 'cultivo' | 'cuidado' | 'seguimiento' | 'cosecha' | 'poscosecha'

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
  replanting: { emoji: '🌱', short: 'Replante', category: 'cultivo' },
  ritualSowing: { emoji: '🌅', short: 'Ritual de siembra', category: 'cultivo' },
  ritualHarvest: { emoji: '🤲', short: 'Ritual de gratitud', category: 'cosecha' },
  signage: { emoji: '🏷️', short: 'Señalética', category: 'cultivo' },
  cleaning: { emoji: '🧼', short: 'Limpieza', category: 'poscosecha' },
  drying: { emoji: '☀️', short: 'Secado', category: 'poscosecha' },
  packaging: { emoji: '📦', short: 'Empaquetado', category: 'poscosecha' },
  storage: { emoji: '🏠', short: 'Almacenaje', category: 'poscosecha' },
}
const FEATURED: ActivityType[] = ['watering', 'sowing', 'fertilizing', 'observation', 'harvest']
const CATEGORIES: { id: Category; label: string; symbol: string }[] = [
  { id: 'all', label: 'Todas', symbol: '✦' },
  { id: 'cultivo', label: 'Cultivo', symbol: '🌱' },
  { id: 'cuidado', label: 'Cuidados', symbol: '🍃' },
  { id: 'seguimiento', label: 'Crecimiento', symbol: '🌿' },
  { id: 'cosecha', label: 'Cosecha', symbol: '🧺' },
  { id: 'poscosecha', label: 'Poscosecha', symbol: '📦' },
]

export default function ActivityModal({
  plants, gardenId, activities = [], responsible, initialPlant, initialPlot, initialDate, initialActivityType,
  onSave, onRegister, onClose, growthStageEnabled = true,
}: {
  plants: GardenPlant[]
  gardenId: string
  activities?: GardenActivity[]
  responsible: string
  initialPlant?: GardenPlant
  initialPlot?: number | null
  initialDate?: string
  initialActivityType?: ActivityType
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
  const initialType = initialActivityType && Object.hasOwn(ACTIVITY_TYPES, initialActivityType) ? initialActivityType : 'watering'
  const [type, setType] = useState<ActivityType>(initialType)
  const [date, setDate] = useState(initialDate && initialDate <= localDate() ? initialDate : localDate())
  const [person, setPerson] = useState(responsible)
  const [targetId, setTargetId] = useState(initialPlant ? `plant:${initialPlant.id}` : initialPlot != null ? `plot:${initialPlot}` : 'garden')
  const [showTargetPicker, setShowTargetPicker] = useState(false)
  const [category, setCategory] = useState<Category>('all')
  const [showMore, setShowMore] = useState(false)
  const [notes, setNotes] = useState('')
  const [details, setDetails] = useState<ActivityDetails>(initialType === 'harvest' ? { harvestMode: 'partial' } : {})
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [previewUrl, setPreviewUrl] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const photo = useJournalPhoto()

  const plant = targetId.startsWith('plant:') ? plants.find(item => item.id === targetId.slice(6)) : undefined
  const postharvest = isPostharvestStep(type)
  const harvestLots = listHarvestLots(activities, gardenId)
  const target: ActivityTarget = postharvest ? { kind: 'garden' } : plant
    ? { kind: 'plant', plantId: plant.id, plot: plant.plot }
    : targetId.startsWith('plot:')
      ? { kind: 'plot', plot: Number(targetId.slice(5)) }
      : { kind: 'garden' }
  const needsPlant = ['sowing', 'hilling', 'replanting', 'observation', 'harvest', 'signage'].includes(type)
  const types = category === 'all'
    ? (FEATURED.includes(type) ? FEATURED : [...FEATURED.slice(0, 4), type])
    : (Object.keys(ACTIVITY_TYPES) as ActivityType[]).filter(item => ACTIVITY_CARDS[item].category === category)
  const extraTypes = (Object.keys(ACTIVITY_TYPES) as ActivityType[]).filter(item => !FEATURED.includes(item))

  useEffect(() => {
    if (!photo.photo) { setPreviewUrl(''); return }
    const url = URL.createObjectURL(photo.photo)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [photo.photo])

  function chooseType(next: ActivityType) {
    setType(next)
    setDetails(next === 'harvest' ? { harvestMode: 'partial' } : next === 'packaging' ? { packagedOn: date } : {})
    if (isPostharvestStep(next)) setShowTargetPicker(false)
    setError('')
  }
  function chooseCategory(next: Category) {
    setShowMore(false)
    setCategory(next)
    if (next !== 'all') {
      const candidate = (Object.keys(ACTIVITY_TYPES) as ActivityType[]).find(item => ACTIVITY_CARDS[item].category === next)
      if (candidate && ACTIVITY_CARDS[type].category !== next) chooseType(candidate)
    }
  }
  function detail<K extends keyof ActivityDetails>(key: K, value: ActivityDetails[K]) {
    setDetails(current => ({ ...current, [key]: value }))
  }
  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setDragOver(false)
    if (!busy && !photo.reading && event.dataTransfer.files.length) void photo.chooseFile(event.dataTransfer.files[0])
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (sending.current || photo.reading || photo.error) return
    const draft: ActivityDraft = { id: id.current, type, date, responsible: person, target, notes, details: type === 'packaging' ? { ...details, packagedOn: date }
      : type === 'signage' ? { ...details, labelCommonName: details.labelCommonName ?? plant?.name, labelScientificName: details.labelScientificName ?? plant?.latin }
      : details, photo: photo.photo }
    const invalid = validateActivity({ ...draft, gardenId, createdAt: new Date().toISOString(), photoIds: photo.photo ? ['pending-photo'] : [], validation: 'local-v1' }, plants)
    const invalidStep = invalid ?? validatePostharvestDraft(draft, gardenId, activities)
    if (invalidStep) { setError(invalidStep); return }
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
      className="garden-journal-dialog activity-garden-modal"
      aria-labelledby="activity-title"
      onCancel={event => { event.preventDefault(); if (!busy) onClose() }}
    >
      <header className="activity-garden-header">
        <div className="activity-garden-header-mark" aria-hidden="true"><GardenIcon name="book" /></div>
        <div className="activity-garden-header-text">
          <small>KAWSAPACHA · MI HUERTO VIVO</small>
          <h2 id="activity-title">Registrar actividad</h2>
          <p>Registra el cuidado de tus plantas y mantén vivo tu huerto.</p>
        </div>
        <span className="activity-garden-header-moon" aria-hidden="true">☾</span>
        <button type="button" autoFocus disabled={busy} className="activity-garden-close" aria-label="Cerrar registro" onClick={onClose}>×</button>
      </header>

      <form onSubmit={submit} aria-busy={busy} className="activity-garden-form">
        <section className="activity-garden-plant-section" aria-label="Planta o lugar de la actividad">
          <div className="activity-garden-section-label"><GardenIcon name="seed" /> {postharvest ? 'Lote de cosecha' : 'Planta seleccionada'}</div>
          <div className="activity-garden-plant-card">
            {plant?.photo
              ? <img src={plant.photo} alt={`Fotografía de ${plant.name}`} />
              : <span className="activity-garden-plant-placeholder" aria-hidden="true">🌿</span>}
            <div className="activity-garden-plant-details">
              <strong>{plant ? plant.name : target.kind === 'plot' ? `Espacio ${target.plot + 1}` : 'Todo el huerto'}</strong>
              <span>{plant ? (plant.latin || `Espacio ${plant.plot + 1}`) : 'Puedes seleccionar una planta o parcela.'}</span>
              {plant && <small><GardenIcon name="leaf" /> Planta vinculada · Espacio {plant.plot + 1}</small>}
            </div>
            {!postharvest && <button type="button" className="activity-garden-change" disabled={busy} aria-expanded={showTargetPicker} onClick={() => setShowTargetPicker(current => !current)}>
              <GardenIcon name="seed" /> {plant ? 'Cambiar planta' : 'Elegir ubicación'}
            </button>}
          </div>
          {!postharvest && showTargetPicker && (
            <div className="activity-garden-picker-popover">
              <label className="activity-garden-field activity-garden-target">
                <span>Planta o ubicación</span>
                <select aria-label="Ubicación de la actividad" autoFocus value={targetId} onChange={event => { setTargetId(event.target.value); setError(''); setShowTargetPicker(false) }} disabled={busy}>
                  <option value="garden">Todo el huerto</option>
                  {Array.from({ length: 6 }, (_, plot) => <option key={plot} value={`plot:${plot}`}>Espacio {plot + 1}</option>)}
                  {plants.filter(item => !item.archivedAt).map(item => <option key={item.id} value={`plant:${item.id}`}>{item.name} · Espacio {item.plot + 1}</option>)}
                </select>
              </label>
              <button type="button" className="activity-garden-picker-done" onClick={() => setShowTargetPicker(false)}>Cerrar</button>
            </div>
          )}
          {needsPlant && !plant && (
            <div className="activity-garden-attention" role="note">
              <span>Esta actividad necesita una planta registrada.</span>
              <button type="button" disabled={busy} onClick={() => onRegister(target.kind === 'plot' ? target.plot : 0, type)}>Registrar planta</button>
            </div>
          )}
        </section>

        <section className="activity-garden-choose" aria-label="Selecciona la actividad realizada">
          <div className="activity-garden-section-label"><GardenIcon name="seed" /> Actividad realizada</div>
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
                  {ACTIVITY_CARDS[item].art
                    ? <img src={ACTIVITY_CARDS[item].art} alt="" />
                    : <span>{ACTIVITY_CARDS[item].emoji}</span>}
                </span>
                <span>{ACTIVITY_CARDS[item].short}</span>
              </button>
            ))}
            {category === 'all' && (
              <button type="button" className="activity-garden-card activity-garden-more" aria-expanded={showMore} disabled={busy} onClick={() => setShowMore(current => !current)}>
                <span className="activity-garden-card-icon" aria-hidden="true">•••</span>
                <span>{showMore ? 'Cerrar' : 'Otras'}</span>
              </button>
            )}
          </div>
          {showMore && category === 'all' && (
            <div className="activity-garden-extra-picker" role="group" aria-label="Otras actividades agrícolas">
              {extraTypes.map(item => <button type="button" key={item} disabled={busy} onClick={() => { chooseType(item); setShowMore(false) }}><span aria-hidden="true">{ACTIVITY_CARDS[item].emoji}</span> {ACTIVITY_TYPES[item]}</button>)}
            </div>
          )}
          <div className="activity-garden-categories" aria-label="Filtrar actividades por categoría">
            {CATEGORIES.map(item => <button key={item.id} type="button" data-active={category === item.id} aria-pressed={category === item.id} disabled={busy} onClick={() => chooseCategory(item.id)}>{item.symbol} {item.label}</button>)}
          </div>
        </section>

        <div className="activity-garden-input-grid">
          <label className="activity-garden-field activity-garden-field-date">
            <span><span aria-hidden="true">📅</span> Fecha de la actividad</span>
            <input type="date" required value={date} max={localDate()} disabled={busy} onChange={event => setDate(event.target.value)} />
          </label>
          <label className="activity-garden-field activity-garden-field-person">
            <span><span aria-hidden="true">👤</span> Responsable</span>
            <input type="text" required minLength={2} maxLength={100} value={person} disabled={busy} onChange={event => setPerson(event.target.value)} placeholder="Persona responsable" />
          </label>
          {['watering', 'fertilizing', 'harvest'].includes(type) && <>
            <label className="activity-garden-field activity-garden-field-quantity">
              <span>Cantidad <em>(opcional)</em></span>
              <input type="number" min="0.001" max="1000000" step="any" value={details.quantity ?? ''} disabled={busy} onChange={event => detail('quantity', event.target.value === '' ? undefined : Number(event.target.value))} placeholder="Ej. 2" />
            </label>
            <label className="activity-garden-field activity-garden-field-unit">
              <span>Unidad</span>
              <select aria-label="Unidad" value={details.unit ?? ''} disabled={busy} onChange={event => detail('unit', event.target.value as ActivityDetails['unit'])}>
                <option value="">Sin especificar</option>
                {['L', 'kg', 'g', 'unidades'].map(value => <option key={value} value={value}>{value}</option>)}
              </select>
            </label>
          </>}

          {postharvest && <div className="activity-garden-field">
            <label htmlFor="postharvest-lot">Cosecha real de origen *</label>
            <select id="postharvest-lot" required disabled={busy} value={details.sourceHarvestId ?? ''} onChange={e => detail('sourceHarvestId', e.target.value || undefined)}>
              <option value="">Selecciona una cosecha de la Bitácora</option>
              {harvestLots.map(lot => <option key={lot.id} value={lot.id}>{lot.label} · {lot.responsible}</option>)}
            </select>
            {!harvestLots.length && <small>Registra primero una cosecha. No se crearán lotes ficticios.</small>}
            {details.sourceHarvestId && <small>Siguiente etapa sin registrar: {statusForHarvestLot(details.sourceHarvestId, activities) ? ACTIVITY_TYPES[statusForHarvestLot(details.sourceHarvestId, activities)!] : 'Todas documentadas'}</small>}
          </div>}
          {(type === 'preparation' || type === 'sowing') && <label className="activity-garden-field">
            <span>Técnica de terreno <em>(opcional)</em></span>
            <select disabled={busy} value={details.groundTechnique ?? ''} onChange={e => detail('groundTechnique', (e.target.value || undefined) as ActivityDetails['groundTechnique'])}>
              <option value="">No especificada</option><option value="furrows">Surcos</option><option value="beds">Camadas</option><option value="raisedBeds">Camellones</option><option value="terraces">Terrazas</option>
            </select>
          </label>}
          {type === 'sowing' && <label className="activity-garden-field">
            <span>Material de siembra</span><select disabled={busy} value={details.sowingMaterial ?? ''} onChange={e => detail('sowingMaterial', (e.target.value || undefined) as ActivityDetails['sowingMaterial'])}>
              <option value="">Sin documentar</option><option value="seed">Semillas</option><option value="stake">Estacas</option><option value="cutting">Esquejes</option><option value="seedling">Plántulas</option>
            </select>
          </label>}
          {type === 'signage' && <>
            <label className="activity-garden-field"><span>Nombre común de la señal</span><input disabled={busy} maxLength={300} value={details.labelCommonName ?? plant?.name ?? ''} onChange={e => detail('labelCommonName', e.target.value)} /></label>
            <label className="activity-garden-field"><span>Nombre científico</span><input disabled={busy} maxLength={300} value={details.labelScientificName ?? plant?.latin ?? ''} onChange={e => detail('labelScientificName', e.target.value)} /></label>
            <label className="activity-garden-field"><span>Clasificación tradicional indicada</span><select disabled={busy} value={details.traditionalType ?? 'unknown'} onChange={e => detail('traditionalType', e.target.value as ActivityDetails['traditionalType'])}>
              <option value="unknown">Sin clasificar</option><option value="hot">Caliente · rojo</option><option value="cool">Fresca · verde/blanco</option>
            </select></label>
            <label className="activity-garden-field"><span>Nombre en idioma de la comunidad (opcional)</span><input disabled={busy} maxLength={300} value={details.labelLocalName ?? ''} onChange={e => detail('labelLocalName', e.target.value)}/></label>
            <label className="activity-garden-field"><span>Familia botánica (si la conoces)</span><input disabled={busy} maxLength={300} value={details.labelFamily ?? ''} onChange={e => detail('labelFamily', e.target.value)}/></label>
            <label className="activity-garden-field"><span>Uso tradicional general (opcional)</span><input disabled={busy} maxLength={300} value={details.labelUse ?? ''} onChange={e => detail('labelUse', e.target.value)}/></label>
            <small>Los datos de señalética son declaraciones del usuario y no equivalen a validación oficial.</small>
          </>}
          {(type === 'ritualSowing' || type === 'ritualHarvest') && <p className="activity-postharvest-tip">Describe la práctica cultural realmente realizada. El calendario lunar orienta, pero no valida ni impide registrar actividades.</p>}
          {type === 'harvest' && <label className="activity-garden-field"><span>Parte recolectada</span><select disabled={busy} value={details.plantPart ?? ''} onChange={e => detail('plantPart', (e.target.value || undefined) as ActivityDetails['plantPart'])}>
            <option value="">Sin documentar</option><option value="leaves">Hojas</option><option value="flowers">Flores</option><option value="fruits">Frutos</option><option value="seeds">Semillas</option><option value="roots">Raíces</option><option value="other">Otra parte</option>
          </select></label>}
          {type === 'cleaning' && <label className="activity-garden-field"><span>Procedimiento de limpieza</span><input disabled={busy} maxLength={100} value={details.method ?? ''} onChange={e => detail('method',e.target.value)} placeholder="Describe la limpieza realizada"/></label>}
          {type === 'drying' && <>
            <label className="activity-garden-field"><span>Inicio real del secado *</span><input required disabled={busy} type="date" max={date} value={details.dryingStartOn ?? ''} onChange={e => detail('dryingStartOn',e.target.value || undefined)} /></label>
            <label className="activity-garden-field"><span>Finalización real del secado *</span><input required disabled={busy} type="date" min={details.dryingStartOn} max={date} value={details.dryingEndOn ?? ''} onChange={e => detail('dryingEndOn',e.target.value || undefined)}/></label>
            <p className="activity-postharvest-tip">Referencia tradicional MSP: secado a la sombra aproximadamente 10–15 días. Solo anota fechas reales: Kawsapacha no certifica la inocuidad ni afirma que un lote se ha secado por el calendario.</p>
          </>}
          {type === 'packaging' && <>
            <label className="activity-garden-field"><span>Nombre común de la etiqueta *</span><input required disabled={busy} maxLength={300} value={details.labelCommonName ?? ''} onChange={e => detail('labelCommonName',e.target.value)}/></label>
            <label className="activity-garden-field"><span>Nombre científico *</span><input required disabled={busy} maxLength={300} value={details.labelScientificName ?? ''} onChange={e => detail('labelScientificName',e.target.value)}/></label>
            <label className="activity-garden-field"><span>Nombre ancestral o local (opcional)</span><input disabled={busy} maxLength={300} value={details.labelLocalName ?? ''} onChange={e => detail('labelLocalName',e.target.value)}/></label>
            <label className="activity-garden-field"><span>Familia botánica (opcional)</span><input disabled={busy} maxLength={300} value={details.labelFamily ?? ''} onChange={e => detail('labelFamily',e.target.value)}/></label>
            <label className="activity-garden-field"><span>Peso o cantidad real del paquete (opcional)</span><input disabled={busy} type="number" min="0.001" step="any" value={details.quantity ?? ''} onChange={e => detail('quantity',e.target.value ? Number(e.target.value) : undefined)}/></label>
            <label className="activity-garden-field"><span>Unidad medida</span><select disabled={busy} value={details.unit ?? ''} onChange={e => detail('unit',(e.target.value || undefined) as ActivityDetails['unit'])}>
              <option value="">Sin especificar</option><option value="g">Gramos</option><option value="kg">Kilogramos</option><option value="unidades">Unidades</option>
            </select></label>
            <label className="activity-garden-field"><span>Clasificación tradicional</span><select disabled={busy} value={details.traditionalType ?? 'unknown'} onChange={e => detail('traditionalType',e.target.value as ActivityDetails['traditionalType'])}>
              <option value="unknown">Sin documentar</option><option value="hot">Caliente</option><option value="cool">Fresca</option>
            </select></label>
            <label className="activity-garden-field"><span>Uso indicado (de fuente confiable)</span><input disabled={busy} maxLength={300} value={details.labelUse ?? ''} onChange={e => detail('labelUse',e.target.value)}/></label>
            <label className="activity-garden-field"><span>Contraindicaciones declaradas</span><input disabled={busy} maxLength={300} value={details.labelWarnings ?? ''} onChange={e => detail('labelWarnings',e.target.value)}/></label>
            <label className="activity-garden-field"><span>Dosificación de referencia validada (opcional)</span><input disabled={busy} maxLength={300} value={details.labelDose ?? ''} onChange={e => detail('labelDose',e.target.value)} placeholder="No se genera automáticamente"/></label>
            <label className="activity-garden-field"><span>Caducidad declarada *</span><input required disabled={busy} type="date" min={date} value={details.expiryDate ?? ''} onChange={e => detail('expiryDate',e.target.value || undefined)}/></label>
            <small>Fecha de empaquetado: {date}. La app no calcula ni certifica la caducidad.</small>
          </>}
          {type === 'storage' && <label className="activity-garden-field"><span>Ubicación de almacenaje *</span><input required disabled={busy} maxLength={300} value={details.storageLocation ?? ''} onChange={e => detail('storageLocation',e.target.value)} placeholder="Bodega / estante ventilado y seco"/></label>}

          {type === 'watering' && <label className="activity-garden-field activity-garden-field-method"><span>¿Cómo realizaste el riego? <em>(opcional)</em></span><input maxLength={100} disabled={busy} value={details.method ?? ''} onChange={event => detail('method', event.target.value)} placeholder="Ej. Con regadera, manguera…" /></label>}
          {type === 'fertilizing' && <label className="activity-garden-field activity-garden-field-method"><span>Abono utilizado <em>(opcional)</em></span><input maxLength={100} disabled={busy} value={details.material ?? ''} onChange={event => detail('material', event.target.value)} placeholder="Ej. Compost orgánico" /></label>}
          {type === 'replanting' && <label className="activity-garden-field activity-garden-field-method"><span>Espacio de destino</span><select required aria-label="Espacio de destino" disabled={busy} value={details.destinationPlot ?? ''} onChange={event => detail('destinationPlot', event.target.value === '' ? undefined : Number(event.target.value))}><option value="" disabled>Selecciona un espacio libre</option>{Array.from({ length: 6 }, (_, plot) => <option key={plot} value={plot} disabled={plants.some(item => !item.archivedAt && item.plot === plot)}>Espacio {plot + 1}</option>)}</select></label>}
          {type === 'observation' && <>
            <label className="activity-garden-field activity-garden-field-observed"><span>Estado observado</span><select aria-label="Estado observado" disabled={busy} value={details.state ?? ''} onChange={event => detail('state', event.target.value ? event.target.value as PlantState : undefined)}><option value="">Sin cambio de estado</option>{Object.entries(PLANT_STATES).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
            <label className="activity-garden-field activity-garden-field-observed"><span>Etapa ilustrada a partir de evidencia</span>
              <select aria-label="Etapa de crecimiento observada" disabled={busy || !growthStageEnabled} value={details.growthStage ?? ''} onChange={event => detail('growthStage', event.target.value ? event.target.value as GrowthStage : undefined)}>
                <option value="">Sin cambio de etapa</option>
                {Object.entries(GROWTH_STAGES).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
              </select>
              <small>{growthStageEnabled ? 'Para cambiar la ilustración del jardín debes adjuntar una fotografía real de la etapa observada.' : 'La sincronización de etapas con el servidor estará disponible tras integrar la API de evidencias #43.'}</small>
            </label>
            <label className="activity-garden-field activity-garden-field-height"><span>Altura (cm) <em>(opcional)</em></span><input type="number" min="0" step="0.1" disabled={busy} value={details.heightCm ?? ''} onChange={event => detail('heightCm', event.target.value === '' ? undefined : Number(event.target.value))} /></label>
          </>}
          {type === 'harvest' && <>
            <label className="activity-garden-field activity-garden-field-harvest"><span>Tipo de cosecha</span><select aria-label="Tipo de cosecha" disabled={busy} value={details.harvestMode ?? 'partial'} onChange={event => setDetails(current => ({ ...current, harvestMode: event.target.value as 'partial' | 'complete', releasePlot: false }))}><option value="partial">Parcial</option><option value="complete">Completa</option></select></label>
            {details.harvestMode === 'complete' && <label className="activity-garden-check"><input type="checkbox" disabled={busy} checked={details.releasePlot ?? false} onChange={event => detail('releasePlot', event.target.checked)} /> Archivar ficha y liberar espacio</label>}
          </>}
        </div>

        <div className="activity-garden-evidence-grid">
          <div className="activity-garden-photo-area">
            <div className="activity-garden-section-label"><GardenIcon name="camera" /> Evidencia fotográfica <em>{type === 'observation' && details.growthStage && details.growthStage !== plant?.growthStage ? '(obligatoria para cambiar etapa)' : '(opcional)'}</em></div>
            <div className="activity-garden-photo-drop" data-drag-over={dragOver} onDragOver={event => { event.preventDefault(); setDragOver(true) }} onDragLeave={() => setDragOver(false)} onDrop={onDrop}>
              <input ref={cameraRef} className="activity-garden-sr-only" type="file" accept="image/*" capture="environment" aria-label="Tomar foto con cámara" disabled={busy} onChange={photo.choose} />
              <input ref={galleryRef} className="activity-garden-sr-only" type="file" accept="image/jpeg,image/png,image/webp" aria-label="Seleccionar imagen de galería" disabled={busy} onChange={photo.choose} />
              <div className="activity-garden-photo-placeholder"><GardenIcon name="camera" /><span>{photo.reading ? 'Preparando fotografía…' : 'Toma una foto o elige un archivo'}</span></div>
              <div className="activity-garden-photo-controls">
                <button type="button" disabled={busy || photo.reading} onClick={() => cameraRef.current?.click()}><GardenIcon name="camera" /> Cámara</button>
                <button type="button" disabled={busy || photo.reading} onClick={() => galleryRef.current?.click()}><GardenIcon name="gallery" /> Galería</button>
              </div>
              {previewUrl && <div className="activity-garden-photo-preview"><img src={previewUrl} alt="Fotografía elegida" /><button type="button" aria-label="Quitar fotografía" title="Quitar fotografía" disabled={busy} onClick={photo.clear}>×</button></div>}
              <small>JPG, PNG o WebP · hasta 3 MB</small>
            </div>
          </div>
          <label className="activity-garden-field activity-garden-observations">
            <span><span aria-hidden="true">📝</span> Observaciones</span>
            <textarea maxLength={2000} disabled={busy} value={notes} onChange={event => setNotes(event.target.value)} placeholder="Cuenta qué hiciste y cómo encontraste la planta…" rows={3} />
            <small>{notes.length} / 2000</small>
          </label>
        </div>

        <p className="activity-garden-storage-note"><span aria-hidden="true">ⓘ</span> Actividad real documentada · Sincronización completa de la bitácora pendiente de la API.</p>
        {(error || photo.error) && <p role="alert" className="journal-error">{error || photo.error}</p>}
        <footer className="activity-garden-footer">
          <button type="button" disabled={busy} onClick={onClose}>Cancelar</button>
          <button type="submit" disabled={busy || photo.reading || Boolean(photo.error)}><GardenIcon name="book" /> {busy ? 'Guardando…' : 'Registrar actividad'}</button>
        </footer>
      </form>
    </dialog>
  )
}
