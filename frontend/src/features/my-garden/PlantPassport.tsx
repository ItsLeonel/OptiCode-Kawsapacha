import { useEffect, useRef, useState } from 'react'
import GardenIcon from './GardenIcon'
import type { GardenPlant } from './garden'
import {
  careApi,
  catalogApi,
  harvestApi,
  type CareLog,
  type GrowthData,
  type CalendarTips,
  type UserSession,
} from '../../services/api'

export default function PlantPassport({
  plant,
  user,
  onClose,
  onHistory,
  onPlantHarvested,
}: {
  plant: GardenPlant | null
  user?: UserSession | null
  onClose: () => void
  onHistory: () => void
  onPlantHarvested?: (plantId: string) => void
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [logs, setLogs] = useState<CareLog[]>([])
  const [growth, setGrowth] = useState<GrowthData | null>(null)
  const [calendar, setCalendar] = useState<CalendarTips | null>(null)
  const [loading, setLoading] = useState(false)
  const [actionNotes, setActionNotes] = useState('')
  const [harvestQuantity, setHarvestQuantity] = useState('200g')
  const [showHarvestDialog, setShowHarvestDialog] = useState(false)
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
    setActionNotes('')
  }

  async function loadPlantData() {
    if (!plant) return
    setLoading(true)
    setError('')
    try {
      // Si la planta tiene ID válido en el backend
      if (user && !plant.id.includes('-')) {
        const [careLogs, growthData] = await Promise.all([
          careApi.list(plant.id).catch(() => []),
          careApi.getGrowth(plant.id).catch(() => null),
        ])
        setLogs(careLogs)
        setGrowth(growthData)
      } else {
        // Modo demostración local simulado
        setGrowth({
          percentage: 45,
          stage: 'Brote 🌿',
          daysUntilHarvest: 25,
          needsWatering: true,
          needsFertilizer: false,
          lifecycleStatus: 'GROWING',
          plantingDate: new Date().toISOString(),
        })
      }

      // Cargar tips del calendario botánico
      try {
        const tips = await catalogApi.getCalendarTips(plant.name)
        setCalendar(tips)
      } catch {
        // Fallback genérico si no se encuentra por nombre
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

  async function handleApplyCare(actionType: 'WATERING' | 'FERTILIZER' | 'PRUNING') {
    if (!plant) return
    setError('')
    setMessage('')
    const label =
      actionType === 'WATERING' ? 'Riego 💧' : actionType === 'FERTILIZER' ? 'Abono 🧪' : 'Poda ✂'
    try {
      if (user && !plant.id.includes('-')) {
        await careApi.add(plant.id, actionType, actionNotes || `Cuidado aplicado: ${label}`)
        setMessage(`¡${label} registrado con éxito!`)
        setActionNotes('')
        await loadPlantData()
      } else {
        // Demo en memoria
        setMessage(`¡${label} registrado en modo demostración!`)
        if (growth) {
          setGrowth({
            ...growth,
            percentage: Math.min(100, growth.percentage + 15),
            needsWatering: actionType === 'WATERING' ? false : growth.needsWatering,
            needsFertilizer: actionType === 'FERTILIZER' ? false : growth.needsFertilizer,
            stage:
              growth.percentage + 15 >= 75
                ? 'Lista para cosechar ✨'
                : growth.percentage + 15 >= 50
                ? 'Crecimiento 🪴'
                : 'Brote 🌿',
          })
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al registrar cuidado')
    }
  }

  async function handleHarvest() {
    if (!plant) return
    setError('')
    setMessage('')
    try {
      if (user && !plant.id.includes('-')) {
        await harvestApi.harvest(plant.id, harvestQuantity, actionNotes || 'Cosecha realizada desde Pasaporte Vivo')
        setMessage(`¡Planta cosechada! Se agregaron ${harvestQuantity} al almacén comunitario.`)
      } else {
        setMessage(`¡Cosecha de ${harvestQuantity} registrada con éxito!`)
      }
      setTimeout(() => {
        if (onPlantHarvested) onPlantHarvested(plant.id)
        dialogRef.current?.close()
      }, 1200)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al registrar cosecha')
    }
  }

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
                Ubicación: <strong>Parcela {plant.plot + 1}</strong> · Sembrada: {plant.date}
              </div>
            </div>
          </div>

          {message && (
            <div style={{ background: '#e6fffa', border: '1px solid #38b2ac', color: '#234e52', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.9rem' }}>
              ✓ {message}
            </div>
          )}

          {error && (
            <div style={{ background: '#fff5f5', border: '1px solid #feb2b2', color: '#9b2c2c', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.9rem' }}>
              ⚠ {error}
            </div>
          )}

          {/* ─── INDICADOR DE CRECIMIENTO DINÁMICO ─── */}
          <section style={{ background: '#f0fff4', border: '1px solid #c6f6d5', borderRadius: '12px', padding: '16px', marginBottom: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <strong style={{ color: '#22543d', fontSize: '1rem' }}>
                Etapa: {growth?.stage || 'Calculando...'}
              </strong>
              <span style={{ fontWeight: 'bold', color: '#2f855a', fontSize: '1.1rem' }}>
                {growth ? `${growth.percentage}%` : '0%'}
              </span>
            </div>

            {/* Barra de progreso */}
            <div style={{ width: '100%', height: '14px', background: '#e2e8f0', borderRadius: '7px', overflow: 'hidden', marginBottom: '10px' }}>
              <div
                style={{
                  width: `${growth ? growth.percentage : 0}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #68d391 0%, #38a169 100%)',
                  borderRadius: '7px',
                  transition: 'width 0.4s ease-in-out',
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#4a5568' }}>
              <span>Días estimados para cosecha: <strong>{growth?.daysUntilHarvest ?? 0} días</strong></span>
              <span>
                {growth?.needsWatering ? (
                  <strong style={{ color: '#d69e2e' }}>💧 Requiere riego</strong>
                ) : (
                  <span style={{ color: '#38a169' }}>✓ Riego al día</span>
                )}
              </span>
            </div>

            {logs.length > 0 && (
              <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px dashed #c6f6d5', fontSize: '0.78rem', color: '#276749' }}>
                <strong>Historial reciente:</strong>{' '}
                {logs.slice(0, 3).map(l => (
                  <span key={l.id} style={{ marginRight: '8px' }}>
                    {l.actionType === 'WATERING' ? '💧 Riego' : l.actionType === 'FERTILIZER' ? '🧪 Abono' : '✂ Poda'} ({new Date(l.performedAt).toLocaleDateString('es-EC')})
                  </span>
                ))}
              </div>
            )}
          </section>

          {/* ─── ACCIONES DE CUIDADO ─── */}
          <section style={{ marginBottom: '18px' }}>
            <h3 style={{ fontSize: '0.95rem', color: '#2d3748', marginBottom: '8px' }}>
              🌿 Registrar cuidado realizado hoy:
            </h3>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
              <button
                type="button"
                onClick={() => handleApplyCare('WATERING')}
                disabled={loading}
                style={{
                  flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #bee3f8',
                  background: '#ebf8ff', color: '#2b6cb0', fontWeight: 600, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                }}
              >
                💧 Regué la planta
              </button>
              <button
                type="button"
                onClick={() => handleApplyCare('FERTILIZER')}
                disabled={loading}
                style={{
                  flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #feebc8',
                  background: '#fffaf0', color: '#c05621', fontWeight: 600, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                }}
              >
                🧪 Apliqué abono
              </button>
              <button
                type="button"
                onClick={() => handleApplyCare('PRUNING')}
                disabled={loading}
                style={{
                  flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0',
                  background: '#edf2f7', color: '#4a5568', fontWeight: 600, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                }}
              >
                ✂ Poda / Mantenimiento
              </button>
            </div>
            <input
              type="text"
              value={actionNotes}
              onChange={e => setActionNotes(e.target.value)}
              placeholder="Nota opcional (ej: se usó abono de compostaje casero)..."
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e0', fontSize: '0.85rem' }}
            />
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

          {/* ─── ACCIÓN DE COSECHA ─── */}
          <section style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px', marginBottom: '16px' }}>
            {!showHarvestDialog ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: '#718096' }}>
                  {growth && growth.percentage >= 75
                    ? '✨ ¡Tu planta está lista para cosechar!'
                    : 'Puedes cosecharla cuando lo desees para transferirla al almacén.'}
                </span>
                <button
                  type="button"
                  onClick={() => setShowHarvestDialog(true)}
                  style={{
                    padding: '8px 16px', background: '#38a169', color: '#fff', border: 'none',
                    borderRadius: '8px', fontWeight: 600, cursor: 'pointer'
                  }}
                >
                  🌾 Cosechar planta
                </button>
              </div>
            ) : (
              <div style={{ background: '#fffff0', border: '1px solid #fefcbf', padding: '14px', borderRadius: '10px' }}>
                <h4 style={{ margin: '0 0 8px', color: '#744210' }}>Registrar Cosecha de {plant.name}</h4>
                <p style={{ margin: '0 0 10px', fontSize: '0.82rem', color: '#744210' }}>
                  Al cosechar, la parcela quedará libre para un nuevo cultivo y el producto recolectado se registrará en el inventario comunitario.
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
                    onClick={handleHarvest}
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
          </section>

          <button
            type="button"
            className="garden-solid-button"
            onClick={onHistory}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            <GardenIcon name="book" /> Ver Bitácora general de cultivo
          </button>
        </div>
      )}
    </dialog>
  )
}
