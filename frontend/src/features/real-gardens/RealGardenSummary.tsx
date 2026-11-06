import GardenIcon from '../my-garden/GardenIcon'
import RealGardenIcon from './RealGardenIcon'
import { formatCoordinates } from './ExactLocationPicker'
import { GARDEN_TYPE_IMAGES } from './garden-type-assets'
import { GARDEN_KINDS, IRRIGATION_OPTIONS, SOIL_OPTIONS, formatGardenArea, type RealGarden } from './real-garden'

export default function RealGardenSummary({ garden, onEdit, onConnect, onCommunity }: {
  garden: RealGarden; onEdit?: () => void; onConnect: () => void; onCommunity: () => void
}) {
  const { location } = garden
  const hasDetails = Boolean(location.reference || location.coordinates || garden.communityName)

  return <section className="rg-panel rg-summary" aria-labelledby="rg-summary-title">
    <header className="rg-summary-heading"><GardenIcon name="seed"/><h2 id="rg-summary-title">Mi huerto registrado</h2></header>
    <div className="rg-summary-layout">
      <figure className="rg-summary-illustration">
        <img src={GARDEN_TYPE_IMAGES[garden.kind]} alt={`Ilustración de un huerto: ${GARDEN_KINDS[garden.kind].label.toLocaleLowerCase('es-EC')}`} width="1536" height="1024"/>
        <figcaption>Ilustración de referencia</figcaption>
      </figure>
      <div className="rg-summary-data">
        <div className="rg-registered-identity"><h3 className="rg-registered-name">{garden.name}</h3>
          <p className="rg-registered-location"><GardenIcon name="map"/>{[location.province, location.canton, location.parish].filter(Boolean).join(' · ')}</p>
        </div>
        <dl className="rg-summary-facts">
          <div className="rg-fact-kind"><dt><GardenIcon name="seed"/>Tipo de huerto</dt><dd>{GARDEN_KINDS[garden.kind].label}</dd></div>
          <div className="rg-fact-area"><dt><RealGardenIcon name="area"/>Superficie</dt><dd>{formatGardenArea(garden.areaM2)}</dd></div>
          <div className="rg-fact-water"><dt><RealGardenIcon name="water"/>Riego</dt><dd>{IRRIGATION_OPTIONS[garden.irrigationAvailability]}</dd></div>
          {garden.soilType && <div className="rg-fact-soil"><dt><RealGardenIcon name="soil"/>Tipo de suelo</dt><dd>{SOIL_OPTIONS[garden.soilType]}</dd></div>}
        </dl>
        {hasDetails && <dl className="rg-summary-extra">
          {location.reference && <div><dt>Dirección o referencia</dt><dd>{location.reference}</dd></div>}
          {location.coordinates && <div><dt>Ubicación marcada</dt><dd>{formatCoordinates(location.coordinates)}<small>Elegida por ti, sin verificar.</small></dd></div>}
          {garden.communityName && <div className="rg-summary-community"><dt>Comunidad</dt><dd><button type="button" className="rg-text-button" onClick={onCommunity}>{garden.communityName}<GardenIcon name="arrow"/></button></dd></div>}
        </dl>}
        <div className="rg-summary-actions">
          {onEdit && (
            <button className="rg-outline-button rg-edit" type="button" onClick={onEdit}><RealGardenIcon name="edit"/>Editar mi huerto</button>
          )}
          <button className="rg-primary-button" type="button" onClick={onConnect}><RealGardenIcon name="link"/>Conectar con Mi Jardín<GardenIcon name="arrow"/></button>
        </div>
      </div>
    </div>
  </section>
}
