import { useEffect, useRef, useState, type ChangeEvent } from 'react'

async function optimizeJournalPhoto(file: File | Blob): Promise<File | Blob> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('Unsupported image type')
  const url = URL.createObjectURL(file)
  try {
    const image = new Image()
    image.src = url
    await image.decode()
    if (!image.naturalWidth || !image.naturalHeight) throw new Error('Empty image')

    const maxDim = 1920
    const w = image.naturalWidth
    const h = image.naturalHeight

    if (file.size <= 3 * 1024 * 1024 && Math.max(w, h) <= maxDim) return file

    const scale = Math.min(1, maxDim / Math.max(w, h))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(w * scale))
    canvas.height = Math.max(1, Math.round(h * scale))
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas 2D unavailable')
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height)

    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.85))
    if (!blob) throw new Error('Compression failed')

    const originalName = file instanceof File ? file.name.replace(/\.[^/.]+$/, '') : 'evidencia-actividad'
    return new File([blob], `${originalName}.jpg`, { type: 'image/jpeg' })
  } finally {
    URL.revokeObjectURL(url)
  }
}

export function useJournalPhoto() {
  const [photo, setPhoto] = useState<Blob>()
  const [reading, setReading] = useState(false)
  const [error, setError] = useState('')
  const selection = useRef(0)

  useEffect(() => () => { selection.current++ }, [])

  function clear() {
    selection.current++
    setPhoto(undefined)
    setError('')
    setReading(false)
  }

  async function chooseFile(file: File | null | undefined) {
    const token = ++selection.current
    setPhoto(undefined)
    setError('')
    setReading(false)
    if (!file) return

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Selecciona una imagen JPG, PNG o WebP.')
      return
    }
    setReading(true)
    try {
      const optimized = await optimizeJournalPhoto(file)
      if (optimized.size > 3 * 1024 * 1024) {
        if (selection.current === token) setError('Usa JPG, PNG o WebP de hasta 3 MB.')
        return
      }
      if (selection.current === token) setPhoto(optimized)
    } catch {
      if (selection.current === token) setError('No se puede leer la fotografía. Elige otra imagen.')
    } finally {
      if (selection.current === token) setReading(false)
    }
  }

  function choose(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0]
    event.currentTarget.value = ''
    void chooseFile(file)
  }

  return { photo, reading, error, choose, chooseFile, clear }
}
