import { useId } from 'react'
import type { GardenRegion } from '../real-gardens/garden-region'
import { SCENE_ART } from './scene-art'

const GARDEN_BACKGROUNDS: Record<GardenRegion, string> = {
  sierra: new URL('../../assets/jardin-regiones/fondo_sierra_jardin_v2.webp', import.meta.url).href,
  costa: new URL('../../assets/jardin-regiones/fondo_costa_jardin_v2.webp', import.meta.url).href,
  oriente: new URL('../../assets/jardin-regiones/fondo_amazonia_jardin_v2.webp', import.meta.url).href,
  galapagos: new URL('../../assets/jardin-regiones/fondo_galapagos_jardin_v2.webp', import.meta.url).href,
}

export function GardenRegionalBackground({ region }: { region: GardenRegion }) {
  const floorId = `${useId().replace(/:/g, '')}-regional-floor`
  // Mirror only the prepared foreground at its native scale. Long mobile pages
  // extend the ground without magnifying its stones or repeating the horizon.
  const floorTexture = <svg width="650" height="190" viewBox="650 790 650 190">
    <image href={GARDEN_BACKGROUNDS[region]} width="1920" height="1080"/>
  </svg>
  return <div className="garden-world-background" aria-hidden="true">
    <svg className="garden-floor-continuation" focusable="false">
      <defs><pattern id={floorId} width="1300" height="380" patternUnits="userSpaceOnUse">
        {floorTexture}
        <g transform="translate(1300 0) scale(-1 1)">{floorTexture}</g>
        <g transform="translate(0 380) scale(1 -1)">{floorTexture}</g>
        <g transform="translate(1300 380) scale(-1 -1)">{floorTexture}</g>
      </pattern></defs>
      <rect width="100%" height="100%" fill={`url(#${floorId})`}/>
    </svg>
    <img key={region} src={GARDEN_BACKGROUNDS[region]} alt="" decoding="async" width="1920" height="1080"
      className="garden-region-layer is-active" data-region={region}/>
  </div>
}

export default function GardenRegionalScenery({ region }: { region: GardenRegion }) {
  const index = { sierra: 0, costa: 1, oriente: 2, galapagos: 3 }[region]
  const viewBox = `${index % 2 * 768} ${Math.floor(index / 2) * 512} 768 512`
  return <div className="garden-regional-details" aria-hidden="true" data-decoration={region}>
    {['left', 'right'].map(side => <svg key={side} className={`garden-region-edge garden-region-edge-${side}`} viewBox={viewBox} focusable="false" data-region-edge={region}>
      <image href={SCENE_ART.borders} width="1536" height="1024" data-garden-art="borders"/>
    </svg>)}
  </div>
}
