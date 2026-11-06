import { useState, useEffect, type FormEvent } from 'react'
import {
  harvestApi,
  resourceApi,
  type HarvestRecord,
  type CommunityResource,
} from '../../services/api'

interface Props {
  communityId: string | null
  communityName: string
  currentCommunityRole?: 'RESPONSABLE' | 'CUIDADOR' | 'PARTICIPANTE' | null
  onClose: () => void
}

export default function CommunityWarehouse({
  communityId,
  communityName,
  currentCommunityRole,
  onClose,
}: Props) {
  const [tab, setTab] = useState<'HARVESTS' | 'INVENTORY'>('HARVESTS')
  const [harvests, setHarvests] = useState<HarvestRecord[]>([])
  const [resources, setResources] = useState<CommunityResource[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  // Formulario nuevo recurso
  const [name, setName] = useState('')
  const [category, setCategory] = useState<'TOOL' | 'SUPPLY' | 'SEED'>('TOOL')
  const [quantity, setQuantity] = useState(1)
  const [unit, setUnit] = useState('unidades')
  const [description, setDescription] = useState('')

  const isResponsable = !currentCommunityRole || currentCommunityRole === 'RESPONSABLE'
  const canManageSupplies = isResponsable || currentCommunityRole === 'CUIDADOR'

  useEffect(() => {
    if (!communityId) return
    loadData()
  }, [communityId, tab])

  async function loadData() {
    if (!communityId) return
    setLoading(true)
    setError('')
    try {
      if (tab === 'HARVESTS') {
        const list = await harvestApi.listByCommunity(communityId)
        setHarvests(list)
      } else {
        const list = await resourceApi.list(communityId)
        setResources(list)
      }
    } catch (err: unknown) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Error al cargar los datos del almacén')
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateResource(e: FormEvent) {
    e.preventDefault()
    if (!communityId || !name.trim()) return
    if (!canManageSupplies) {
      setError('Solo Cuidadores y Responsables pueden registrar recursos en el almacén.')
      return
    }
    setError('')
    setMessage('')
    try {
      setLoading(true)
      await resourceApi.create(communityId, {
        name: name.trim(),
        category,
        quantity,
        unit,
        description: description.trim(),
        status: 'DISPONIBLE',
      })
      setMessage(`Recurso "${name.trim()}" agregado al inventario de la comunidad.`)
      setName('')
      setDescription('')
      setQuantity(1)
      await loadData()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al registrar recurso')
    } finally {
      setLoading(false)
    }
  }

  async function handleStatusChange(resourceId: string, newStatus: string) {
    if (!communityId || !canManageSupplies) return
    try {
      await resourceApi.update(communityId, resourceId, { status: newStatus })
      await loadData()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al actualizar estado')
    }
  }

  async function handleDeleteResource(resourceId: string) {
    if (!communityId) return
    if (!isResponsable) {
      setError('Solo el Responsable de la comunidad puede eliminar herramientas del almacén.')
      return
    }
    if (!confirm('¿Seguro que deseas eliminar este recurso del inventario?')) return
    try {
      await resourceApi.remove(communityId, resourceId)
      setMessage('Recurso eliminado del almacén.')
      await loadData()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al eliminar recurso')
    }
  }

  return (
    <div
      className="community-dialog-backdrop"
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        backdropFilter: 'blur(3px)',
      }}
    >
      <div
        className="community-dialog-content"
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: '16px',
          maxWidth: '720px',
          width: '92%',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '24px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
          position: 'relative',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <span style={{ fontSize: '0.85rem', color: '#2f855a', fontWeight: 'bold' }}>COMUNIDAD: {communityName}</span>
            <h2 style={{ margin: '4px 0 0', fontSize: '1.4rem', color: '#1a202c' }}>🌾 Almacén Comunitario & Cosechas</h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={loadData}
              title="Refrescar almacén"
              style={{
                background: '#edf2f7',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.85rem',
                padding: '6px 12px',
                borderRadius: '8px',
                fontWeight: 600,
              }}
            >
              🔄 Recargar
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar almacén"
              style={{
                background: '#edf2f7',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1.1rem',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ✕
            </button>
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

        {/* Pestañas: Cosechas vs Inventario */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid #edf2f7', marginBottom: '18px' }}>
          <button
            type="button"
            onClick={() => setTab('HARVESTS')}
            style={{
              padding: '10px 16px',
              border: 'none',
              background: 'none',
              fontWeight: tab === 'HARVESTS' ? 700 : 500,
              color: tab === 'HARVESTS' ? '#2f855a' : '#718096',
              borderBottom: tab === 'HARVESTS' ? '3px solid #2f855a' : '3px solid transparent',
              cursor: 'pointer',
              fontSize: '0.95rem',
            }}
          >
            🧺 Registro de Cosechas ({harvests.length})
          </button>
          <button
            type="button"
            onClick={() => setTab('INVENTORY')}
            style={{
              padding: '10px 16px',
              border: 'none',
              background: 'none',
              fontWeight: tab === 'INVENTORY' ? 700 : 500,
              color: tab === 'INVENTORY' ? '#2f855a' : '#718096',
              borderBottom: tab === 'INVENTORY' ? '3px solid #2f855a' : '3px solid transparent',
              cursor: 'pointer',
              fontSize: '0.95rem',
            }}
          >
            ⛏ Herramientas e Insumos ({resources.length})
          </button>
        </div>

        {/* ─── PESTAÑA: COSECHAS ─── */}
        {tab === 'HARVESTS' && (
          <section>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#718096' }}>
                Cosechas recolectadas por integrantes de la comunidad y registradas automáticamente.
              </p>
            </div>

            {loading ? (
              <p style={{ textAlign: 'center', padding: '24px 0', color: '#718096' }}>Cargando cosechas...</p>
            ) : harvests.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 16px', background: '#f7fafc', borderRadius: '12px', border: '1px dashed #cbd5e0' }}>
                <p style={{ margin: '0 0 6px', fontSize: '1.05rem', color: '#4a5568' }}>Aún no hay cosechas registradas.</p>
                <small style={{ color: '#718096' }}>Cuando un miembro coseche una planta desde el Pasaporte Vivo, aparecerá aquí automáticamente.</small>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {harvests.map(h => (
                  <div
                    key={h.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      background: '#f0fff4',
                      border: '1px solid #c6f6d5',
                      borderRadius: '10px',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '1.2rem' }}>🌿</span>
                        <strong style={{ color: '#22543d' }}>{h.speciesName}</strong>
                        {h.speciesLatinName && <em style={{ fontSize: '0.8rem', color: '#718096' }}>({h.speciesLatinName})</em>}
                        <span style={{ background: '#38a169', color: '#fff', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700 }}>
                          {h.quantity}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#4a5568', marginTop: '4px' }}>
                        Cosechado por: <strong>{h.harvestedBy?.name || 'Comunitario'}</strong> · {new Date(h.harvestDate).toLocaleDateString('es-EC')}
                        {h.notes && <span> · Nota: "{h.notes}"</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ─── PESTAÑA: INVENTARIO / BODEGA ─── */}
        {tab === 'INVENTORY' && (
          <section>
            {/* Formulario nuevo recurso */}
            {canManageSupplies ? (
              <form onSubmit={handleCreateResource} style={{ background: '#f7fafc', padding: '16px', borderRadius: '12px', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ margin: '0 0 10px', fontSize: '0.95rem', color: '#2d3748' }}>➕ Agregar herramienta o insumo al almacén</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', marginBottom: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#4a5568', marginBottom: '4px' }}>Nombre</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Pala, Regadera, Abono compost..."
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e0', fontSize: '0.9rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#4a5568', marginBottom: '4px' }}>Categoría</label>
                    <select
                      value={category}
                      onChange={e => setCategory(e.target.value as 'TOOL' | 'SUPPLY' | 'SEED')}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e0', fontSize: '0.9rem' }}
                    >
                      <option value="TOOL">Herramienta ⛏</option>
                      <option value="SUPPLY">Insumo / Cosecha 🧪</option>
                      <option value="SEED">Semilla / Esqueje 🌱</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#4a5568', marginBottom: '4px' }}>Cantidad y unidad</label>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <input
                        type="number"
                        min="1"
                        required
                        value={quantity}
                        onChange={e => setQuantity(Number(e.target.value))}
                        style={{ width: '70px', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e0', fontSize: '0.9rem' }}
                      />
                      <input
                        type="text"
                        value={unit}
                        onChange={e => setUnit(e.target.value)}
                        placeholder="unidades, kg, porciones"
                        style={{ flex: 1, padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e0', fontSize: '0.9rem' }}
                      />
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input
                    type="text"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Detalles de estado o ubicación física (opcional)..."
                    style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e0', fontSize: '0.9rem' }}
                  />
                  <button
                    type="submit"
                    disabled={loading || !communityId}
                    style={{
                      padding: '8px 16px',
                      background: '#2f855a',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Guardar recurso
                  </button>
                </div>
              </form>
            ) : (
              <div
                role="note"
                style={{
                  background: '#f7fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '12px 16px',
                  marginBottom: '18px',
                  color: '#718096',
                  fontSize: '0.88rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span>ℹ️</span>
                <span>El registro y gestión de herramientas e insumos está reservado para Cuidadores y Responsables.</span>
              </div>
            )}

            {/* Listado de recursos y cosechas automáticas */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', color: '#2d3748' }}>
                Inventario de la comunidad ({resources.length})
              </h3>
              <small style={{ color: '#718096' }}>Incluye herramientas manuales y cosechas reflejadas</small>
            </div>

            {loading ? (
              <p style={{ textAlign: 'center', padding: '24px 0', color: '#718096' }}>Cargando inventario...</p>
            ) : resources.length === 0 ? (
              <p style={{ color: '#718096', fontSize: '0.9rem', textAlign: 'center', padding: '24px 0' }}>
                No hay herramientas ni insumos registrados aún en el almacén.
              </p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
                {resources.map(r => {
                  const isHarvestSupply = r.name.startsWith('Cosecha') || (r.category === 'SUPPLY' && r.name.toLowerCase().includes('cosecha'))
                  return (
                    <div
                      key={r.id}
                      style={{
                        padding: '14px',
                        background: isHarvestSupply ? '#f0fff4' : '#ffffff',
                        border: `1px solid ${isHarvestSupply ? '#9ae6b4' : '#e2e8f0'}`,
                        borderRadius: '10px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <strong style={{ fontSize: '1rem', color: isHarvestSupply ? '#22543d' : '#2d3748' }}>
                            {isHarvestSupply ? '🧺' : r.category === 'TOOL' ? '⛏' : r.category === 'SUPPLY' ? '🧪' : '🌱'} {r.name}
                          </strong>
                          {isResponsable && (
                            <button
                              type="button"
                              onClick={() => handleDeleteResource(r.id)}
                              style={{ background: 'none', border: 'none', color: '#e53e3e', cursor: 'pointer', fontSize: '0.9rem' }}
                              title="Eliminar recurso (Solo Responsable)"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#4a5568', marginTop: '6px' }}>
                          Cantidad disponible: <strong>{r.quantity} {r.unit}</strong>
                          {isHarvestSupply && (
                            <span style={{ marginLeft: '8px', fontSize: '0.72rem', background: '#c6f6d5', color: '#22543d', padding: '2px 6px', borderRadius: '8px', fontWeight: 700 }}>
                              Cosecha fresca
                            </span>
                          )}
                        </div>
                        {r.description && (
                          <div style={{ fontSize: '0.8rem', color: '#718096', marginTop: '4px' }}>
                            {r.description}
                          </div>
                        )}
                      </div>

                      <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.75rem', color: '#a0aec0' }}>Estado:</span>
                        {canManageSupplies ? (
                          <select
                            value={r.status}
                            onChange={e => handleStatusChange(r.id, e.target.value)}
                            style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #cbd5e0', fontSize: '0.8rem' }}
                          >
                            <option value="DISPONIBLE">Disponible ✅</option>
                            <option value="EN_USO">En uso ⏳</option>
                            <option value="MANTENIMIENTO">Mantenimiento 🔧</option>
                            <option value="AGOTADO">Agotado ❌</option>
                          </select>
                        ) : (
                          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#4a5568' }}>
                            {r.status === 'DISPONIBLE' ? 'Disponible ✅' : r.status === 'EN_USO' ? 'En uso ⏳' : r.status === 'MANTENIMIENTO' ? 'Mantenimiento 🔧' : 'Agotado ❌'}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  )
}
