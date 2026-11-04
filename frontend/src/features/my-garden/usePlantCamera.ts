import { useCallback, useEffect, useRef, useState } from 'react'

type CameraState = 'idle' | 'requesting' | 'streaming' | 'capturing'

function cameraMessage(error: unknown) {
  const name = error instanceof Error ? error.name : ''
  if (name === 'NotAllowedError' || name === 'PermissionDeniedError') return 'Permiso de cámara denegado. Puedes habilitarlo en tu navegador o usar Galería.'
  if (name === 'NotFoundError' || name === 'DevicesNotFoundError') return 'No encontramos una cámara. Puedes seleccionar una fotografía en Galería.'
  if (name === 'NotReadableError' || name === 'TrackStartError') return 'No se pudo abrir la cámara. Comprueba si otra aplicación la está usando o utiliza Galería.'
  if (name === 'SecurityError') return 'El navegador bloqueó la cámara. Usa una conexión HTTPS o selecciona una fotografía en Galería.'
  return 'No se pudo iniciar la cámara. Inténtalo de nuevo o utiliza Galería.'
}

export function usePlantCamera() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const generation = useRef(0)
  const [state, setState] = useState<CameraState>('idle')
  const [error, setError] = useState('')
  const [ready, setReady] = useState(false)

  const release = useCallback(() => {
    generation.current++
    const stream = streamRef.current
    streamRef.current = null
    stream?.getTracks().forEach(track => { track.onended = null; track.stop() })
    if (videoRef.current) videoRef.current.srcObject = null
  }, [])

  const stop = useCallback(() => {
    release()
    setState('idle')
    setReady(false)
    setError('')
  }, [release])

  // Invalidate pending permission requests too: a late stream must never survive the modal.
  useEffect(() => release, [release])

  async function start() {
    stop()
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      setError('La cámara no está disponible en este navegador o conexión. Usa HTTPS o selecciona una fotografía en Galería.')
      return
    }
    const request = generation.current
    setState('requesting')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1440 } } })
      if (request !== generation.current) { stream.getTracks().forEach(track => track.stop()); return }
      streamRef.current = stream
      stream.getVideoTracks().forEach(track => {
        track.onended = () => {
          stop()
          setError('La cámara se desconectó. Vuelve a abrirla o utiliza Galería.')
        }
      })
      const video = videoRef.current
      if (!video) { stop(); return }
      video.srcObject = stream
      await video.play()
      if (request !== generation.current) return
      setState('streaming')
      setReady(video.videoWidth > 0 && video.readyState >= 2)
    } catch (error) {
      if (request !== generation.current) return
      release()
      setReady(false)
      setState('idle')
      setError(cameraMessage(error))
    }
  }

  async function capture(): Promise<Blob | null> {
    const video = videoRef.current
    if (!video || !ready || !streamRef.current || !video.videoWidth) return null
    const request = generation.current
    setState('capturing')
    try {
      const canvas = document.createElement('canvas')
      const scale = Math.min(1, 1920 / Math.max(video.videoWidth, video.videoHeight))
      canvas.width = Math.round(video.videoWidth * scale)
      canvas.height = Math.round(video.videoHeight * scale)
      const context = canvas.getContext('2d')
      if (!context) throw new Error('Canvas unavailable')
      context.drawImage(video, 0, 0, canvas.width, canvas.height)
      const photo = await new Promise<Blob>((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Empty capture')), 'image/jpeg', .85))
      if (request !== generation.current) return null
      if (photo.size > 3 * 1024 * 1024) throw new Error('Capture too large')
      stop()
      return photo
    } catch {
      if (request === generation.current) {
        setState('streaming')
        setError('No se pudo tomar la fotografía. Inténtalo de nuevo o utiliza Galería.')
      }
      return null
    }
  }

  return { videoRef, state, ready, error, start, stop, capture, onCanPlay: () => setReady(true) }
}
