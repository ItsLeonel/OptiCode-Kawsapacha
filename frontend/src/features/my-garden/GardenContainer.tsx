import { useId } from 'react'
import type { GardenRegion } from '../real-gardens/garden-region'
import { potArtwork, SCENE_ART } from './scene-art'

/** A single empty artisan vessel. Its photograph and interactive control belong to GardenScene. */
export default function GardenContainer({ region, index }: { region: GardenRegion; index: number }) {
  const id = useId().replace(/:/g, '')
  const art = potArtwork(region, index)
  return <svg className="garden-container garden-container-pots" viewBox="0 0 512 512" preserveAspectRatio="xMidYMax meet" aria-hidden="true" focusable="false" data-vessel={art.variant}>
    <defs>
      <radialGradient id={`${id}-contact`}><stop stopColor="#211a10" stopOpacity=".75"/><stop offset=".55" stopColor="#282219" stopOpacity=".3"/><stop offset="1" stopColor="#282219" stopOpacity="0"/></radialGradient>
      <clipPath id={`${id}-vessel`}><rect x="8" width="496" height="512"/></clipPath>
    </defs>
    <g className="garden-container-contact">
      <ellipse cx="205" cy="487" rx="198" ry="24" fill={`url(#${id}-contact)`}/>
      <ellipse cx="255" cy="480" rx="135" ry="7" fill="#211b14" opacity=".72"/>
    </g>
    <g className="garden-container-body" clipPath={`url(#${id}-vessel)`}>
      <image href={SCENE_ART.pots} x={-art.column * 512} y={-art.row * 512 + art.offsetY} width="1536" height="1024" data-garden-art="pots"/>
    </g>
  </svg>
}
