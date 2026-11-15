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
  harvestApi,
  activityApi,
  resolveMediaUrl,
  type CareLog,
  type GrowthData,
  type HealthStatus,
  type CalendarTips,
  type UserSession,
} from '../../services/api'
import './garden-journal.css'
import './plant-passport-clean.css'

// ─── Badge de salud ──────────────────────────────────────────────────────────

function HealthBadge({ status }: { status: HealthStatus | undefined }) {
  if (!status) return null
  const map: Record<HealthStatus, { label: string; color: string; bg: string; border: string }> = {
    VIGOROSA:       { label: 'Salud: Vigorosa 🌿',               color: '#276749', bg: '#f0fff4', border: '#c6f6d5' },
    EXCESO_AGUA:    { label: 'Riesgo: Exceso de agua 💧⚠️',       color: '#7b341e', bg: '#fff5f5', border: '#fc8181' },
    EXCESO_ABONO:   { label: 'Riesgo: Exceso de abono 🧪⚠️',      color: '#7b341e', bg: '#fffaf0', border: '#fbd38d' },
    ESTRES_PODA:    { label: 'Estrés: Poda excesiva ✂️⚠️',        color: '#744210', bg: '#fffff0', border: '#fefcbf' },
    REQUIERE_RIEGO: { label: 'Requiere riego 🍂',                 color: '#744210', bg: '#fefcbf', border: '#f6e05e' },
    REQUIERE_ABONO: { label: 'Requiere abono 🌱',                 color: '#553c9a', bg: '#faf5ff', border: '#e9d8fd' },
  }
  const { label, color, bg, border } = map[status]
  return (
    <span style={{
      display: 'inline-block', padding: '4px 10px', borderRadius: '20px',
      background: bg, border: `1px solid ${border}`, color, fontSize: '0.78rem', fontWeight: 700,
    }}>
      {label}
    </span>
  )
}

// ─── Componente principal ────────────────────────────────────────────────────

