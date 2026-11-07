import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react'
import './game-ui.css'

import fondoCosta from '../../assets/regional-backgrounds/fondo_comunidad_costa.webp'
import fondoSierra from '../../assets/regional-backgrounds/fondo_comunidad_sierra.webp'
import fondoOriente from '../../assets/regional-backgrounds/fondo_comunidad_oriente.webp'
import fondoGalapagos from '../../assets/regional-backgrounds/fondo_comunidad_galapagos.webp'
import guiaCosta from '../../../assets/kawsapacha-comunidad/personajes/personaje_costa.png'
import guiaSierra from '../../../assets/kawsapacha-comunidad/personajes/personaje_sierra.png'
import guiaOriente from '../../../assets/kawsapacha-comunidad/personajes/personaje_oriente.png'
import guiaGalapagos from '../../../assets/kawsapacha-comunidad/personajes/personaje_galapagos.png'

export type GameRegion = 'costa' | 'sierra' | 'oriente' | 'galapagos'
const REGIONS = {
  costa: { label: 'Costa', background: fondoCosta, guide: guiaCosta },
  sierra: { label: 'Sierra', background: fondoSierra, guide: guiaSierra },
  oriente: { label: 'Amazonía', background: fondoOriente, guide: guiaOriente },
  galapagos: { label: 'Galápagos', background: fondoGalapagos, guide: guiaGalapagos },
} as const

export const gameRegionAssets = REGIONS

/** Solo presentacional. Para seleccionar provincias, reutilizar EcuadorMap y regionForProvince. */
export function GameWorld({ region, children, className = '' }: {
  region: GameRegion; children: ReactNode; className?: string
}) {
  const background = REGIONS[region].background
  return <div className={`kg-world ${className}`} data-region={region}
    style={{ backgroundImage: `url("${background}")` } as CSSProperties}>
    {children}
  </div>
}

export function GamePanel({ title, children, className = '' }: {
  title?: string; children: ReactNode; className?: string
}) {
  return <section className={`kg-panel ${className}`}>
    {title && <h2 className="kg-panel__heading">{title}</h2>}
    {children}
  </section>
}

export function GameButton({ variant = 'primary', className = '', children, ...props }:
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' }) {
  return <button {...props} className={`kg-btn ${variant !== 'primary' ? `kg-btn--${variant}` : ''} ${className}`}>
    {children}
  </button>
}

export function GameChoice({ selected, children, className = '', ...props }:
  ButtonHTMLAttributes<HTMLButtonElement> & { selected: boolean }) {
  return <button {...props} type={props.type ?? 'button'}
    aria-pressed={selected} className={`kg-choice ${className}`}>{children}</button>
}

export function GameSteps({ labels, activeIndex, onSelect }: { labels: string[]; activeIndex: number; onSelect?: (index: number) => void }) {
  return <nav className="kg-step-track" aria-label="Pasos de registro">
    {labels.map((label, i) => <button type="button" key={label} className="kg-step" onClick={() => onSelect?.(i)}
      data-state={i < activeIndex ? 'done' : i === activeIndex ? 'active' : 'todo'}
      aria-current={i === activeIndex ? 'step' : undefined}>
      <span className="kg-step__number">{i < activeIndex ? '✓' : i + 1}</span>
      {label}
    </button>)}
  </nav>
}

export function GameGuide({ region, message }: { region: GameRegion; message: string }) {
  return <aside className="kg-guide" aria-label={`Guía de la ${REGIONS[region].label}`}>
    <img className="kg-guide__portrait" src={REGIONS[region].guide}
      alt={`Personaje ilustrado de la ${REGIONS[region].label}`} />
    <p className="kg-guide__speech">{message}</p>
  </aside>
}

