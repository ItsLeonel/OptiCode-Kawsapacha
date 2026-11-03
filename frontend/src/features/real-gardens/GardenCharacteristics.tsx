import GardenIcon from '../my-garden/GardenIcon'
import GardenTypePicker from './GardenTypePicker'
import RealGardenField from './RealGardenField'
import RealGardenIcon from './RealGardenIcon'
import { IRRIGATION_OPTIONS, SOIL_OPTIONS, type IrrigationAvailability, type RealGardenDraft, type RealGardenErrors, type SoilType } from './real-garden'

export default function GardenCharacteristics({ values, errors, onChange }: {
  values: RealGardenDraft; errors: RealGardenErrors
  onChange: <K extends keyof RealGardenDraft>(field: K, value: RealGardenDraft[K]) => void
}) {
  return <section className="rg-panel rg-characteristics" aria-labelledby="rg-characteristics-title">
    <header className="rg-panel-heading"><GardenIcon name="seed"/><div><h2 id="rg-characteristics-title">Características del huerto</h2><p>Cuéntanos cómo es tu espacio de cultivo real.</p></div></header>
    <RealGardenField id="rg-name" label="Nombre del huerto" required error={errors.name}>{props => <input {...props} name="gardenName" minLength={3} maxLength={100} value={values.name} onChange={event => onChange('name', event.target.value)} placeholder="¿Cómo se llama tu huerto?"/>}</RealGardenField>
    <GardenTypePicker value={values.kind} error={errors.kind} onChange={kind => onChange('kind', kind)}/>
    <div className="rg-characteristic-fields">
      <div><span className="rg-field-icon" aria-hidden="true"><RealGardenIcon name="area"/></span><RealGardenField id="rg-areaM2" label="Superficie (m²)" required error={errors.areaM2}>{props => <input {...props} type="number" name="areaM2" min="0.01" step="any" inputMode="decimal" value={values.areaM2} onChange={event => onChange('areaM2', event.target.value)} placeholder="Área aproximada"/>}</RealGardenField></div>
      <div><span className="rg-field-icon" aria-hidden="true"><RealGardenIcon name="water"/></span><RealGardenField id="rg-irrigationAvailability" label="Agua de riego" required error={errors.irrigationAvailability}>{props => <select {...props} name="irrigationAvailability" value={values.irrigationAvailability} onChange={event => onChange('irrigationAvailability', event.target.value as IrrigationAvailability | '')}><option value="">Selecciona una opción</option>{Object.entries(IRRIGATION_OPTIONS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>}</RealGardenField></div>
      <div><span className="rg-field-icon" aria-hidden="true"><RealGardenIcon name="soil"/></span>{values.kind === 'ground' ? <RealGardenField id="rg-soilType" label="Tipo de suelo" required error={errors.soilType}>{props => <select {...props} name="soilType" value={values.soilType} onChange={event => onChange('soilType', event.target.value as SoilType | '')}><option value="">Selecciona el suelo</option>{Object.entries(SOIL_OPTIONS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>}</RealGardenField> : <div className="rg-soil-note"><strong>Tipo de suelo</strong><span>{values.kind ? 'No corresponde a este tipo de huerto.' : 'Se solicita si eliges «En tierra».'}</span></div>}</div>
    </div>
  </section>
}
