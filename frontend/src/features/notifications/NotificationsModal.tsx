import { useState, useEffect } from 'react'
import GardenIcon from '../my-garden/GardenIcon'
import { invitationApi, type CommunityInvitationItem } from '../../services/api'

interface Props {
  onClose: () => void
  onAccepted: (communityId: string) => Promise<void> | void
}

export default function NotificationsModal({ onClose, onAccepted }: Props) {
  const [invitations, setInvitations] = useState<CommunityInvitationItem[]>([])
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    loadInvitations()
  }, [])

  async function loadInvitations() {
    setLoading(true)
    try {
      const list = await invitationApi.getMyInvitations()
      setInvitations(list)
    } catch (err: unknown) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleAccept(invitation: CommunityInvitationItem) {
    setError('')
    setMessage('')
    setActionLoading(invitation.id)
    try {
      await invitationApi.accept(invitation.id)
      setMessage(`¡Te has unido exitosamente a la comunidad "${invitation.communityName}"!`)
      await onAccepted(invitation.communityId)
      await loadInvitations()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al aceptar invitación')
    } finally {
      setActionLoading(null)
    }
  }

  async function handleReject(invitation: CommunityInvitationItem) {
    if (!confirm(`¿Estás seguro de que deseas rechazar la invitación a ${invitation.communityName}?`)) return
    setError('')
    setMessage('')
    setActionLoading(invitation.id)
    try {
      await invitationApi.reject(invitation.id)
      setMessage(`Has rechazado la invitación a la comunidad "${invitation.communityName}".`)
      await loadInvitations()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al rechazar invitación')
    } finally {
      setActionLoading(null)
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
        background: 'rgba(0, 0, 0, 0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1100,
        backdropFilter: 'blur(4px)',
      }}
    >
      <div
        className="community-dialog-content"
        onClick={e => e.stopPropagation()}
        style={{
          background: '#ffffff',
          borderRadius: '18px',
          maxWidth: '560px',
          width: '92%',
          maxHeight: '85vh',
          overflowY: 'auto',
          padding: '26px',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
          position: 'relative',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.6rem' }}>🔔</span>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.3rem', color: '#1a202c' }}>Bandeja de Notificaciones</h2>
              <p style={{ margin: '2px 0 0', fontSize: '0.85rem', color: '#718096' }}>
                Invitaciones y avisos para formar parte de comunidades
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar notificaciones"
            style={{
              background: '#edf2f7',
              border: 'none',
              borderRadius: '50%',
              width: '34px',
              height: '34px',
              cursor: 'pointer',
              fontSize: '1rem',
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
          <div style={{ background: '#fff5f5', border: '1px solid #feb2b2', color: '#9b2c2c', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.9rem' }}>
            ⚠ {error}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '36px 0', color: '#718096' }}>
            <p>Cargando notificaciones...</p>
          </div>
        ) : invitations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '36px 20px', color: '#718096' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>🌱</div>
            <h3 style={{ margin: '0 0 6px', fontSize: '1.1rem', color: '#2d3748' }}>No tienes invitaciones pendientes</h3>
            <p style={{ margin: 0, fontSize: '0.88rem' }}>
              Cuando un responsable te invite a una comunidad, la solicitud aparecerá aquí para que puedas aceptarla o rechazarla.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {invitations.map(inv => (
              <div
                key={inv.id}
                style={{
                  border: '1px solid #c6f6d5',
                  background: '#f0fff4',
                  borderRadius: '12px',
                  padding: '16px 18px',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.03)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div style={{ fontSize: '1rem', color: '#22543d', fontWeight: 600 }}>
                    La comunidad <strong>{inv.communityName}</strong> te ha invitado con el rol <strong>{inv.role}</strong>
                  </div>
                  <span
                    style={{
                      background: '#feebc8',
                      color: '#744210',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: '10px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Pendiente ⏳
                  </span>
                </div>

                <div style={{ fontSize: '0.82rem', color: '#4a5568', marginBottom: '14px', display: 'flex', flexWrap: 'wrap', gap: '14px' }}>
                  <span>👤 Invitado por: <strong>{inv.invitedByName}</strong></span>
                  {inv.communityLocation && <span>📍 Ubicación: {inv.communityLocation}</span>}
                  <span>📅 {new Date(inv.createdAt).toLocaleDateString('es-EC')}</span>
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    disabled={actionLoading === inv.id}
                    onClick={() => handleReject(inv)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e0',
                      background: '#fff',
                      color: '#e53e3e',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                    }}
                  >
                    Rechazar ✕
                  </button>
                  <button
                    type="button"
                    disabled={actionLoading === inv.id}
                    onClick={() => handleAccept(inv)}
                    style={{
                      padding: '8px 18px',
                      borderRadius: '8px',
                      border: 'none',
                      background: '#2f855a',
                      color: '#fff',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <GardenIcon name="community" />
                    {actionLoading === inv.id ? 'Uniendo...' : 'Aceptar invitación ✅'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

