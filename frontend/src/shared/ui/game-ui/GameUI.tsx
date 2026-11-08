import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react'
import './game-ui.css'
import './game-v3.css'
import { gameRegionAssets as REGIONS, type GameRegion } from './game-region-assets'
export { gameRegionAssets } from './game-region-assets'
export type { GameRegion } from './game-region-assets'

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

export function GameGuide({ region, message, className = '' }: { region: GameRegion; message?: string; className?: string }) {
  return <aside className={`kg-guide ${className}`} aria-label={`Guía de la ${REGIONS[region].label}`}>
    <img className="kg-guide__portrait" src={REGIONS[region].guide}
      alt={`Personaje ilustrado de la ${REGIONS[region].label}`} />
    {message && <p className="kg-guide__speech">{message}</p>}
  </aside>
}