export default function PlantPassport({
  plant,
  user,
  currentCommunityRole,
  onClose,
  onHistory,
  onPlantHarvested,
  onPlantRemoved: _onPlantRemoved,
  onEdit,
  onArchive,
  onRestore,
  onActivity,
  activeGardenId,
  activities = [],
  onActivityCreated,
}: {
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
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [logs, setLogs] = useState<CareLog[]>([])
  const [growth, setGrowth] = useState<GrowthData | null>(null)
  const [calendar, setCalendar] = useState<CalendarTips | null>(null)
  const [loading, setLoading] = useState(false)
  const [actionNotes, setActionNotes] = useState('')
  const [harvestQuantity, setHarvestQuantity] = useState('200g')
  const [showHarvestDialog, setShowHarvestDialog] = useState(false)
  const [showArchiveDialog, setShowArchiveDialog] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (plant && !dialog.open) {
      dialog.showModal()
      loadPlantData()
    }
    if (!plant && dialog.open) {
      dialog.close()
      resetState()
    }
  }, [plant])

  function resetState() {
    setLogs([])
    setGrowth(null)
    setCalendar(null)
    setMessage('')
    setError('')
    setShowHarvestDialog(false)
    setShowArchiveDialog(false)
    setActionNotes('')
  }

  async function loadPlantData() {
    if (!plant) return
    setLoading(true)
    setError('')
    try {
      if (user && !plant.id.includes('-')) {
        const [careLogs, growthData] = await Promise.all([
          careApi.list(plant.id).catch(() => []),
          careApi.getGrowth(plant.id).catch(() => null),
        ])
        setLogs(careLogs)
        setGrowth(growthData)
      } else {
        // No inventar crecimiento ni humedad a partir de una ficha local.
        setGrowth(null)
      }

      try {
        const tips = await catalogApi.getCalendarTips(plant.name)
        setCalendar(tips)
      } catch {
        setCalendar({
          wateringFrequencyDays: 3,
          fertilizerFrequencyDays: 25,
          growthCycleDays: 45,
          bestPlantingSeason: 'Todo el año',
          lunarPhaseTip: 'Sembrar en cuarto creciente para estimular el crecimiento vegetal',
        })
      }
    } catch (err: unknown) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // ─── Cuidados con validación de sobrecuidado ──────────────────────────────

  async function handleApplyCare(actionType: 'WATERING' | 'FERTILIZER' | 'PRUNING') {
    if (!plant) return
    setError('')
    setMessage('')
    const label =
      actionType === 'WATERING' ? 'Riego 💧' : actionType === 'FERTILIZER' ? 'Abono 🧪' : 'Poda ✂️'

    // Validación local de sobrecuidado (modo demo)
    if (!user || plant.id.includes('-')) {
      if (actionType === 'WATERING' && growth && !growth.needsWatering) {
        setError('⚠️ Esta planta ya tiene suficiente humedad. Regar en exceso puede pudrir sus raíces.')
        return
      }
      if (actionType === 'FERTILIZER' && growth && !growth.needsFertilizer) {
        setError('⚠️ El suelo ya está nutrido. El exceso de abono quema las raíces por toxicidad de sales.')
        return
      }
      setMessage(`¡${label} registrado en modo demostración!`)
      if (growth) {
        setGrowth({
          ...growth,
          needsWatering: actionType === 'WATERING' ? false : growth.needsWatering,
          needsFertilizer: actionType === 'FERTILIZER' ? false : growth.needsFertilizer,
          healthStatus: 'VIGOROSA',
        })
      }
      return
    }

    try {
      if (user && activeGardenId && !plant.id.includes('-')) {
        const type = actionType === 'WATERING' ? 'watering' : actionType === 'FERTILIZER' ? 'fertilizing' : 'weeding'
        const formData = new FormData()
        formData.append('type', type)
        formData.append('performedDate', new Date().toISOString().split('T')[0])
        formData.append('targetKind', 'plant')
        formData.append('plantId', plant.id)
        formData.append('plotIndex', String(plant.plot ?? 0))
        formData.append('notes', actionNotes || `Cuidado rápido: ${label}`)
        formData.append('details', JSON.stringify({ method: 'Acción rápida desde Pasaporte Vivo' }))

        await activityApi.create(activeGardenId, formData)
      } else {
        await careApi.add(plant.id, actionType, actionNotes || `Cuidado aplicado: ${label}`)
      }
      const actionName = actionType === 'WATERING' ? 'Riego' : actionType === 'FERTILIZER' ? 'Abono' : 'Limpieza'
      setMessage(`✅ ${actionName} guardado en Bitácora. Las recompensas elegibles se acreditan de inmediato.`)
      setTimeout(() => setMessage(''), 5000)
      setActionNotes('')
      await loadPlantData()
      if (onActivityCreated) onActivityCreated()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al registrar cuidado')
    }
  }

  // ─── Cosecha no-destructiva ────────────────────────────────────────────────

  async function handleHarvest() {
    if (!plant) return
    setError('')
    setMessage('')
    try {
      if (user && !plant.id.includes('-')) {
        if (activeGardenId) {
          const formData = new FormData()
          formData.append('type', 'harvest')
          formData.append('performedDate', new Date().toISOString().split('T')[0])
          formData.append('targetKind', 'plant')
          formData.append('plantId', plant.id)
          formData.append('plotIndex', String(plant.plot ?? 0))
          formData.append('notes', actionNotes || `Cosecha: ${harvestQuantity}`)
          formData.append('details', JSON.stringify({ method: harvestQuantity, harvestMode: 'partial' }))
          await activityApi.create(activeGardenId, formData)
          if (onActivityCreated) onActivityCreated()
          setMessage('🌾 ¡Cosecha registrada en Bitácora! La planta permanece sembrada y el MSP puede auditarla posteriormente.')
        } else {
          await harvestApi.harvest(plant.id, harvestQuantity, actionNotes || 'Cosecha realizada desde Pasaporte Vivo')
          setMessage('🌾 ¡Cosecha recolectada e ingresada al almacén! La planta permanece sembrada y ha iniciado un nuevo ciclo de rebrote.')
        }
      } else {
        setMessage(`🌾 ¡Cosecha de ${harvestQuantity} registrada! La planta sigue en su parcela iniciando rebrote.`)
      }
      setShowHarvestDialog(false)
      setTimeout(() => {
        if (onPlantHarvested) onPlantHarvested(plant.id)
      }, 1400)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al registrar cosecha')
    }
  }

  // ─── Renderizado ───────────────────────────────────────────────────────────

  const isRegrowing = growth?.lifecycleStatus === 'REGROWING'
  const canHarvest = ((growth?.percentage ?? 0) >= 75 && !isRegrowing) || (isRegrowing && (growth?.percentage ?? 0) >= 75)
  const hasStress = growth?.overWatered || growth?.overFertilized || growth?.overPruned
  const recentlyPruned = logs.some(l => l.actionType === 'PRUNING' && (Date.now() - new Date(l.performedAt).getTime()) < 7 * 24 * 60 * 60 * 1000) || growth?.healthStatus === 'ESTRES_PODA'
  const isResponsible = !user || currentCommunityRole === 'RESPONSABLE'

  // Estado informativo: el MSP no bloquea cuidados de una planta real.
  const isSowingPending = plant?.reviewStatus === 'PENDING' || plant?.reviewStatus === 'NEEDS_CHANGES'

  const hasPendingActivityType = (actType: GardenActivity['type']) =>
    Boolean(
      plant &&
        activities.some(
          a =>
            !a.voidedAt &&
            a.type === actType &&
            (a.reviewStatus === 'PENDING' || a.reviewStatus === 'NEEDS_CHANGES') &&
            a.target.kind === 'plant' &&
            a.target.plantId === plant.id
        )
    )
  const isWateringPending = hasPendingActivityType('watering')
  const isFertilizingPending = hasPendingActivityType('fertilizing')
  const isWeedingPending = hasPendingActivityType('weeding')
  const isHarvestPending = hasPendingActivityType('harvest')
  const pendingCareCount = [isWateringPending, isFertilizingPending, isWeedingPending, isHarvestPending].filter(Boolean).length

  const visualEvidence = (plant?.evidences ?? [])
    .filter(item => item.visualProfile)
    .sort((a, b) => a.date.localeCompare(b.date))
  const previousProfile = visualEvidence.length > 1 ? visualEvidence[visualEvidence.length - 2].visualProfile : undefined
  const currentProfile = visualEvidence.length ? visualEvidence[visualEvidence.length - 1].visualProfile : undefined
  const visualChanges = compareVisualProfiles(previousProfile, currentProfile)

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
      {plant && (
        <div className="passport-scroll">
          <div className="garden-passport-header">
            <span>
              <GardenIcon name="history" /> PASAPORTE VIVO & CUIDADOS
            </span>
            <button
              type="button"
              autoFocus
              onClick={() => dialogRef.current?.close()}
              aria-label="Cerrar Pasaporte Vivo"
            >
              <GardenIcon name="close" />
            </button>
          </div>

          <section className="passport-hero" aria-label="Resumen de la planta">
            <img
              className="garden-passport-photo passport-hero-photo"
              src={resolveMediaUrl(plant.photo)}
              alt={`Fotografía registrada de ${plant.name}`}
            />
            <div className="garden-passport-copy passport-hero-copy">
              <span className="garden-eyebrow">
                {user ? 'REGISTRO PERSISTENTE · BASE DE DATOS' : 'REGISTRO LOCAL · DEMOSTRACIÓN'}
              </span>
              <h2 id="plant-passport-title">
                {plant.name}
              </h2>
              <p className="passport-latin">
                <em>{plant.latin}</em>
              </p>
              <div className="passport-location">
                <span><strong>Parcela {plant.plot >= 0 ? plant.plot + 1 : 'archivada'}</strong></span>
                <span>Registro: {plant.date}</span>
                {plant.plantedOn && <span>Siembra: {new Date(`${plant.plantedOn}T12:00:00`).toLocaleDateString('es-EC')}</span>}
              </div>
              <div className="passport-health-tags">
                <HealthBadge status={growth?.healthStatus} />
                <span style={{
                  display: 'inline-block', padding: '4px 10px', borderRadius: '20px',
                  background: '#ebf8ff', border: '1px solid #bee3f8', color: '#2b6cb0',
                  fontSize: '0.78rem', fontWeight: 700,
                }}>
                  🌱 {PLANT_STATES[plant.state ?? 'not-documented'] ?? plant.state}
                </span>
              </div>
              <p className="passport-stage"><span aria-hidden="true">🌱</span> Etapa observada: <strong>{documentedGrowthStage(plant) ? GROWTH_STAGES[documentedGrowthStage(plant)!] : 'Sin etapa documentada'}</strong></p>
            </div>
          </section>

          <nav className="passport-toolbar" aria-label="Acciones de la ficha">
            {onEdit && <button type="button" onClick={onEdit} className="passport-primary-action">Actualizar foto y observaciones</button>}
            {onActivity && !plant.archivedAt && <button type="button" onClick={() => onActivity()} className="passport-secondary-action">Registrar actividad</button>}
            {onRestore && plant.archivedAt && <button type="button" onClick={() => void onRestore()} className="passport-secondary-action">Restaurar al espacio</button>}
            <button type="button" onClick={onHistory} className="passport-link-action"><GardenIcon name="book" /> Ver Bitácora general de cultivo</button>
          </nav>
          {!user && onActivity && !plant.archivedAt && (
            <section className="passport-care-shortcuts" aria-label="Cuidados del huerto">
              <span>Cuidados realizados</span>
              <div>
                <button type="button" onClick={() => onActivity('watering')}>💧 Riego</button>
                <button type="button" onClick={() => onActivity('fertilizing')}>🌾 Abonado</button>
                <button type="button" onClick={() => onActivity('weeding')}>🌿 Deshierbe</button>
                <button type="button" onClick={() => onActivity('harvest')}>🧺 Cosecha</button>
              </div>
              <small>Selecciona una actividad para documentar lo que hiciste en el huerto real.</small>
            </section>
          )}
          {plant.evidences?.length ? (
            <div className="passport-evidence-summary" aria-label="Resumen de evidencias fotográficas">
              <span className="passport-evidence-count"><strong>{plant.evidences.length}</strong> {plant.evidences.length === 1 ? 'fotografía registrada' : 'fotografías registradas'}</span>
              <div className="passport-preview-list">
                {[...plant.evidences].reverse().slice(0, 3).map(item => item.photo
                  ? <img key={item.id} src={resolveMediaUrl(item.photo)} alt={`Evidencia de ${item.date}`} loading="lazy" />
                  : null
                )}
              </div>
            </div>
          ) : null}

          <details className="passport-disclosure passport-evolution">
            <summary><span>🌿 Evolución fotográfica</span><small>Ver comparación y perfil de las fotografías</small></summary>
            <section aria-label="Espejo Digital Evolutivo" style={{ border: '1px solid #c6dfc6', background: '#f6fbf4', borderRadius: 12, padding: 14, marginBottom: 18 }}>
            <h3 style={{ margin: '0 0 8px', color: '#28513d', fontSize: '0.98rem' }}>🌱 Espejo Digital Evolutivo</h3>
            {plant.visualProfile
              ? <p style={{ fontSize: '0.82rem', margin: '0 0 6px' }}>
                  Perfil fotográfico: follaje {plant.visualProfile.densityLevel}/5 · amplitud {plant.visualProfile.spreadLevel}/5 · tono {plant.visualProfile.leafTone === 'light' ? 'claro' : plant.visualProfile.leafTone === 'dark' ? 'oscuro' : 'medio'}.
                  {plant.visualProfile.confidence === 'low' ? ' · Confianza baja' : ''}
                </p>
              : <p style={{ fontSize: '0.82rem', margin: '0 0 6px' }}>Aún no hay un perfil visual automático fiable asociado a esta planta.</p>}
            {visualChanges.length > 0 && <p style={{ fontSize: '0.82rem', margin: '0 0 6px' }}><strong>Cambios aparentes entre fotos:</strong> {visualChanges.join(' · ')}.</p>}
            {visualEvidence.length > 0 && <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '8px 0' }}>
              {visualEvidence.map(item => <div key={item.id} style={{ minWidth: 85, maxWidth: 120, fontSize: '0.73rem' }}>
                {item.photo && <img src={resolveMediaUrl(item.photo)} alt={'Evidencia fotográfica del ' + item.date} style={{ width: 85, height: 85, objectFit: 'cover', borderRadius: 7 }} />}
                <div>{item.date}</div><div>Cobertura: {item.visualProfile!.densityLevel}/5</div>
              </div>)}
            </div>}
            <small style={{ color: '#506357' }}>Las comparaciones dependen del encuadre y la iluminación; no prueban crecimiento real ni diagnóstico.</small>
            </section>
          </details>

          {isSowingPending && (
            <div
              style={{
                background: '#fffbeb',
                border: '2px solid #f59e0b',
                color: '#92400e',
                padding: '14px 16px',
                borderRadius: '10px',
                marginBottom: '16px',
                fontSize: '0.92rem',
              }}
            >
              <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                ℹ️ Siembra anterior todavía sin revisión institucional
              </div>
              <div style={{ marginTop: '4px', fontSize: '0.85rem', fontWeight: 400, lineHeight: 1.4 }}>
                La planta está registrada y se puede cuidar normalmente. Su evidencia también está disponible para auditoría posterior del MSP.
              </div>
            </div>
          )}
          {pendingCareCount > 0 && <p role="status" style={{ fontSize: '0.8rem', color: '#92400e' }}>{pendingCareCount} tipo(s) de actividad en revisión MSP. Puedes seguir documentando tareas reales.</p>}

          {message && (
            <div className="pending-approval-notice" style={{ background: '#ecfdf5', border: '1px solid #10b981', color: '#065f46', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.9rem' }}>
              {message}
            </div>
          )}

          {error && (
            <div style={{ background: '#fff5f5', border: '1px solid #feb2b2', color: '#9b2c2c', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.9rem' }}>
              {error}
            </div>
          )}

          {/* ─── Alerta de sobrecuidado ─── */}
          {hasStress && (
            <div style={{ background: '#fff5f5', border: '2px solid #fc8181', color: '#9b2c2c', padding: '12px 16px', borderRadius: '10px', marginBottom: '16px', fontSize: '0.88rem', lineHeight: 1.5 }}>
              <strong>⚠️ Alerta agronómica:</strong>
              {growth?.overWatered && <div>💧 Suelo saturado de agua: riesgo inminente de <strong>asfixia radicular y pudrición de raíces</strong>. Suspende el riego.</div>}
              {growth?.overFertilized && <div>🧪 Suelo sobrefertilizado: exceso de sales puede <strong>quemar las raíces</strong>. No apliques más abono.</div>}
              {growth?.overPruned && <div>✂️ Poda excesiva esta semana: la planta necesita tiempo para <strong>recuperarse del estrés</strong>.</div>}
              <div style={{ marginTop: '6px', fontSize: '0.82rem', color: '#c53030' }}>El crecimiento está pausado hasta que el estrés ceda.</div>
            </div>
          )}

          {/* ─── INDICADOR DE CRECIMIENTO DINÁMICO ─── */}
          {user && growth && <details className="passport-disclosure passport-estimate">
            <summary><span>📊 Información agronómica orientativa</span><small>Consultar estimaciones y alertas de cuidados</small></summary>
            <section style={{ background: isRegrowing ? '#fffff0' : '#f0fff4', border: `1px solid ${isRegrowing ? '#fefcbf' : '#c6f6d5'}`, borderRadius: '12px', padding: '16px', marginBottom: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div>
                <strong style={{ color: isRegrowing ? '#744210' : '#22543d', fontSize: '1rem' }}>
                  Estimación agronómica: {growth?.stage || 'Calculando...'}
                </strong>
                <div style={{ fontSize: '0.82rem', color: '#4a5568', marginTop: '2px' }}>
                  Estado documentado: <strong>{PLANT_STATES[plant.state ?? 'not-documented'] ?? plant.state}</strong>
                </div>
              </div>
              <span style={{ fontWeight: 'bold', color: isRegrowing ? '#d69e2e' : '#2f855a', fontSize: '1.1rem' }}>
                {growth ? `${growth.percentage}%` : '0%'}
              </span>
            </div>

            {/* Barra de progreso */}
            <div style={{ width: '100%', height: '14px', background: '#e2e8f0', borderRadius: '7px', overflow: 'hidden', marginBottom: '10px' }}>
              <div
                style={{
                  width: `${growth ? growth.percentage : 0}%`,
                  height: '100%',
                  background: isRegrowing
                    ? 'linear-gradient(90deg, #f6e05e 0%, #d69e2e 100%)'
                    : 'linear-gradient(90deg, #68d391 0%, #38a169 100%)',
                  borderRadius: '7px',
                  transition: 'width 0.4s ease-in-out',
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#4a5568' }}>
              <span>
                {isRegrowing
                  ? (canHarvest
                    ? '✨ Rebrote maduro — ¡lista para cosechar de nuevo!'
                    : `🌱 En recuperación: lista para cosechar en aprox. ${growth?.daysUntilHarvest ?? 0} días`)
                  : `Días estimados para cosecha: `}
                {!isRegrowing && <strong>{growth?.daysUntilHarvest ?? 0} días</strong>}
              </span>
              <span>
                {growth?.needsWatering ? (
                  <strong style={{ color: '#d69e2e' }}>💧 Requiere riego</strong>
                ) : (
                  <span style={{ color: '#38a169' }}>✓ Riego al día</span>
                )}
              </span>
            </div>

            <small style={{ display: 'block', fontSize: '0.72rem', color: '#718096', marginTop: '6px', fontStyle: 'italic' }}>
              ℹ️ Estimación orientativa agroecológica según bitácora y fecha de siembra. La evidencia documental válida del huerto real corresponde a las fotografías y registros aportados por el usuario.
            </small>

            {logs.length > 0 && (
              <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px dashed #c6f6d5', fontSize: '0.78rem', color: '#276749' }}>
                <strong>Historial reciente:</strong>{' '}
                {logs.slice(0, 3).map(l => (
                  <span key={l.id} style={{ marginRight: '8px' }}>
                    {l.actionType === 'WATERING' ? '💧 Riego' : l.actionType === 'FERTILIZER' ? '🧪 Abono' : '✂️ Poda'} ({new Date(l.performedAt).toLocaleDateString('es-EC')})
                  </span>
                ))}
              </div>
            )}
          </section>
          </details>}

          {/* Los visitantes registran cuidados mediante el formulario documental único. */}
          {user && <section style={{ marginBottom: '18px' }}>
            <h3 style={{ fontSize: '0.95rem', color: '#2d3748', marginBottom: '8px' }}>
              🌿 Registrar cuidado realizado hoy:
            </h3>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
              <button
                type="button"
                onClick={() => {
                  if (!growth?.needsWatering) {
                    setError('⚠️ Esta planta ya tiene suficiente humedad. Regar en exceso puede pudrir sus raíces.')
                    return
                  }
                  void handleApplyCare('WATERING')
                }}
                disabled={loading}
                title={!growth?.needsWatering ? 'Suelo húmedo — no requiere riego ahora' : 'Registrar riego'}
                style={{
                  flex: 1, padding: '10px', borderRadius: '8px',
                  border: (growth?.needsWatering ? '1px solid #bee3f8' : '1px solid #c6f6d5'),
                  background: (growth?.needsWatering ? '#ebf8ff' : '#f0fff4'),
                  color: (growth?.needsWatering ? '#2b6cb0' : '#276749'),
                  fontWeight: 600, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  opacity: loading ? 0.6 : 1,
                }}
              >
                {growth?.needsWatering ? '💧 Regué la planta' : '✓ Suelo húmedo'}
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!growth?.needsFertilizer) {
                    setError('⚠️ El suelo ya está nutrido. El exceso de abono quema las raíces por toxicidad de sales.')
                    return
                  }
                  void handleApplyCare('FERTILIZER')
                }}
                disabled={loading}
                title={!growth?.needsFertilizer ? 'Suelo nutrido — no requiere abono ahora' : 'Registrar abono'}
                style={{
                  flex: 1, padding: '10px', borderRadius: '8px',
                  border: (growth?.needsFertilizer ? '1px solid #feebc8' : '1px solid #c6f6d5'),
                  background: (growth?.needsFertilizer ? '#fffaf0' : '#f0fff4'),
                  color: (growth?.needsFertilizer ? '#c05621' : '#276749'),
                  fontWeight: 600, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  opacity: loading ? 0.6 : 1,
                }}
              >
                {growth?.needsFertilizer ? '🧪 Apliqué abono' : '✓ Suelo nutrido'}
              </button>

              <button
                type="button"
                onClick={() => {
                  if (recentlyPruned) {
                    setError('⚠️ La planta ya se encuentra podada y con su mantenimiento al día. Podar con demasiada frecuencia causa estrés a la planta.')
                    return
                  }
                  void handleApplyCare('PRUNING')
                }}
                disabled={loading}
                title={recentlyPruned ? 'Poda y mantenimiento al día' : 'Registrar poda o mantenimiento'}
                style={{
                  flex: 1, padding: '10px', borderRadius: '8px',
                  border: (recentlyPruned ? '1px solid #c6f6d5' : '1px solid #e2e8f0'),
                  background: (recentlyPruned ? '#f0fff4' : '#edf2f7'),
                  color: (recentlyPruned ? '#276749' : '#4a5568'),
                  fontWeight: 600, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  opacity: loading ? 0.6 : 1,
                }}
              >
                {recentlyPruned ? '✓ Poda al día' : '✂️ Poda / Mantenimiento'}
              </button>
            </div>
            <input
              type="text"
              value={actionNotes}
              onChange={e => setActionNotes(e.target.value)}
              placeholder="Nota opcional (ej: se usó abono de compostaje casero)..."
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e0', fontSize: '0.85rem' }}
            />
          </section>}

          {/* ─── SUGERENCIAS DEL CALENDARIO AGRÍCOLA Y FASE LUNAR ─── */}
          {user && calendar && (
            <section style={{ background: '#faf5ff', border: '1px solid #e9d8fd', borderRadius: '12px', padding: '14px', marginBottom: '18px' }}>
              <h3 style={{ margin: '0 0 6px', fontSize: '0.9rem', color: '#6b46c1' }}>
                🌙 Calendario Agrícola Tradicional & Saberes:
              </h3>
              <p style={{ margin: '0 0 6px', fontSize: '0.85rem', color: '#44337a', lineHeight: 1.4 }}>
                <strong>Influencia lunar:</strong> {calendar.lunarPhaseTip}
              </p>
              <div style={{ display: 'flex', gap: '16px', fontSize: '0.8rem', color: '#553c9a', flexWrap: 'wrap' }}>
                <span>🌱 Época ideal: <strong>{calendar.bestPlantingSeason}</strong></span>
                <span>💧 Riego cada: <strong>{calendar.wateringFrequencyDays} días</strong></span>
                <span>🧪 Abonar cada: <strong>{calendar.fertilizerFrequencyDays} días</strong></span>
              </div>
            </section>
          )}

          {/* La cosecha local se documenta con evidencia desde Registrar actividad. */}
          {user && <section style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px', marginBottom: '16px' }}>
            {!showHarvestDialog ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <span style={{ fontSize: '0.85rem', color: '#718096' }}>
                  {canHarvest
                    ? (isRegrowing ? '✨ ¡Rebrote maduro! La planta está lista para una nueva cosecha.' : '✨ ¡Tu planta está lista para cosechar!')
                    : (isRegrowing
                      ? `🌱 En recuperación: lista para cosechar en aprox. ${growth?.daysUntilHarvest ?? 0} días.`
                      : 'La planta necesita más tiempo para madurar antes de cosechar.')}
                </span>
                <button
                  type="button"
                  onClick={() => setShowHarvestDialog(true)}
                  disabled={!canHarvest || loading}
                  title={!canHarvest ? (isRegrowing ? `La planta aún está en rebrote. Espera ${growth?.daysUntilHarvest ?? 0} días más.` : 'Espera a que la planta madure (≥75%)') : 'Cosechar'}
                  style={{
                    padding: '8px 16px', background: canHarvest ? '#38a169' : '#a0aec0', color: '#fff', border: 'none',
                    borderRadius: '8px', fontWeight: 600,
                    cursor: canHarvest ? 'pointer' : 'not-allowed',
                    opacity: canHarvest ? 1 : 0.65,
                  }}
                >
                  {'🌾 Cosechar planta'}
                </button>
              </div>
            ) : (
              <div style={{ background: '#fffff0', border: '1px solid #fefcbf', padding: '14px', borderRadius: '10px' }}>
                <h4 style={{ margin: '0 0 8px', color: '#744210' }}>Registrar Cosecha de {plant.name}</h4>
                <p style={{ margin: '0 0 10px', fontSize: '0.82rem', color: '#744210' }}>
                  🌱 La planta permanecerá en su parcela e iniciará un nuevo ciclo de rebrote. El producto recolectado se registrará en el inventario comunitario.
                </p>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input
                    type="text"
                    value={harvestQuantity}
                    onChange={e => setHarvestQuantity(e.target.value)}
                    placeholder="Cantidad (ej: 250g hojas secas)"
                    style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e0', fontSize: '0.85rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => void handleHarvest()}
                    disabled={loading}
                    style={{ padding: '8px 16px', background: '#d69e2e', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Confirmar cosecha
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowHarvestDialog(false)}
                    style={{ background: 'none', border: 'none', color: '#718096', cursor: 'pointer', fontSize: '0.85rem' }}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </section>}

          {/* ─── BOTÓN UNIFICADO ARCHIVAR Y LIBERAR PARCELA (SOLO RESPONSABLE) ─── */}
          {!plant.archivedAt && onArchive && (
            <section style={{ borderTop: '1px solid #fed7aa', paddingTop: '14px', marginBottom: '14px' }}>
              {isResponsible ? (
                !showArchiveDialog ? (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.82rem', color: '#718096' }}>
                      ¿Quieres archivar esta ficha y liberar la parcela?
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowArchiveDialog(true)}
                      disabled={loading}
                      style={{
                        padding: '7px 14px',
                        background: '#fffaf0',
                        color: '#c05621',
                        border: '1px solid #fbd38d',
                        borderRadius: '8px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      📦 Archivar planta y liberar parcela
                    </button>
                  </div>
                ) : (
                  <div style={{ background: '#fffaf0', border: '2px solid #f6ad55', padding: '14px', borderRadius: '10px' }}>
                    <h4 style={{ margin: '0 0 8px', color: '#9c4221' }}>📦 Confirmar archivado de {plant.name}</h4>
                    <p style={{ margin: '0 0 12px', fontSize: '0.82rem', color: '#7b341e', lineHeight: 1.5 }}>
                      La <strong>Parcela {plant.plot >= 0 ? plant.plot + 1 : 'actual'}</strong> quedará libre para sembrar otro cultivo. Toda la información, fotos y bitácora de riegos/abonos se conservarán en la pestaña <strong>"Archivadas"</strong> de Mis Plantas y en <strong>"Mi historia"</strong>.
                    </p>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        type="button"
                        onClick={async () => {
                          setLoading(true)
                          try {
                            await onArchive()
                            setShowArchiveDialog(false)
                            dialogRef.current?.close()
                          } catch (cause) {
                            setError(cause instanceof Error ? cause.message : 'No fue posible archivar en el servidor.')
                          } finally {
                            setLoading(false)
                          }
                        }}
                        disabled={loading}
                        style={{
                          padding: '8px 18px',
                          background: '#dd6b20',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '8px',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        {loading ? 'Archivando...' : '📦 Sí, archivar y liberar'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowArchiveDialog(false)}
                        disabled={loading}
                        style={{ background: 'none', border: 'none', color: '#718096', cursor: 'pointer', fontSize: '0.85rem' }}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#f7fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px 14px' }}>
                  <span style={{ fontSize: '1.2rem' }}>🔒</span>
                  <div>
                    <strong style={{ fontSize: '0.85rem', color: '#4a5568', display: 'block' }}>Permiso de Responsable requerido</strong>
                    <span style={{ fontSize: '0.78rem', color: '#718096' }}>El archivado de plantas y liberación de parcelas está reservado para el Responsable de la comunidad. Los participantes no tienen permisos para archivar.</span>
                  </div>
                </div>
              )}
            </section>
          )}


          {!!plant.evidences?.length && (
            <details className="passport-disclosure passport-evidence-history">
              <summary><span>📸 Fotos y observaciones</span><small>Historial completo de cambios documentados</small></summary>
              <section aria-label="Evidencias de la planta">
                <ol className="journal-evidences">
                  {[...plant.evidences].reverse().map(evidence => (
                    <li key={evidence.id}>
                      <time dateTime={evidence.date}>{evidence.date}</time>
                      <p>{evidence.notes}</p>
                      {evidence.state && <small>{PLANT_STATES[evidence.state]}</small>}
                      {evidence.growthStage && <p><strong>Etapa declarada: {GROWTH_STAGES[evidence.growthStage]}</strong>{evidence.reviewStatus === 'PENDING' && <small> · Pendiente de revisión MSP</small>}</p>}
                      {evidence.heightCm !== undefined && <p>Altura medida: {evidence.heightCm} cm</p>}
                      {evidence.photo && <img src={resolveMediaUrl(evidence.photo)} alt={'Evidencia de ' + plant.name + ' del ' + evidence.date}/>}
                    </li>
                  ))}
                </ol>
              </section>
            </details>
          )}
          <details className="passport-disclosure passport-signage">
            <summary><span>🏷️ Señalética de la planta</span><small>Consultar o imprimir la ficha para el huerto físico</small></summary>
            <BotanicalSignage plant={plant} />
          </details>
        </div>
      )}
    </dialog>
  )
}
