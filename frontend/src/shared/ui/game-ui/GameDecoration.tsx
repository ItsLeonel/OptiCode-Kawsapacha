import adornos from '../../assets/comunidad-v3/decoraciones/adornos-andinos.png'
import naturaleza from '../../assets/comunidad-v3/decoraciones/naturaleza-ecuador.png'

const PARTS = {
  title: { source: adornos, viewBox: '575 24 495 158' },
  flowers: { source: adornos, viewBox: '982 322 265 205' },
  harvest: { source: adornos, viewBox: '680 642 290 235' },
  plank: { source: naturaleza, viewBox: '0 185 805 168' },
} as const

/** Ventanas SVG sobre las láminas decorativas originales; nunca capturas de pantalla. */
export default function GameDecoration({ kind, className = '' }: { kind: keyof typeof PARTS; className?: string }) {
  const part = PARTS[kind]
  return <svg className={`game-decoration ${className}`} viewBox={part.viewBox} aria-hidden="true" focusable="false" preserveAspectRatio={kind === 'title' || kind === 'plank' ? 'none' : 'xMidYMid meet'}>
    <image href={part.source} width="1536" height="1024"/>
  </svg>
}
