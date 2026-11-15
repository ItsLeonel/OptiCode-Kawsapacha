import { useEffect, useRef, useState } from 'react'
import GardenIcon from './GardenIcon'
import { PLANT_STATES, type GardenPlant } from './garden'
import type { ActivityType, GardenActivity } from './journal/activities'
import { GROWTH_STAGES, documentedGrowthStage } from './growth-stages'
import { compareVisualProfiles } from './plant-visual-profile'
import BotanicalSignage from './BotanicalSignage'
import {
  careApi,
  catalogApi,
  resolveMediaUrl,
  type GrowthData,
  type CalendarTips,
  type UserSession,
} from '../../services/api'
import './plant-passport-clean.css'

interface PassportProps {
  plant: GardenPlant | null
  user?: UserSession | null
  activeGardenId?: string | null
  activities?: GardenActivity[]
  currentCommunityRole?: 'RESPONSABLE' | 'PARTICIPANTE' | null
  onClose: () => void
  onHistory: () => void
  onPlantHarvested?: (plantId: string) => void
  onPlantRemoved?: (plantId: string) => void
  onEdit?: () => void
  onArchive?: () => void | Promise<void>
  onRestore?: () => string | null | Promise<string | null>
  onActivity?: (type?: ActivityType) => void
  onActivityCreated?: () => void
}

function displayDate(value?: string) {
  if (!value) return ''
  const day = value.slice(0, 10)
  const [year, month, date] = day.split('-')
  return year && month && date ? date + '/' + month + '/' + year : value
}

/**
 * La ficha muestra hechos registrados: fotos, estado documentado y actividades.
 * Recomendaciones/estimaciones son secundarias y no prueban cuidados realizados.
 * El registro de riegos, abonos y cosechas ocurre en la Bitácora única.
 */
