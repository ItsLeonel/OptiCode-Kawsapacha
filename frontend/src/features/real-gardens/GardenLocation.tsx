import EcuadorMap from '../../EcuadorMap'
import GardenIcon from '../my-garden/GardenIcon'
import RealGardenField from './RealGardenField'
import type { RealGardenDraft, RealGardenErrors } from './real-garden'

export default function GardenLocation({ values, errors, disabled, onChange }: {
  values: RealGardenDraft; errors: RealGardenErrors; disabled: boolean
  onChange: <K extends keyof RealGardenDraft>(field: K, value: RealGardenDraft[K]) => void
}) {
  return <section className="rg-panel rg-location" aria-labelledby="rg-location-title">
    <header className="rg-panel-heading"><GardenIcon name="map"/><div><h2 id="rg-location-title">Ubica tu huerto</h2><p>Indica dónde se encuentra tu huerto en Ecuador.</p></div></header>
    {errors.province && <p className="rg-error" id="rg-province-error">{errors.province}</p>}
    <div className="rg-location-layout">
      <EcuadorMap value={values.province} onChange={province => onChange('province', province)} selectId="rg-province" selectLabel="Provincia" compact required disabled={disabled} invalid={Boolean(errors.province)} describedBy={errors.province ? 'rg-province-error' : 'rg-locality-hint'}/>
      <div className="rg-locality-fields">
        <RealGardenField id="rg-canton" label="Cantón" error={errors.canton}>{props => <input {...props} name="canton" maxLength={80} value={values.canton} onChange={event => onChange('canton', event.target.value)} placeholder="Escribe el cantón"/>}</RealGardenField>
        <RealGardenField id="rg-parish" label="Parroquia" error={errors.parish}>{props => <input {...props} name="parish" maxLength={80} value={values.parish} onChange={event => onChange('parish', event.target.value)} placeholder="Escribe la parroquia"/>}</RealGardenField>
        <RealGardenField id="rg-reference" label="Dirección o referencia" error={errors.reference}>{props => <textarea {...props} name="reference" rows={2} maxLength={300} value={values.reference} onChange={event => onChange('reference', event.target.value)} placeholder="Sector, calle o un lugar de referencia"/>}</RealGardenField>
      </div>
      <small className="rg-hint rg-locality-hint" id="rg-locality-hint">Cantón y parroquia son datos de texto libre, sin catálogo oficial ni validación territorial.</small>
    </div>
  </section>
}
