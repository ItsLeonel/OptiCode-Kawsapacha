import { useEffect, useRef, useState, type ChangeEvent } from 'react'

export function useJournalPhoto() {
  const [photo, setPhoto] = useState<Blob>(), [reading, setReading] = useState(false), [error, setError] = useState('')
  const selection = useRef(0)
  useEffect(() => () => { selection.current++ }, [])
  async function choose(event: ChangeEvent<HTMLInputElement>) {
    const token = ++selection.current, file = event.target.files?.[0]
    setPhoto(undefined); setError(''); setReading(false)
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || !file.size || file.size > 3 * 1024 * 1024) { setError('Usa JPG, PNG o WebP de hasta 3 MB.'); event.target.value = ''; return }
    setReading(true)
    const url = URL.createObjectURL(file)
    try { const image = new Image(); image.src = url; await image.decode(); if (selection.current === token) setPhoto(file) }
    catch { if (selection.current === token) setError('No se puede leer la fotografía. Elige otra imagen.') }
    finally { URL.revokeObjectURL(url); if (selection.current === token) setReading(false) }
  }
  return { photo, reading, error, choose }
}
