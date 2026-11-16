import { useState, useEffect } from 'react'
import { invitationApi, notificationApi, type CommunityInvitationItem, type UserNotification } from '../../services/api'

interface Props {
  onClose: () => void
  onAccepted: (communityId: string) => Promise<void> | void
  onNotificationsUpdated?: () => Promise<void> | void
  onGoToCommunity?: () => void
  onGoToGarden?: () => void
}

function formatNotificationMessage(message: string): string {
  if (!message) return ''
  const englishToSpanish: Record<string, string> = {
    '"preparation"': '«Preparación del terreno»',
    '"watering"': '«Riego»',
    '"fertilizing"': '«Abonado orgánico»',
    '"weeding"': '«Limpieza y mantenimiento»',
    '"hilling"': '«Aporque»',
    '"harvest"': '«Cosecha»',
    '"sowing"': '«Siembra»',
    '"replanting"': '«Trasplante o resiembra»',
    '"observation"': '«Observación botánica»',
  }
  let result = message
  for (const [en, es] of Object.entries(englishToSpanish)) {
    result = result.split(en).join(es)
  }
  return result
}

export default function NotificationsModal({ onClose, onAccepted, onNotificationsUpdated, onGoToCommunity, onGoToGarden }: Props) {
  const [activeTab, setActiveTab] = useState<'unread' | 'read' | 'invitations'>('unread')
  const [invitations, setInvitations] = useState<CommunityInvitationItem[]>([])
  const [notifications, setNotifications] = useState<UserNotification[]>([])
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    loadAll()
  }, [])

  async function loadAll() {
    setLoading(true)
    try {
      const [invList, notifRes] = await Promise.all([
        invitationApi.getMyInvitations().catch(() => []),
        notificationApi.list().catch(() => ({ notifications: [], unreadCount: 0 })),
      ])
      const notifs = notifRes.notifications || []
      const invs = invList || []
      setInvitations(invs)
      setNotifications(notifs)

      // Si no hay avisos no leídos pero sí hay invitaciones, sugerir pestaña de invitaciones
      const unreadCount = notifs.filter(n => !n.isRead).length
      if (unreadCount === 0 && invs.length > 0) {
        setActiveTab('invitations')
      } else if (unreadCount === 0 && notifs.length > 0) {
        setActiveTab('read')
      }
      await onNotificationsUpdated?.()
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
      await loadAll()
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
      await loadAll()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al rechazar invitación')
    } finally {
      setActionLoading(null)
    }
  }

  async function handleMarkRead(notifId: string) {
    try {
      await notificationApi.markRead(notifId)
      setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, isRead: true } : n))
      setMessage('Notificación movida a la pestaña "Leídas".')
      await onNotificationsUpdated?.()
    } catch (err) {
      console.error(err)
    }
  }

  async function handleMarkAllRead() {
    try {
      await notificationApi.markAllRead()
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      setMessage('Todas las notificaciones fueron movidas a la pestaña "Leídas".')
      setActiveTab('read')
      await onNotificationsUpdated?.()
    } catch (err) {
      console.error(err)
    }
  }

  async function handleClearRead() {
    if (!confirm('¿Deseas vaciar todas las notificaciones leídas de tu historial?')) return
    try {
      await notificationApi.clearRead()
      setNotifications(prev => prev.filter(n => !n.isRead))
      setMessage('Historial de notificaciones leídas vaciado correctamente.')
      await onNotificationsUpdated?.()
    } catch (err) {
      console.error(err)
    }
  }

  const unreadNotifications = notifications.filter(n => !n.isRead)
  const readNotifications = notifications.filter(n => n.isRead)
  const unreadMspCount = unreadNotifications.length
  const readMspCount = readNotifications.length
  const pendingInvCount = invitations.length

  async function handleClose() {
    if (unreadNotifications.length > 0) {
      try {
        await notificationApi.markAllRead()
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
        await onNotificationsUpdated?.()
      } catch {
        // continuar cierre aunque falle el marcado automático
      }
    } else {
      await onNotificationsUpdated?.()
    }
    onClose()
  }

  return (
    <div
      className="community-dialog-backdrop"
      onClick={() => void handleClose()}
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
          maxWidth: '640px',
          width: '92%',
          maxHeight: '88vh',
          overflowY: 'auto',
          padding: '24px',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
          position: 'relative',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.6rem' }}>🔔</span>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#1a202c' }}>Bandeja de Notificaciones</h2>
              <p style={{ margin: '2px 0 0', fontSize: '0.85rem', color: '#718096' }}>
                Avisos oficiales del MSP e invitaciones comunitarias
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void handleClose()}
            aria-label="Cerrar notificaciones"
            style={{
              background: '#edf2f7',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
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

        {/* Pestañas de Notificaciones */}
        <div style={{ display: 'flex', gap: '0.45rem', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => setActiveTab('unread')}
            style={{
              padding: '0.4rem 0.85rem',
              borderRadius: '6px',
              border: 'none',
              background: activeTab === 'unread' ? '#276749' : '#edf2f7',
              color: activeTab === 'unread' ? '#fff' : '#4a5568',
              fontWeight: 600,
              fontSize: '0.84rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>No leídas</span>
            {unreadMspCount > 0 && (
              <span style={{ background: '#e53e3e', color: '#fff', fontSize: '0.7rem', padding: '1px 6px', borderRadius: '10px' }}>
                {unreadMspCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('read')}
            style={{
              padding: '0.4rem 0.85rem',
              borderRadius: '6px',
              border: 'none',
              background: activeTab === 'read' ? '#276749' : '#edf2f7',
              color: activeTab === 'read' ? '#fff' : '#4a5568',
              fontWeight: 600,
              fontSize: '0.84rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>Leídas ({readMspCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('invitations')}
            style={{
              padding: '0.4rem 0.85rem',
              borderRadius: '6px',
              border: 'none',
              background: activeTab === 'invitations' ? '#276749' : '#edf2f7',
              color: activeTab === 'invitations' ? '#fff' : '#4a5568',
              fontWeight: 600,
              fontSize: '0.84rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>Invitaciones</span>
            {pendingInvCount > 0 && (
              <span style={{ background: '#d69e2e', color: '#fff', fontSize: '0.7rem', padding: '1px 6px', borderRadius: '10px' }}>
                {pendingInvCount}
              </span>
            )}
          </button>

          {activeTab === 'unread' && unreadMspCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              style={{
                marginLeft: 'auto',
                fontSize: '0.78rem',
                background: 'none',
                border: 'none',
                color: '#3182ce',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Marcar todas como leídas
            </button>
          )}

          {activeTab === 'read' && readMspCount > 0 && (
            <button
              type="button"
              onClick={handleClearRead}
              style={{
                marginLeft: 'auto',
                fontSize: '0.78rem',
                background: 'none',
                border: 'none',
                color: '#e53e3e',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Limpiar historial de leídas
            </button>
          )}
        </div>

        {message && (
          <div style={{ background: '#e6fffa', border: '1px solid #38b2ac', color: '#234e52', padding: '10px 14px', borderRadius: '8px', marginBottom: '14px', fontSize: '0.88rem' }}>
            ✓ {message}
          </div>
        )}

        {error && (
          <div style={{ background: '#fff5f5', border: '1px solid #feb2b2', color: '#9b2c2c', padding: '10px 14px', borderRadius: '8px', marginBottom: '14px', fontSize: '0.88rem' }}>
            ⚠ {error}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '36px 0', color: '#718096' }}>
            <p>Cargando notificaciones...</p>
          </div>
        ) : activeTab === 'unread' ? (
          unreadNotifications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px 20px', color: '#718096' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>✨</div>
              <h3 style={{ margin: '0 0 6px', fontSize: '1.05rem', color: '#2d3748' }}>¡Estás al día!</h3>
              <p style={{ margin: 0, fontSize: '0.85rem' }}>
                No tienes notificaciones pendientes. Puedes consultar los avisos anteriores en la pestaña <strong>Leídas ({readMspCount})</strong>.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {unreadNotifications.map(n => renderNotificationCard(n, false))}
            </div>
          )
        ) : activeTab === 'read' ? (
          readNotifications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px 20px', color: '#718096' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>📜</div>
              <h3 style={{ margin: '0 0 6px', fontSize: '1.05rem', color: '#2d3748' }}>Sin notificaciones leídas</h3>
              <p style={{ margin: 0, fontSize: '0.85rem' }}>
                Aquí se conservarán temporalmente las notificaciones que marques como leídas durante 7 días.
              </p>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '14px' }}>
                {readNotifications.map(n => renderNotificationCard(n, true))}
              </div>
              <small style={{ display: 'block', textAlign: 'center', color: '#a0aec0', fontSize: '0.78rem', fontStyle: 'italic', borderTop: '1px solid #edf2f7', paddingTop: '10px' }}>
                ℹ️ Las notificaciones leídas se conservan en tu historial durante 7 días y luego se depuran automáticamente.
              </small>
            </div>
          )
        ) : (
          invitations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px 20px', color: '#718096' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>🌱</div>
              <h3 style={{ margin: '0 0 6px', fontSize: '1.05rem', color: '#2d3748' }}>No tienes invitaciones pendientes</h3>
              <p style={{ margin: 0, fontSize: '0.85rem' }}>
                Cuando un responsable te invite a una comunidad, la solicitud aparecerá aquí para que puedas aceptarla o rechazarla.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {invitations.map(inv => (
                <div
                  key={inv.id}
                  style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '16px',
                    background: '#f7fafc',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                      <strong style={{ fontSize: '1rem', color: '#2d3748' }}>{inv.communityName}</strong>
                      <div style={{ fontSize: '0.82rem', color: '#718096', marginTop: '2px' }}>
                        Invitación enviada por: <strong>{inv.invitedByName || 'Responsable'}</strong> · Rol propuesto: <strong>{inv.role}</strong>
                      </div>
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '2px 8px', borderRadius: '12px', background: '#feebc8', color: '#744210' }}>
                      PENDIENTE
                    </span>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: '#4a5568', margin: '0 0 12px 0' }}>
                    Has sido invitado/a a formar parte de esta comunidad agroecológica. Al aceptar, podrás compartir el huerto y registrar actividades colaborativas.
                  </p>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      disabled={actionLoading === inv.id}
                      onClick={() => handleReject(inv)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e0',
                        background: '#fff',
                        color: '#4a5568',
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        fontWeight: 600,
                      }}
                    >
                      Rechazar
                    </button>
                    <button
                      type="button"
                      disabled={actionLoading === inv.id}
                      onClick={() => handleAccept(inv)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '6px',
                        border: 'none',
                        background: '#2f855a',
                        color: '#fff',
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        fontWeight: 600,
                      }}
                    >
                      {actionLoading === inv.id ? 'Aceptando...' : 'Aceptar invitación'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  )

  function renderNotificationCard(n: UserNotification, isHistory: boolean) {
    const isApproved = n.type.includes('APPROVED')
    const isNeedsChanges = n.type.includes('NEEDS_CHANGES')
    const isRejected = n.type.includes('REJECTED')
    const borderColor = isHistory ? '#e2e8f0' : isApproved ? '#9ae6b4' : isNeedsChanges ? '#fbd38d' : isRejected ? '#feb2b2' : '#e2e8f0'
    const bgColor = isHistory ? '#fafafa' : isApproved ? '#f0fff4' : isNeedsChanges ? '#fffaf0' : isRejected ? '#fff5f5' : '#f7fafc'
    const badgeColor = isHistory ? '#718096' : isApproved ? '#22543d' : isNeedsChanges ? '#744210' : '#742a2a'
    const badgeBg = isHistory ? '#edf2f7' : isApproved ? '#c6f6d5' : isNeedsChanges ? '#feebc8' : '#fed7d7'
    const badgeText = isApproved ? 'APROBADO' : isNeedsChanges ? 'REQUIERE CORRECCIÓN' : isRejected ? 'RECHAZADO' : 'AVISO'

    return (
      <div
        key={n.id}
        style={{
          border: `1px solid ${borderColor}`,
          background: bgColor,
          borderRadius: '10px',
          padding: '14px 16px',
          opacity: isHistory ? 0.88 : 1,
          boxShadow: isHistory ? 'none' : '0 2px 6px rgba(0,0,0,0.06)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: '8px', background: badgeBg, color: badgeColor }}>
              {badgeText}
            </span>
            {isHistory && (
              <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#718096' }}>
                ✓ LEÍDA
              </span>
            )}
          </div>
          <small style={{ color: '#a0aec0', fontSize: '0.75rem' }}>
            {new Date(n.createdAt).toLocaleDateString('es-EC', { hour: '2-digit', minute: '2-digit' })}
          </small>
        </div>
        <strong style={{ display: 'block', color: '#2d3748', fontSize: '0.95rem', marginBottom: '4px' }}>
          {n.title}
        </strong>
        <p style={{ margin: '0 0 10px 0', fontSize: '0.86rem', color: '#4a5568', lineHeight: 1.4 }}>
          {formatNotificationMessage(n.message)}
        </p>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          {!isHistory && (
            <button
              type="button"
              onClick={() => handleMarkRead(n.id)}
              style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', border: '1px solid #cbd5e0', background: '#fff', borderRadius: '4px', cursor: 'pointer' }}
            >
              ✓ Marcar como leída
            </button>
          )}
          {(isNeedsChanges || isRejected) && n.type.startsWith('COMMUNITY_') && onGoToCommunity && (
            <button
              type="button"
              onClick={onGoToCommunity}
              style={{ fontSize: '0.75rem', padding: '0.2rem 0.7rem', border: 'none', background: '#d69e2e', color: '#fff', fontWeight: 600, borderRadius: '4px', cursor: 'pointer' }}
            >
              ✏️ Corregir mi comunidad
            </button>
          )}
          {isApproved && n.type.startsWith('COMMUNITY_') && onGoToGarden && (
            <button
              type="button"
              onClick={onGoToGarden}
              style={{ fontSize: '0.75rem', padding: '0.2rem 0.7rem', border: 'none', background: '#276749', color: '#fff', fontWeight: 600, borderRadius: '4px', cursor: 'pointer' }}
            >
              🌱 Ir a sembrar
            </button>
          )}
          {onGoToGarden && n.type.startsWith('ACTIVITY_') && (
            <button
              type="button"
              onClick={onGoToGarden}
              style={{ fontSize: '0.75rem', padding: '0.2rem 0.7rem', border: 'none', background: '#3182ce', color: '#fff', fontWeight: 600, borderRadius: '4px', cursor: 'pointer' }}
            >
              🌿 Ver mi huerto
            </button>
          )}
        </div>
      </div>
    )
  }
}
