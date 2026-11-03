import { GARDEN_REGIONS, type GardenRegion } from './garden-region'

export default function GardenRegionalBackground({ region }: { region: GardenRegion }) {
  return <div className="rg-world-background" aria-hidden="true">
    {Object.entries(GARDEN_REGIONS).map(([key, item]) => <img key={key} src={item.background} alt=""
      className={`rg-regional-layer${key === region ? ' is-active' : ''}`} data-region={key} decoding="async"/>)}
  </div>
}
