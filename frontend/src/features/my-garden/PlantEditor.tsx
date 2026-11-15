import { useEffect, useRef, useState, type FormEvent } from 'react'
import GardenIcon from './GardenIcon'
import { PLANT_STATES, type GardenPlant, type PlantState } from './garden'
import { GROWTH_STAGES, type GrowthStage } from './growth-stages'
import { localDate, recordId, validatePlantUpdate, type PlantUpdate } from './plant-record'
import { useGardenDialog } from './useGardenDialog'
import { useJournalPhoto } from './journal/useJournalPhoto'
import { PHOTO_ACCEPT } from '../../shared/photo-validation'
import { resolveMediaUrl } from '../../services/api'
import { usePlantVisualAnalysis } from './usePlantVisualAnalysis'
import PlantVisualAnalysis from './PlantVisualAnalysis'
import './garden-journal.css'
import './plant-editor.css'

type PlantEditorProps = {
  plant: GardenPlant
  plants: GardenPlant[]
  onSave: (draft: PlantUpdate) => void | Promise<void>
  onClose: () => void
  growthStageEnabled?: boolean
}

export default function PlantEditor({
  plant, plants, onSave, onClose, growthStageEnabled = true,
}: PlantEditorProps) {
  const dialog = useGardenDialog()
  const request = useRef(recordId('plant-update'))
  const photo = useJournalPhoto()
  const analysis = usePlantVisualAnalysis(photo.photo)
  const [draft, setDraft] = useState<PlantUpdate>({
    name: plant.name,
    latin: plant.latin,
    plantedOn: plant.plantedOn ?? '',
    plot: plant.plot,
    observations: plant.observations ?? '',
    state: plant.state ?? 'not-documented',
    growthStage: plant.growthStage,
    date: localDate(),
  })
  const [preview, setPreview] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!photo.photo) {
      setPreview(null)
      return
    }
    const url = URL.createObjectURL(photo.photo)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [photo.photo])

  function field<K extends keyof PlantUpdate>(key: K, value: PlantUpdate[K]) {
    setDraft(current => ({ ...current, [key]: value }))
    if (error) setError('')
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy || photo.reading || photo.error || analysis.status === 'analyzing') return
    const invalid = validatePlantUpdate({ ...draft, photo: photo.photo }, plant, plants)
    if (invalid) {
      setError(invalid)
      return
    }
    setBusy(true)
    setError('')
    try {
      await onSave({
        ...draft,
        photo: photo.photo,
        ...(analysis.status === 'ready' && analysis.profile ? { visualProfile: analysis.profile } : {}),
        requestId: request.current,
      })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo guardar la ficha.')
      setBusy(false)
    }
  }

  const stagePhotoNeeded = growthStageEnabled
    && draft.growthStage !== undefined
    && draft.growthStage !== plant.growthStage
  const savingDisabled = busy || photo.reading || Boolean(photo.error) || analysis.status === 'analyzing'
  const currentPhoto = resolveMediaUrl(plant.photo)

  return (
    <dialog
      ref={dialog}
      className="garden-journal-dialog plant-editor"
      aria-labelledby="plant-edit-title"
      onCancel={event => {
        event.preventDefault()
        if (!busy) onClose()
      }}
    >
      <header className="plant-editor-header">
        <div className="plant-editor-heading">
          <div className="plant-editor-heading-icon"><GardenIcon name="seed" /></div>
          <div>
            <small>PASAPORTE VIVO · SEGUIMIENTO</small>
            <h2 id="plant-edit-title">Actualizar planta</h2>
            <p>Documenta cambios reales de tu cultivo.</p>
          </div>
        </div>
        <button
          type="button"
          autoFocus
          disabled={busy}
          onClick={onClose}
          aria-label="Cerrar edición de planta"
          className="plant-editor-close"
        >
          <GardenIcon name="close" />
        </button>
      </header>

      <form onSubmit={submit} className="plant-editor-form">
        <div className="plant-editor-intro">
          {currentPhoto && (
            <img className="plant-editor-current-photo" src={currentPhoto} alt={'Fotografía actual de ' + plant.name} />
          )}
          <div>
            <span className="plant-editor-eyebrow">Planta en tu jardín</span>
            <strong>{plant.name}</strong>
            <span>Parcela {plant.plot + 1}{plant.latin ? ' · ' + plant.latin : ''}</span>
          </div>
          <span className="plant-editor-intro-label">Ficha existente</span>
        </div>

        <section className="plant-editor-section" aria-labelledby="editor-general-heading">
          <div className="plant-editor-section-title">
            <span className="plant-editor-step">01</span>
            <div>
              <h3 id="editor-general-heading">Datos de la planta</h3>
              <p>Identificación y ubicación en tu huerto.</p>
            </div>
          </div>
          <div className="journal-fields plant-editor-fields">
            <label>
              <span className="plant-editor-field-title">Nombre común <span className="plant-editor-required" aria-label="obligatorio">*</span></span>
              <input required value={draft.name} maxLength={100} onChange={event => field('name', event.target.value)} />
            </label>
            <label>
              Nombre científico
              <input value={draft.latin} maxLength={150} onChange={event => field('latin', event.target.value)} placeholder="Ej. Salvia rosmarinus" />
            </label>
            <label>
              Espacio de cultivo
              <select
                aria-label="Espacio de cultivo"
                value={draft.plot}
                onChange={event => field('plot', Number(event.target.value))}
              >
                {Array.from({ length: 6 }, (_, plot) => (
                  <option
                    key={plot}
                    value={plot}
                    disabled={!plant.archivedAt && plants.some(item => item.id !== plant.id && !item.archivedAt && item.plot === plot)}
                  >
                    Parcela {plot + 1}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Fecha de siembra
              <input type="date" max={localDate()} value={draft.plantedOn} onChange={event => field('plantedOn', event.target.value)} />
            </label>
          </div>
        </section>

        <section className="plant-editor-section" aria-labelledby="editor-observation-heading">
          <div className="plant-editor-section-title">
            <span className="plant-editor-step">02</span>
            <div>
              <h3 id="editor-observation-heading">Nueva observación</h3>
              <p>Registra lo que observaste hoy en la planta.</p>
            </div>
          </div>
          <div className="journal-fields plant-editor-fields">
            <label>
              <span className="plant-editor-field-title">Fecha de observación <span className="plant-editor-required" aria-label="obligatorio">*</span></span>
              <input required type="date" max={localDate()} value={draft.date} onChange={event => field('date', event.target.value)} />
            </label>
            <label>
              Estado observado
              <select aria-label="Estado documentado" value={draft.state} onChange={event => field('state', event.target.value as PlantState)}>
                {Object.entries(PLANT_STATES).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
              </select>
            </label>
            <label>
              Etapa de crecimiento
              <select
                aria-label="Etapa de crecimiento observada"
                disabled={!growthStageEnabled}
                value={draft.growthStage ?? ''}
                onChange={event => field('growthStage', event.target.value ? event.target.value as GrowthStage : undefined)}
              >
                <option value="">Sin etapa documentada</option>
                {Object.entries(GROWTH_STAGES).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
              </select>
            </label>
            <label>
              <span className="plant-editor-field-title">Altura medida <span className="plant-editor-optional">(opcional, cm)</span></span>
              <input
                type="number"
                min="0"
                max="100000"
                step="0.1"
                value={draft.heightCm ?? ''}
                placeholder="Ej. 24.5"
                onChange={event => field('heightCm', event.target.value === '' ? undefined : Number(event.target.value))}
              />
            </label>
            <label className="journal-wide plant-editor-notes">
              <span className="plant-editor-field-title">Observaciones <span className="plant-editor-optional">(opcional)</span></span>
              <textarea
                value={draft.observations}
                maxLength={2000}
                rows={3}
                placeholder="¿Qué cambió desde la última fotografía? Describe hojas, tallo, flores o cuidados observados."
                onChange={event => field('observations', event.target.value)}
              />
              <span className="plant-editor-counter">{draft.observations.length}/2000</span>
            </label>
          </div>
        </section>

        <section className="plant-editor-section" aria-labelledby="editor-evidence-heading">
          <div className="plant-editor-section-title">
            <span className="plant-editor-step">03</span>
            <div>
              <h3 id="editor-evidence-heading">Evidencia fotográfica</h3>
              <p>La fotografía documenta los cambios de la planta real.</p>
            </div>
          </div>

          <div className="plant-editor-evidence">
            <label className="plant-editor-file-picker">
              <span className="plant-editor-file-icon"><GardenIcon name="camera" /></span>
              <strong>{photo.photo ? 'Cambiar fotografía' : 'Seleccionar fotografía'}</strong>
              <span>JPG, PNG o WebP · Hasta 3 MB</span>
              <input
                type="file"
                accept={PHOTO_ACCEPT}
                onChange={photo.choose}
                aria-label="Nueva fotografía de la planta"
                aria-describedby="plant-editor-photo-help"
                disabled={busy || photo.reading}
              />
            </label>
            <div className="plant-editor-evidence-preview">
              {preview ? (
                <>
                  <img src={preview} alt="Vista previa de la fotografía seleccionada" />
                  <button type="button" onClick={photo.clear} disabled={busy}>Quitar foto</button>
                </>
              ) : (
                <>
                  {currentPhoto && <img src={currentPhoto} alt="Fotografía previamente registrada" />}
                  <span>{photo.reading ? 'Preparando fotografía…' : 'Fotografía actual'}</span>
                </>
              )}
            </div>
          </div>
          <p
            className={'plant-editor-help' + (stagePhotoNeeded && !photo.photo ? ' plant-editor-help--required' : '')}
            id="plant-editor-photo-help"
          >
            {stagePhotoNeeded
              ? 'Cambiaste la etapa de crecimiento: adjunta una fotografía nueva para guardar este cambio.'
              : 'Puedes guardar una observación sin foto si la etapa no cambia. Las fotos anteriores se conservan.'}
          </p>
          <PlantVisualAnalysis analysis={analysis} previous={plant.visualProfile} />
          {!growthStageEnabled && (
            <p className="plant-editor-help">Para actualizar la etapa de crecimiento, conecta la sesión del huerto. Las fotos guardadas se mantienen.</p>
          )}
        </section>

        {(error || photo.error) && <p role="alert" className="journal-error plant-editor-error">{error || photo.error}</p>}

        <footer className="plant-editor-actions">
          <button type="button" disabled={busy} onClick={onClose} className="plant-editor-cancel">Cancelar</button>
          <button type="submit" disabled={savingDisabled} className="plant-editor-submit">
            {busy ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </footer>
      </form>
    </dialog>
  )
}
