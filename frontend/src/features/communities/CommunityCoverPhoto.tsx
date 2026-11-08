import { useEffect, useId, useState } from 'react'
import GardenIcon from '../my-garden/GardenIcon'
import './community-cover-photo.css'

export default function CommunityCoverPhoto({ photo, fallback, onChange }: {
  photo?: File
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
    <img src={preview || fallback} alt={photo ? 'Vista previa de la fotografía de portada de tu comunidad' : ''}/>
    {onChange && <div className="community-cover-controls">
      <label htmlFor={inputId}><GardenIcon name="camera"/>{photo ? 'Cambiar foto' : 'Añadir portada (opcional)'}</label>
      <input id={inputId} type="file" accept="image/*" aria-label="Fotografía de portada opcional" aria-invalid={Boolean(error)} aria-describedby={error ? `${inputId}-error` : undefined} onChange={event => {
        const file = event.target.files?.[0]
        if (file) {
          if (!file.type.startsWith('image/')) setError('Selecciona un archivo de imagen.')
          else { setError(''); onChange(file) }
        }
        event.target.value = ''
      }}/>
      {photo && <button type="button" onClick={() => { setError(''); onChange(undefined) }}>Quitar foto</button>}
    </div>}
    {error && <p id={`${inputId}-error`} role="alert" className="community-cover-error">{error}</p>}
  </div>
}
