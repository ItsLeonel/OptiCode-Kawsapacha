import { useEffect, useId, useState } from 'react'
import GardenIcon from '../my-garden/GardenIcon'
import './community-cover-photo.css'
import { PHOTO_ACCEPT, validatePhoto } from '../../shared/photo-validation'

export default function CommunityCoverPhoto({ photo, photoUrl, fallback, onChange }: {
  photo?: File
  photoUrl?: string | null
  fallback: string
  onChange?: (photo: File | undefined) => void
}) {
  const [preview, setPreview] = useState('')
  const [error, setError] = useState('')
  const inputId = useId()

  useEffect(() => {
    if (!photo) { setPreview(''); return }
    const url = URL.createObjectURL(photo)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [photo])

  return <div className="community-cover-photo">
    <img src={preview || photoUrl || fallback} alt={photo || photoUrl ? 'Fotografía de portada de tu comunidad' : ''}/>
    {onChange && <div className="community-cover-controls">
      <label htmlFor={inputId}><GardenIcon name="camera"/>{photo || photoUrl ? 'Cambiar foto' : 'Añadir portada (opcional)'}</label>
      <input id={inputId} type="file" accept={PHOTO_ACCEPT} aria-label="Fotografía de portada opcional" aria-invalid={Boolean(error)} aria-describedby={error ? `${inputId}-error` : undefined} onChange={event => {
        const file = event.target.files?.[0]
        if (file) {
          if (validatePhoto(file)) setError(validatePhoto(file))
          else { setError(''); onChange(file) }
        }
        event.target.value = ''
      }}/>
      {(photo || photoUrl) && <button type="button" onClick={() => { setError(''); onChange(undefined) }}>Quitar foto</button>}
    </div>}
    {error && <p id={`${inputId}-error`} role="alert" className="community-cover-error">{error}</p>}
  </div>
}
