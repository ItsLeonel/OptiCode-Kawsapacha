import { useEffect, useId, useState } from 'react'
import GardenIcon from '../my-garden/GardenIcon'
import { PHOTO_ACCEPT, validatePhoto } from '../../shared/photo-validation'

export default function GardenPhoto({ photo, photoUrl, fallback, disabled = false, onChange }: {
  photo?: File; photoUrl?: string | null; fallback?: string; disabled?: boolean; onChange?: (photo: File | undefined) => void
}) {
  const [preview, setPreview] = useState<{ file: File; url: string } | null>(null)
  const [error, setError] = useState('')
  const inputId = useId()

  useEffect(() => {
    if (!photo) { setPreview(null); return }
    const url = URL.createObjectURL(photo)
    setPreview({ file: photo, url })
    return () => URL.revokeObjectURL(url)
  }, [photo])

  const hasPhoto = Boolean(photo || photoUrl)
  const source = photo ? preview?.file === photo ? preview.url : undefined : photoUrl || fallback
  return <figure className="rg-garden-photo">
    {source ? <img src={source} alt={hasPhoto ? 'Fotografía de tu terreno' : 'Ilustración de referencia del tipo de huerto'}/> : <div className="rg-garden-photo-empty"><GardenIcon name="camera"/><span>{photo ? 'Cargando tu fotografía…' : 'Añade una fotografía de tu terreno'}</span></div>}
    <figcaption>{hasPhoto ? 'Fotografía de tu terreno' : onChange ? 'Fotografía del terreno (opcional)' : 'Ilustración de referencia'}</figcaption>
    {onChange && <div className="rg-garden-photo-actions">
      <label htmlFor={inputId}>{hasPhoto ? 'Reemplazar fotografía' : 'Subir fotografía'}</label>
      <input id={inputId} type="file" accept={PHOTO_ACCEPT} disabled={disabled} aria-label="Fotografía del terreno (opcional)" aria-invalid={Boolean(error)} aria-describedby={error ? `${inputId}-error` : undefined} onChange={event => {
        const file = event.target.files?.[0]
        if (file) {
          if (validatePhoto(file)) setError(validatePhoto(file))
          else { setError(''); onChange(file) }
        }
        event.target.value = ''
      }}/>
      {hasPhoto && <button type="button" className="rg-text-button" disabled={disabled} onClick={() => { setError(''); onChange(undefined) }}>Quitar fotografía</button>}
    </div>}
    {error && <p className="rg-error" id={`${inputId}-error`} role="alert">{error}</p>}
  </figure>
}
