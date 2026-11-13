import { useId } from 'react'

/** Representación visual orientativa de iluminación; no sustituye efemérides. */
export default function MoonPhaseIcon({ fraction, size = 40, className = '' }: {
  fraction: number
  size?: number
  className?: string
}) {
  const id = useId().replace(/:/g, '')
  const cycle = ((fraction % 1) + 1) % 1
  const terminator = 24 + 40 * Math.cos(2 * Math.PI * cycle)
  const waxing = cycle < 0.5
  const path = `M24 4 A20 20 0 0 ${waxing ? 1 : 0} 24 44 Q${terminator.toFixed(3)} 24 24 4 Z`
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} className={className}
      aria-hidden="true" focusable="false" role="presentation">
      <defs>
        <linearGradient id={`lunar-light-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fff8d1" />
          <stop offset="65%" stopColor="#f3d67e" />
          <stop offset="100%" stopColor="#c89c46" />
        </linearGradient>
        <radialGradient id={`lunar-dark-${id}`} cx="45%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#37435c" />
          <stop offset="100%" stopColor="#14243b" />
        </radialGradient>
      </defs>
      <circle cx="24" cy="24" r="21" fill="#a2ae8d" opacity=".22" />
      <circle cx="24" cy="24" r="20" fill={`url(#lunar-dark-${id})`} />
      <path d={path} fill={`url(#lunar-light-${id})`} />
      <circle cx="24" cy="24" r="20" fill="none" stroke="#ffe3a0" strokeOpacity=".38" strokeWidth=".65" />
      <circle cx="17" cy="16" r="3.2" fill="#7c744e" opacity=".10" />
      <circle cx="28" cy="29" r="4.5" fill="#706f61" opacity=".10" />
      <circle cx="32" cy="18" r="2.2" fill="#706f61" opacity=".08" />
    </svg>
  )
}
