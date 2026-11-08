import { useRef, type CSSProperties, type KeyboardEvent } from 'react'
import GardenIcon from './GardenIcon'
import GardenContainer from './GardenContainer'
import GardenRegionalScenery from './GardenRegionalScenery'
import GardenGroundSurface from './GardenGroundSurface'
import GardenPergola from './GardenPergola'
import GardenVerticalStructure from './GardenVerticalStructure'
import { HANGING_POINTS, potArtwork, REGIONAL_SURFACES, VERTICAL_POINTS } from './scene-art'
import { PLOT_COUNT, type GardenPlant } from './garden'
import { formatGardenArea, type GardenKind } from '../real-gardens/real-garden'
import type { GardenRegion } from '../real-gardens/garden-region'

const SCENES = {
  ground: { title: 'Tu huerto en tierra', unit: 'Punto de siembra', empty: 'Punto de siembra vacío', icon: 'seed' },
  pots: { title: 'Tu espacio en macetas', unit: 'Maceta', empty: 'Maceta vacía', icon: 'pot' },
  vertical: { title: 'Tu jardín vertical', unit: 'Espacio', empty: 'Espacio vertical vacío', icon: 'vertical' },
  hanging: { title: 'Tu jardín colgante', unit: 'Macetero', empty: 'Macetero colgante vacío', icon: 'hanging' },
} as const

export default function GardenScene({
  kind = 'ground',
  areaM2 = 25,
  region = 'sierra',
  plants,
  selectedPlot,
  onRegister,
  onSelect,
  disabled = false,
}: {
  kind?: GardenKind
  areaM2?: number
  region?: GardenRegion
  plants: GardenPlant[]
  selectedPlot: number | null
  onRegister: (plot: number) => void
  onSelect: (plant: GardenPlant) => void
  disabled?: boolean
}) {
  const plotRefs = useRef<(HTMLButtonElement | null)[]>([])
  const gridRef = useRef<HTMLOListElement>(null)
  const validKind: GardenKind =
    kind === 'pots' || kind === 'vertical' || kind === 'hanging' || kind === 'ground' ? kind : 'ground'
  const scene = SCENES[validKind]
  const validRegion: GardenRegion =
    region === 'costa' || region === 'sierra' || region === 'oriente' || region === 'galapagos' ? region : 'sierra'
  // Square-root sizing suggests area; bounds keep every existing control usable.
  const extent = Math.sqrt(areaM2 / (areaM2 + 25))
  const compact = areaM2 < 10
  const layout = {
    '--scene-footprint': .62 + .38 * extent,
    '--scene-depth': .8 + .2 * extent,
    '--scene-gap': `${8 + 20 * extent}px`,
    '--scene-columns': compact ? 2 : 3,
    '--scene-ground-ratio': compact ? 1.5 : 2.15,
  } as CSSProperties

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

  return (
    <section className="garden-scene garden-scene--sized" aria-label={scene.title} data-garden-kind={validKind} data-layout={compact ? 'compact' : 'spread'} style={layout}>
      <div className="garden-scene-caption">
        <GardenIcon name={scene.icon as any} />
        <span>{scene.title} · {formatGardenArea(areaM2)}</span>
      </div>
      <p className="garden-sr-only" id="garden-keyboard-hint">
        Usa Tab o las flechas para recorrer los seis espacios. Inicio y Fin van al primero y al último. Enter o Espacio abren el registro o el Pasaporte Vivo.
      </p>
      <div className="garden-stage" data-kind={validKind} data-surface={REGIONAL_SURFACES[validRegion]}>
        <GardenRegionalScenery region={validRegion} />
        {validKind === 'ground' && <GardenGroundSurface />}
        {validKind === 'hanging' && <GardenPergola />}
        {validKind === 'vertical' && <GardenVerticalStructure />}
        <ol
          className="garden-parcels"
          ref={gridRef}
          aria-label={`Seis espacios de cultivo: ${scene.title.toLocaleLowerCase('es-EC')}`}
          aria-describedby="garden-keyboard-hint"
        >
          {Array.from({ length: PLOT_COUNT }, (_, index) => {
            const plant = plants.find(record => record.plot === index)
            const point = validKind === 'vertical' ? VERTICAL_POINTS[index] : validKind === 'hanging' ? HANGING_POINTS[index] : null
            const art = potArtwork(validRegion, index)
            const style = {
              '--soil-from-bottom': art.soilFromBottom,
              ...(point ? { '--plot-x': `${point[0]}%`, '--plot-y': `${point[1]}%` } : {}),
            } as CSSProperties
            const isPlotDisabled = disabled && !plant

            return (
              <li key={index} style={style}>
                <button
                  type="button"
                  data-plot-index={index}
                  ref={element => {
                    plotRefs.current[index] = element
                  }}
                  disabled={isPlotDisabled}
                  style={isPlotDisabled ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
                  className={`garden-parcel ${plant ? 'is-occupied' : 'is-empty'} ${selectedPlot === index ? 'is-selected' : ''}`}
                  aria-label={
                    plant
                      ? `${scene.unit} ${index + 1}: ${plant.name}. Abrir Pasaporte Vivo`
                      : isPlotDisabled
                      ? `Parcela ${index + 1} deshabilitada. Vincula una comunidad y un huerto real para sembrar`
                      : `${scene.empty} ${index + 1}. Registrar planta`
                  }
                  aria-haspopup={plant ? 'dialog' : undefined}
                  onClick={() => {
                    if (plant) onSelect(plant)
                    else if (!isPlotDisabled) onRegister(index)
                  }}
                  onKeyDown={event => moveFocus(event, index)}
                >
                  {validKind === 'pots' && <GardenContainer region={validRegion} index={index} />}
                  {plant ? (
                    <span className="garden-parcel-photo">
                      <img src={plant.photo} alt="" />
                    </span>
                  ) : (
                    <span className="garden-parcel-plus">
                      <GardenIcon name={isPlotDisabled ? 'leaf' : 'plus'} />
                    </span>
                  )}
                  <span className="garden-parcel-label">
                    <strong>{plant ? plant.name : validKind === 'ground' ? `Punto ${index + 1}` : `${scene.unit} ${index + 1}`}</strong>
                    <small>
                      {plant
                        ? 'Ver Pasaporte Vivo'
                        : isPlotDisabled
                        ? 'Huerto no vinculado'
                        : 'Registrar planta'}
                    </small>
                  </span>
                </button>
              </li>
            )
          })}
        </ol>
      </div>
      <p className="garden-scene-note">
        Tamaño y distribución orientativos según tu superficie y tipo de huerto. No indica medidas exactas, forma ni capacidad real.{plants.length ? ' Fotografías registradas.' : ''}
      </p>
    </section>
  )
}
