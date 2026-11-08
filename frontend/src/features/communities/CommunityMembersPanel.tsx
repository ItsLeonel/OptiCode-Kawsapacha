import { useState, useEffect, type FormEvent } from 'react'
import GardenIcon from '../my-garden/GardenIcon'
import { memberApi, type CommunityMember, type UserSession } from '../../services/api'

interface Props {
  communityId: string | null
  communityName: string
  currentUser: UserSession | null
  onClose: () => void
  onMembersUpdated?: () => void
}

export default function CommunityMembersPanel({
  communityId,
  communityName,
  currentUser,
  onClose,
  onMembersUpdated,
}: Props) {
  const [members, setMembers] = useState<CommunityMember[]>([])
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'RESPONSABLE' | 'PARTICIPANTE'>('PARTICIPANTE')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  // Determinar rol del usuario actual en la comunidad (solo RESPONSABLE o PARTICIPANTE)
  const currentRole =
    members.find(m => m.userId === currentUser?.id)?.roleInCommunity ??
    (currentUser?.role === 'RESPONSABLE' ? 'RESPONSABLE' : 'PARTICIPANTE')

  const isResponsable = currentRole === 'RESPONSABLE'

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
    const cleanEmail = email.trim().toLowerCase()
    if (!communityId || !cleanEmail) return
    setError('')
    setMessage('')
    try {
      setLoading(true)
      await memberApi.invite(communityId, cleanEmail, role)
      setMessage(`Invitación enviada con éxito a ${email.trim()} con rol propuesto "${role}". El usuario la recibirá en sus notificaciones.`)
      setEmail('')
      await loadMembers()
      onMembersUpdated?.()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al enviar invitación')
    } finally {
      setLoading(false)
    }
  }

  async function handleRoleChange(userId: string, newRole: string) {
    if (!communityId) return
    setError('')
    try {
      await memberApi.updateRole(communityId, userId, newRole)
      setMessage('Rol actualizado correctamente.')
      await loadMembers()
      onMembersUpdated?.()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al cambiar rol')
    }
  }

  async function handleRemove(userId: string, isPending: boolean) {
    if (!communityId) return
    const actionText = isPending ? 'cancelar esta invitación' : 'eliminar este miembro de la comunidad'
    if (!confirm(`¿Seguro que deseas ${actionText}?`)) return
    setError('')
    try {
      await memberApi.remove(communityId, userId)
      setMessage(isPending ? 'Invitación cancelada.' : 'Miembro removido de la comunidad.')
      await loadMembers()
      onMembersUpdated?.()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al remover miembro')
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
          maxWidth: '680px',
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
            <h2 style={{ margin: '4px 0 0', fontSize: '1.4rem', color: '#1a202c' }}>👥 Gestión de Integrantes</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar panel"
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

        {message && (
          <div style={{ background: '#e6fffa', border: '1px solid #38b2ac', color: '#234e52', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.9rem' }}>
            ✓ {message}
          </div>
        )}

        {error && (
          <div
            role="alert"
            style={{
              background: '#fff5f5',
              border: '2px solid #e53e3e',
              color: '#9b2c2c',
              padding: '12px 16px',
              borderRadius: '10px',
              marginBottom: '16px',
              fontSize: '0.92rem',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span style={{ fontSize: '1.2rem' }}>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Formulario de invitación: solo visible para el Responsable */}
        {isResponsable ? (
          <section style={{ background: '#f7fafc', padding: '16px', borderRadius: '12px', marginBottom: '22px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 8px', fontSize: '1rem', color: '#2d3748' }}>✉ Invitar nuevo miembro</h3>
            <p style={{ margin: '0 0 12px', fontSize: '0.85rem', color: '#718096' }}>
              Ingresa el correo electrónico del usuario registrado. Recibirá una notificación para aceptar o rechazar la invitación a tu comunidad.
            </p>
            <form onSubmit={handleInvite} style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'flex-end' }}>
              <div style={{ flex: '1 1 200px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#4a5568', marginBottom: '4px' }}>
                  Correo electrónico registrado
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="ejemplo@kawsapacha.ec"
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e0', fontSize: '0.9rem' }}
                />
              </div>
              <div style={{ flex: '0 1 170px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#4a5568', marginBottom: '4px' }}>
                  Rol propuesto
                </label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value as 'RESPONSABLE' | 'PARTICIPANTE')}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e0', fontSize: '0.9rem' }}
                >
                  <option value="PARTICIPANTE">Participante 🌱</option>
                  <option value="RESPONSABLE">Responsable 👑</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={loading || !communityId}
                style={{
                  padding: '10px 18px',
                  background: '#2f855a',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <GardenIcon name="community" /> {loading ? 'Enviando...' : 'Enviar invitación'}
              </button>
            </form>
          </section>
        ) : (
          <div
            role="note"
            style={{
              background: '#f7fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              padding: '12px 16px',
              marginBottom: '20px',
              color: '#718096',
              fontSize: '0.88rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span>🔒</span>
            <span>Estás participando en esta comunidad como <strong>Participante</strong>. Solo el <strong>Responsable</strong> puede invitar nuevos miembros y cambiar roles.</span>
          </div>
        )}

        {/* Listado de miembros (Activos y Pendientes) */}
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#2d3748' }}>
              Listado de integrantes ({members.length})
            </h3>
            <span style={{ fontSize: '0.8rem', color: '#718096' }}>
              {members.filter(m => m.status === 'ACCEPTED').length} activos · {members.filter(m => m.status === 'PENDING').length} pendientes
            </span>
          </div>

          {members.length === 0 ? (
            <p style={{ color: '#718096', fontSize: '0.9rem', textAlign: 'center', padding: '24px 0' }}>
              {loading ? 'Cargando integrantes...' : 'No hay integrantes vinculados aún en esta comunidad.'}
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {members.map(member => {
                const isPending = member.status === 'PENDING'
                return (
                  <div
                    key={member.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      background: isPending ? '#fffaf0' : '#ffffff',
                      border: `1px solid ${isPending ? '#feebc8' : '#e2e8f0'}`,
                      borderRadius: '10px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          background: isPending ? '#feebc8' : '#c6f6d5',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 'bold',
                          color: isPending ? '#744210' : '#22543d',
                          flexShrink: 0,
                        }}
                      >
                        {member.user?.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 600, color: '#2d3748' }}>
                            {member.user?.name} {member.userId === currentUser?.id ? '(Tú)' : ''}
                          </span>
                          {/* Badges de estado */}
                          {isPending ? (
                            <span
                              style={{
                                padding: '2px 8px',
                                borderRadius: '12px',
                                fontSize: '0.74rem',
                                fontWeight: 700,
                                background: '#feebc8',
                                color: '#744210',
                                border: '1px solid #fbd38d',
                              }}
                            >
                              Invitación pendiente ⏳
                            </span>
                          ) : (
                            <span
                              style={{
                                padding: '2px 8px',
                                borderRadius: '12px',
                                fontSize: '0.74rem',
                                fontWeight: 700,
                                background: '#c6f6d5',
                                color: '#22543d',
                                border: '1px solid #9ae6b4',
                              }}
                            >
                              Activo ✅
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#718096' }}>{member.user?.email}</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {isResponsable ? (
                        <select
                          value={member.roleInCommunity === 'RESPONSABLE' ? 'RESPONSABLE' : 'PARTICIPANTE'}
                          onChange={e => handleRoleChange(member.userId, e.target.value)}
                          title="Cambiar rol del integrante"
                          style={{
                            padding: '6px 10px',
                            borderRadius: '6px',
                            border: '1px solid #cbd5e0',
                            fontSize: '0.85rem',
                            background: '#fff',
                          }}
                        >
                          <option value="RESPONSABLE">Responsable 👑</option>
                          <option value="PARTICIPANTE">Participante 🌱</option>
                        </select>
                      ) : (
                        <span
                          style={{
                            padding: '4px 10px',
                            borderRadius: '20px',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            background: member.roleInCommunity === 'RESPONSABLE' ? '#feebc8' : '#e2e8f0',
                            color: member.roleInCommunity === 'RESPONSABLE' ? '#744210' : '#4a5568',
                          }}
                        >
                          {member.roleInCommunity === 'RESPONSABLE' ? 'Responsable 👑' : 'Participante 🌱'}
                        </span>
                      )}

                      {isResponsable && member.userId !== currentUser?.id && (
                        <button
                          type="button"
                          onClick={() => handleRemove(member.userId, isPending)}
                          title={isPending ? 'Cancelar invitación' : 'Eliminar de la comunidad'}
                          style={{
                            background: '#fff5f5',
                            border: '1px solid #fed7d7',
                            color: '#e53e3e',
                            cursor: 'pointer',
                            padding: '6px 10px',
                            borderRadius: '6px',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                          }}
                        >
                          {isPending ? 'Cancelar ✕' : 'Eliminar 🗑'}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
