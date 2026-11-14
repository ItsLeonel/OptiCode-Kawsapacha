import { useRef, useState, type ChangeEvent } from 'react'
import GardenIcon from './GardenIcon'
import { usePlantCamera } from './usePlantCamera'

interface JournalPhotoPickerProps {
  label?: string
  photo: Blob | undefined
  preview?: string
  reading?: boolean
  error?: string
  onChooseFile: (file: File | Blob | null | undefined) => void | Promise<void>
  onClear: () => void
  helpText?: string
}

export default function JournalPhotoPicker({
  label = 'Fotografía',
  photo,
  preview,
  reading = false,
  error,
  onChooseFile,
  onClear,
  helpText = 'Toma una foto con tu cámara o elige una imagen de tu galería (JPG, PNG o WebP, hasta 3 MB).',
}: JournalPhotoPickerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const camera = usePlantCamera()
  const [cameraActive, setCameraActive] = useState(false)

  // Detectar si estamos en un dispositivo móvil/táctil o si no hay contexto seguro para getUserMedia
  const isMobileOrTouch =
    typeof window !== 'undefined' &&
    ('ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      /Android|iPhone|iPad|iPod/i.test(navigator.userAgent))

  const canUseMediaStream =
    typeof window !== 'undefined' &&
    Boolean(window.isSecureContext) &&
    Boolean(navigator.mediaDevices?.getUserMedia)

  // Abrir cámara
  async function handleOpenCamera() {
    // En móviles o conexiones HTTP sin contexto seguro, abrir la app de cámara nativa directamente
    if (isMobileOrTouch || !canUseMediaStream) {
      camera.stop()
      setCameraActive(false)
      cameraInputRef.current?.click()
      return
    }

    // En navegadores de escritorio con webcam y HTTPS / localhost
    setCameraActive(true)
    await camera.start()
  }

  // Tomar captura desde webcam en vivo (escritorio)
  async function handleTakeWebcamPhoto() {
    const captured = await camera.capture()
    if (captured) {
      await onChooseFile(captured)
      camera.stop()
      setCameraActive(false)
    }
  }

  function handleCloseWebcam() {
    camera.stop()
    setCameraActive(false)
  }

  // Abrir selector de galería / archivos
  function handleOpenGallery() {
    camera.stop()
    setCameraActive(false)
    fileInputRef.current?.click()
  }

  // Manejar selección de archivo desde input
  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0]
    event.currentTarget.value = ''
    if (file) {
      void onChooseFile(file)
    }
  }

  return (
    <div
      className="journal-photo-picker journal-wide"
      style={{
        background: '#fffdf4',
        border: '1px solid #dcd4b8',
        borderRadius: '14px',
        padding: '14px 16px',
        margin: '6px 0',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#294732' }}>
          {label}
        </span>
        {photo && (
          <span
            style={{
              fontSize: '0.78rem',
              color: '#276749',
              background: '#e6fffa',
              padding: '2px 8px',
              borderRadius: '6px',
              fontWeight: 600,
            }}
          >
            ✓ Foto cargada
          </span>
        )}
      </div>

      {/* Inputs nativos ocultos */}
      {/* 1. Galería / Archivos existentes */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/*"
        style={{ display: 'none' }}
        tabIndex={-1}
        onChange={handleInputChange}
      />

      {/* 2. Cámara nativa (en celulares abre directamente la cámara con capture="environment") */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/*"
        capture="environment"
        style={{ display: 'none' }}
        tabIndex={-1}
        onChange={handleInputChange}
      />

      {/* Vista de cámara en directo (para computadoras / navegadores con webcam) */}
      {cameraActive && (
        <div
          style={{
            position: 'relative',
            background: '#1a202c',
            borderRadius: '12px',
            overflow: 'hidden',
            marginBottom: '12px',
            textAlign: 'center',
          }}
        >
          <video
            ref={camera.videoRef}
            autoPlay
            muted
            playsInline
            onCanPlay={camera.onCanPlay}
            style={{ width: '100%', maxHeight: '260px', objectFit: 'cover', display: 'block' }}
          />
          <div
            style={{
              padding: '10px',
              background: 'rgba(0,0,0,0.6)',
              display: 'flex',
              gap: '10px',
              justifyContent: 'center',
            }}
          >
            <button
              type="button"
              onClick={handleTakeWebcamPhoto}
              disabled={!camera.ready || camera.state !== 'streaming'}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                background: '#38a169',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <GardenIcon name="camera" /> Capturar foto
            </button>
            <button
              type="button"
              onClick={handleCloseWebcam}
              style={{
                padding: '8px 14px',
                background: '#4a5568',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Vista previa de la fotografía si ya está seleccionada */}
      {preview && !cameraActive && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            background: '#f7fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            padding: '10px',
            marginBottom: '10px',
          }}
        >
          <img
            src={preview}
            alt="Vista previa de la evidencia"
            style={{
              width: '80px',
              height: '80px',
              objectFit: 'cover',
              borderRadius: '8px',
              border: '1px solid #cbd5e0',
              flexShrink: 0,
            }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: '0 0 4px', fontSize: '0.85rem', fontWeight: 600, color: '#2d3748' }}>
              Fotografía lista para adjuntar
            </p>
            <p style={{ margin: '0 0 8px', fontSize: '0.78rem', color: '#718096' }}>
              {reading ? 'Optimizando imagen…' : 'Se incluirá en el registro'}
            </p>
            <button
              type="button"
              onClick={onClear}
              style={{
                padding: '4px 10px',
                fontSize: '0.78rem',
                color: '#e53e3e',
                background: '#fff5f5',
                border: '1px solid #feb2b2',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              🗑️ Quitar foto
            </button>
          </div>
        </div>
      )}

      {/* Botones de acción principales: Cámara y Galería */}
      {!cameraActive && (
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleOpenCamera}
            disabled={reading || camera.state === 'requesting'}
            style={{
              flex: '1 1 140px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              minHeight: '44px',
              padding: '10px 14px',
              background: '#f4e7bf',
              border: '1px solid #9d8a52',
              borderRadius: '10px',
              color: '#28462d',
              fontWeight: 600,
              fontSize: '0.88rem',
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
          >
            <GardenIcon name="camera" />
            {preview ? 'Tomar otra foto' : 'Tomar foto'}
          </button>

          <button
            type="button"
            onClick={handleOpenGallery}
            disabled={reading}
            style={{
              flex: '1 1 140px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              minHeight: '44px',
              padding: '10px 14px',
              background: '#f4e7bf',
              border: '1px solid #9d8a52',
              borderRadius: '10px',
              color: '#28462d',
              fontWeight: 600,
              fontSize: '0.88rem',
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
          >
            <GardenIcon name="gallery" />
            {preview ? 'Elegir otra de galería' : 'Subir de galería'}
          </button>
        </div>
      )}

      {reading && (
        <p style={{ margin: '8px 0 0', fontSize: '0.8rem', color: '#319795' }}>
          ⏳ Procesando y optimizando imagen…
        </p>
      )}

      {error && (
        <p style={{ margin: '8px 0 0', fontSize: '0.8rem', color: '#e53e3e', fontWeight: 600 }}>
          ⚠️ {error}
        </p>
      )}

      {!preview && !cameraActive && !reading && helpText && (
        <p style={{ margin: '8px 0 0', fontSize: '0.78rem', color: '#718096' }}>
          {helpText}
        </p>
      )}
    </div>
  )
}

