import { useEffect, useRef, useState, type ChangeEvent, type FormEvent, type KeyboardEvent } from 'react'
import GardenIcon from './GardenIcon'
import { PLOT_COUNT, type GardenPlant } from './garden'
import { PLANT_SPECIES, type PlantSpecies, type PlantRegistration, type PlantRegistrationResult } from './plant-species'
import { usePlantCamera } from './usePlantCamera'
import './plant-registration.css'
import { localDate, recordId, validDate } from './plant-record'

// Held only in App memory while the visitor sets up their real garden.
export type PlantRegistrationDraft = {
  plot: number | null
  species: string
  photo: Blob | null
  plantedOn: string
  notice?: string
  requestId?: string
  recordSowing?: boolean
  responsible?: string
}

async function optimizeImage(file: File | Blob): Promise<File | Blob> {
  const url = URL.createObjectURL(file)
  try {
    const image = new Image()
    image.src = url
    await image.decode()
    if (!image.naturalWidth || !image.naturalHeight) throw new Error('Empty image')

    const maxDim = 1920
    const w = image.naturalWidth
    const h = image.naturalHeight

    if (file.size <= 3 * 1024 * 1024 && Math.max(w, h) <= maxDim && ['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      return file
    }

    const scale = Math.min(1, maxDim / Math.max(w, h))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(w * scale)
    canvas.height = Math.round(h * scale)
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas 2D unavailable')
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height)

    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.85))
    if (!blob) throw new Error('Compression failed')

    const originalName = file instanceof File ? file.name.replace(/\.[^/.]+$/, '') : 'foto-planta'
    return new File([blob], `${originalName}.jpg`, { type: 'image/jpeg' })
  } finally {
    URL.revokeObjectURL(url)
  }
}

