import { SCENE_ART } from './scene-art'

export default function GardenPergola() {
  return <div className="garden-hanging-frame" aria-hidden="true">
    {[[11.8, 98.2], [87.6, 98.2], [21, 88.1], [78.7, 88.1]].map(([x, y], index) =>
      <span key={index} className="garden-frame-contact" style={{ left: `${x}%`, top: `${y}%` }}/>)}
    <img className="garden-structure-art" src={SCENE_ART.hanging} alt="" width="1536" height="1024" decoding="async" data-garden-art="hanging"/>
  </div>
}
