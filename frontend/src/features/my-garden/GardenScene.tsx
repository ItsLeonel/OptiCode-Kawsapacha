import { useRef, type KeyboardEvent } from 'react'
import GardenIcon from './GardenIcon'
import { PLOT_COUNT, type GardenPlant } from './garden'
import { GARDEN_TYPE_IMAGES } from '../real-gardens/garden-type-assets'
import { GARDEN_KINDS, type GardenKind } from '../real-gardens/real-garden'

export default function GardenScene({
  plants,
  selectedPlot,
  onRegister,
  onSelect,
  gardenKind = 'ground',
  disabled = false,
}: {
  plants: GardenPlant[]
  selectedPlot: number | null
  onRegister: (plot: number) => void
  onSelect: (plant: GardenPlant) => void
  gardenKind?: string
  disabled?: boolean
}) {
  const plotRefs = useRef<(HTMLButtonElement | null)[]>([])
  const gridRef = useRef<HTMLOListElement>(null)

  const validKind: GardenKind =
    gardenKind === 'pots' || gardenKind === 'vertical' || gardenKind === 'hanging' || gardenKind === 'ground'
      ? gardenKind
      : 'ground'

  const kindInfo = GARDEN_KINDS[validKind]
  const kindImage = GARDEN_TYPE_IMAGES[validKind]

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
    <section
      className={`garden-scene garden-scene--${validKind}`}
      aria-label={`Parcelas de tu jardín digital (${kindInfo.label})`}
    >
      <div className="garden-scene-header-bar">
        <div className="garden-scene-caption">
          <GardenIcon name="leaf" />
          <span>
            Tu espacio para sembrar · <strong>{kindInfo.label}</strong>
            <small>{disabled ? 'Vincula tu comunidad y huerto para habilitar las parcelas' : 'Elige una parcela · Tab, flechas y Enter'}</small>
          </span>
        </div>
        <div className={`garden-kind-badge garden-kind-badge--${validKind}`}>
          <span className="garden-kind-badge-dot" />
          {validKind === 'ground' && '🌱 En tierra'}
          {validKind === 'pots' && '🪴 En macetas'}
          {validKind === 'vertical' && '🪜 Huerto vertical'}
          {validKind === 'hanging' && '🪢 Huerto colgante'}
        </div>
      </div>

      <div className={`garden-parcels-frame garden-parcels-frame--${validKind}`}>
        <div
          className="garden-kind-bg-image"
          style={{ backgroundImage: `url(${kindImage})` }}
          aria-hidden="true"
        />
        <div className="garden-kind-bg-tint" aria-hidden="true" />

        <ol className={`garden-parcels garden-parcels--${validKind}`} ref={gridRef} aria-label="Seis parcelas de cultivo">
          {Array.from({ length: PLOT_COUNT }, (_, index) => {
            const plant = plants.find(record => record.plot === index)
            const isPlotDisabled = disabled && !plant
            return (
              <li key={index} className={`garden-parcel-item garden-parcel-item--${validKind}`}>
                <button
                  type="button"
                  data-plot-index={index}
                  ref={element => {
                    plotRefs.current[index] = element
                  }}
                  disabled={isPlotDisabled}
                  style={isPlotDisabled ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
                  className={`garden-parcel garden-parcel--${validKind} ${plant ? 'is-occupied' : 'is-empty'} ${selectedPlot === index ? 'is-selected' : ''}`}
                  aria-label={
                    plant
                      ? `Parcela ${index + 1}: ${plant.name}. Abrir Pasaporte Vivo`
                      : isPlotDisabled
                      ? `Parcela ${index + 1} deshabilitada. Vincula una comunidad y un huerto real para sembrar`
                      : `Parcela vacía ${index + 1}. Registrar planta`
                  }
                  aria-haspopup={plant ? 'dialog' : undefined}
                  onClick={() => {
                    if (plant) onSelect(plant)
                    else if (!isPlotDisabled) onRegister(index)
                  }}
                  onKeyDown={event => moveFocus(event, index)}
                >
                  <span className="garden-parcel-ground" aria-hidden="true" />
                  <span className="garden-parcel-bed" aria-hidden="true" />
                  {plant ? (
                    <span className="garden-parcel-photo">
                      <img src={plant.photo} alt="" />
                      <GardenIcon name="leaf" />
                    </span>
                  ) : (
                    <span className="garden-parcel-plus">
                      <GardenIcon name={isPlotDisabled ? 'leaf' : 'plus'} />
                    </span>
                  )}
                  <span className="garden-parcel-label">
                    <strong>{plant ? plant.name : `Parcela ${index + 1}`}</strong>
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
        Modalidad: <strong>{kindInfo.label}</strong> — {kindInfo.description}
      </p>
    </section>
  )
}
