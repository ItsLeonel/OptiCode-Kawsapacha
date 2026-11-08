import type { ReactNode } from 'react'
import GameDecoration from './GameDecoration'
import './game-v3.css'

export default function GameTitle({ children, subtitle, icon, as: Heading = 'h2', id, tabIndex, screenHeading = false, className = '' }: {
  children: ReactNode; subtitle?: ReactNode; icon?: ReactNode; as?: 'h1' | 'h2'; id?: string; tabIndex?: number; screenHeading?: boolean; className?: string
}) {
  return <Heading id={id} tabIndex={tabIndex} data-screen-heading={screenHeading ? '' : undefined} className={`game-title ${className}`}>
    <GameDecoration kind="title" className="game-title-art"/>
    {icon && <span className="game-title-medallion" aria-hidden="true">{icon}</span>}
    <span className="game-title-copy"><span className="game-title-text">{children}</span>{subtitle && <span className="game-title-subtitle">{subtitle}</span>}</span>
  </Heading>
}
