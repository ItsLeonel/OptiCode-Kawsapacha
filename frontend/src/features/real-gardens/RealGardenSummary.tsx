import GardenIcon from '../my-garden/GardenIcon'
import RealGardenIcon from './RealGardenIcon'
import { GARDEN_KINDS, IRRIGATION_OPTIONS, SOIL_OPTIONS, formatGardenArea, type RealGarden } from './real-garden'

export default function RealGardenSummary({ garden, onEdit, onConnect, onCommunity }: {
  garden: RealGarden | null; onEdit: () => void; onConnect: () => void; onCommunity: () => void
}) {
  return <section className="rg-panel rg-summary" aria-labelledby="rg-summary-title">
    <div className="rg-summary-illustration" aria-hidden="true"><span>Ilustración del territorio</span></div>
    <div className="rg-summary-data">
      <div className="rg-summary-heading"><div><span className="rg-kicker">{garden ? 'REGISTRO TEMPORAL · ESTA VISITA' : 'TU HUERTO REAL'}</span><h2 id="rg-summary-title"><GardenIcon name="leaf"/>Mi huerto registrado</h2></div>{garden && <button className="rg-outline-button rg-edit" type="button" onClick={onEdit}><RealGardenIcon name="edit"/>Editar información</button>}</div>
      {garden ? <>
        <h3 className="rg-registered-name">{garden.name}</h3>
        <dl className="rg-summary-facts">
          <div><dt><GardenIcon name="map"/> Ubicación</dt><dd>{[garden.location.province, garden.location.canton, garden.location.parish].filter(Boolean).join(' · ')}</dd></div>
          <div><dt><GardenIcon name="seed"/> Tipo y superficie</dt><dd>{GARDEN_KINDS[garden.kind].label} · {formatGardenArea(garden.areaM2)}</dd></div>
          <div><dt><RealGardenIcon name="water"/> Riego{garden.soilType ? ' y suelo' : ''}</dt><dd>{IRRIGATION_OPTIONS[garden.irrigationAvailability]}{garden.soilType && ` · ${SOIL_OPTIONS[garden.soilType]}`}</dd></div>
        </dl>
        <p className="rg-summary-reference"><strong>Dirección o referencia:</strong> {garden.location.reference || 'Sin especificar'}</p>
        <p className="rg-summary-community"><GardenIcon name="community"/>{garden.communityName || 'Aún sin comunidad vinculada.'}{!garden.communityName && <button type="button" className="rg-text-button" onClick={onCommunity}>Crear mi comunidad <GardenIcon name="arrow"/></button>}</p>
      </> : <div className="rg-summary-empty"><p>Tu huerto todavía no está registrado.</p><small>Completa su ubicación y sus características. Aquí aparecerán únicamente los datos que guardes durante esta visita.</small></div>}
    </div>
    <div className="rg-connect"><RealGardenIcon name="digital"/><div><h3>¡Ahora, dale vida en Mi Jardín!</h3><p>Tu huerto real y su representación digital, en un mismo camino.</p></div><button className="rg-primary-button" type="button" onClick={onConnect} disabled={!garden}><RealGardenIcon name="link"/>Conectar con Mi Jardín<GardenIcon name="arrow"/></button>{!garden && <small>Primero guarda la información de tu huerto.</small>}</div>
  </section>
}
