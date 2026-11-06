import { useEffect, useRef, useState, type ChangeEvent, type FormEvent, type KeyboardEvent } from 'react'
import GardenIcon from './GardenIcon'
import { PLOT_COUNT, type GardenPlant } from './garden'
import { PLANT_SPECIES, type PlantRegistration, type PlantRegistrationResult } from './plant-species'
import { usePlantCamera } from './usePlantCamera'
import './plant-registration.css'

export default function PlantRegistrationModal({ plants, initialPlot, initialSpecies, ready, notice, onConfirm, onClose, onSetup }: {
  plants: GardenPlant[]
  initialPlot: number | null
  initialSpecies: string
  ready: boolean
  notice?: string
  onConfirm: (registration: PlantRegistration) => PlantRegistrationResult | Promise<PlantRegistrationResult>
  onClose: () => void
  onSetup: () => void
}) {
  const available = Array.from({ length: PLOT_COUNT }, (_, index) => index).filter(plot => !plants.some(plant => plant.plot === plot))
  const [plot, setPlot] = useState(initialPlot !== null && available.includes(initialPlot) ? initialPlot : available[0] ?? -1)
  const [speciesName, setSpeciesName] = useState(initialSpecies)
  const [plantedOn, setPlantedOn] = useState('')
  const [photo, setPhoto] = useState<Blob | null>(null)
  const [preview, setPreview] = useState('')
  const [mode, setMode] = useState<'gallery' | 'camera'>('gallery')
  const [error, setError] = useState('')
  const [reading, setReading] = useState(false)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const openerRef = useRef(document.activeElement instanceof HTMLElement ? document.activeElement : null)
  const fileRef = useRef<HTMLInputElement>(null)
  const selection = useRef(0)
  const saving = useRef(false)
  const camera = usePlantCamera()
  const species = PLANT_SPECIES.find(item => item.name === speciesName)
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
    setReading(false)
    setPhoto(null)
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || !file.size || file.size > 3 * 1024 * 1024) {
      setError('Usa JPG, PNG o WebP de hasta 3 MB.')
      return
    }
    setReading(true)
    const url = URL.createObjectURL(file)
    try {
      const image = new Image()
      image.src = url
      await image.decode()
      if (!image.naturalWidth || !image.naturalHeight) throw new Error('Empty image')
      if (request === selection.current) setPhoto(file)
    } catch {
      if (request === selection.current) setError('No se puede leer esta imagen. Selecciona otra fotografía.')
    } finally {
      URL.revokeObjectURL(url)
      if (request === selection.current) setReading(false)
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
    setMode('camera')
    setError('')
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
    saving.current = true
    try {
      camera.stop()
      const result = await onConfirm({ photo, species, plot, ...(plantedOn ? { plantedOn } : {}) })
      if (!result.ok) { saving.current = false; setError(result.error) }
    } catch {
      saving.current = false
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

  return <dialog ref={dialogRef} className="plant-registration" aria-labelledby="plant-registration-title" aria-describedby="plant-registration-description" onKeyDown={keepFocus} onCancel={event => { event.preventDefault(); onClose() }}>
    <header className="plant-registration-header">
      <GardenIcon name="seed"/>
      <div><h2 id="plant-registration-title">Registrar planta</h2><p id="plant-registration-description">Toma una fotografía o elige una imagen de tu planta.</p></div>
      <button className="plant-registration-close" type="button" autoFocus aria-label="Cerrar registro de planta" onClick={onClose}><GardenIcon name="close"/></button>
    </header>
    <form onSubmit={submit}>
      <div className="plant-registration-body">
        <section className="plant-photo-panel" aria-label="Fotografía de tu planta">
          <div className="plant-photo-sources" role="group" aria-label="Origen de la fotografía">
            <button type="button" aria-pressed={mode === 'camera'} onClick={openCamera} disabled={camera.state === 'requesting' || camera.state === 'capturing'}><GardenIcon name="camera"/>Cámara</button>
            <button type="button" aria-pressed={mode === 'gallery'} onClick={openGallery}><GardenIcon name="gallery"/>Galería</button>
            <label className="plant-sr-only" htmlFor="plant-photo">Fotografía de tu planta (JPG, PNG o WebP, hasta 3 MB)</label>
            <input ref={fileRef} id="plant-photo" type="file" accept="image/jpeg,image/png,image/webp" tabIndex={-1} className="plant-sr-only" onChange={choosePhoto}/>
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
          <label className="plant-registration-field" htmlFor="plant-species">Especie medicinal<select id="plant-species" value={speciesName} onChange={event => setSpeciesName(event.target.value)} required>{PLANT_SPECIES.map(item => <option key={item.name} value={item.name}>{item.name}</option>)}</select></label>
          <label className="plant-registration-field" htmlFor="plant-position">Posición de cultivo<select id="plant-position" value={plot} onChange={event => setPlot(Number(event.target.value))} required disabled={!available.length}>{!available.length && <option value={-1}>Sin espacios disponibles</option>}{Array.from({ length: PLOT_COUNT }, (_, index) => <option key={index} value={index} disabled={!available.includes(index)}>Espacio {index + 1}{!available.includes(index) ? ' · ocupado' : ''}</option>)}</select></label>
          <label className="plant-registration-field" htmlFor="plant-sowing-date">Fecha de siembra <span>(opcional)</span><input type="date" id="plant-sowing-date" value={plantedOn} onChange={event => setPlantedOn(event.target.value)}/></label>
          {notice && <p className="plant-registration-notice">{notice}</p>}
          {!available.length && <p className="plant-registration-notice" role="status">Los seis espacios están ocupados. Consulta sus Pasaportes Vivos en el jardín.</p>}
          {!ready && <div className="plant-registration-setup"><p>Primero registra tu huerto</p><button type="button" onClick={onSetup}>Ir a Mi Huerto <GardenIcon name="arrow"/></button></div>}
          {(error || (mode === 'camera' && camera.error)) && <p className="plant-registration-error" role="alert">{error || camera.error}</p>}
          <div className="plant-registration-actions"><button type="button" className="plant-registration-cancel" onClick={onClose}>Cancelar</button><button className="plant-registration-submit" type="submit" disabled={!ready || !available.length || !photo || reading || cameraActive}><GardenIcon name="seed"/>Añadir a mi huerto</button></div>
          <small className="plant-registration-temporary">Registro temporal durante esta visita.</small>
        </section>
      </div>
    </form>
  </dialog>
}
