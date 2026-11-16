import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { isAcceptedImageInput, MAX_PHOTO_BYTES, optimizeMobilePhoto } from '../../../shared/photo-validation'

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

    if (!isAcceptedImageInput(file)) {
      setError('Selecciona una imagen JPG, PNG o WebP.')
      return
    }
    setReading(true)
    try {
      const optimized = await optimizeMobilePhoto(file, 'evidencia-actividad')
      if (optimized.size > MAX_PHOTO_BYTES) {
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
