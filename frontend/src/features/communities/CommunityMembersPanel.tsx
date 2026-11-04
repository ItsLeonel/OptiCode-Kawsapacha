import { useState, useEffect, type FormEvent } from 'react'
import GardenIcon from '../my-garden/GardenIcon'
import { memberApi, type CommunityMember, type UserSession } from '../../services/api'

interface Props {
  communityId: string | null
  communityName: string
  currentUser: UserSession | null
  onClose: () => void
}

export default function CommunityMembersPanel({
  communityId,
  communityName,
  currentUser,
  onClose,
}: Props) {
  const [members, setMembers] = useState<CommunityMember[]>([])
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'RESPONSABLE' | 'CUIDADOR' | 'PARTICIPANTE'>('PARTICIPANTE')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const isCreatorOrResponsable =
    currentUser?.role === 'RESPONSABLE' ||
    members.some(m => m.userId === currentUser?.id && m.roleInCommunity === 'RESPONSABLE')

  useEffect(() => {
    if (!communityId) return
    loadMembers()
  }, [communityId])

  async function loadMembers() {
    if (!communityId) return
    try {
      setLoading(true)
      const list = await memberApi.list(communityId)
      setMembers(list)
    } catch (err: unknown) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleInvite(e: FormEvent) {
    e.preventDefault()
    if (!communityId || !email.trim()) return
    setError('')
    setMessage('')
    try {
      setLoading(true)
      await memberApi.invite(communityId, email.trim(), role)
      setMessage(`Invitación enviada exitosamente a ${email.trim()} con rol ${role}.`)
      setEmail('')
      await loadMembers()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al enviar invitación')
    } finally {
      setLoading(false)
    }
  }

  async function handleRoleChange(userId: string, newRole: string) {
    if (!communityId) return
    try {
      await memberApi.updateRole(communityId, userId, newRole)
      setMessage('Rol actualizado correctamente.')
      await loadMembers()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al cambiar rol')
    }
  }

  async function handleRemove(userId: string) {
    if (!communityId) return
    if (!confirm('¿Seguro que deseas eliminar este miembro de la comunidad?')) return
    try {
      await memberApi.remove(communityId, userId)
      setMessage('Miembro removido de la comunidad.')
      await loadMembers()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al remover miembro')
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
          background: '#fff', borderRadius: '16px', maxWidth: '640px', width: '92%', maxHeight: '90vh',
          overflowY: 'auto', padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', position: 'relative'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <span style={{ fontSize: '0.85rem', color: '#2f855a', fontWeight: 'bold' }}>COMUNIDAD: {communityName}</span>
            <h2 style={{ margin: '4px 0 0', fontSize: '1.4rem' }}>👥 Gestión de Integrantes y Roles</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', padding: '6px' }}
          >
            ✕
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

        {/* Formulario de invitación para el creador / responsable */}
        <section style={{ background: '#f7fafc', padding: '16px', borderRadius: '12px', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 10px', fontSize: '1rem', color: '#2d3748' }}>✉ Invitar nuevo miembro</h3>
          <p style={{ margin: '0 0 12px', fontSize: '0.85rem', color: '#718096' }}>
            Ingresa el correo electrónico para invitarlo. Si ya tiene cuenta en Kawsapacha, se vinculará directamente a tu comunidad.
          </p>
          <form onSubmit={handleInvite} style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'flex-end' }}>
            <div style={{ flex: '1 1 200px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#4a5568', marginBottom: '4px' }}>
                Correo electrónico
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="ejemplo@kawsapacha.ec"
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e0', fontSize: '0.9rem' }}
              />
            </div>
            <div style={{ flex: '0 1 160px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#4a5568', marginBottom: '4px' }}>
                Rol en la comunidad
              </label>
              <select
                value={role}
                onChange={e => setRole(e.target.value as 'RESPONSABLE' | 'CUIDADOR' | 'PARTICIPANTE')}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e0', fontSize: '0.9rem' }}
              >
                <option value="PARTICIPANTE">Participante 🌱</option>
                <option value="CUIDADOR">Cuidador 💧</option>
                <option value="RESPONSABLE">Responsable 👑</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={loading || !communityId}
              style={{
                padding: '9px 18px', background: '#2f855a', color: '#fff', border: 'none', borderRadius: '8px',
                fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
              }}
            >
              <GardenIcon name="community" /> Enviar invitación
            </button>
          </form>
        </section>

        {/* Listado de miembros */}
        <section>
          <h3 style={{ margin: '0 0 12px', fontSize: '1rem', color: '#2d3748' }}>
            Integrantes activos ({members.length})
          </h3>
          {members.length === 0 ? (
            <p style={{ color: '#718096', fontSize: '0.9rem', textAlign: 'center', padding: '20px 0' }}>
              {loading ? 'Cargando integrantes...' : 'No hay integrantes registrados aún en la base de datos.'}
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {members.map(member => (
                <div
                  key={member.id}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 16px', background: '#fff', border: '1px solid #e2e8f0',
                    borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '38px', height: '38px', borderRadius: '50%', background: '#c6f6d5',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#22543d'
                    }}>
                      {member.user?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: '#2d3748' }}>
                        {member.user?.name} {member.userId === currentUser?.id ? '(Tú)' : ''}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#718096' }}>{member.user?.email}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {isCreatorOrResponsable ? (
                      <select
                        value={member.roleInCommunity}
                        onChange={e => handleRoleChange(member.userId, e.target.value)}
                        style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e0', fontSize: '0.85rem' }}
                      >
                        <option value="RESPONSABLE">Responsable</option>
                        <option value="CUIDADOR">Cuidador</option>
                        <option value="PARTICIPANTE">Participante</option>
                      </select>
                    ) : (
                      <span style={{
                        padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600,
                        background: member.roleInCommunity === 'RESPONSABLE' ? '#feebc8' : '#e2e8f0',
                        color: member.roleInCommunity === 'RESPONSABLE' ? '#744210' : '#4a5568'
                      }}>
                        {member.roleInCommunity}
                      </span>
                    )}

                    {isCreatorOrResponsable && member.userId !== currentUser?.id && (
                      <button
                        type="button"
                        onClick={() => handleRemove(member.userId)}
                        title="Eliminar de la comunidad"
                        style={{ background: 'none', border: 'none', color: '#e53e3e', cursor: 'pointer', padding: '6px' }}
                      >
                        🗑
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
