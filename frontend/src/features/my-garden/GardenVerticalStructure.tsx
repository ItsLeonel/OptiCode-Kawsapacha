import { useId } from 'react'
import { SCENE_ART, VERTICAL_POINTS } from './scene-art'

export default function GardenVerticalStructure() {
  const frameId = `${useId().replace(/:/g, '')}-open-frame`
  return <div className="garden-vertical-structure" aria-hidden="true">
    <span className="garden-frame-contact" style={{ left: '10.6%', top: '95.5%' }}/>
    <span className="garden-frame-contact" style={{ left: '89.4%', top: '95.5%' }}/>
    <svg className="garden-structure-art" viewBox="0 0 1254 1280" preserveAspectRatio="none" focusable="false">
      <defs><clipPath id={frameId}>
        <rect width="1254" height="880"/>
        <rect width="330" height="1280"/>
        <rect x="925" width="329" height="1280"/>
      </clipPath></defs>
      {/* The central stile ends at the lower rail; only the main anchored posts reach the ground. */}
      <image href={SCENE_ART.vertical} width="1254" height="1254" clipPath={`url(#${frameId})`} data-garden-art="vertical"/>
    </svg>
    {VERTICAL_POINTS.map(([left, top], index) =>
      <svg key={index} className="garden-vertical-planter" viewBox="0 160 1536 720" focusable="false" style={{ left: `${left}%`, top: `${top}%` }}>
        <image href={SCENE_ART.verticalPlanter} width="1536" height="1024" data-garden-art="vertical-planter"/>
      </svg>
    )}
  </div>
}
