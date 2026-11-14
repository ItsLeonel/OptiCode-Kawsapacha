import { useEffect, useRef, useState, type ReactNode } from 'react'
import GardenIcon from './GardenIcon'
import { PLANT_STATES, type GardenPlant } from './garden'
import { GROWTH_STAGES, documentedGrowthStage } from './growth-stages'
import { compareVisualProfiles } from './plant-visual-profile'
import type { ActivityType } from './journal/activities'
import {
  careApi,
  catalogApi,
  type CareLog,
  type GrowthData,
  type HealthStatus,
  type CalendarTips,
  type UserSession,
} from '../../services/api'
import './garden-journal.css'
import BotanicalSignage from './BotanicalSignage'

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
  onPlantRemoved: _onPlantRemoved,
  onEdit,
  onArchive,
  onRestore,
  onActivity,
  activityItems,
}: {
  plant: GardenPlant | null
  user?: UserSession | null
  currentCommunityRole?: 'RESPONSABLE' | 'PARTICIPANTE' | null
  onClose: () => void
  onHistory: () => void
  onPlantHarvested?: (plantId: string) => void
  onPlantRemoved?: (plantId: string) => void
  onEdit?: () => void
  onArchive?: () => void | Promise<void>
  onRestore?: () => string | null | Promise<string | null>
  onActivity?: (type?: ActivityType) => void
  activityItems?: ReactNode
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [logs, setLogs] = useState<CareLog[]>([])
  const [growth, setGrowth] = useState<GrowthData | null>(null)
  const [calendar, setCalendar] = useState<CalendarTips | null>(null)
  const [loading, setLoading] = useState(false)
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
    setShowArchiveDialog(false)
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
        // Sin servidor no se inventan porcentajes, estado de salud ni madurez.
        setGrowth(null)
      }

      try {
        const tips = await catalogApi.getCalendarTips(plant.name)
        setCalendar(tips)
      } catch {
        setCalendar(null)
      }
    } catch (err: unknown) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // ─── Renderizado ───────────────────────────────────────────────────────────

  const isRegrowing = growth?.lifecycleStatus === 'REGROWING'
  const hasStress = growth?.overWatered || growth?.overFertilized || growth?.overPruned
  const isResponsible = !user || currentCommunityRole === 'RESPONSABLE'
  const visualEvidence = (plant?.evidences ?? []).filter(item => item.visualProfile).sort((a, b) => a.date.localeCompare(b.date))
  const previousProfile = visualEvidence.length > 1 ? visualEvidence[visualEvidence.length - 2].visualProfile : undefined
  const currentProfile = visualEvidence.length ? visualEvidence[visualEvidence.length - 1].visualProfile : undefined
  const visualChanges = compareVisualProfiles(previousProfile, currentProfile)

  return (
    <dialog
      ref={dialogRef}
      className="garden-passport"
      aria-labelledby="plant-passport-title"
      onClose={onClose}
      onClick={event => {
        if (event.target === event.currentTarget) dialogRef.current?.close()
      }}
      style={{ maxWidth: '620px', width: '92%', borderRadius: '16px', padding: '0', border: 'none' }}
    >
      {plant && (
        <div style={{ padding: '24px', maxHeight: '90vh', overflowY: 'auto' }}>
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

          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', margin: '16px 0' }}>
            <img
              className="garden-passport-photo"
              src={plant.photo}
              alt={`Fotografía registrada de ${plant.name}`}
              style={{ width: '110px', height: '110px', objectFit: 'cover', borderRadius: '12px', border: '2px solid #cbd5e0' }}
            />
            <div className="garden-passport-copy" style={{ margin: 0 }}>
              <span className="garden-eyebrow">
                {user ? 'REGISTRO PERSISTENTE · BASE DE DATOS' : 'REGISTRO LOCAL · DEMOSTRACIÓN'}
              </span>
              <h2 id="plant-passport-title" style={{ margin: '4px 0' }}>
                {plant.name}
              </h2>
              <p style={{ margin: '0 0 8px', color: '#4a5568' }}>
                <em>{plant.latin}</em>
              </p>
              <div style={{ fontSize: '0.85rem', color: '#718096' }}>
                Ubicación: <strong>Parcela {plant.plot + 1}</strong> · Registrada: {plant.date}
                {plant.plantedOn && ` · Sembrada: ${new Date(`${plant.plantedOn}T12:00:00`).toLocaleDateString('es-EC')}`}
              </div>
              <div style={{ marginTop: '6px' }}>
                <HealthBadge status={growth?.healthStatus} />
              </div>
              <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#276749', margin: '9px 0 0' }}>
                Etapa reflejada en Mi Jardín: {documentedGrowthStage(plant) ? GROWTH_STAGES[documentedGrowthStage(plant)!] : 'Sin observación visual documentada'}
              </p>
              <small style={{ color: '#718096' }}>
                {user ? 'La sincronización de etapas observadas está pendiente de la API.' : 'La etapa cambia solamente con fotografías registradas en este navegador.'}
              </small>
            </div>
          </div>

          <BotanicalSignage plant={plant}/>
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
                {item.photo && <img src={item.photo} alt={'Evidencia fotográfica del ' + item.date} style={{ width: 85, height: 85, objectFit: 'cover', borderRadius: 7 }} />}
                <div>{item.date}</div><div>Cobertura: {item.visualProfile!.densityLevel}/5</div>
              </div>)}
            </div>}
            <small style={{ color: '#506357' }}>Las comparaciones dependen del encuadre y la iluminación; no prueban crecimiento real ni diagnóstico. {user ? 'La persistencia entre dispositivos de este perfil requiere integrar la API de evidencias #35/#43.' : 'Este historial está guardado solo en este navegador.'}</small>
          </section>

          {message && (
            <div style={{ background: '#e6fffa', border: '1px solid #38b2ac', color: '#234e52', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.9rem' }}>
              ✓ {message}
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
              <div style={{ marginTop: '6px', fontSize: '0.82rem', color: '#c53030' }}>Esta alerta es orientativa; no confirma el estado real del suelo o de la planta.</div>
            </div>
          )}

          {/* ─── INDICADOR DE CRECIMIENTO DINÁMICO ─── */}
          <section style={{ background: isRegrowing ? '#fffff0' : '#f0fff4', border: `1px solid ${isRegrowing ? '#fefcbf' : '#c6f6d5'}`, borderRadius: '12px', padding: '16px', marginBottom: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <strong style={{ color: isRegrowing ? '#744210' : '#22543d', fontSize: '1rem' }}>
                Estimación agronómica: {growth?.stage || 'Sin estimación'}
              </strong>
              <span style={{ fontWeight: 'bold', color: isRegrowing ? '#d69e2e' : '#2f855a', fontSize: '1.1rem' }}>
                {growth ? `${growth.percentage}%` : 'Sin dato'}
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
                {!growth ? 'Sin pronóstico agronómico disponible' : isRegrowing
                  ? 'Indicador orientativo de rebrote; no confirma su estado real'
                  : 'Días estimados para cosecha: '}
                {growth && !isRegrowing && <strong>{growth.daysUntilHarvest} días</strong>}
              </span>
              <span>
                {!growth ? (
                  <span>No hay medición de humedad</span>
                ) : growth.needsWatering ? (
                  <strong style={{ color: '#d69e2e' }}>💧 Riego sugerido (orientativo)</strong>
                ) : (
                  <span style={{ color: '#38a169' }}>Riego no sugerido hoy (estimación)</span>
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

          {/* Un solo registro verificable: no simular éxito desde el Pasaporte. */}
          <section style={{ marginBottom:'18px' }}>
            <h3 style={{ fontSize:'0.95rem', color:'#2d3748', marginBottom:'8px' }}>🌿 Documentar actividad realizada</h3>
            <p style={{ color:'#718096', fontSize:'0.82rem' }}>El jardín solo cambia de etapa con nueva evidencia fotográfica. Regar o abonar no provoca crecimiento automático.</p>
            {onActivity && !plant.archivedAt && <div style={{ display:'flex', flexWrap:'wrap', gap:'8px' }}>
              <button type="button" className="rg-outline-button" onClick={() => onActivity('watering')}>💧 Riego</button>
              <button type="button" className="rg-outline-button" onClick={() => onActivity('fertilizing')}>🌾 Abonado</button>
              <button type="button" className="rg-outline-button" onClick={() => onActivity('weeding')}>🌿 Deshierbe</button>
              <button type="button" className="rg-outline-button" onClick={() => onActivity('observation')}>📷 Seguimiento</button>
            </div>}
          </section>

          {/* ─── SUGERENCIAS DEL CALENDARIO AGRÍCOLA Y FASE LUNAR ─── */}
          {calendar && (
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

          {/* Una cosecha real se registra aunque el estimador de madurez no la espere. */}
          <section style={{ borderTop:'1px solid #e2e8f0', paddingTop:'16px', marginBottom:'16px' }}>
            <p style={{ fontSize:'0.84rem', color:'#718096' }}>Si realizaste una cosecha, documenta tipo, cantidad medida y fotografía desde la Bitácora. No se inventa rebrote ni cantidad.</p>
            {onActivity && !plant.archivedAt && <button type="button" className="garden-solid-button" onClick={() => onActivity('harvest')}>🧺 Registrar cosecha con evidencia</button>}
          </section>

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

          <div className="journal-passport-actions" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', margin: '12px 0' }}>
            {onEdit && <button type="button" onClick={onEdit} className="rg-outline-button" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>Actualizar foto y observaciones</button>}
            {onActivity && !plant.archivedAt && <button type="button" onClick={() => onActivity()} className="rg-outline-button" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>Registrar actividad</button>}
            {onRestore && plant.archivedAt && <button type="button" onClick={() => void onRestore()} className="rg-outline-button" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>Restaurar al espacio</button>}
          </div>

          <button
            type="button"
            className="garden-solid-button"
            onClick={onHistory}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            <GardenIcon name="book" /> Ver Bitácora general de cultivo
          </button>
          {/* Evidencias de main */}
          {!!plant.evidences?.length && <section aria-label="Evidencias de la planta"><h3>Fotos y observaciones</h3><ol className="journal-evidences">{[...plant.evidences].reverse().map(evidence => <li key={evidence.id}><time dateTime={evidence.date}>{evidence.date}</time><p>{evidence.notes}</p>{evidence.state && <small>{PLANT_STATES[evidence.state]}</small>}{evidence.growthStage && <p><strong>Etapa documentada: {GROWTH_STAGES[evidence.growthStage]}</strong></p>}{evidence.heightCm !== undefined && <p>Altura medida: {evidence.heightCm} cm</p>}{evidence.photo && <img src={evidence.photo} alt={'Evidencia de ' + plant.name + ' del ' + evidence.date}/>}</li>)}</ol></section>}
          {activityItems}
        </div>
      )}
    </dialog>
  )
}
