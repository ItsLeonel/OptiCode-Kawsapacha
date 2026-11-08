import { useEffect, useRef } from 'react'

export function useGardenDialog() {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const dialog = ref.current!
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'; dialog.showModal()
    return () => { dialog.close(); document.body.style.overflow = overflow; if (opener?.isConnected && !opener.closest('dialog:not([open])')) opener.focus({ preventScroll: true }) }
  }, [])
  return ref
}
