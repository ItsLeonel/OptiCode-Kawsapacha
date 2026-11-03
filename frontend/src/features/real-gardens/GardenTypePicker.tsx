import RealGardenIcon from './RealGardenIcon'
import { GARDEN_KINDS, type GardenKind } from './real-garden'
import groundImage from './assets/en-tierra-v1.jpg'
import potsImage from './assets/macetas-v1.jpg'
import verticalImage from './assets/vertical-v1.jpg'
import hangingImage from './assets/colgante-v1.jpg'

const KINDS = [
  { kind: 'ground', image: groundImage, icon: 'soil' },
  { kind: 'pots', image: potsImage, icon: 'pots' },
  { kind: 'vertical', image: verticalImage, icon: 'vertical' },
  { kind: 'hanging', image: hangingImage, icon: 'hanging' },
] as const

export default function GardenTypePicker({ value, onChange, error }: {
  value: GardenKind | ''; onChange: (kind: GardenKind) => void; error?: string
}) {
  return <fieldset className="rg-type-picker" aria-describedby={error ? 'rg-kind-error' : 'rg-kind-hint'}>
    <legend><RealGardenIcon name="soil"/> Tipo de huerto <span aria-hidden="true">*</span></legend>
    <div className="rg-type-grid">{KINDS.map(({ kind, image, icon }, index) => <label className="rg-type-option" key={kind}>
      <input id={index === 0 ? 'rg-kind' : `rg-kind-${kind}`} type="radio" name="garden-kind" value={kind} checked={value === kind} onChange={() => onChange(kind)} required aria-invalid={Boolean(error)}/>
      <span className="rg-type-card"><img src={image} alt="" aria-hidden="true" width="1536" height="1024" decoding="async"/><span className="rg-type-checked"><RealGardenIcon name="check"/></span><span className="rg-type-copy"><RealGardenIcon name={icon}/><strong>{GARDEN_KINDS[kind].label}</strong><small>{GARDEN_KINDS[kind].description}</small></span></span>
    </label>)}</div>
    {error ? <p className="rg-error" id="rg-kind-error">{error}</p> : <small id="rg-kind-hint" className="rg-hint">Elige el espacio donde cultivas. Las imágenes son ilustrativas.</small>}
  </fieldset>
}
