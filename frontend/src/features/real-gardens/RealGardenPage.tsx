import { useRef, useState, type FormEvent } from 'react'
import GardenIcon from '../my-garden/GardenIcon'
import GardenLocation from './GardenLocation'
import GardenCharacteristics from './GardenCharacteristics'
import RealGardenSummary from './RealGardenSummary'
import RealGardenIcon from './RealGardenIcon'
import GardenRegionalBackground from './GardenRegionalBackground'
import { regionForProvince } from './garden-region'
import { parseRealGarden, toGardenDraft, type RealGarden, type RealGardenDraft, type RealGardenErrors } from './real-garden'
import type { UserSession } from '../../services/api'
import './real-gardens.css'

export default function RealGardenPage({
  garden,
  draft,
  onDraftChange,
  communityName,
  onSave,
  onConnect,
  onHome,
  onCommunity,
  user,
}: {
  garden: RealGarden | null
  communityName: string | null
  onSave: (garden: RealGarden) => void
  draft: RealGardenDraft
  onDraftChange: (draft: RealGardenDraft) => void
  onConnect: () => void
  onHome: () => void
  onCommunity: () => void
  user?: UserSession | null
}) {
  const values = draft
  const setValues = onDraftChange
  const [editing, setEditing] = useState(!garden || JSON.stringify(draft) !== JSON.stringify(toGardenDraft(garden)))
  const [errors, setErrors] = useState<RealGardenErrors>({})
  const [notice, setNotice] = useState('')
  const formRef = useRef<HTMLFormElement>(null)
  const summaryRef = useRef<HTMLDivElement>(null)
  const readOnly = Boolean(garden) && !editing
  const region = regionForProvince(readOnly && garden ? garden.location.province : values.province)

  function update<K extends keyof RealGardenDraft>(field: K, value: RealGardenDraft[K]) {
    if (readOnly) return
    setValues({
      ...values,
      [field]: value,
      ...(field === 'kind' && value !== 'ground' ? { soilType: '' as const } : {}),
      ...(field === 'province' && value !== values.province ? { cantonCode: '', parishCode: '', coordinates: null } : {}),
      ...(field === 'cantonCode' && value !== values.cantonCode ? { parishCode: '', coordinates: null } : {}),
      ...(field === 'parishCode' && value !== values.parishCode ? { coordinates: null } : {}),
    })
    setErrors(current => ({
      ...current,
      [field]: undefined,
      ...(field === 'kind' ? { soilType: undefined } : {}),
      ...(field === 'province' ? { cantonCode: undefined, parishCode: undefined, coordinates: undefined } : {}),
      ...(field === 'cantonCode' ? { parishCode: undefined, coordinates: undefined } : {}),
      ...(field === 'parishCode' ? { coordinates: undefined } : {}),
    }))
    setNotice('')
  }

  function edit() {
    setValues(toGardenDraft(garden))
    setEditing(true)
    setErrors({})
    setNotice('Editando tu huerto. Guarda o cancela los cambios.')
    requestAnimationFrame(() => formRef.current?.querySelector<HTMLInputElement>('#rg-name')?.focus())
  }

  function cancel() {
    setValues(toGardenDraft(garden))
    setEditing(false)
    setErrors({})
    setNotice('Edición cancelada.')
    requestAnimationFrame(() => summaryRef.current?.querySelector<HTMLButtonElement>('.rg-edit')?.focus())
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (readOnly) return
    const result = parseRealGarden(values, communityName)
    if (!result.ok) {
      setErrors(result.errors)
      setNotice('Revisa los campos indicados antes de guardar tu huerto.')
      const first = Object.keys(result.errors)[0]
      requestAnimationFrame(() => {
        const control = formRef.current?.querySelector<HTMLElement>(`#rg-${first}`)
        const details = control?.closest('details')
        if (details) details.open = true
        control?.focus()
      })
      return
    }
    onSave(result.garden)
    setValues(toGardenDraft(result.garden))
    setEditing(false)
    setErrors({})
    setNotice(garden ? 'Huerto actualizado en el servidor.' : 'Huerto guardado exitosamente.')
    requestAnimationFrame(() => summaryRef.current?.focus())
  }

  return (
    <main className="real-garden-page" data-region={region} data-view={readOnly ? 'registered' : 'form'}>
      <GardenRegionalBackground region={region} />
      <div className="rg-content">
        <header className="rg-topbar">
          <nav className="rg-breadcrumbs" aria-label="Ruta de navegación">
            <button type="button" onClick={onHome}>
              <GardenIcon name="seed" /> Kawsapacha
            </button>
            <span aria-hidden="true">/</span>
            <span aria-current="page">Mi Huerto</span>
          </nav>
          {user ? (
            <span className="rg-visitor" style={{ background: 'rgba(56, 161, 105, 0.15)', color: '#2f855a' }}>
              <span aria-hidden="true">●</span> {user.name} · {user.role}
            </span>
          ) : (
            <span className="rg-visitor">
              <span aria-hidden="true" /> Demostración pública · Visitante sin sesión
            </span>
          )}
        </header>

        <section className="rg-hero" aria-labelledby="rg-page-title">
          <div>
            <h1 data-screen-heading tabIndex={-1} id="rg-page-title">
              <GardenIcon name="seed" /> Mi Huerto
            </h1>
            <p className="rg-subtitle">Donde comienza la vida</p>
            {!readOnly && <p className="rg-intro">Registra el lugar donde cultivas tus plantas medicinales.</p>}
          </div>
          <div className="rg-connection-preview" aria-label="Mi Huerto es el espacio real y Mi Jardín su representación digital">
            <div>
              <GardenIcon name="seed" />
              <span>
                <strong>Mi Huerto <small>(Real)</small></strong>
                <span>Tu espacio físico de cultivo</span>
              </span>
            </div>
            <GardenIcon name="arrow" />
            <div>
              <RealGardenIcon name="digital" />
              <span>
                <strong>Mi Jardín <small>(Digital)</small></strong>
                <span>Tu representación virtual para aprender y compartir</span>
              </span>
            </div>
          </div>
        </section>

        {readOnly && garden ? (
          <div className="rg-summary-focus" ref={summaryRef} tabIndex={-1} aria-label="Ficha del huerto">
            <RealGardenSummary garden={garden} onEdit={edit} onConnect={onConnect} onCommunity={onCommunity} />
          </div>
        ) : (
          <form
            ref={formRef}
            className="rg-form"
            onSubmit={submit}
            noValidate
            aria-label={garden ? 'Editar mi huerto' : 'Registrar mi huerto'}
            aria-describedby="rg-visit-note"
          >
            <div className="rg-form-panels">
              <GardenLocation values={values} errors={errors} disabled={false} onChange={update} />
              <GardenCharacteristics
                values={values}
                errors={errors}
                disabled={false}
                onChange={update}
                actions={
                  <div className="rg-form-footer">
                    <p>* Campos obligatorios</p>
                    <div>
                      {garden && (
                        <button className="rg-outline-button" type="button" onClick={cancel}>
                          Cancelar edición
                        </button>
                      )}
                      <button className="rg-primary-button" type="submit">
                        <GardenIcon name="seed" />
                        {garden ? 'Guardar cambios' : 'Guardar mi huerto'}
                        <GardenIcon name="arrow" />
                      </button>
                    </div>
                  </div>
                }
              />
            </div>
          </form>
        )}

        <p className="rg-sr-only" role="status" aria-live="polite" aria-atomic="true">
          {notice}
        </p>
        <footer className="rg-visit-note" id="rg-visit-note">
          <GardenIcon name="leaf" />
          <span>
            {user ? 'Datos guardados en la base de datos de tu huerto.' : 'Datos temporales de demostración. Inicia sesión para persistir.'}
          </span>
        </footer>
      </div>
    </main>
  )
}
