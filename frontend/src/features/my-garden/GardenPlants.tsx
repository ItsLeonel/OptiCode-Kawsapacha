import { useState } from 'react'
import { PLANT_STATES, type GardenPlant } from './garden'
import './garden-journal.css'

export default function GardenPlants({ plants, onSelect, onRegister }: { plants: GardenPlant[]; onSelect: (plant: GardenPlant) => void; onRegister: () => void }) {
  const [archived, setArchived] = useState(false)
  const visible = plants.filter(plant => Boolean(plant.archivedAt) === archived)
  return <section className="journal-plants" aria-label="Mis plantas registradas">
    <div className="journal-heading"><h2>Mis plantas</h2><button type="button" onClick={onRegister}>Registrar planta</button></div>
    <div className="journal-tabs" role="group" aria-label="Estado de las fichas"><button type="button" aria-pressed={!archived} onClick={() => setArchived(false)}>En el jardín</button><button type="button" aria-pressed={archived} onClick={() => setArchived(true)}>Archivadas</button></div>
    {visible.length ? <div className="journal-plant-grid">{visible.map(plant => <button type="button" key={plant.id} className="journal-plant-card" onClick={() => onSelect(plant)}><img src={plant.photo} alt={`Fotografía registrada de ${plant.name}`}/><strong>{plant.name}</strong><em>{plant.latin}</em><span>Espacio {plant.plot + 1} · {PLANT_STATES[plant.state ?? 'not-documented']}</span><small>Abrir Pasaporte Vivo</small></button>)}</div> : <p>{archived ? 'No hay fichas archivadas.' : 'Aún no has registrado plantas en tu huerto.'}</p>}
  </section>
}
