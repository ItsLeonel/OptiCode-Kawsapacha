import GardenIcon from './GardenIcon'
import type { GardenPlant } from './garden'

export default function GardenHistory({ plants, onRegister, onSelect, onRealGarden }: {
  plants: GardenPlant[]
  onRegister: () => void
  onSelect: (plant: GardenPlant) => void
  onRealGarden: () => void
}) {
  return <div className="garden-history">
    <section className="garden-history-path" aria-labelledby="green-path-title"><GardenIcon name="seed"/><div><span className="garden-eyebrow">RECONOCIMIENTOS POR CONECTAR</span><h2 id="green-path-title">Mi camino verde</h2><p>Aprendiz → Oficial → Maestro</p><p>No hay grado ni Semillas de vida asignados. Los avances requieren actividades verificadas por el servidor.</p></div></section>
    <section aria-labelledby="cultivation-log-title"><div className="garden-history-heading"><div><h2 id="cultivation-log-title">Bitácora de cultivo</h2><p>Registros temporales de esta visita. No representan actividades verificadas ni recompensas.</p></div><button type="button" className="outline" onClick={onRealGarden}>Mi huerto real <GardenIcon name="arrow"/></button></div>
      {plants.length ? <ol className="garden-history-events">{[...plants].reverse().map(plant => <li key={plant.id}><img src={plant.photo} alt=""/><div><small>{plant.date} · Parcela {plant.plot + 1}</small><h3>Registro de {plant.name}</h3><p><em>{plant.latin}</em></p><button type="button" onClick={() => onSelect(plant)}>Abrir Pasaporte Vivo <GardenIcon name="arrow"/></button></div></li>)}</ol>
        : <div className="garden-history-empty"><GardenIcon name="book"/><h3>Tu historia empieza con una planta</h3><p>Registra una fotografía de tu planta para verla aquí. Las actividades de cuidado se incorporarán posteriormente.</p><button type="button" className="garden-solid-button" onClick={onRegister}>Registrar mi primera planta <GardenIcon name="arrow"/></button></div>}
    </section>
  </div>
}
