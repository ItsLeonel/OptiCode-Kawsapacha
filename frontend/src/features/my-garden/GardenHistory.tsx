import GardenIcon from './GardenIcon'
import type { GardenPlant } from './garden'
import { useState } from 'react'
import ActivityList from './journal/ActivityList'
import { ACTIVITY_TYPES, type GardenActivity } from './journal/activities'
import './garden-journal.css'

export default function GardenHistory({ plants, onRegister, onSelect, onRealGarden, activities = [], onActivity, onVoid }: {
  plants: GardenPlant[]
  onRegister: () => void
  onSelect: (plant: GardenPlant) => void
  onRealGarden: () => void
  activities?: GardenActivity[]
  onActivity?: () => void
  onVoid?: (id: string, reason: string) => Promise<void>
}) {
  const [type, setType] = useState('all')
  return <div className="garden-history">
    <section className="journal-history" aria-label="Actividades agrícolas guardadas"><div className="journal-heading"><h2>Actividades de mi huerto</h2>{onActivity && <button type="button" onClick={onActivity}>Registrar actividad</button>}</div><p>Bitácora local de acciones documentadas. Las imágenes y los registros se conservan en este navegador.</p><label>Filtrar actividades<select className="journal-filter" aria-label="Filtrar actividades" value={type} onChange={event => setType(event.target.value)}><option value="all">Todas las actividades</option>{Object.entries(ACTIVITY_TYPES).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label><ActivityList activities={activities.filter(activity => type === 'all' || activity.type === type)} plants={plants} onSelect={onSelect} onVoid={onVoid}/></section>
    <section aria-labelledby="cultivation-log-title"><div className="garden-history-heading"><div><h2 id="cultivation-log-title">Fichas de plantas</h2><p>Identificación, fotografías y evidencias del huerto real, incluidas las fichas archivadas.</p></div><button type="button" className="outline" onClick={onRealGarden}>Mi terreno <GardenIcon name="arrow"/></button></div>
      {plants.length ? <ol className="garden-history-events">{[...plants].reverse().map(plant => <li key={plant.id}><img src={plant.photo} alt=""/><div><small>{plant.date} · Parcela {plant.plot + 1}</small><h3>Registro de {plant.name}</h3><p><em>{plant.latin}</em></p><button type="button" onClick={() => onSelect(plant)}>Abrir Pasaporte Vivo <GardenIcon name="arrow"/></button></div></li>)}</ol>
        : <div className="garden-history-empty"><GardenIcon name="book"/><h3>Tu historia empieza con una planta</h3><p>Registra una fotografía de tu planta para verla aquí.</p><button type="button" className="garden-solid-button" onClick={onRegister}>Registrar mi primera planta <GardenIcon name="arrow"/></button></div>}
    </section>
  </div>
}
