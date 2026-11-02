import { useRef, type KeyboardEvent } from 'react'
import GardenIcon from './GardenIcon'
import { PLOT_COUNT, type GardenPlant } from './garden'

export default function GardenScene({ plants, selectedPlot, onRegister, onSelect }: {
  plants: GardenPlant[]
  selectedPlot: number | null
  onRegister: (plot: number) => void
  onSelect: (plant: GardenPlant) => void
}) {
  const plotRefs = useRef<(HTMLButtonElement | null)[]>([])
  const gridRef = useRef<HTMLOListElement>(null)

  function moveFocus(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const columns = gridRef.current ? getComputedStyle(gridRef.current).gridTemplateColumns.split(' ').length : 3
    const offsets: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: columns, ArrowUp: -columns }
    let next: number
    if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = PLOT_COUNT - 1
    else if (event.key in offsets) next = Math.max(0, Math.min(PLOT_COUNT - 1, index + offsets[event.key]))
    else return
    event.preventDefault()
    plotRefs.current[next]?.focus()
  }

  return <section className="garden-scene" aria-label="Parcelas de tu jardín digital">
    <div className="garden-scene-caption"><GardenIcon name="leaf"/><span>Tu espacio para sembrar<small>Elige una parcela · Tab, flechas y Enter</small></span></div>
    <ol className="garden-parcels" ref={gridRef} aria-label="Seis parcelas de cultivo">
      {Array.from({ length: PLOT_COUNT }, (_, index) => {
        const plant = plants.find(record => record.plot === index)
        return <li key={index}><button type="button" data-plot-index={index} ref={element => { plotRefs.current[index] = element }}
          className={`garden-parcel ${plant ? 'is-occupied' : 'is-empty'} ${selectedPlot === index ? 'is-selected' : ''}`}
          aria-label={plant ? `Parcela ${index + 1}: ${plant.name}. Abrir Pasaporte Vivo` : `Parcela vacía ${index + 1}. Registrar planta`}
          aria-haspopup={plant ? 'dialog' : undefined} onClick={() => plant ? onSelect(plant) : onRegister(index)} onKeyDown={event => moveFocus(event, index)}>
          <span className="garden-parcel-ground" aria-hidden="true"/>
          <span className="garden-parcel-bed" aria-hidden="true"/>
          {plant ? <span className="garden-parcel-photo"><img src={plant.photo} alt=""/><GardenIcon name="leaf"/></span> : <span className="garden-parcel-plus"><GardenIcon name="plus"/></span>}
          <span className="garden-parcel-label"><strong>{plant ? plant.name : `Parcela ${index + 1}`}</strong><small>{plant ? 'Ver Pasaporte Vivo' : 'Registrar planta'}</small></span>
        </button></li>
      })}
    </ol>
    <p className="garden-scene-note">Escenario ilustrado · Las fotografías representan tus registros de esta visita, no crecimiento verificado.</p>
  </section>
}
