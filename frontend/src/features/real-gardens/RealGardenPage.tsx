import { useRef, useState, type FormEvent } from 'react'
import GardenIcon from '../my-garden/GardenIcon'
import GardenLocation from './GardenLocation'
import GardenCharacteristics from './GardenCharacteristics'
import RealGardenSummary from './RealGardenSummary'
import RealGardenIcon from './RealGardenIcon'
import { parseRealGarden, toGardenDraft, type RealGarden, type RealGardenDraft, type RealGardenErrors } from './real-garden'
import './real-gardens.css'

export default function RealGardenPage({ garden, communityName, onSave, onConnect, onHome, onCommunity }: {
  garden: RealGarden | null; communityName: string | null; onSave: (garden: RealGarden) => void
  onConnect: () => void; onHome: () => void; onCommunity: () => void
}) {
  const [values, setValues] = useState(() => toGardenDraft(garden))
  const [editing, setEditing] = useState(!garden)
  const [errors, setErrors] = useState<RealGardenErrors>({})
  const [notice, setNotice] = useState('')
  const formRef = useRef<HTMLFormElement>(null)
  const summaryRef = useRef<HTMLDivElement>(null)
  const readOnly = Boolean(garden) && !editing

  function update<K extends keyof RealGardenDraft>(field: K, value: RealGardenDraft[K]) {
    if (readOnly) return
    setValues(current => ({ ...current, [field]: value, ...(field === 'kind' && value !== 'ground' ? { soilType: '' as const } : {}) }))
    setErrors(current => ({ ...current, [field]: undefined, ...(field === 'kind' ? { soilType: undefined } : {}) }))
    setNotice('')
  }

  function edit() {
    setValues(toGardenDraft(garden))
    setEditing(true)
    setErrors({})
    setNotice('Puedes editar los datos. Los cambios se aplican al guardar.')
    requestAnimationFrame(() => formRef.current?.querySelector<HTMLInputElement>('#rg-name')?.focus())
  }

  function cancel() {
    setValues(toGardenDraft(garden))
    setEditing(false)
    setErrors({})
    setNotice('Edición cancelada. Se conserva la información registrada.')
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
      formRef.current?.querySelector<HTMLElement>(`#rg-${first}`)?.focus()
      return
    }
    onSave(result.garden)
    setValues(toGardenDraft(result.garden))
    setEditing(false)
    setErrors({})
    setNotice(garden ? 'Información del huerto actualizada durante esta visita.' : 'Huerto registrado durante esta visita. Ya puedes conectarlo con Mi Jardín.')
    requestAnimationFrame(() => summaryRef.current?.focus())
  }

  return <main className="real-garden-page">
    <div className="rg-world-background" aria-hidden="true"/>
    <div className="rg-content">
      <header className="rg-topbar"><nav className="rg-breadcrumbs" aria-label="Ruta de navegación"><button type="button" onClick={onHome}><GardenIcon name="seed"/>Kawsapacha</button><span aria-hidden="true">/</span><span aria-current="page">Mi Huerto</span></nav><span className="rg-visitor"><span aria-hidden="true"/>Demostración pública · Visitante sin sesión</span></header>
      <section className="rg-hero" aria-labelledby="rg-page-title"><div><h1 data-screen-heading tabIndex={-1} id="rg-page-title">Mi Huerto <GardenIcon name="leaf"/></h1><p className="rg-subtitle">Donde comienza la vida</p><p className="rg-intro">Registra el lugar real donde cultivas tus plantas medicinales,<br className="rg-desktop-break"/> sus características y su ubicación en el territorio.</p></div>
        <div className="rg-connection-preview" aria-label="Mi Huerto es el espacio real y Mi Jardín su representación digital"><div><GardenIcon name="seed"/><span><strong>Mi Huerto <small>(Real)</small></strong><span>Tu espacio físico de cultivo</span></span></div><GardenIcon name="arrow"/><div><RealGardenIcon name="digital"/><span><strong>Mi Jardín <small>(Digital)</small></strong><span>Tu representación virtual para aprender y compartir</span></span></div></div>
      </section>
      <form ref={formRef} className="rg-form" onSubmit={submit} noValidate aria-label={garden ? 'Información de mi huerto' : 'Registrar mi huerto'} aria-describedby="rg-visit-note">
        <fieldset className="rg-form-panels" disabled={readOnly}><legend className="rg-sr-only">Ubicación y características del huerto</legend><GardenLocation values={values} errors={errors} disabled={readOnly} onChange={update}/><GardenCharacteristics values={values} errors={errors} onChange={update}/></fieldset>
        <div className="rg-form-footer"><p>{readOnly ? 'Consulta los datos registrados o elige «Editar información» para cambiarlos.' : 'Los campos con * son obligatorios. Guarda para consultar tu ficha.'}</p><div>{readOnly ? <button className="rg-outline-button" type="button" onClick={edit}><RealGardenIcon name="edit"/>Editar información</button> : <>{garden && <button className="rg-outline-button" type="button" onClick={cancel}>Cancelar edición</button>}<button className="rg-primary-button" type="submit"><GardenIcon name="seed"/>{garden ? 'Guardar cambios' : 'Guardar mi huerto'}<GardenIcon name="arrow"/></button></>}</div></div>
      </form>
      <p className="rg-status" role="status" aria-live="polite" aria-atomic="true">{notice}</p>
      <div className="rg-summary-focus" ref={summaryRef} tabIndex={-1} aria-label="Ficha del huerto"><RealGardenSummary garden={garden} onEdit={edit} onConnect={onConnect} onCommunity={onCommunity}/></div>
      <footer className="rg-visit-note" id="rg-visit-note"><GardenIcon name="leaf"/><span>Un mismo territorio, un mismo propósito: cuidar y multiplicar la vida.<small>Registros temporales, solo durante esta visita. Se perderán al recargar.</small></span></footer>
    </div>
  </main>
}
