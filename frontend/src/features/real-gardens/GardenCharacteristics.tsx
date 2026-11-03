import { useState, type ReactNode } from 'react'
import GardenIcon from '../my-garden/GardenIcon'
import GardenTypePicker from './GardenTypePicker'
import RealGardenField from './RealGardenField'
import RealGardenIcon from './RealGardenIcon'
import { IRRIGATION_OPTIONS, SOIL_OPTIONS, type IrrigationAvailability, type RealGardenDraft, type RealGardenErrors, type SoilType } from './real-garden'

export default function GardenCharacteristics({ values, errors, disabled, actions, onChange }: {
  values: RealGardenDraft; errors: RealGardenErrors
  disabled: boolean; actions: ReactNode
  onChange: <K extends keyof RealGardenDraft>(field: K, value: RealGardenDraft[K]) => void
}) {
  const [moreOpen, setMoreOpen] = useState(false)
  return <section className="rg-panel rg-characteristics" aria-labelledby="rg-characteristics-title">
    <fieldset className="rg-characteristic-controls" disabled={disabled}><legend className="rg-sr-only">Características del huerto</legend>
    <header className="rg-panel-heading"><GardenIcon name="seed"/><div><h2 id="rg-characteristics-title">Tu espacio de cultivo</h2><p>Define lo esencial de tu huerto.</p></div></header>
    <div className="rg-essential-fields"><RealGardenField id="rg-name" label="Nombre del huerto" required error={errors.name}>{props => <input {...props} name="gardenName" minLength={3} maxLength={100} value={values.name} onChange={event => onChange('name', event.target.value)} placeholder="Mi Huerto Andino"/>}</RealGardenField>
      <RealGardenField id="rg-areaM2" label="Superficie aproximada (m²)" required error={errors.areaM2}>{props => <input {...props} type="number" name="areaM2" min="0.01" step="any" inputMode="decimal" value={values.areaM2} onChange={event => onChange('areaM2', event.target.value)} placeholder="Ej. 25"/>}</RealGardenField></div>
    <GardenTypePicker value={values.kind} error={errors.kind} onChange={kind => onChange('kind', kind)}/>
    <details className="rg-more-characteristics" open={moreOpen || Boolean(errors.irrigationAvailability || errors.soilType)} onToggle={event => setMoreOpen(event.currentTarget.open)}><summary><span>Más características<small>Completa el riego y, si cultivas en tierra, el suelo</small></span><span aria-hidden="true">⌄</span></summary><div className="rg-characteristic-fields">
      <div><span className="rg-field-icon" aria-hidden="true"><RealGardenIcon name="water"/></span><RealGardenField id="rg-irrigationAvailability" label="Agua de riego" required error={errors.irrigationAvailability}>{props => <select {...props} name="irrigationAvailability" value={values.irrigationAvailability} onChange={event => onChange('irrigationAvailability', event.target.value as IrrigationAvailability | '')}><option value="">Selecciona una opción</option>{Object.entries(IRRIGATION_OPTIONS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>}</RealGardenField></div>
      <div><span className="rg-field-icon" aria-hidden="true"><RealGardenIcon name="soil"/></span>{values.kind === 'ground' ? <RealGardenField id="rg-soilType" label="Tipo de suelo" required error={errors.soilType}>{props => <select {...props} name="soilType" value={values.soilType} onChange={event => onChange('soilType', event.target.value as SoilType | '')}><option value="">Selecciona el suelo</option>{Object.entries(SOIL_OPTIONS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>}</RealGardenField> : <div className="rg-soil-note"><strong>Tipo de suelo</strong><span>{values.kind ? 'No corresponde a este tipo de huerto.' : 'Se solicita si eliges «En tierra».'}</span></div>}</div>
    </div></details>
    </fieldset>
    {actions}
  </section>
}