export default function PlantPassport({
  plant, user, currentCommunityRole, onClose, onHistory,
  onEdit, onArchive, onRestore, onActivity,
}: PassportProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [growth, setGrowth] = useState<GrowthData | null>(null)
  const [calendar, setCalendar] = useState<CalendarTips | null>(null)
  const [archiveConfirm, setArchiveConfirm] = useState(false)
  const [archiving, setArchiving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (!plant) {
      if (dialog.open) dialog.close()
      return
    }
    if (!dialog.open) dialog.showModal()
    let cancelled = false
    setError('')
    setArchiveConfirm(false)
    setGrowth(null)
    setCalendar(null)

    if (user && !plant.id.includes('-')) {
      void careApi.getGrowth(plant.id)
        .then(data => { if (!cancelled) setGrowth(data) })
        .catch(() => { if (!cancelled) setGrowth(null) })
    }
    void catalogApi.getCalendarTips(plant.name)
      .then(data => { if (!cancelled) setCalendar(data) })
      .catch(() => { if (!cancelled) setCalendar(null) })
    return () => { cancelled = true }
  }, [plant?.id, plant?.name, user])

  if (!plant) return <dialog ref={dialogRef} className="garden-passport passport-clean" onClose={onClose} />

  const stage = documentedGrowthStage(plant)
  const photos = [...(plant.evidences ?? [])]
    .filter(item => Boolean(item.photo))
    .sort((a, b) => b.date.localeCompare(a.date))
  const visualEvidence = [...(plant.evidences ?? [])]
    .filter(item => Boolean(item.visualProfile))
    .sort((a, b) => a.date.localeCompare(b.date))
  const previousProfile = visualEvidence.length > 1 ? visualEvidence[visualEvidence.length - 2].visualProfile : undefined
  const currentProfile = visualEvidence.length ? visualEvidence[visualEvidence.length - 1].visualProfile : undefined
  const visualChanges = compareVisualProfiles(previousProfile, currentProfile)
  const hasCareAlert = Boolean(growth?.overWatered || growth?.overFertilized || growth?.overPruned)
  const isResponsible = !user || currentCommunityRole === 'RESPONSABLE'
  const showArchive = Boolean(onArchive && !plant.archivedAt)
  const showRestore = Boolean(onRestore && plant.archivedAt)

  async function archivePlant() {
    if (!onArchive || archiving) return
    setArchiving(true)
    setError('')
    try {
      await onArchive()
      setArchiveConfirm(false)
      dialogRef.current?.close()
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'No fue posible archivar la planta.')
    } finally {
      setArchiving(false)
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="garden-passport passport-clean"
      aria-labelledby="plant-passport-title"
      onClose={onClose}
      onClick={event => {
        if (event.target === event.currentTarget) dialogRef.current?.close()
      }}
    >
      <div className="passport-scroll">
        <header className="garden-passport-header">
          <span><GardenIcon name="history" /> Pasaporte Vivo</span>
          <button type="button" autoFocus aria-label="Cerrar Pasaporte Vivo" onClick={() => dialogRef.current?.close()}>
            <GardenIcon name="close" />
          </button>
        </header>

        <div className="passport-body">
          <section className="passport-hero" aria-label="Resumen de la planta">
            <img
              className="garden-passport-photo passport-hero-photo"
              src={resolveMediaUrl(plant.photo)}
              alt={'Fotografía registrada de ' + plant.name}
            />
            <div className="passport-hero-copy">
              <span className="passport-eyebrow">Mi huerto · Planta registrada</span>
              <h2 id="plant-passport-title">{plant.name}</h2>
              <p className="passport-latin"><em>{plant.latin}</em></p>
              <div className="passport-meta">
                <span>📍 {plant.archivedAt ? 'Archivada' : 'Parcela ' + (plant.plot + 1)}</span>
                {plant.plantedOn && <span>🌱 Siembra: {displayDate(plant.plantedOn)}</span>}
              </div>
              {stage && <p className="passport-stage">Etapa documentada: <strong>{GROWTH_STAGES[stage]}</strong></p>}
              {!stage && <p className="passport-stage passport-stage--muted">Etapa de crecimiento sin documentar</p>}
            </div>
          </section>

          <nav className="passport-toolbar" aria-label="Acciones de la planta">
            {onActivity && !plant.archivedAt && (
              <button type="button" className="passport-primary-action" onClick={() => onActivity()}>
                <GardenIcon name="book" /> Registrar actividad
              </button>
            )}
            {onEdit && !plant.archivedAt && (
              <button type="button" className="passport-secondary-action" onClick={onEdit}>
                <GardenIcon name="camera" /> Añadir foto
              </button>
            )}
            {showRestore && <button type="button" className="passport-secondary-action" onClick={() => void onRestore?.()}>Restaurar planta</button>}
            <button type="button" className="passport-link-action" onClick={() => {
              dialogRef.current?.close()
              onHistory()
            }}>Ver Bitácora</button>
          </nav>

          {error && <p className="passport-message passport-message--error" role="alert">{error}</p>}
          {hasCareAlert && (
            <aside className="passport-care-alert" role="status">
              <span aria-hidden="true">⚠️</span>
              <div><strong>Revisa los cuidados registrados</strong>
                <p>
                  {growth?.overWatered ? 'Hay riegos frecuentes. ' : ''}
                  {growth?.overFertilized ? 'Hay abonados frecuentes. ' : ''}
                  {growth?.overPruned ? 'Hay podas frecuentes. ' : ''}
                  Es una alerta orientativa basada en la Bitácora, no un diagnóstico de la planta.
                </p>
              </div>
            </aside>
          )}

          <section className="passport-photo-overview" aria-label="Fotografías de la planta">
            <div className="passport-section-heading">
              <div><h3>Seguimiento fotográfico</h3><p>Las imágenes documentan los cambios reales.</p></div>
              <span className="passport-photo-count">{photos.length} {photos.length === 1 ? 'foto' : 'fotos'}</span>
            </div>
            {photos.length ? (
              <div className="passport-photo-strip">
                {photos.slice(0, 3).map(item => (
                  <figure key={item.id}>
                    <img src={resolveMediaUrl(item.photo)} alt={'Evidencia de ' + plant.name + ' del ' + displayDate(item.date)} loading="lazy" />
                    <figcaption>{displayDate(item.date)}</figcaption>
                  </figure>
                ))}
              </div>
            ) : <p className="passport-empty">Aún no se han registrado fotos. Usa «Añadir foto» para documentar la planta.</p>}
          </section>

          <div className="passport-sections">
            <details className="passport-disclosure">
              <summary><span>Fotos y evolución</span><small>Observaciones y comparación entre registros</small></summary>
              <div className="passport-panel-body">
                {visualChanges.length > 0 && (
                  <p className="passport-visual-note"><strong>Cambios aparentes:</strong> {visualChanges.join(' · ')}.</p>
                )}
                {currentProfile && (
                  <p className="passport-visual-note">Perfil estimado de la última imagen: follaje {currentProfile.densityLevel}/5 y amplitud {currentProfile.spreadLevel}/5.
                    {currentProfile.confidence === 'low' ? ' Confianza baja.' : ''}
                  </p>
                )}
                {photos.length ? (
                  <ol className="passport-timeline">
                    {photos.map(evidence => (
                      <li key={evidence.id}>
                        <img src={resolveMediaUrl(evidence.photo)} alt={'Fotografía registrada el ' + displayDate(evidence.date)} loading="lazy" />
                        <div>
                          <strong>{displayDate(evidence.date)}</strong>
                          {evidence.notes && <p>{evidence.notes}</p>}
                          {evidence.growthStage && <small>Etapa: {GROWTH_STAGES[evidence.growthStage]}</small>}
                          {evidence.state && <small> · {PLANT_STATES[evidence.state]}</small>}
                          {evidence.heightCm !== undefined && <small> · Altura medida: {evidence.heightCm} cm</small>}
                        </div>
                      </li>
                    ))}
                  </ol>
                ) : <p className="passport-empty">Sin fotografías registradas.</p>}
                <p className="passport-disclaimer">La comparación depende del encuadre y la luz. No demuestra por sí sola crecimiento ni salud.</p>
              </div>
            </details>

            <details className="passport-disclosure">
              <summary><span>Cuidados y recomendaciones</span><small>Estimaciones según registros y especie</small></summary>
              <div className="passport-panel-body">
                {growth && (
                  <section className="passport-guidance-section">
                    <h3>Seguimiento orientativo</h3>
                    <p><strong>Estado estimado:</strong> {growth.stage}</p>
                    <p><strong>Progreso estimado:</strong> {growth.percentage}% · {growth.daysUntilHarvest} días estimados hasta cosecha</p>
                    <p><strong>Cuidados:</strong> {growth.needsWatering ? 'Revisar si necesita riego' : 'Sin aviso de riego'} · {growth.needsFertilizer ? 'Revisar abonado' : 'Sin aviso de abonado'}</p>
                  </section>
                )}
                {calendar ? (
                  <section className="passport-guidance-section">
                    <h3>Orientación por especie y calendario</h3>
                    <p>💧 Riego orientativo: cada {calendar.wateringFrequencyDays} días</p>
                    <p>🌿 Abonado orientativo: cada {calendar.fertilizerFrequencyDays} días</p>
                    <p>🌙 Referencia cultural: {calendar.lunarPhaseTip}</p>
                    <p>Época sugerida: {calendar.bestPlantingSeason}</p>
                  </section>
                ) : <p className="passport-empty">Sin recomendaciones de calendario disponibles.</p>}
                <p className="passport-disclaimer">Estas orientaciones no registran acciones automáticamente ni sustituyen la observación del huerto real.</p>
                {onActivity && !plant.archivedAt && (
                  <button type="button" className="passport-inline-action" onClick={() => onActivity()}>
                    Registrar un riego, abono, cuidado o cosecha
                  </button>
                )}
              </div>
            </details>

            <details className="passport-disclosure">
              <summary><span>Opciones de la planta</span><small>Señalética y gestión de la parcela</small></summary>
              <div className="passport-panel-body">
                <details className="passport-sub-disclosure">
                  <summary>🏷️ Ver o imprimir señalética</summary>
                  <BotanicalSignage plant={plant} />
                </details>

                {showArchive && isResponsible && (
                  <section className="passport-archive">
                    <h3>Archivar planta</h3>
                    {!archiveConfirm ? (
                      <button type="button" className="passport-archive-trigger" onClick={() => setArchiveConfirm(true)}>
                        Archivar y liberar parcela
                      </button>
                    ) : (
                      <div className="passport-archive-confirm">
                        <p>La parcela quedará libre. Las fotografías y la Bitácora se conservarán en el historial.</p>
                        <div>
                          <button type="button" disabled={archiving} onClick={() => void archivePlant()}>
                            {archiving ? 'Archivando…' : 'Confirmar archivado'}
                          </button>
                          <button type="button" disabled={archiving} onClick={() => setArchiveConfirm(false)}>Cancelar</button>
                        </div>
                      </div>
                    )}
                  </section>
                )}
                {showArchive && !isResponsible && <p className="passport-disclaimer">Solo el responsable de la comunidad puede archivar esta planta.</p>}
              </div>
            </details>
          </div>
        </div>
      </div>
    </dialog>
  )
}
