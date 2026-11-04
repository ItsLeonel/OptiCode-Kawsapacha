import { useRef, type CSSProperties, type KeyboardEvent } from 'react'
import GardenIcon from './GardenIcon'
import GardenContainer from './GardenContainer'
import GardenRegionalScenery from './GardenRegionalScenery'
import GardenGroundSurface from './GardenGroundSurface'
import GardenPergola from './GardenPergola'
import GardenVerticalStructure from './GardenVerticalStructure'
import { HANGING_POINTS, potArtwork, REGIONAL_SURFACES, VERTICAL_POINTS } from './scene-art'
import { PLOT_COUNT, type GardenPlant } from './garden'
import type { GardenKind } from '../real-gardens/real-garden'
import type { GardenRegion } from '../real-gardens/garden-region'

const SCENES = {
  ground: { title: 'Tu huerto en tierra', unit: 'Punto de siembra', empty: 'Punto de siembra vacío', icon: 'seed' },
  pots: { title: 'Tu espacio en macetas', unit: 'Maceta', empty: 'Maceta vacía', icon: 'pot' },
  vertical: { title: 'Tu jardín vertical', unit: 'Espacio', empty: 'Espacio vertical vacío', icon: 'vertical' },
  hanging: { title: 'Tu jardín colgante', unit: 'Macetero', empty: 'Macetero colgante vacío', icon: 'hanging' },
} as const

export default function GardenScene({ kind, region, plants, selectedPlot, onRegister, onSelect }: {
  kind: GardenKind
  region: GardenRegion
  plants: GardenPlant[]
  selectedPlot: number | null
  onRegister: (plot: number) => void
  onSelect: (plant: GardenPlant) => void
}) {
  const plotRefs = useRef<(HTMLButtonElement | null)[]>([])
  const gridRef = useRef<HTMLOListElement>(null)
  const scene = SCENES[kind]

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

  return <section className="garden-scene" aria-label={scene.title} data-garden-kind={kind}>
    <div className="garden-scene-caption"><GardenIcon name={scene.icon}/><span>{scene.title}</span></div>
    <p className="garden-sr-only" id="garden-keyboard-hint">Usa Tab o las flechas para recorrer los seis espacios. Inicio y Fin van al primero y al último. Enter o Espacio abren el registro o el Pasaporte Vivo.</p>
    <div className="garden-stage" data-kind={kind} data-surface={REGIONAL_SURFACES[region]}>
      <GardenRegionalScenery region={region}/>
      {kind === 'ground' && <GardenGroundSurface/>}
      {kind === 'hanging' && <GardenPergola/>}
      {kind === 'vertical' && <GardenVerticalStructure/>}
      <ol className="garden-parcels" ref={gridRef} aria-label={`Seis espacios de cultivo: ${scene.title.toLocaleLowerCase('es-EC')}`} aria-describedby="garden-keyboard-hint">
        {Array.from({ length: PLOT_COUNT }, (_, index) => {
          const plant = plants.find(record => record.plot === index)
          const point = kind === 'vertical' ? VERTICAL_POINTS[index] : kind === 'hanging' ? HANGING_POINTS[index] : null
          const art = potArtwork(region, index)
          const style = { '--soil-from-bottom': art.soilFromBottom, ...(point ? { '--plot-x': `${point[0]}%`, '--plot-y': `${point[1]}%` } : {}) } as CSSProperties
          return <li key={index} style={style}>
            <button type="button" data-plot-index={index} ref={element => { plotRefs.current[index] = element }}
              className={`garden-parcel ${plant ? 'is-occupied' : 'is-empty'} ${selectedPlot === index ? 'is-selected' : ''}`}
              aria-label={plant ? `${scene.unit} ${index + 1}: ${plant.name}. Abrir Pasaporte Vivo` : `${scene.empty} ${index + 1}. Registrar planta`}
              aria-haspopup={plant ? 'dialog' : undefined} onClick={() => plant ? onSelect(plant) : onRegister(index)} onKeyDown={event => moveFocus(event, index)}>
              {kind === 'pots' && <GardenContainer region={region} index={index}/>}
              {plant ? <span className="garden-parcel-photo"><img src={plant.photo} alt=""/></span> : <span className="garden-parcel-plus"><GardenIcon name="plus"/></span>}
              <span className="garden-parcel-label"><strong>{plant ? plant.name : kind === 'ground' ? `Punto ${index + 1}` : `${scene.unit} ${index + 1}`}</strong><small>{plant ? 'Ver Pasaporte Vivo' : 'Registrar planta'}</small></span>
            </button>
          </li>
        })}
      </ol>
    </div>
    <p className="garden-scene-note">Escenario ilustrado{plants.length ? ' · Fotografías registradas durante esta visita' : ''}</p>
  </section>
}