export default function PlantRegistrationModal({ plants, initialPlot, initialSpecies, initialPhoto, initialPlantedOn, ready, notice, onConfirm, onClose, onSetup, initialSowing = false, initialResponsible = '', initialRequestId, speciesOptions = PLANT_SPECIES as unknown as PlantSpecies[] }: {
  plants: GardenPlant[]
  speciesOptions?: PlantSpecies[]
  initialPlot: number | null
  initialSpecies: string
  initialPhoto: Blob | null
  initialPlantedOn: string
  ready: boolean
  notice?: string
  onConfirm: (registration: PlantRegistration) => PlantRegistrationResult | Promise<PlantRegistrationResult>
  initialSowing?: boolean
  initialResponsible?: string
  initialRequestId?: string
  onClose: () => void
  onSetup: (draft: PlantRegistrationDraft) => void
}) {
  const available = Array.from({ length: PLOT_COUNT }, (_, index) => index).filter(plot => !plants.some(plant => plant.plot === plot))
  const [plot, setPlot] = useState(initialPlot !== null && available.includes(initialPlot) ? initialPlot : available[0] ?? -1)
  const [speciesName, setSpeciesName] = useState(() => speciesOptions.some(option => option.name === initialSpecies) ? initialSpecies : speciesOptions[0]?.name ?? initialSpecies)
  const [plantedOn, setPlantedOn] = useState(initialPlantedOn)
  const [photo, setPhoto] = useState<Blob | null>(initialPhoto)
  const [preview, setPreview] = useState('')
  const [mode, setMode] = useState<'gallery' | 'camera'>('gallery')
  const [error, setError] = useState('')
  const [reading, setReading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [recordSowing, setRecordSowing] = useState(initialSowing)
  const [responsible, setResponsible] = useState(initialResponsible)
  const requestId = useRef(initialRequestId ?? recordId('registration'))
  const dialogRef = useRef<HTMLDialogElement>(null)
  const openerRef = useRef(document.activeElement instanceof HTMLElement ? document.activeElement : null)
  const fileRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const selection = useRef(0)
  const saving = useRef(false)
  const camera = usePlantCamera()
  const species = speciesOptions.find(item => item.name === speciesName)
  const cameraActive = camera.state !== 'idle'

  useEffect(() => {
    const dialog = dialogRef.current!
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialog.showModal()
    return () => {
      selection.current++
      dialog.close()
      document.body.style.overflow = previousOverflow
      if (openerRef.current?.isConnected) openerRef.current.focus({ preventScroll: true })
    }
  }, [])

  useEffect(() => {
    if (!photo) { setPreview(''); return }
    const url = URL.createObjectURL(photo)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [photo])

  async function choosePhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    const request = ++selection.current
    camera.stop()
    setMode('gallery')
    setError('')
    setReading(true)
    setPhoto(null)

    try {
      const optimized = await optimizeImage(file)
      if (optimized.size > 3 * 1024 * 1024) {
        if (request === selection.current) {
          setError('La fotografía excede los 3 MB incluso tras optimizar. Elige otra imagen.')
          setReading(false)
        }
        return
      }
      if (request === selection.current) {
        setPhoto(optimized)
        setReading(false)
      }
    } catch {
      if (request === selection.current) {
        setError('No se puede leer o procesar esta imagen. Selecciona otra fotografía.')
        setReading(false)
      }
    }
  }

  function openGallery() {
    selection.current++
    setReading(false)
    camera.stop()
    setMode('gallery')
    setError('')
    fileRef.current?.click()
  }

  async function openCamera() {
    selection.current++
    setReading(false)
    setError('')

    // En móviles sobre HTTP LAN no hay contexto seguro (window.isSecureContext === false)
    // o navigator.mediaDevices?.getUserMedia está bloqueado. En ese caso usamos la app de cámara nativa.
    const canUseStream = typeof window !== 'undefined' && window.isSecureContext && Boolean(navigator.mediaDevices?.getUserMedia)
    if (!canUseStream) {
      camera.stop()
      setMode('gallery')
      cameraInputRef.current?.click()
      return
    }

    setMode('camera')
    await camera.start()
  }

  async function takePhoto() {
    const request = ++selection.current
    setError('')
    const captured = await camera.capture()
    if (captured && request === selection.current) { setPhoto(captured); setMode('gallery') }
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (saving.current) return
    if (!ready) { setError('Primero registra tu huerto'); return }
    if (!photo || !species || !available.includes(plot) || reading || cameraActive) {
      setError('Selecciona una fotografía, una especie y un espacio disponible.')
      return
    }
    setError('')
    if ((plantedOn && !validDate(plantedOn)) || (recordSowing && (!plantedOn || responsible.trim().length < 2))) { setError('Para registrar la siembra, indica una fecha válida y la persona responsable.'); return }
    saving.current = true
    setBusy(true)
    try {
      camera.stop()
      const result = await onConfirm({ photo, species, plot, requestId: requestId.current, recordSowing, responsible, ...(plantedOn ? { plantedOn } : {}) })
      if (!result.ok) { saving.current = false; setBusy(false); setError(result.error) }
    } catch {
      saving.current = false
      setBusy(false)
      setError('No se pudo registrar tu planta. Tu fotografía sigue disponible; vuelve a intentarlo.')
    }
  }

  function keepFocus(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key !== 'Tab') return
    const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), select:not(:disabled), input:not(:disabled):not([tabindex="-1"])')).filter(element => element.getClientRects().length > 0)
    const first = controls[0]
    const last = controls.at(-1)
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
  }

  return <dialog ref={dialogRef} className="plant-registration" aria-labelledby="plant-registration-title" aria-describedby="plant-registration-description" onKeyDown={keepFocus} onCancel={event => { event.preventDefault(); if (!busy) onClose() }}>
    <header className="plant-registration-header">
      <GardenIcon name="seed"/>
      <div><h2 id="plant-registration-title">Registrar planta</h2><p id="plant-registration-description">Toma una fotografía o elige una imagen de tu planta.</p></div>
      <button className="plant-registration-close" type="button" disabled={busy} autoFocus aria-label="Cerrar registro de planta" onClick={onClose}><GardenIcon name="close"/></button>
    </header>
    <form onSubmit={submit}>
      <div className="plant-registration-body">
        <section className="plant-photo-panel" aria-label="Fotografía de tu planta">
          <div className="plant-photo-sources" role="group" aria-label="Origen de la fotografía">
            <button type="button" aria-pressed={mode === 'camera'} onClick={openCamera} disabled={camera.state === 'requesting' || camera.state === 'capturing'}><GardenIcon name="camera"/>Cámara</button>
            <button type="button" aria-pressed={mode === 'gallery'} onClick={openGallery}><GardenIcon name="gallery"/>Galería</button>
            <label className="plant-sr-only" htmlFor="plant-photo">Fotografía de tu planta (JPG, PNG o WebP, hasta 3 MB)</label>
            <input ref={fileRef} id="plant-photo" type="file" accept="image/jpeg,image/png,image/webp,image/*" tabIndex={-1} className="plant-sr-only" onChange={choosePhoto}/>
            <input ref={cameraInputRef} id="plant-camera-native" type="file" accept="image/jpeg,image/png,image/webp,image/*" capture="environment" tabIndex={-1} className="plant-sr-only" onChange={choosePhoto}/>
          </div>
          <div className="plant-photo-workspace" aria-busy={reading || camera.state === 'requesting' || camera.state === 'capturing'}>
            <div className="plant-viewfinder">
              <video ref={camera.videoRef} hidden={!cameraActive} autoPlay muted playsInline onCanPlay={camera.onCanPlay} aria-label="Vista de la cámara en directo"/>
              {!cameraActive && (preview ? <img src={preview} alt="Vista previa de tu planta"/> : <div className="plant-photo-empty"><GardenIcon name="leaf"/><span>Tu planta, tu fotografía</span><small>JPG, PNG o WebP · hasta 3 MB</small></div>)}
              <span className="plant-viewfinder-corners" aria-hidden="true"/>
              {camera.state === 'requesting' && <span className="plant-camera-status" role="status">Esperando permiso de cámara…</span>}
            </div>
            <div className="plant-photo-controls">
              {cameraActive ? <><button type="button" className="plant-shutter" onClick={takePhoto} disabled={!camera.ready || camera.state !== 'streaming'} aria-label="Tomar fotografía"><GardenIcon name="camera"/></button><button type="button" className="plant-camera-stop" onClick={camera.stop}>Cerrar cámara</button></> : <span role="status">{reading ? 'Cargando fotografía…' : preview ? 'Fotografía lista' : 'Elige Cámara o Galería'}</span>}
            </div>
          </div>
        </section>
        <section className="plant-details-panel" aria-label="Datos de la planta">
          <h3>Vista previa</h3>
          <div className="plant-selected-species">{preview ? <img src={preview} alt="Fotografía seleccionada"/> : <span className="plant-preview-placeholder" aria-hidden="true"><GardenIcon name="seed"/></span>}<div><strong>{species?.name ?? 'Tu planta'}</strong>{species && <em>{species.latin}</em>}</div></div>
          <label className="plant-registration-field" htmlFor="plant-species">Especie medicinal<select id="plant-species" value={speciesName} onChange={event => setSpeciesName(event.target.value)} required>{speciesOptions.map(item => <option key={item.name} value={item.name}>{item.name}</option>)}</select></label>
          <label className="plant-registration-field" htmlFor="plant-position">Posición de cultivo<select id="plant-position" value={plot} onChange={event => setPlot(Number(event.target.value))} required disabled={!available.length}>{!available.length && <option value={-1}>Sin espacios disponibles</option>}{Array.from({ length: PLOT_COUNT }, (_, index) => <option key={index} value={index} disabled={!available.includes(index)}>Espacio {index + 1}{!available.includes(index) ? ' · ocupado' : ''}</option>)}</select></label>
          <label className="plant-registration-field" htmlFor="plant-sowing-date">Fecha de siembra <span>(opcional)</span><input type="date" id="plant-sowing-date" max={localDate()} value={plantedOn} onChange={event => setPlantedOn(event.target.value)}/></label>
          <label className="journal-check"><input type="checkbox" checked={recordSowing} onChange={event => setRecordSowing(event.target.checked)}/>Registrar también la actividad de siembra realizada</label>
          {recordSowing && <label className="plant-registration-field">Persona responsable de la siembra<input required minLength={2} maxLength={100} value={responsible} onChange={event => setResponsible(event.target.value)}/></label>}
          {notice && <p className="plant-registration-notice">{notice}</p>}
          {!available.length && <p className="plant-registration-notice" role="status">Los seis espacios están ocupados. Consulta sus Pasaportes Vivos en el jardín.</p>}
          {!ready && <div className="plant-registration-setup"><p>Primero registra tu terreno en Mi Jardín. Debe estar vinculado a una comunidad. Una comunidad personal es válida.</p><button type="button" disabled={reading || cameraActive} onClick={() => onSetup({ plot, species: speciesName, photo, plantedOn, notice, requestId: requestId.current, recordSowing, responsible })}>Ir a Mi terreno <GardenIcon name="arrow"/></button></div>}
          {(error || (mode === 'camera' && camera.error)) && (
            <div className="plant-registration-error" role="alert">
              <p>{error || camera.error}</p>
              {mode === 'camera' && camera.error && (
                <button
                  type="button"
                  style={{ marginTop: '6px', fontSize: '12px', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', background: '#276749', color: '#fff', border: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  onClick={() => cameraInputRef.current?.click()}
                >
                  <GardenIcon name="camera" /> Abrir cámara del celular
                </button>
              )}
            </div>
          )}
          <div className="plant-registration-actions"><button type="button" className="plant-registration-cancel" disabled={busy} onClick={onClose}>Cancelar</button><button className="plant-registration-submit" type="submit" disabled={busy || !ready || !available.length || !photo || reading || cameraActive}><GardenIcon name="seed"/>{busy ? 'Guardando…' : 'Añadir a mi huerto'}</button></div>
          <small className="plant-registration-temporary">Se guardan la ficha y la fotografía en este navegador.</small>
        </section>
      </div>
    </form>
  </dialog>
}
