import { useRef, useState, type FormEvent } from 'react'
import GardenIcon from '../my-garden/GardenIcon'
import GardenLocation from './GardenLocation'
import GardenCharacteristics from './GardenCharacteristics'
import RealGardenSummary from './RealGardenSummary'
import RealGardenIcon from './RealGardenIcon'
import GardenRegistrationDetails from './GardenRegistrationDetails'
import type { Community } from '../communities/communities'
import { withCommunityLocation } from './garden-community-location'
import { parseRealGarden, toGardenDraft, type RealGarden, type RealGardenDraft, type RealGardenErrors } from './real-garden'
import type { UserSession } from '../../services/api'
import './real-gardens.css'
import './garden-registration.css'

export default function RealGardenPage({
  garden,
  draft,
  onDraftChange,
  community,
  communityName,
  onSave,
  onConnect,
  onCommunity,
  plantRegistrationPending,
  user,
  currentCommunityRole,
}: {
  garden: RealGarden | null
  community?: Community | null
  communityName?: string | null
  onSave: (garden: RealGarden) => RealGarden | void | Promise<RealGarden | void>
  draft: RealGardenDraft
  onDraftChange: (draft: RealGardenDraft) => void
  onConnect: () => void
  onHome?: () => void
  onCommunity: () => void
  plantRegistrationPending?: boolean
  user?: UserSession | null
  /** Rol del usuario actual en la comunidad vinculada al huerto */
  currentCommunityRole?: 'RESPONSABLE' | 'PARTICIPANTE' | null
}) {
  const values = draft
  const setValues = onDraftChange
  // Si el usuario NO es RESPONSABLE ni creador del huerto, mostrar el formulario en modo lectura
  const isCreator = Boolean(user && garden?.createdById && garden.createdById === user.id)
  const canEdit = !user || !currentCommunityRole || currentCommunityRole === 'RESPONSABLE' || isCreator

  const [editing, setEditing] = useState(!garden || draft.photo !== garden.photo || JSON.stringify(draft) !== JSON.stringify(toGardenDraft(garden)))
  const [errors, setErrors] = useState<RealGardenErrors>({})
  const [notice, setNotice] = useState('')
  const [registrationDetailsOpen, setRegistrationDetailsOpen] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const saveGuard = useRef(false)
  const summaryRef = useRef<HTMLDivElement>(null)
  const readOnly = Boolean(garden) && !editing
  const resolvedCommunityName = community?.name ?? communityName ?? null
  const registrationMode = !garden

  function useCommunityLocation() {
    if (!community || readOnly) return
    setValues(withCommunityLocation(values, community))
    setErrors(current => ({ ...current, province: undefined, cantonCode: undefined, parishCode: undefined, coordinates: undefined, reference: undefined }))
    setNotice('Ubicación de la comunidad seleccionada.')
  }

  function update<K extends keyof RealGardenDraft>(field: K, value: RealGardenDraft[K]) {
    if (readOnly || !canEdit) return
    setValues({
      ...values,
      [field]: value,
      ...(field === 'kind' && value !== 'ground' ? { soilType: '' as const } : {}),
      ...(field === 'province' && value !== values.province ? { cantonCode: '', parishCode: '', coordinates: null } : {}),
      ...(field === 'cantonCode' && value !== values.cantonCode ? { parishCode: '', coordinates: null } : {}),
      ...(field === 'parishCode' && value !== values.parishCode ? { coordinates: null } : {}),
      ...(field === 'photo' ? { removePhoto: !value } : {}),
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
    if (!canEdit) return
    setValues(toGardenDraft(garden))
    setEditing(true)
    setErrors({})
    setNotice('Editando tu terreno. Guarda o cancela los cambios.')
    requestAnimationFrame(() => formRef.current?.querySelector<HTMLInputElement>('#rg-name')?.focus())
  }

  function cancel() {
    setValues(toGardenDraft(garden))
    setEditing(false)
    setErrors({})
    setNotice('Edición cancelada.')
    requestAnimationFrame(() => summaryRef.current?.querySelector<HTMLButtonElement>('.rg-edit')?.focus())
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (readOnly || !canEdit || saveGuard.current) return
    const result = parseRealGarden(values, resolvedCommunityName)
    if (!result.ok) {
      setErrors(result.errors)
      setNotice('Revisa los campos indicados antes de guardar tu huerto.')
      const fields = Object.keys(result.errors)
      const configurationErrors = fields.filter(field => field !== 'name' && field !== 'areaM2')
      if (registrationMode && !configurationErrors.length) {
        if (!resolvedCommunityName) {
          setNotice('Primero crea o selecciona una comunidad. Una comunidad personal es válida. Tu borrador sigue aquí.')
          document.getElementById('rg-create-community')?.focus()
          return
        }
        setRegistrationDetailsOpen(true)
      }
      const first = registrationMode ? configurationErrors[0] ?? fields[0] : fields[0]
      requestAnimationFrame(() => {
        const control = formRef.current?.querySelector<HTMLElement>(`#rg-${first}`) ?? document.getElementById(`rg-${first}`)
        const details = control?.closest('details')
        if (details) details.open = true
        if (control) control.focus()
        else if (registrationMode && ['province', 'cantonCode', 'parishCode', 'coordinates', 'reference'].includes(first)) document.getElementById('rg-change-location')?.focus()
      })
      return
    }
    if (!resolvedCommunityName) {
      setNotice('Primero crea o selecciona una comunidad. Una comunidad personal es válida. Tu borrador sigue aquí.')
      document.getElementById('rg-create-community')?.focus()
      return
    }
    saveGuard.current = true
    let saved: RealGarden | void
    try { saved = await onSave(result.garden) }
    catch (cause) { saveGuard.current = false; setNotice(cause instanceof Error ? cause.message : 'No se pudo guardar el terreno.'); return }
    saveGuard.current = false
    setValues(toGardenDraft(saved ?? result.garden))
    setEditing(false)
    setRegistrationDetailsOpen(false)
    setErrors({})
    setNotice(garden ? (user ? 'Huerto actualizado en el servidor.' : 'Terreno actualizado.') : (user ? 'Huerto guardado exitosamente.' : 'Terreno guardado en este navegador.'))
    requestAnimationFrame(() => summaryRef.current?.focus())
  }

  return (
    <section className={`real-garden-page garden-terrain-view${registrationMode ? ' rg-registration-page' : ''}`} data-view={readOnly ? 'registered' : 'form'} aria-label="Mi terreno">
      <div className="rg-content">
        {user && (
          <span className="rg-visitor" style={{ background: 'rgba(56, 161, 105, 0.15)', color: '#2f855a', padding: '4px 10px', borderRadius: '12px', display: 'inline-block', marginBottom: '8px' }}>
            <span aria-hidden="true">●</span> {user.name} · {user.role}
          </span>
        )}
        {!readOnly && !registrationMode && (
          <header className="rg-terrain-intro">
            <RealGardenIcon name="check" />
            <div>
              <h2>Editar mi terreno</h2>
              <p>Actualiza la ubicación y las características de tu huerto.</p>
            </div>
          </header>
        )}
        {plantRegistrationPending && (
          <p className="rg-feedback">Tu planta está en pausa. Guarda el terreno y pulsa «Volver a Mi Jardín» para continuar con la fotografía y los datos elegidos.</p>
        )}
        {!resolvedCommunityName && (
          <section className="rg-feedback" aria-label="Comunidad requerida">
            <h2>Primero, una comunidad para tu huerto</h2>
            <p>Puedes explorar y preparar este borrador. Para registrar el huerto, crea o selecciona una comunidad; una personal de 1 persona es válida. Tus datos y tu fotografía pendiente se conservan al volver.</p>
            <button id="rg-create-community" type="button" className="rg-primary-button" onClick={onCommunity}>
              Crear comunidad para mi huerto
              <GardenIcon name="arrow" />
            </button>
          </section>
        )}
        {!canEdit && (
          <div
            role="note"
            style={{
              background: '#fffaf0',
              border: '1px solid #fbd38d',
              color: '#744210',
              borderRadius: '10px',
              padding: '12px 16px',
              marginBottom: '16px',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span style={{ fontSize: '1.2rem' }}>🔒</span>
            <span>Solo el <strong>Responsable</strong> de la comunidad puede modificar los datos del terreno.</span>
          </div>
        )}
        {readOnly && garden ? (
          <div className="rg-summary-focus" ref={summaryRef} tabIndex={-1} aria-label="Características de mi terreno">
            <RealGardenSummary garden={garden} onEdit={canEdit ? edit : undefined} onConnect={onConnect} onCommunity={onCommunity} />
          </div>
        ) : (
          <form ref={formRef} className="rg-form" onSubmit={submit} noValidate aria-label={garden ? 'Editar mi terreno' : 'Registrar mi terreno'} aria-describedby="rg-visit-note">
            <div className={`rg-form-panels${registrationMode ? ' rg-registration-panels' : ''}`}>
              <GardenLocation values={values} errors={errors} disabled={!canEdit} community={community ?? null} registrationMode={registrationMode} onUseCommunityLocation={useCommunityLocation} onChange={update} />
              <GardenCharacteristics
                values={values}
                errors={errors}
                disabled={!canEdit}
                registrationMode={registrationMode}
                onChange={update}
                actions={
                  <div className="rg-form-footer">
                    <p>* Campos obligatorios · Comunidad requerida</p>
                    <div>
                      {garden && (
                        <button className="rg-outline-button" type="button" onClick={cancel}>
                          Cancelar edición
                        </button>
                      )}
                      <button className="rg-primary-button" type="submit" disabled={!canEdit}>
                        <GardenIcon name="seed" />
                        {garden ? 'Guardar cambios' : 'Guardar mi terreno'}
                        <GardenIcon name="arrow" />
                      </button>
                    </div>
                  </div>
                }
              />
            </div>
          </form>
        )}
        <p className={notice ? 'rg-feedback' : 'rg-sr-only'} role="status" aria-live="polite" aria-atomic="true">
          {notice}
        </p>
        <p className="rg-visit-note" id="rg-visit-note">
          {user ? 'Datos guardados en la base de datos de tu huerto.' : 'Guardado local en este navegador · Sin sincronización multiusuario.'}
        </p>
      </div>
      {registrationMode && registrationDetailsOpen && (
        <GardenRegistrationDetails values={values} errors={errors} onChange={update} onConfirm={submit} onClose={() => setRegistrationDetailsOpen(false)} />
      )}
    </section>
  )
}
