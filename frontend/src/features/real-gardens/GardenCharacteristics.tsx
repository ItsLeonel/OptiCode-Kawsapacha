import { useState, type ReactNode } from 'react'
import GardenIcon from '../my-garden/GardenIcon'
import GardenTypePicker from './GardenTypePicker'
import RealGardenField from './RealGardenField'
import RealGardenIcon from './RealGardenIcon'
import GardenChecklist from './GardenChecklist'
import GardenPhoto from './GardenPhoto'
import GardenFeatureAccordion, { type GardenFeatureStep } from './GardenFeatureAccordion'
import { FENCE_OPTIONS, GROUND_DESIGN_OPTIONS, IRRIGATION_METHOD_OPTIONS, NATURAL_FERTILIZER_OPTIONS, WATER_SOURCE_OPTIONS, toGardenFeatures, toggleGardenFeature, type GardenFeatures } from './garden-characteristics'
import { IRRIGATION_OPTIONS, SOIL_OPTIONS, type IrrigationAvailability, type RealGardenDraft, type RealGardenErrors, type SoilType } from './real-garden'

export default function GardenCharacteristics({ values, errors, disabled, actions, onChange, registrationMode = false }: {
  values: RealGardenDraft; errors: RealGardenErrors
  disabled: boolean; actions: ReactNode
  registrationMode?: boolean
  onChange: <K extends keyof RealGardenDraft>(field: K, value: RealGardenDraft[K]) => void
}) {
  const [moreOpen, setMoreOpen] = useState(false)
  const features = toGardenFeatures(values.characteristics)
  function toggle<K extends keyof GardenFeatures>(field: K, value: GardenFeatures[K][number]) {
    onChange('characteristics', toggleGardenFeature(features, field, value))
  }
  const steps: GardenFeatureStep[] = [
    { id: 'rg-irrigationAvailability', title: 'Disponibilidad de agua', icon: <RealGardenIcon name="water"/>, selected: values.irrigationAvailability ? 1 : 0, required: true, error: errors.irrigationAvailability,
      content: <GardenChecklist<IrrigationAvailability> id="rg-irrigationAvailability" label="Disponibilidad de agua de riego" icon={<RealGardenIcon name="water"/>} options={IRRIGATION_OPTIONS} value={values.irrigationAvailability} required error={errors.irrigationAvailability} onChange={value => onChange('irrigationAvailability', value)}/> },
    { id: 'rg-waterSources', title: 'Fuente de agua', icon: <RealGardenIcon name="water"/>, selected: features.waterSources.length,
      content: <GardenChecklist id="rg-waterSources" label="Fuente de agua" icon={<RealGardenIcon name="water"/>} options={WATER_SOURCE_OPTIONS} value={features.waterSources} multiple onChange={value => toggle('waterSources', value)}/> },
    { id: 'rg-irrigationMethods', title: 'Método de riego', icon: <RealGardenIcon name="water"/>, selected: features.irrigationMethods.length,
      content: <GardenChecklist id="rg-irrigationMethods" label="Método de riego" icon={<RealGardenIcon name="water"/>} options={IRRIGATION_METHOD_OPTIONS} value={features.irrigationMethods} multiple onChange={value => toggle('irrigationMethods', value)}/> },
  ]
  if (registrationMode || values.kind === 'ground') steps.push(
    { id: 'rg-soilType', title: 'Tipo de suelo', icon: <RealGardenIcon name="soil"/>, selected: values.soilType ? 1 : 0, required: values.kind === 'ground', notApplicable: Boolean(values.kind && values.kind !== 'ground'), error: errors.soilType,
      content: values.kind === 'ground' ? <GardenChecklist<SoilType> id="rg-soilType" label="Tipo de suelo" icon={<RealGardenIcon name="soil"/>} options={SOIL_OPTIONS} value={values.soilType} required error={errors.soilType} onChange={value => onChange('soilType', value)}/> : <p className="rg-registration-not-applicable">El tipo de suelo corresponde a los huertos «En tierra».</p> },
    { id: 'rg-groundDesigns', title: 'Distribución en tierra', icon: <RealGardenIcon name="soil"/>, selected: features.groundDesigns.length, notApplicable: Boolean(values.kind && values.kind !== 'ground'),
      content: values.kind === 'ground' ? <GardenChecklist id="rg-groundDesigns" label="Distribución en tierra" icon={<RealGardenIcon name="soil"/>} options={GROUND_DESIGN_OPTIONS} value={features.groundDesigns} multiple onChange={value => toggle('groundDesigns', value)}/> : <p className="rg-registration-not-applicable">Esta distribución corresponde a los huertos «En tierra». Las selecciones anteriores se conservan.</p> },
  )
  steps.push(
    { id: 'rg-fences', title: 'Cercas', icon: <RealGardenIcon name="vertical"/>, selected: features.fences.length,
      content: <GardenChecklist id="rg-fences" label="Cercas" icon={<RealGardenIcon name="vertical"/>} options={FENCE_OPTIONS} value={features.fences} multiple onChange={value => toggle('fences', value)}/> },
    { id: 'rg-naturalFertilizers', title: 'Abono natural', icon: <GardenIcon name="leaf"/>, selected: features.naturalFertilizers.length,
      content: <GardenChecklist id="rg-naturalFertilizers" label="Abono natural" icon={<GardenIcon name="leaf"/>} options={NATURAL_FERTILIZER_OPTIONS} value={features.naturalFertilizers} multiple onChange={value => toggle('naturalFertilizers', value)}/> },
  )
  if (registrationMode) return <>
    <section className="rg-panel rg-registration-kind" aria-labelledby="rg-registration-kind-title"><fieldset className="rg-characteristic-controls" disabled={disabled}><legend className="rg-sr-only">Tipo de huerto</legend><header className="rg-panel-heading"><GardenIcon name="seed"/><div><h2 id="rg-registration-kind-title">Tipo de huerto <span aria-hidden="true">*</span></h2></div></header><GardenTypePicker value={values.kind} error={errors.kind} onChange={kind => onChange('kind', kind)}/></fieldset></section>
    <section className="rg-panel rg-registration-more" id="rg-characteristics" tabIndex={-1} aria-labelledby="rg-registration-more-title"><fieldset className="rg-characteristic-controls" disabled={disabled}><legend className="rg-sr-only">Características del huerto</legend><header className="rg-panel-heading"><GardenIcon name="book"/><div><h2 id="rg-registration-more-title">Más características</h2><p>Completa las secciones para describir tu huerto.</p></div></header><GardenFeatureAccordion steps={steps} registrationMode/><div id="rg-photo" tabIndex={-1}><GardenPhoto photo={values.photo} photoUrl={values.removePhoto ? undefined : values.photoUrl} disabled={disabled} onChange={photo => onChange('photo', photo)}/>{errors.photo && <p className="rg-error">{errors.photo}</p>}</div>{errors.characteristics && <p className="rg-error">{errors.characteristics}</p>}</fieldset></section>
  </>
  return <section className="rg-panel rg-characteristics" aria-labelledby="rg-characteristics-title">
    <fieldset className="rg-characteristic-controls" disabled={disabled}><legend className="rg-sr-only">Características del huerto</legend>
    <header className="rg-panel-heading"><GardenIcon name="seed"/><div><h2 id="rg-characteristics-title">Tu espacio de cultivo</h2><p>Define lo esencial de tu huerto.</p></div></header>
    <div className="rg-essential-fields"><RealGardenField id="rg-name" label="Nombre del huerto" required error={errors.name}>{props => <input {...props} name="gardenName" minLength={3} maxLength={100} value={values.name} onChange={event => onChange('name', event.target.value)} placeholder="Mi Huerto Andino"/>}</RealGardenField>
      <RealGardenField id="rg-areaM2" label="Superficie aproximada (m²)" required error={errors.areaM2}>{props => <input {...props} type="number" name="areaM2" min="0.01" step="any" inputMode="decimal" value={values.areaM2} onChange={event => onChange('areaM2', event.target.value)} placeholder="Ej. 25"/>}</RealGardenField></div>
    <GardenTypePicker value={values.kind} error={errors.kind} onChange={kind => onChange('kind', kind)}/>
    <div id="rg-photo" tabIndex={-1}><GardenPhoto photo={values.photo} photoUrl={values.removePhoto ? undefined : values.photoUrl} disabled={disabled} onChange={photo => onChange('photo', photo)}/>{errors.photo && <p className="rg-error">{errors.photo}</p>}</div>
    <details id="rg-characteristics" tabIndex={-1} className="rg-more-characteristics" open={moreOpen || Boolean(errors.irrigationAvailability || errors.soilType || errors.characteristics)} onToggle={event => setMoreOpen(event.currentTarget.open)}><summary><span>Más características<small>Completa una sección y continúa con la siguiente.</small></span><span aria-hidden="true">⌄</span></summary><GardenFeatureAccordion steps={steps}/>{values.kind !== 'ground' && <p className="rg-hint">Suelo y distribución en tierra: disponibles al elegir «En tierra».</p>}{errors.characteristics && <p className="rg-error">{errors.characteristics}</p>}</details>
    </fieldset>
    {actions}
  </section>
}
