import { SCENE_ART } from './scene-art'

/** One continuous, flat field with a feathered natural perimeter; there are no individual beds. */
export default function GardenGroundSurface() {
  return <div className="garden-earth-surface" aria-hidden="true">
    <svg className="garden-earth-texture" viewBox="0 240 1536 670" preserveAspectRatio="none" focusable="false">
      <image href={SCENE_ART.ground} width="1536" height="1024" data-garden-art="ground"/>
    </svg>
  </div>
}
