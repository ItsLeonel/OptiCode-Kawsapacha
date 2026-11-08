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
import './real-gardens.css'
import './garden-registration.css'

export default function RealGardenPage({ garden, draft, onDraftChange, community, onSave, onConnect, onCommunity, plantRegistrationPending }: {
  garden: RealGarden | null; community: Community | null; onSave: (garden: RealGarden) => void | Promise<void>
  draft: RealGardenDraft; onDraftChange: (draft: RealGardenDraft) => void
  onConnect: () => void; onCommunity: () => void
  plantRegistrationPending?: boolean
}) {
  const values = draft
  const setValues = onDraftChange
  const [editing, setEditing] = useState(!garden || draft.photo !== garden.photo || JSON.stringify(draft) !== JSON.stringify(toGardenDraft(garden)))
  const [errors, setErrors] = useState<RealGardenErrors>({})
  const [notice, setNotice] = useState('')
  const [registrationDetailsOpen, setRegistrationDetailsOpen] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const saveGuard = useRef(false)
  const summaryRef = useRef<HTMLDivElement>(null)
  const readOnly = Boolean(garden) && !editing
  const communityName = community?.name ?? null
  const registrationMode = !garden

  function useCommunityLocation() {
    if (!community || readOnly) return
    setValues(withCommunityLocation(values, community))
    setErrors(current => ({ ...current, province: undefined, cantonCode: undefined, parishCode: undefined, coordinates: undefined, reference: undefined }))
    setNotice('Ubicación de la comunidad seleccionada.')
  }

  function update<K extends keyof RealGardenDraft>(field: K, value: RealGardenDraft[K]) {
    if (readOnly) return
    setValues({ ...values, [field]: value,
      ...(field === 'kind' && value !== 'ground' ? { soilType: '' as const } : {}),
      ...(field === 'province' && value !== values.province ? { cantonCode: '', parishCode: '', coordinates: null } : {}),
      ...(field === 'cantonCode' && value !== values.cantonCode ? { parishCode: '', coordinates: null } : {}),
      ...(field === 'parishCode' && value !== values.parishCode ? { coordinates: null } : {}),
    })
    setErrors(current => ({ ...current, [field]: undefined,
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
    if (readOnly || saveGuard.current) return
    const result = parseRealGarden(values, communityName)
    if (!result.ok) {
      setErrors(result.errors)
      setNotice('Revisa los campos indicados antes de guardar tu huerto.')
      const fields = Object.keys(result.errors)
      const configurationErrors = fields.filter(field => field !== 'name' && field !== 'areaM2')
      if (registrationMode && !configurationErrors.length) {
        if (!communityName) {
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
    if (!communityName) {
      setNotice('Primero crea o selecciona una comunidad. Una comunidad personal es válida. Tu borrador sigue aquí.')
      document.getElementById('rg-create-community')?.focus()
      return
    }
    saveGuard.current = true
    try { await onSave(result.garden) }
    catch (cause) { saveGuard.current = false; setNotice(cause instanceof Error ? cause.message : 'No se pudo guardar el terreno.'); return }
    saveGuard.current = false
    setValues(toGardenDraft(result.garden))
    setEditing(false)
    setRegistrationDetailsOpen(false)
    setErrors({})
    setNotice(garden ? 'Terreno actualizado.' : 'Terreno guardado en este navegador.')
    requestAnimationFrame(() => summaryRef.current?.focus())
  }

  return <section className={`real-garden-page garden-terrain-view${registrationMode ? ' rg-registration-page' : ''}`} data-view={readOnly ? 'registered' : 'form'} aria-label="Mi terreno">
    <div className="rg-content">
      {!readOnly && !registrationMode && <header className="rg-terrain-intro"><RealGardenIcon name="check"/><div><h2>Editar mi terreno</h2><p>Actualiza la ubicación y las características de tu huerto.</p></div></header>}
      {plantRegistrationPending && <p className="rg-feedback">Tu planta está en pausa. Guarda el terreno y pulsa «Volver a Mi Jardín» para continuar con la fotografía y los datos elegidos.</p>}
      {!communityName && <section className="rg-feedback" aria-label="Comunidad requerida"><h2>Primero, una comunidad para tu huerto</h2><p>Puedes explorar y preparar este borrador. Para registrar el huerto, crea o selecciona una comunidad; una personal de 1 persona es válida. Tus datos y tu fotografía pendiente se conservan al volver.</p><button id="rg-create-community" type="button" className="rg-primary-button" onClick={onCommunity}>Crear comunidad para mi huerto<GardenIcon name="arrow"/></button></section>}
      {readOnly && garden ? <div className="rg-summary-focus" ref={summaryRef} tabIndex={-1} aria-label="Características de mi terreno"><RealGardenSummary garden={garden} onEdit={edit} onConnect={onConnect} onCommunity={onCommunity}/></div> :
        <form ref={formRef} className="rg-form" onSubmit={submit} noValidate aria-label={garden ? 'Editar mi terreno' : 'Registrar mi terreno'} aria-describedby="rg-visit-note">
          <div className={`rg-form-panels${registrationMode ? ' rg-registration-panels' : ''}`}><GardenLocation values={values} errors={errors} disabled={false} community={community} registrationMode={registrationMode} onUseCommunityLocation={useCommunityLocation} onChange={update}/><GardenCharacteristics values={values} errors={errors} disabled={false} registrationMode={registrationMode} onChange={update} actions={<div className="rg-form-footer"><p>* Campos obligatorios · Comunidad requerida</p><div>{garden && <button className="rg-outline-button" type="button" onClick={cancel}>Cancelar edición</button>}<button className="rg-primary-button" type="submit"><GardenIcon name="seed"/>{garden ? 'Guardar cambios' : 'Guardar mi terreno'}<GardenIcon name="arrow"/></button></div></div>}/></div>
        </form>}
      <p className={notice ? 'rg-feedback' : 'rg-sr-only'} role="status" aria-live="polite" aria-atomic="true">{notice}</p>
      <p className="rg-visit-note" id="rg-visit-note">Guardado local en este navegador · Sin sincronización multiusuario.</p>
    </div>
    {registrationMode && registrationDetailsOpen && <GardenRegistrationDetails values={values} errors={errors} onChange={update} onConfirm={submit} onClose={() => setRegistrationDetailsOpen(false)}/>}
  </section>
}
