import { useState } from 'react'
import EcuadorMap from '../../EcuadorMap'
import GardenIcon from '../my-garden/GardenIcon'
import RealGardenIcon from './RealGardenIcon'
import RealGardenField from './RealGardenField'
import TerritorySelect from './TerritorySelect'
import ExactLocationPicker from './ExactLocationPicker'
import type { Community } from '../communities/communities'
import { communityTerritoryLabels } from '../communities/community-territory'
import { matchesCommunityLocation } from './garden-community-location'
import { cantonsForProvince, parishesForCanton, provinceForName } from './territory'
import type { RealGardenDraft, RealGardenErrors } from './real-garden'

export default function GardenLocation({ values, errors, disabled, community, onUseCommunityLocation, onChange, registrationMode = false }: {
  values: RealGardenDraft; errors: RealGardenErrors; disabled: boolean
  community: Community | null; onUseCommunityLocation: () => void
  registrationMode?: boolean
  onChange: <K extends keyof RealGardenDraft>(field: K, value: RealGardenDraft[K]) => void
}) {
  const province = provinceForName(values.province)
  const [referenceOpen, setReferenceOpen] = useState(false)
  const [changingLocation, setChangingLocation] = useState(!registrationMode && !matchesCommunityLocation(values, community))
  const showEditor = changingLocation || (!registrationMode && (!matchesCommunityLocation(values, community) || Boolean(errors.province || errors.cantonCode || errors.parishCode)))
  const inherited = communityTerritoryLabels({ province: values.province, cantonCode: values.cantonCode, parishCode: values.parishCode, sector: values.reference })
  if (registrationMode) return <fieldset className="rg-panel rg-location rg-registration-location" aria-labelledby="rg-location-title" disabled={disabled}>
    <header className="rg-panel-heading"><GardenIcon name="map"/><div><h2 id="rg-location-title">Ubicación del terreno</h2></div></header>
    <div className="rg-registration-location-summary">
      <GardenIcon name="map" className="rg-registration-location-mark"/>
      <dl>{[['Provincia', inherited.province], ['Cantón', inherited.canton], ['Parroquia', inherited.parish], ['Sector / Barrio', inherited.sector]].map(([label, value]) => <div key={label}><dt>{label}:</dt><dd>{value || 'Sin especificar'}</dd></div>)}</dl>
      {community && <p className="rg-registration-community">{matchesCommunityLocation(values, community) ? 'Ubicación de ' : 'Comunidad: '}<strong>{community.name}</strong></p>}
      {values.coordinates && <p className="rg-registration-coordinates">Latitud: {values.coordinates.latitude} · Longitud: {values.coordinates.longitude}</p>}
      <button id="rg-change-location" type="button" className="rg-outline-button" aria-expanded={showEditor} aria-controls={showEditor ? 'rg-registration-location-editor' : undefined} onClick={() => { setChangingLocation(current => !current); if (!showEditor) requestAnimationFrame(() => document.getElementById('rg-province')?.focus()) }}><RealGardenIcon name="edit"/>{showEditor ? 'Cerrar ubicación' : 'Cambiar ubicación'}</button>
    </div>
    {!showEditor && (errors.province || errors.cantonCode || errors.parishCode || errors.coordinates || errors.reference) && <p className="rg-error" role="alert">{errors.province || errors.cantonCode || errors.parishCode || errors.coordinates || errors.reference} Pulsa «Cambiar ubicación» para corregirla.</p>}
    {showEditor && <div className="rg-registration-location-editor" id="rg-registration-location-editor">
      <div className="rg-location-layout" data-editing="true"><EcuadorMap value={values.province} onChange={province => onChange('province', province)} selectId="rg-province" selectLabel="Provincia" compact required disabled={disabled} showAttribution={false} invalid={Boolean(errors.province)} describedBy={errors.province ? 'rg-province-error' : undefined}/>
        <div className="rg-locality-fields"><TerritorySelect key={`canton-${values.province}`} id="rg-cantonCode" label="Cantón" error={errors.cantonCode} value={values.cantonCode} options={cantonsForProvince(province?.code ?? '')} disabled={disabled || !province} placeholder={province ? 'Buscar cantón…' : 'Primero elige provincia'} onChange={code => onChange('cantonCode', code)}/><TerritorySelect key={`parish-${values.cantonCode}`} id="rg-parishCode" label="Parroquia" error={errors.parishCode} value={values.parishCode} options={parishesForCanton(values.cantonCode)} disabled={disabled || !values.cantonCode} placeholder={values.cantonCode ? 'Buscar parroquia…' : 'Primero elige cantón'} onChange={code => onChange('parishCode', code)}/></div>
      </div>
      {errors.province && <p className="rg-error" id="rg-province-error">{errors.province}</p>}
      <ExactLocationPicker coordinates={values.coordinates} province={values.province} disabled={disabled} error={errors.coordinates} onChange={coordinates => onChange('coordinates', coordinates)}/>
      <RealGardenField id="rg-reference" label="Dirección o referencia" error={errors.reference}>{props => <textarea {...props} name="reference" rows={2} maxLength={300} value={values.reference} onChange={event => onChange('reference', event.target.value)} placeholder="Sector, calle o un lugar de referencia"/>}</RealGardenField>
      <div className="rg-registration-location-controls">{community?.province && <button className="rg-outline-button" type="button" onClick={() => { onUseCommunityLocation(); setChangingLocation(false) }}>Usar ubicación de mi comunidad</button>}<button className="rg-primary-button" type="button" onClick={() => setChangingLocation(false)}><RealGardenIcon name="check"/>Usar esta ubicación</button></div>
    </div>}
  </fieldset>
  return <fieldset className="rg-panel rg-location" aria-labelledby="rg-location-title" disabled={disabled}>
    <header className="rg-panel-heading"><GardenIcon name="map"/><div><h2 id="rg-location-title">Ubicación de mi terreno</h2><p>{community?.province ? 'La ubicación se toma de tu comunidad. Puedes cambiarla.' : 'Elige en el mapa el lugar donde cultivas.'}</p></div></header>
    {community && <p className="rg-location-community"><GardenIcon name="community"/><span>Comunidad: <strong>{community.name}</strong></span></p>}
    {errors.province && <p className="rg-error" id="rg-province-error">{errors.province}</p>}
    <div className="rg-location-layout" data-editing={showEditor}>
      <EcuadorMap value={values.province} onChange={province => onChange('province', province)} selectId="rg-province" selectLabel="Provincia" showProvinceSelect={showEditor} compact required disabled={disabled || !showEditor} showAttribution={false} invalid={Boolean(errors.province)} describedBy={errors.province ? 'rg-province-error' : undefined}/>
      {showEditor ? <div className="rg-locality-fields">
        <TerritorySelect key={`canton-${values.province}`} id="rg-cantonCode" label="Cantón" error={errors.cantonCode} value={values.cantonCode} options={cantonsForProvince(province?.code ?? '')} disabled={disabled || !province} placeholder={province ? 'Buscar cantón…' : 'Primero elige provincia'} onChange={code => onChange('cantonCode', code)}/>
        <TerritorySelect key={`parish-${values.cantonCode}`} id="rg-parishCode" label="Parroquia" error={errors.parishCode} value={values.parishCode} options={parishesForCanton(values.cantonCode)} disabled={disabled || !values.cantonCode} placeholder={values.cantonCode ? 'Buscar parroquia…' : 'Primero elige cantón'} onChange={code => onChange('parishCode', code)}/>
      </div> : <dl className="rg-inherited-location">{[['Provincia', inherited.province], ['Cantón', inherited.canton], ['Parroquia', inherited.parish], ['Sector / Barrio', inherited.sector]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || 'Sin especificar'}</dd></div>)}</dl>}
    </div>
    <div className="rg-location-actions">{community?.province && <button className="rg-primary-button" type="button" onClick={() => { onUseCommunityLocation(); setChangingLocation(false) }}><RealGardenIcon name="check"/>Usar la ubicación de mi comunidad</button>}{!showEditor && <button className="rg-outline-button" type="button" onClick={() => { setChangingLocation(true); requestAnimationFrame(() => document.getElementById('rg-province')?.focus()) }}>Cambiar ubicación del terreno</button>}</div>
    <ExactLocationPicker coordinates={values.coordinates} province={values.province} disabled={disabled} error={errors.coordinates} onChange={coordinates => onChange('coordinates', coordinates)}/>
    <details className="rg-location-reference" open={referenceOpen || Boolean(errors.reference)} onToggle={event => setReferenceOpen(event.currentTarget.open)}><summary>Dirección o referencia <small>(opcional)</small></summary><RealGardenField id="rg-reference" label="Dirección o referencia" error={errors.reference}>{props => <textarea {...props} name="reference" rows={2} maxLength={300} value={values.reference} onChange={event => onChange('reference', event.target.value)} placeholder="Sector, calle o un lugar de referencia"/>}</RealGardenField></details>
  </fieldset>
}
