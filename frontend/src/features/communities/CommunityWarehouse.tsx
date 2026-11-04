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
  onClose: () => void
}

export default function CommunityWarehouse({
  communityId,
  communityName,
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

  useEffect(() => {
    if (!communityId) return
    loadData()
  }, [communityId, tab])

  async function loadData() {
    if (!communityId) return
    setLoading(true)
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
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateResource(e: FormEvent) {
    e.preventDefault()
    if (!communityId || !name.trim()) return
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
    if (!communityId) return
    try {
      await resourceApi.update(communityId, resourceId, { status: newStatus })
      await loadData()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al actualizar estado')
    }
  }

  async function handleDeleteResource(resourceId: string) {
    if (!communityId) return
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
    <div className="community-dialog-backdrop" onClick={onClose} style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div
        className="community-dialog-content"
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: '16px', maxWidth: '700px', width: '92%', maxHeight: '90vh',
          overflowY: 'auto', padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', position: 'relative'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <span style={{ fontSize: '0.85rem', color: '#2f855a', fontWeight: 'bold' }}>COMUNIDAD: {communityName}</span>
            <h2 style={{ margin: '4px 0 0', fontSize: '1.4rem' }}>🌾 Almacén Comunitario & Cosechas</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', padding: '6px' }}
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '2px solid #e2e8f0', marginBottom: '20px', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setTab('HARVESTS')}
            style={{
              padding: '10px 18px', border: 'none', background: 'none', fontWeight: 600, cursor: 'pointer',
              borderBottom: tab === 'HARVESTS' ? '3px solid #2f855a' : '3px solid transparent',
              color: tab === 'HARVESTS' ? '#2f855a' : '#718096'
            }}
          >
            🧺 Registro de Cosechas
          </button>
          <button
            type="button"
            onClick={() => setTab('INVENTORY')}
            style={{
              padding: '10px 18px', border: 'none', background: 'none', fontWeight: 600, cursor: 'pointer',
              borderBottom: tab === 'INVENTORY' ? '3px solid #2f855a' : '3px solid transparent',
              color: tab === 'INVENTORY' ? '#2f855a' : '#718096'
            }}
          >
            🛠 Herramientas y Recursos ({resources.length})
          </button>
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

        {tab === 'HARVESTS' && (
          <section>
            <p style={{ color: '#718096', fontSize: '0.88rem', marginBottom: '16px' }}>
              Historial de plantas medicinales recolectadas en los huertos de esta comunidad.
            </p>
            {harvests.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 0', color: '#a0aec0' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🌱</div>
                <p>Aún no hay cosechas registradas en esta comunidad.</p>
                <small>Cuando coseches una planta desde el Pasaporte Vivo, aparecerá aquí.</small>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {harvests.map(h => (
                  <div
                    key={h.id}
                    style={{
                      padding: '14px 18px', background: '#f0fff4', border: '1px solid #c6f6d5',
                      borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 'bold', color: '#22543d', fontSize: '1.05rem' }}>
                        🌿 {h.speciesName} <span style={{ fontSize: '0.85rem', color: '#4a5568', fontStyle: 'italic' }}>({h.speciesLatinName})</span>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#4a5568', marginTop: '4px' }}>
                        Cantidad cosechada: <strong>{h.quantity}</strong> · Huerto: {h.realGarden?.name || 'Huerto comunitario'}
                      </div>
                      {h.notes && (
                        <div style={{ fontSize: '0.8rem', color: '#718096', marginTop: '4px' }}>
                          Nota: {h.notes}
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '0.8rem', color: '#718096' }}>
                      <div>{new Date(h.harvestDate).toLocaleDateString('es-EC')}</div>
                      <div>Por: {h.harvestedBy?.name || 'Miembro'}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {tab === 'INVENTORY' && (
          <section>
            {/* Formulario nuevo recurso */}
            <form onSubmit={handleCreateResource} style={{ background: '#f7fafc', padding: '16px', borderRadius: '12px', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: '0 0 10px', fontSize: '1rem', color: '#2d3748' }}>➕ Registrar herramienta o insumo</h3>
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
                    <option value="SUPPLY">Insumo / Abono 🧪</option>
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
                      placeholder="unidades, kg, sacos"
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
                    padding: '8px 16px', background: '#2f855a', color: '#fff', border: 'none', borderRadius: '8px',
                    fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap'
                  }}
                >
                  Guardar recurso
                </button>
              </div>
            </form>

            {/* Listado de recursos */}
            <h3 style={{ margin: '0 0 12px', fontSize: '1rem', color: '#2d3748' }}>Inventario de la comunidad</h3>
            {resources.length === 0 ? (
              <p style={{ color: '#718096', fontSize: '0.9rem', textAlign: 'center', padding: '20px 0' }}>
                No hay herramientas ni insumos registrados en el almacén.
              </p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
                {resources.map(r => (
                  <div
                    key={r.id}
                    style={{
                      padding: '14px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <strong style={{ fontSize: '1rem', color: '#2d3748' }}>
                          {r.category === 'TOOL' ? '⛏' : r.category === 'SUPPLY' ? '🧪' : '🌱'} {r.name}
                        </strong>
                        <button
                          type="button"
                          onClick={() => handleDeleteResource(r.id)}
                          style={{ background: 'none', border: 'none', color: '#e53e3e', cursor: 'pointer', fontSize: '0.9rem' }}
                        >
                          ✕
                        </button>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#4a5568', marginTop: '6px' }}>
                        Cantidad disponible: <strong>{r.quantity} {r.unit}</strong>
                      </div>
                      {r.description && (
                        <div style={{ fontSize: '0.8rem', color: '#718096', marginTop: '4px' }}>
                          {r.description}
                        </div>
                      )}
                    </div>

                    <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.75rem', color: '#a0aec0' }}>Estado:</span>
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
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  )
}
