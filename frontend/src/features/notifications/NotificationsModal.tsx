import { useEffect, useId, useMemo, useRef, useState, type ChangeEvent, type MouseEvent } from 'react'
import GardenIcon from '../my-garden/GardenIcon'
import { invitationApi, type CommunityInvitationItem } from '../../services/api'
import {
  isAdministrativeNotice,
  noticeDate,
  noticeKindLabel,
  noticePointsLabel,
  type AdministrativeNotice,
  type AdministrativeNoticeSource,
} from './administrative-notifications'
import './notifications.css'

type InboxTab = 'all' | 'invitations' | 'notices'

interface Props {
  onClose: () => void
  onAccepted: (communityId: string) => Promise<void> | void
  /** Se conectará desde App cuando Ronny publique los endpoints confirmados. */
  noticeSource?: AdministrativeNoticeSource
  /** Navegación opcional hacia la evidencia o comunidad; no se inventan enlaces. */
  onOpenNotice?: (notice: AdministrativeNotice) => void
}

export default function NotificationsModal({ onClose, onAccepted, noticeSource, onOpenNotice }: Props) {
  const titleId = useId()
  const descriptionId = useId()
  const dialogRef = useRef<HTMLDivElement | null>(null)
  const closeRef = useRef(onClose)
  const [tab, setTab] = useState<InboxTab>('all')
  const [onlyPending, setOnlyPending] = useState(false)
  const [invitations, setInvitations] = useState<CommunityInvitationItem[]>([])
  const [notices, setNotices] = useState<AdministrativeNotice[]>([])
  const [invitationLoading, setInvitationLoading] = useState(true)
  const [noticeLoading, setNoticeLoading] = useState(Boolean(noticeSource))
  const [invitationError, setInvitationError] = useState('')
  const [noticeError, setNoticeError] = useState('')
  const [actionId, setActionId] = useState<string | null>(null)
  const [rejectId, setRejectId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState('')
  const [reload, setReload] = useState(0)

  useEffect(() => { closeRef.current = onClose }, [onClose])

  // Acepta Escape y mantiene el foco dentro del diálogo, incluso con filtros.
  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    dialogRef.current?.focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); closeRef.current(); return }
      if (event.key !== 'Tab' || !dialogRef.current) return
      const enabled = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not(:disabled), input:not(:disabled), a[href], [tabindex]:not([tabindex="-1"])',
      )).filter(item => item.getClientRects().length > 0)
      if (!enabled.length) return
      const first = enabled[0]
      const last = enabled[enabled.length - 1]
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) {
        event.preventDefault(); last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault(); first.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => { document.removeEventListener('keydown', onKeyDown); previous?.focus() }
  }, [])

  useEffect(() => {
    let current = true
    setInvitationLoading(true)
    setInvitationError('')
    invitationApi.getMyInvitations().then(items => {
      if (current) setInvitations(items.filter(item => item.status === 'PENDING' || !item.status))
    }).catch((error: unknown) => {
      if (current) setInvitationError(error instanceof Error ? error.message : 'No fue posible cargar las invitaciones.')
    }).finally(() => { if (current) setInvitationLoading(false) })
    return () => { current = false }
  }, [reload])

  useEffect(() => {
    let current = true
    setNoticeError('')
    if (!noticeSource) {
      setNotices([])
      setNoticeLoading(false)
      return () => { current = false }
    }
    setNoticeLoading(true)
    noticeSource.list().then(items => {
      if (!current) return
      if (!Array.isArray(items) || !items.every(isAdministrativeNotice)) {
        setNotices([])
        setNoticeError('El servidor devolvió avisos con un formato inesperado.')
        return
      }
      setNotices([...items].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)))
    }).catch((error: unknown) => {
      if (current) setNoticeError(error instanceof Error ? error.message : 'No fue posible cargar los avisos.')
    }).finally(() => { if (current) setNoticeLoading(false) })
    return () => { current = false }
  }, [noticeSource, reload])

  const unread = useMemo(() => notices.filter(notice => !notice.readAt).length, [notices])
  const visibleInvitations = tab === 'notices' ? [] : invitations
  const visibleNotices = useMemo(
    () => tab === 'invitations' ? [] : notices.filter(notice => !onlyPending || !notice.readAt),
    [notices, onlyPending, tab],
  )
  const busy = Boolean(actionId)

  async function accept(invitation: CommunityInvitationItem) {
    if (busy) return
    setFeedback(''); setInvitationError(''); setActionId(`accept:${invitation.id}`)
    try {
      await invitationApi.accept(invitation.id)
      await onAccepted(invitation.communityId)
      setFeedback(`Aceptaste la invitación de «${invitation.communityName}».`)
      setReload(value => value + 1)
    } catch (error) {
      setInvitationError(error instanceof Error ? error.message : 'No fue posible aceptar la invitación.')
      // Recuperamos la lista del servidor: la aceptación pudo haberse guardado ya.
      setReload(value => value + 1)
    } finally { setActionId(null) }
  }

  async function reject(invitation: CommunityInvitationItem) {
    if (busy) return
    setFeedback(''); setInvitationError(''); setActionId(`reject:${invitation.id}`)
    try {
      await invitationApi.reject(invitation.id)
      setFeedback(`Rechazaste la invitación de «${invitation.communityName}».`)
      setRejectId(null)
      setReload(value => value + 1)
    } catch (error) {
      setInvitationError(error instanceof Error ? error.message : 'No fue posible rechazar la invitación.')
    } finally { setActionId(null) }
  }

  async function markRead(notice: AdministrativeNotice) {
    if (!noticeSource || notice.readAt || busy) return
    setFeedback(''); setNoticeError(''); setActionId(`read:${notice.id}`)
    try {
      const updated = await noticeSource.markRead(notice.id)
      if (!isAdministrativeNotice(updated) || updated.id !== notice.id || !updated.readAt) {
        throw new Error('El servidor no confirmó la lectura del aviso.')
      }
      setNotices(items => items.map(item => item.id === updated.id ? updated : item))
      setFeedback('Aviso marcado como leído.')
    } catch (error) {
      setNoticeError(error instanceof Error ? error.message : 'No fue posible marcar el aviso como leído.')
    } finally { setActionId(null) }
  }

  return <div className="knt-backdrop" onMouseDown={(event: MouseEvent<HTMLDivElement>) => { if (event.currentTarget === event.target) onClose() }}>
    <div className="knt-dialog" ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descriptionId} tabIndex={-1}>
      <header className="knt-header">
        <span className="knt-header-icon"><GardenIcon name="bell"/></span>
        <div className="knt-heading">
          <h2 id={titleId}>Centro de notificaciones</h2>
          <p id={descriptionId}>Invitaciones a comunidades y decisiones de revisión MSP</p>
        </div>
        <button type="button" className="knt-close" onClick={onClose} aria-label="Cerrar notificaciones"><GardenIcon name="close"/></button>
      </header>

      <div className="knt-filters">
        <div className="knt-tabs" role="group" aria-label="Tipo de notificación">
          <button type="button" className={tab === 'all' ? 'is-active' : ''} aria-pressed={tab === 'all'} onClick={() => setTab('all')}>Todas</button>
          <button type="button" className={tab === 'invitations' ? 'is-active' : ''} aria-pressed={tab === 'invitations'} onClick={() => setTab('invitations')}>Invitaciones <span>{invitations.length}</span></button>
          <button type="button" className={tab === 'notices' ? 'is-active' : ''} aria-pressed={tab === 'notices'} onClick={() => setTab('notices')}>Avisos {Boolean(unread) && <span>{unread}</span>}</button>
        </div>
        <label className="knt-unread"><input type="checkbox" checked={onlyPending} onChange={(event: ChangeEvent<HTMLInputElement>) => setOnlyPending(event.target.checked)}/><span>Solo pendientes / sin leer</span></label>
      </div>

      <div className="knt-content">
        {feedback && <p className="knt-feedback" role="status">{feedback}</p>}
        {invitationError && tab !== 'notices' && <p className="knt-error" role="alert">{invitationError}</p>}
        {noticeError && tab !== 'invitations' && <p className="knt-error" role="alert">{noticeError}</p>}

        {tab !== 'notices' && <section className="knt-section" aria-label="Invitaciones a comunidades">
          <div className="knt-section-heading"><h3>Invitaciones</h3><small>Solicitudes recibidas desde Kawsapacha</small></div>
          {invitationLoading ? <p className="knt-empty" role="status">Cargando invitaciones…</p> : visibleInvitations.length ? (
            <ul className="knt-list">{visibleInvitations.map(inv => <li key={inv.id} className="knt-card knt-invitation">
              <div className="knt-card-top"><span className="knt-kind"><GardenIcon name="community"/> Comunidad</span><span className="knt-pill">Pendiente</span></div>
              <h4>Invitación a {inv.communityName}</h4>
              <p>Te invitaron como <strong>{inv.role}</strong>.</p>
              <div className="knt-meta"><span>Invita: {inv.invitedByName}</span>{inv.communityLocation && <span>{inv.communityLocation}</span>}<time dateTime={inv.createdAt}>{noticeDate(inv.createdAt)}</time></div>
              {rejectId === inv.id ? <div className="knt-confirm" role="group" aria-label={`Confirmar rechazo de ${inv.communityName}`}>
                <p>¿Rechazar esta invitación? No te unirás a la comunidad.</p>
                <button type="button" className="knt-secondary" disabled={busy} onClick={() => setRejectId(null)}>Cancelar</button>
                <button type="button" className="knt-danger" disabled={busy} onClick={() => { void reject(inv) }}>{actionId === `reject:${inv.id}` ? 'Rechazando…' : 'Confirmar rechazo'}</button>
              </div> : <div className="knt-actions">
                <button type="button" className="knt-secondary" disabled={busy} onClick={() => setRejectId(inv.id)}>Rechazar</button>
                <button type="button" className="knt-primary" disabled={busy} onClick={() => { void accept(inv) }}>{actionId === `accept:${inv.id}` ? 'Aceptando…' : 'Aceptar invitación'}</button>
              </div>}
            </li>)}</ul>
          ) : !invitationError && <p className="knt-empty">No tienes invitaciones pendientes.</p>}
          {invitationError && <button type="button" className="knt-retry" onClick={() => setReload(value => value + 1)}>Volver a consultar</button>}
        </section>}

        {tab !== 'invitations' && <section className="knt-section" aria-label="Avisos administrativos">
          <div className="knt-section-heading"><h3>Avisos del MSP</h3><small>Resoluciones y cambios verificados por el servidor</small></div>
          {!noticeSource ? <div className="knt-empty knt-unconnected">
            <GardenIcon name="leaf"/><strong>Avisos pendientes de integración</strong>
            <p>Las decisiones de comunidades y evidencias aparecerán aquí cuando se conecte el servicio de notificaciones del backend. No se muestran decisiones ni puntos ficticios.</p>
          </div> : noticeLoading ? <p className="knt-empty" role="status">Consultando avisos…</p> : visibleNotices.length ? <ul className="knt-list">
            {visibleNotices.map(notice => <li key={notice.id} className={`knt-card knt-notice${notice.readAt ? '' : ' is-unread'}`}>
              <div className="knt-card-top"><span className="knt-kind"><GardenIcon name="leaf"/>{noticeKindLabel(notice.kind)}</span>{!notice.readAt && <span className="knt-pill">Sin leer</span>}</div>
              <h4>{notice.title}</h4><p>{notice.description}</p>
              {notice.reason && <p className="knt-reason"><strong>Observación MSP:</strong> {notice.reason}</p>}
              {notice.points && <p className="knt-points"><GardenIcon name="seed"/> {noticePointsLabel(notice.points.state)}{typeof notice.points.amount === 'number' ? ` · ${notice.points.amount.toLocaleString('es-EC')}` : ''}</p>}
              <div className="knt-meta">{notice.communityName && <span>{notice.communityName}</span>}{notice.subjectName && <span>{notice.subjectName}</span>}{notice.actorName && <span>Revisó: {notice.actorName}</span>}<time dateTime={notice.createdAt}>{noticeDate(notice.createdAt)}</time></div>
              {(!notice.readAt || onOpenNotice) && <div className="knt-actions">
                {!notice.readAt && <button type="button" className="knt-secondary" disabled={busy} onClick={() => { void markRead(notice) }}>{actionId === `read:${notice.id}` ? 'Guardando…' : 'Marcar como leído'}</button>}
                {onOpenNotice && <button type="button" className="knt-primary" onClick={() => onOpenNotice(notice)}>{notice.actionLabel || 'Ver detalle'}</button>}
              </div>}
            </li>)}
          </ul> : !noticeError && <p className="knt-empty">{onlyPending ? 'No tienes avisos sin leer.' : 'No hay avisos administrativos registrados.'}</p>}
          {noticeSource && noticeError && <button type="button" className="knt-retry" onClick={() => setReload(value => value + 1)}>Volver a consultar</button>}
        </section>}
      </div>
      <footer className="knt-footer">Los cambios de estado y de recompensas se confirman únicamente desde el servidor.</footer>
    </div>
  </div>
}
