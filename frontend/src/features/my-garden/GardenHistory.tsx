import GardenIcon from './GardenIcon'
import type { GardenPlant } from './garden'
import { useState, useEffect } from 'react'
import ActivityList from './journal/ActivityList'
import { ACTIVITY_TYPES, type GardenActivity } from './journal/activities'
import { careApi, type CareLog } from '../../services/api'
import './garden-journal.css'

function getRelativeDays(dateStr: string): string {
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays <= 0) return 'Hoy'
  if (diffDays === 1) return 'Ayer'
  return `Hace ${diffDays} días`
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('es-EC', { year: 'numeric', month: 'short', day: 'numeric' })
}

interface NormalizedLog {
  id: string
  actionType: string
  icon: string
  label: string
  date: string
  relative: string
  notes: string
  responsible?: string
}

export default function GardenHistory({
  plants,
  onRegister,
  onSelect,
  onRealGarden,
  activities = [],
  onActivity,
  onVoid,
}: {
  plants: GardenPlant[]
  onRegister: () => void
  onSelect: (plant: GardenPlant) => void
  onRealGarden: () => void
  activities?: GardenActivity[]
  onActivity?: () => void
  onVoid?: (id: string, reason: string) => Promise<void>
}) {
  const [type, setType] = useState('all')
  const [archivedTab, setArchivedTab] = useState(false)
  const [selectedPlant, setSelectedPlant] = useState<GardenPlant | null>(null)
  const [apiLogs, setApiLogs] = useState<CareLog[]>([])
  const [loadingLogs, setLoadingLogs] = useState(false)
  const [backendCareActivities, setBackendCareActivities] = useState<GardenActivity[]>([])

  useEffect(() => {
    const realPlants = plants.filter(p => !p.id.includes('-'))
    if (!realPlants.length) {
      setBackendCareActivities([])
      return
    }

    Promise.all(
      realPlants.map(async p => {
        try {
          const logs = await careApi.list(p.id)
          return logs.map((log): GardenActivity => {
            let actType: 'watering' | 'fertilizing' | 'observation' = 'observation'
            if (log.actionType === 'WATERING') actType = 'watering'
            else if (log.actionType === 'FERTILIZER') actType = 'fertilizing'

            return {
              id: log.id,
              gardenId: '',
              type: actType,
              date: log.performedAt.slice(0, 10),
              responsible: log.user?.name || 'Comunidad',
              target: {
                kind: 'plant',
                plantId: log.plantId,
                plot: p.plot,
              },
              notes: log.notes,
              details: {},
              createdAt: log.performedAt,
              validation: 'local-v1',
              photoIds: [],
            }
          })
        } catch {
          return []
        }
      })
    ).then(results => {
      setBackendCareActivities(results.flat())
    })
  }, [plants])

  const unifiedActivities: GardenActivity[] = [
    ...activities,
    ...backendCareActivities.filter(ba => !activities.some(a => a.id === ba.id)),
  ]

  useEffect(() => {
    if (!selectedPlant) {
      setApiLogs([])
      return
    }
    if (!selectedPlant.id.includes('-')) {
      setLoadingLogs(true)
      careApi
        .list(selectedPlant.id)
        .then(logs => setApiLogs(logs))
        .catch(() => setApiLogs([]))
        .finally(() => setLoadingLogs(false))
    } else {
      setApiLogs([])
    }
  }, [selectedPlant?.id])

  // Normalizar registros del backend y actividades locales
  const combinedLogs: NormalizedLog[] = []

  // 1. Logs de API
  for (const log of apiLogs) {
    let icon = '🌱'
    let label = log.actionType
    if (log.actionType === 'WATERING') {
      icon = '💧'
      label = 'Riego'
    } else if (log.actionType === 'FERTILIZER') {
      icon = '🌿'
      label = 'Abono orgánico'
    } else if (log.actionType === 'PRUNING') {
      icon = '✂️'
      label = 'Poda'
    } else if (log.actionType === 'PEST_CONTROL') {
      icon = '🛡️'
      label = 'Control ecológico de plagas'
    }

    combinedLogs.push({
      id: log.id,
      actionType: log.actionType,
      icon,
      label,
      date: log.performedAt,
      relative: getRelativeDays(log.performedAt),
      notes: log.notes,
      responsible: log.user?.name,
    })
  }

  // 2. Actividades locales correspondientes a esta planta (si no están en backend o modo demo)
  if (selectedPlant) {
    const localMatches = activities.filter(
      a => a.target?.kind === 'plant' && a.target.plantId === selectedPlant.id
    )
    for (const act of localMatches) {
      if (combinedLogs.some(l => l.id === act.id)) continue
      let icon = '🌱'
      let label: string = String(act.type)
      const actType = String(act.type)
      if (actType === 'watering') {
        icon = '💧'
        label = 'Riego'
      } else if (actType === 'fertilizing') {
        icon = '🌿'
        label = 'Abono orgánico'
      } else if (actType === 'pruning') {
        icon = '✂️'
        label = 'Poda'
      } else if (actType === 'harvest') {
        icon = '🌾'
        label = 'Cosecha'
      }
      combinedLogs.push({
        id: act.id,
        actionType: act.type.toUpperCase(),
        icon,
        label,
        date: act.date,
        relative: getRelativeDays(act.date),
        notes: act.notes || '',
        responsible: act.responsible,
      })
    }
  }

  // Ordenar cronológicamente descendente (más reciente primero)
  combinedLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  // Cálculos estadísticos
  const wateringLogs = combinedLogs.filter(l => l.actionType === 'WATERING')
  const fertilizerLogs = combinedLogs.filter(l => l.actionType === 'FERTILIZER')
  const pruningLogs = combinedLogs.filter(l => l.actionType === 'PRUNING')
  const harvestLogs = combinedLogs.filter(l => l.actionType === 'HARVEST')

  const lastWatering = wateringLogs[0]
  const lastFertilizer = fertilizerLogs[0]

  return (
    <div className="garden-history">
      <section className="journal-history" aria-label="Actividades agrícolas guardadas">
        <div className="journal-heading">
          <h2>Actividades de mi huerto</h2>
          {onActivity && (
            <button type="button" onClick={onActivity}>
              Registrar actividad
            </button>
          )}
        </div>
        <p>
          Bitácora de acciones documentadas. Las imágenes y los registros se conservan en el huerto y
          el historial.
        </p>
        <label>
          Filtrar actividades
          <select
            className="journal-filter"
            aria-label="Filtrar actividades"
            value={type}
            onChange={event => setType(event.target.value)}
          >
            <option value="all">Todas las actividades</option>
            {Object.entries(ACTIVITY_TYPES).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <ActivityList
          activities={unifiedActivities.filter(activity => type === 'all' || activity.type === type)}
          plants={plants}
          onSelect={onSelect}
          onVoid={onVoid}
        />
      </section>

      {/* ─── HISTORIAL DETALLADO DE CUIDADOS POR PLANTA (LOGS) ─── */}
      {selectedPlant && (
        <section
          style={{
            background: '#fffdf4',
            border: '2px solid #84a98c',
            borderRadius: '20px',
            padding: '22px',
            marginBottom: '24px',
            boxShadow: '0 4px 14px rgba(47, 76, 53, 0.08)',
          }}
          aria-label={`Historial de cuidados de ${selectedPlant.name}`}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: '12px',
              flexWrap: 'wrap',
              borderBottom: '1px solid #d9d5b6',
              paddingBottom: '14px',
              marginBottom: '16px',
            }}
          >
            <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
              <img
                src={selectedPlant.photo}
                alt=""
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '12px',
                  objectFit: 'cover',
                  border: '2px solid #a3b18a',
                }}
              />
              <div>
                <span
                  style={{
                    display: 'inline-block',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: selectedPlant.archivedAt ? '#c05621' : '#2f855a',
                    background: selectedPlant.archivedAt ? '#feebc8' : '#e6fffa',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    marginBottom: '4px',
                  }}
                >
                  {selectedPlant.archivedAt
                    ? '📦 Archivada (parcela libre)'
                    : selectedPlant.plot >= 0
                    ? `Parcela ${selectedPlant.plot + 1}`
                    : 'En jardín'}
                </span>
                <h3 style={{ margin: '0 0 2px', color: '#2f4c35', fontSize: '1.25rem' }}>
                  Historial de cuidados: {selectedPlant.name}
                </h3>
                <p style={{ margin: 0, fontStyle: 'italic', fontSize: '0.85rem', color: '#667085' }}>
                  {selectedPlant.latin} · Sembrada el {selectedPlant.date}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => onSelect(selectedPlant)}
                style={{
                  padding: '7px 14px',
                  borderRadius: '10px',
                  background: '#354f52',
                  color: '#fff',
                  border: 'none',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                📋 Abrir Pasaporte Vivo
              </button>
              <button
                type="button"
                onClick={() => setSelectedPlant(null)}
                style={{
                  padding: '7px 12px',
                  borderRadius: '10px',
                  background: '#f4ede1',
                  color: '#555',
                  border: '1px solid #d3bd86',
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                }}
              >
                ✕ Cerrar detalle
              </button>
            </div>
          </div>

          {/* Tarjetas resumen de cuidados */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
              gap: '12px',
              marginBottom: '20px',
            }}
          >
            {/* Riegos */}
            <div
              style={{
                background: '#ebf8ff',
                border: '1px solid #bee3f8',
                borderRadius: '12px',
                padding: '12px 14px',
              }}
            >
              <div style={{ fontSize: '0.82rem', color: '#2b6cb0', fontWeight: 600 }}>
                💧 Riegos totales
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#2c5282', margin: '4px 0' }}>
                {wateringLogs.length} {wateringLogs.length === 1 ? 'riego' : 'riegos'}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#4a5568' }}>
                {lastWatering
                  ? `Último: ${lastWatering.relative} (${formatDate(lastWatering.date)})`
                  : 'Sin riegos registrados'}
              </div>
            </div>

            {/* Abonos */}
            <div
              style={{
                background: '#f0fff4',
                border: '1px solid #c6f6d5',
                borderRadius: '12px',
                padding: '12px 14px',
              }}
            >
              <div style={{ fontSize: '0.82rem', color: '#276749', fontWeight: 600 }}>
                🌿 Abonos aplicados
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#22543d', margin: '4px 0' }}>
                {fertilizerLogs.length} {fertilizerLogs.length === 1 ? 'abono' : 'abonos'}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#4a5568' }}>
                {lastFertilizer
                  ? `Último: ${lastFertilizer.relative} (${formatDate(lastFertilizer.date)})`
                  : 'Sin abono registrado'}
              </div>
            </div>

            {/* Podas */}
            <div
              style={{
                background: '#fffaf0',
                border: '1px solid #fbd38d',
                borderRadius: '12px',
                padding: '12px 14px',
              }}
            >
              <div style={{ fontSize: '0.82rem', color: '#c05621', fontWeight: 600 }}>
                ✂️ Podas realizadas
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#7b341e', margin: '4px 0' }}>
                {pruningLogs.length}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#4a5568' }}>
                {pruningLogs[0] ? `Última: ${pruningLogs[0].relative}` : 'Sin podas registradas'}
              </div>
            </div>

            {/* Cosechas */}
            <div
              style={{
                background: '#faf5ff',
                border: '1px solid #e9d8fd',
                borderRadius: '12px',
                padding: '12px 14px',
              }}
            >
              <div style={{ fontSize: '0.82rem', color: '#6b46c1', fontWeight: 600 }}>
                🌾 Cosechas
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#44337a', margin: '4px 0' }}>
                {harvestLogs.length}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#4a5568' }}>
                {harvestLogs[0] ? `Última: ${harvestLogs[0].relative}` : 'Sin cosechas registradas'}
              </div>
            </div>
          </div>

          {/* Timeline de registros cronológicos */}
          <h4
            style={{
              margin: '0 0 12px',
              fontSize: '0.95rem',
              color: '#2f4c35',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>📜</span> Bitácora cronológica de cuidados ({combinedLogs.length})
          </h4>

          {loadingLogs ? (
            <p style={{ fontSize: '0.85rem', color: '#718096' }}>Cargando bitácora de cuidados...</p>
          ) : combinedLogs.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {combinedLogs.map(log => (
                <div
                  key={log.id}
                  style={{
                    background: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: '12px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                  }}
                >
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '1.3rem', lineHeight: 1 }}>{log.icon}</span>
                    <div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <strong style={{ fontSize: '0.9rem', color: '#2d3748' }}>{log.label}</strong>
                        {log.responsible && (
                          <span
                            style={{
                              fontSize: '0.72rem',
                              color: '#4a5568',
                              background: '#edf2f7',
                              padding: '1px 6px',
                              borderRadius: '6px',
                            }}
                          >
                            Por: {log.responsible}
                          </span>
                        )}
                      </div>
                      {log.notes && (
                        <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#4a5568' }}>
                          {log.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        color: '#2b6cb0',
                        background: '#ebf8ff',
                        padding: '2px 8px',
                        borderRadius: '12px',
                      }}
                    >
                      {log.relative}
                    </span>
                    <div style={{ fontSize: '0.72rem', color: '#718096', marginTop: '2px' }}>
                      {formatDate(log.date)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div
              style={{
                background: '#fff',
                border: '1px dashed #cbd5e0',
                borderRadius: '10px',
                padding: '16px',
                textAlign: 'center',
                color: '#718096',
                fontSize: '0.85rem',
              }}
            >
              🌱 Aún no se han registrado riegos ni abonos para esta planta.
              <br />
              Puedes registrar cuidados desde su Pasaporte Vivo o con el botón superior "Registrar
              actividad".
            </div>
          )}
        </section>
      )}

      {/* ─── LISTA DE FICHAS DE PLANTAS ─── */}
      <section aria-labelledby="cultivation-log-title">
        <div className="garden-history-heading">
          <div>
            <h2 id="cultivation-log-title">Fichas de plantas</h2>
            <p>
              Haz clic en cualquier planta para ver su bitácora de riegos, abonos y cuidados.
            </p>
          </div>
          <button type="button" className="outline" onClick={onRealGarden}>
            Mi terreno <GardenIcon name="arrow" />
          </button>
        </div>

        {/* Pestañas para separar plantas en el jardín vs archivadas */}
        <div
          className="journal-tabs"
          role="group"
          aria-label="Estado de las fichas de plantas"
          style={{ margin: '14px 0 18px' }}
        >
          <button
            type="button"
            aria-pressed={!archivedTab}
            onClick={() => setArchivedTab(false)}
          >
            En el jardín
          </button>
          <button
            type="button"
            aria-pressed={archivedTab}
            onClick={() => setArchivedTab(true)}
          >
            Archivadas
          </button>
        </div>

        {plants.filter(plant => Boolean(plant.archivedAt) === archivedTab).length ? (
          <ol className="garden-history-events">
            {[...plants.filter(plant => Boolean(plant.archivedAt) === archivedTab)]
              .reverse()
              .map(plant => {
                const isSelected = selectedPlant?.id === plant.id
                return (
                  <li
                    key={plant.id}
                    onClick={() => setSelectedPlant(plant)}
                    style={{
                      cursor: 'pointer',
                      outline: isSelected ? '3px solid #52796f' : 'none',
                      borderRadius: '14px',
                      transition: 'all 0.15s ease',
                      background: isSelected ? '#f0fdf4' : undefined,
                    }}
                  >
                    <img src={plant.photo} alt="" />
                    <div>
                      <small>
                        {plant.date} ·{' '}
                        {plant.archivedAt
                          ? '📦 Archivada'
                          : plant.plot >= 0
                          ? `Parcela ${plant.plot + 1}`
                          : 'En huerto'}
                      </small>
                      <h3>Registro de {plant.name}</h3>
                      <p>
                        <em>{plant.latin}</em>
                      </p>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation()
                            setSelectedPlant(plant)
                          }}
                          style={{
                            background: isSelected ? '#52796f' : '#f4e7bf',
                            color: isSelected ? '#fff' : '#28462d',
                          }}
                        >
                          📜 {isSelected ? 'Viendo bitácora' : 'Ver bitácora de cuidados'}
                        </button>
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation()
                            onSelect(plant)
                          }}
                        >
                          Abrir Pasaporte Vivo <GardenIcon name="arrow" />
                        </button>
                      </div>
                    </div>
                  </li>
                )
              })}
          </ol>
        ) : (
          <div className="garden-history-empty">
            <GardenIcon name="book" />
            <h3>{archivedTab ? 'No hay fichas archivadas' : 'No hay plantas en el jardín'}</h3>
            <p>
              {archivedTab
                ? 'Las plantas archivadas aparecerán aquí cuando archives una ficha y liberes su parcela.'
                : 'Registra una fotografía de tu planta para verla cultivándose en tu huerto.'}
            </p>
            {!archivedTab && (
              <button
                type="button"
                className="garden-solid-button"
                onClick={onRegister}
              >
                Registrar mi primera planta <GardenIcon name="arrow" />
              </button>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
