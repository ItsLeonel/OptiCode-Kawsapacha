import { useRef, useState, type FormEvent } from 'react'
import GardenIcon from '../my-garden/GardenIcon'
import GardenLocation from './GardenLocation'
import GardenCharacteristics from './GardenCharacteristics'
import RealGardenSummary from './RealGardenSummary'
import RealGardenIcon from './RealGardenIcon'
import GardenRegionalBackground from './GardenRegionalBackground'
import { regionForProvince } from './garden-region'
import { parseRealGarden, toGardenDraft, type RealGarden, type RealGardenDraft, type RealGardenErrors } from './real-garden'
import './real-gardens.css'

export default function RealGardenPage({ garden, draft, onDraftChange, communityName, onSave, onConnect, onHome, onCommunity, plantRegistrationPending }: {
  garden: RealGarden | null; communityName: string | null; onSave: (garden: RealGarden) => void
  draft: RealGardenDraft; onDraftChange: (draft: RealGardenDraft) => void
  onConnect: () => void; onHome: () => void; onCommunity: () => void
  plantRegistrationPending?: boolean
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
    if (!communityName) {
      setNotice('Primero crea o selecciona una comunidad. Una comunidad personal es válida. Tu borrador sigue aquí.')
      document.getElementById('rg-create-community')?.focus()
      return
    }
    onSave(result.garden)
    setValues(toGardenDraft(result.garden))
    setEditing(false)
    setErrors({})
    setNotice(garden ? 'Huerto actualizado.' : 'Huerto guardado durante esta visita.')
    requestAnimationFrame(() => summaryRef.current?.focus())
  }

  return <main className="real-garden-page" data-region={region} data-view={readOnly ? 'registered' : 'form'}>
    <GardenRegionalBackground region={region}/>
    <div className="rg-content">
      <header className="rg-topbar"><nav className="rg-breadcrumbs" aria-label="Ruta de navegación"><button type="button" onClick={onHome}><GardenIcon name="seed"/>Kawsapacha</button><span aria-hidden="true">/</span><span aria-current="page">Mi Huerto</span></nav><span className="rg-visitor"><span aria-hidden="true"/>Demostración pública · Visitante sin sesión</span></header>
      <section className="rg-hero" aria-labelledby="rg-page-title"><div><h1 data-screen-heading tabIndex={-1} id="rg-page-title"><GardenIcon name="seed"/>Mi Huerto</h1><p className="rg-subtitle">Donde comienza la vida</p>{!readOnly && <p className="rg-intro">Registra el lugar donde cultivas tus plantas medicinales.</p>}</div>
        <div className="rg-connection-preview" aria-label="Mi Huerto es el espacio real y Mi Jardín su representación digital"><div><GardenIcon name="seed"/><span><strong>Mi Huerto <small>(Real)</small></strong><span>Tu espacio físico de cultivo</span></span></div><GardenIcon name="arrow"/><div><RealGardenIcon name="digital"/><span><strong>Mi Jardín <small>(Digital)</small></strong><span>Tu representación virtual para aprender y compartir</span></span></div></div>
      </section>
      {plantRegistrationPending && <p className="rg-feedback">Tu planta está en pausa. Guarda el huerto y pulsa «Conectar con Mi Jardín» para continuar con la fotografía y los datos elegidos.</p>}
      {!communityName && <section className="rg-feedback" aria-label="Comunidad requerida"><h2>Primero, una comunidad para tu huerto</h2><p>Puedes explorar y preparar este borrador. Para registrar el huerto, crea o selecciona una comunidad; una personal de 1 persona es válida. Tus datos y tu fotografía pendiente se conservan al volver.</p><button id="rg-create-community" type="button" className="rg-primary-button" onClick={onCommunity}>Crear comunidad para mi huerto<GardenIcon name="arrow"/></button></section>}
      {readOnly && garden ? <div className="rg-summary-focus" ref={summaryRef} tabIndex={-1} aria-label="Ficha del huerto"><RealGardenSummary garden={garden} onEdit={edit} onConnect={onConnect} onCommunity={onCommunity}/></div> :
        <form ref={formRef} className="rg-form" onSubmit={submit} noValidate aria-label={garden ? 'Editar mi huerto' : 'Registrar mi huerto'} aria-describedby="rg-visit-note">
          <div className="rg-form-panels"><GardenLocation values={values} errors={errors} disabled={false} onChange={update}/><GardenCharacteristics values={values} errors={errors} disabled={false} onChange={update} actions={<div className="rg-form-footer"><p>* Campos obligatorios · Comunidad requerida</p><div>{garden && <button className="rg-outline-button" type="button" onClick={cancel}>Cancelar edición</button>}<button className="rg-primary-button" type="submit"><GardenIcon name="seed"/>{garden ? 'Guardar cambios' : 'Guardar mi huerto'}<GardenIcon name="arrow"/></button></div></div>}/></div>
        </form>}
      <p className={notice ? 'rg-feedback' : 'rg-sr-only'} role="status" aria-live="polite" aria-atomic="true">{notice}</p>
      <footer className="rg-visit-note" id="rg-visit-note"><GardenIcon name="leaf"/><span>Datos temporales de demostración. Se pierden al recargar.</span></footer>
    </div>
  </main>
}
