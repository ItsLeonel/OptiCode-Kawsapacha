import { useRef, useState, type FormEvent } from 'react'
import GardenIcon from '../my-garden/GardenIcon'
import CommunityDialog from './CommunityDialog'
import type { Community } from './communities'

const EMPTY_COMMUNITY: Community = { name: '', responsible: '', location: '', description: '' }

export default function CommunityForm({ community, onSave, onClose }: {
  community: Community | null
  onSave: (community: Community) => void
  onClose: () => void
}) {
  const [values, setValues] = useState<Community>(community ?? EMPTY_COMMUNITY)
  const [nameError, setNameError] = useState('')
  const nameRef = useRef<HTMLInputElement>(null)

  function update(field: keyof Community, value: string) {
    setValues(current => ({ ...current, [field]: value }))
    if (field === 'name') setNameError('')
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (values.name.trim().length < 3 || values.name.trim().length > 80) {
      setNameError('Escribe un nombre de entre 3 y 80 caracteres, sin contar espacios al inicio o al final.')
      nameRef.current?.focus()
      return
    }
    onSave({ name: values.name.trim(), responsible: values.responsible.trim(), location: values.location.trim(), description: values.description.trim() })
  }

  return <CommunityDialog title={community ? 'Editar mi comunidad' : 'Crear mi comunidad'} description="Dale un nombre a este nuevo encuentro con la tierra. Solo el nombre es obligatorio." onClose={onClose}>
    <p className="community-demo-note" id="community-form-demo">Registro temporal. Se pierde al recargar.</p>
    <form className="community-form" onSubmit={submit} noValidate aria-describedby="community-form-demo">
      <label htmlFor="community-name">Nombre de la comunidad <span aria-hidden="true">*</span></label>
      <input ref={nameRef} id="community-name" name="name" data-community-autofocus required minLength={3} maxLength={80} value={values.name} onChange={event => update('name', event.target.value)} placeholder="¿Cómo se llama tu comunidad?" aria-invalid={Boolean(nameError)} aria-describedby={nameError ? 'community-name-error' : 'community-name-hint'}/>
      {nameError ? <p className="community-field-error" id="community-name-error" role="alert">{nameError}</p> : <small id="community-name-hint">Entre 3 y 80 caracteres.</small>}
      <label htmlFor="community-responsible">Persona responsable <span>(opcional)</span></label>
      <input id="community-responsible" name="responsible" autoComplete="name" maxLength={80} value={values.responsible} onChange={event => update('responsible', event.target.value)} placeholder="Nombre de la persona responsable"/>
      <label htmlFor="community-location">Localidad o provincia <span>(opcional)</span></label>
      <input id="community-location" name="location" maxLength={120} value={values.location} onChange={event => update('location', event.target.value)} placeholder="¿Dónde cultivan sus raíces?"/>
      <label htmlFor="community-description">Acerca de la comunidad <span>(opcional)</span></label>
      <textarea id="community-description" name="description" rows={3} maxLength={500} value={values.description} onChange={event => update('description', event.target.value)} placeholder="Cuéntanos qué les une y qué les gustaría cultivar." aria-describedby="community-description-hint"/>
      <small id="community-description-hint">{values.description.length} de 500 caracteres.</small>
      <div className="community-form-actions">
        <button className="community-secondary-button" type="button" onClick={onClose}>Cancelar</button>
        <button className="community-primary-button" type="submit"><GardenIcon name={community ? 'leaf' : 'community'}/>{community ? 'Guardar cambios' : 'Crear comunidad'}<GardenIcon name="arrow"/></button>
      </div>
    </form>
  </CommunityDialog>
}
