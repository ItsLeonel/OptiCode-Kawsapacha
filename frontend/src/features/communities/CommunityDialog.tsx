import { useEffect, useId, useRef, type KeyboardEvent, type ReactNode } from 'react'
import GardenIcon from '../my-garden/GardenIcon'

export default function CommunityDialog({ title, description, onClose, children }: {
  title: string
  description: string
  onClose: () => void
  children: ReactNode
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const descriptionId = useId()

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    if (!dialog.open) dialog.showModal()
    dialog.querySelector<HTMLElement>('[data-community-autofocus]')?.focus()
    return () => {
      dialog.close()
      document.body.style.overflow = previousOverflow
      if (opener?.isConnected) opener.focus({ preventScroll: true })
    }
  }, [])

  function keepFocusInDialog(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key !== 'Tab') return
    const controls = event.currentTarget.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), a[href], [tabindex="0"]')
    const first = controls[0]
    const last = controls[controls.length - 1]
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last?.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first?.focus()
    }
  }

  return <dialog ref={dialogRef} className="community-dialog" aria-labelledby={titleId} aria-describedby={descriptionId} onCancel={event => { event.preventDefault(); onClose() }} onKeyDown={keepFocusInDialog}>
    <div className="community-dialog-header">
      <span className="community-kicker"><GardenIcon name="leaf"/> COMUNIDAD · KAWSAPACHA</span>
      <button className="community-close" type="button" aria-label="Cerrar ventana" onClick={onClose}><GardenIcon name="close"/></button>
    </div>
    <h2 id={titleId}>{title}</h2>
    <p id={descriptionId} className="community-dialog-description">{description}</p>
    {children}
  </dialog>
}
