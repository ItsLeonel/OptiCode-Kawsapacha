import { useState } from 'react'
import EcuadorMap from '../../EcuadorMap'
import GardenIcon from '../my-garden/GardenIcon'
import RealGardenField from './RealGardenField'
import TerritorySelect from './TerritorySelect'
import ExactLocationPicker from './ExactLocationPicker'
import { cantonsForProvince, parishesForCanton, provinceForName } from './territory'
import type { RealGardenDraft, RealGardenErrors } from './real-garden'

export default function GardenLocation({ values, errors, disabled, onChange }: {
  values: RealGardenDraft; errors: RealGardenErrors; disabled: boolean
  onChange: <K extends keyof RealGardenDraft>(field: K, value: RealGardenDraft[K]) => void
}) {
  const province = provinceForName(values.province)
  const [referenceOpen, setReferenceOpen] = useState(false)
  return <fieldset className="rg-panel rg-location" aria-labelledby="rg-location-title" disabled={disabled}>
    <header className="rg-panel-heading"><GardenIcon name="map"/><div><h2 id="rg-location-title">Selecciona tu provincia</h2><p>Elige en el mapa el lugar de tu huerto.</p></div></header>
    {errors.province && <p className="rg-error" id="rg-province-error">{errors.province}</p>}
    <div className="rg-location-layout">
      <EcuadorMap value={values.province} onChange={province => onChange('province', province)} selectId="rg-province" selectLabel="Provincia" compact required disabled={disabled} showAttribution={false} invalid={Boolean(errors.province)} describedBy={errors.province ? 'rg-province-error' : undefined}/>
      <div className="rg-locality-fields">
        <TerritorySelect key={`canton-${values.province}`} id="rg-cantonCode" label="Cantón" error={errors.cantonCode} value={values.cantonCode} options={cantonsForProvince(province?.code ?? '')} disabled={disabled || !province} placeholder={province ? 'Buscar cantón…' : 'Primero elige provincia'} onChange={code => onChange('cantonCode', code)}/>
        <TerritorySelect key={`parish-${values.cantonCode}`} id="rg-parishCode" label="Parroquia" error={errors.parishCode} value={values.parishCode} options={parishesForCanton(values.cantonCode)} disabled={disabled || !values.cantonCode} placeholder={values.cantonCode ? 'Buscar parroquia…' : 'Primero elige cantón'} onChange={code => onChange('parishCode', code)}/>
      </div>
    </div>
    <ExactLocationPicker coordinates={values.coordinates} province={values.province} disabled={disabled} error={errors.coordinates} onChange={coordinates => onChange('coordinates', coordinates)}/>
    <details className="rg-location-reference" open={referenceOpen || Boolean(errors.reference)} onToggle={event => setReferenceOpen(event.currentTarget.open)}><summary>Dirección o referencia <small>(opcional)</small></summary><RealGardenField id="rg-reference" label="Dirección o referencia" error={errors.reference}>{props => <textarea {...props} name="reference" rows={2} maxLength={300} value={values.reference} onChange={event => onChange('reference', event.target.value)} placeholder="Sector, calle o un lugar de referencia"/>}</RealGardenField></details>
  </fieldset>
}
