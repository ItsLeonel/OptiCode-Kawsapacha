import type { SVGProps, ReactNode } from 'react'

export type BitacoraIconName =
  | 'book' | 'clipboard' | 'sprout' | 'camera' | 'calendar' | 'water' | 'sowing'
  | 'fertilizing' | 'observation' | 'harvest' | 'leaf' | 'filter' | 'pin'
  | 'person' | 'plus' | 'chevron' | 'right' | 'close' | 'check' | 'archive'
  | 'history' | 'photo' | 'weeding' | 'preparation' | 'hilling' | 'replanting'
  | 'file' | 'layers' | 'info' | 'empty' | 'flower'

type Props = SVGProps<SVGSVGElement> & { name: BitacoraIconName; size?: number }

/** SVG original, integrado al proyecto: iconos sin emojis ni servicios externos. */
export default function BitacoraIcon({ name, size = 22, className, ...props }: Props) {
  if (name === 'book') {
    return <svg {...props} className={className} width={size} height={size} viewBox="0 0 120 96" fill="none" aria-hidden="true">
      <defs><linearGradient id="bv-book-page" x1="20" y1="20" x2="90" y2="85" gradientUnits="userSpaceOnUse"><stop stopColor="#fffbd8"/><stop offset="1" stopColor="#eec884"/></linearGradient></defs>
      <path d="M15 19 54 17l6 8 6-8 41 2 7 66-49-4-6 5-8-5-43 4Z" fill="#7b421e" stroke="#542c15" strokeWidth="5" strokeLinejoin="round"/>
      <path d="M14 15c16-5 31-3 45 4v61c-16-8-32-8-45-5V15Z" fill="url(#bv-book-page)" stroke="#ad7c40" strokeWidth="2.5"/>
      <path d="M59 19c15-7 30-9 46-4v60c-15-4-30-1-46 5V19Z" fill="url(#bv-book-page)" stroke="#ad7c40" strokeWidth="2.5"/>
      <path d="M59 19v61" stroke="#956c39" strokeWidth="2"/><path d="M22 69c12-3 21-2 31 3M66 72c9-5 20-6 32-4" stroke="#cca46e" strokeWidth="2"/>
      <path d="M34 59c-1-16 3-24 7-35M82 59c0-19-2-27-7-37" stroke="#668d3e" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M36 48c-13-1-15-9-14-14 10 1 14 5 14 14ZM38 40c9-2 13-8 14-13-10 1-14 5-14 13ZM35 57c-9 0-12-7-12-12 8 1 12 5 12 12Z" fill="#8dbd65" stroke="#4b793f" strokeWidth="1.5"/>
      <path d="M82 47c-11-2-15-10-15-16 9 2 14 6 15 16ZM81 40c12-1 15-8 16-14-10 1-15 7-16 14ZM82 56c10-1 15-8 15-13-10 1-14 5-15 13Z" fill="#b4c976" stroke="#577944" strokeWidth="1.5"/>
    </svg>
  }
  const stroke = { stroke: 'currentColor', strokeWidth: 1.9, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  let drawing: ReactNode
  switch (name) {
    case 'clipboard': drawing = <><rect x="5" y="4" width="14" height="18" rx="2"/><rect x="9" y="2" width="6" height="5" rx="1.2"/><path d="m8 12 1.5 1.5 3-3M8 18h8m-1-6h1"/></>; break
    case 'sprout': drawing = <><path d="M12 22v-10"/><path d="M12 15C5 15 3 11 3 6c7 0 9 4 9 9ZM12 12c0-7 4-10 9-10 0 7-3 10-9 10Z"/><path d="M4 22h16"/></>; break
    case 'leaf': drawing = <><path d="M21 3C8 2 3 8 5 15c3 8 15 3 16-12Z"/><path d="M3 22c5-7 10-11 16-15"/></>; break
    case 'camera': drawing = <><path d="M3 7h4l2-3h6l2 3h4v13H3V7Z"/><circle cx="12" cy="13.5" r="4"/><circle cx="18.4" cy="9.4" r=".7" fill="currentColor" stroke="none"/></>; break
    case 'calendar': drawing = <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 2v6m10-6v6M3 11h18m-13 4h2m4 0h2m-8 3h2"/></>; break
    case 'water': drawing = <><path d="M6 11h10l-1.3 9H7.3L6 11ZM5 11V8h12v3M7 8V6a3 3 0 0 1 6 0v2M17 9l4 3-2 3m-1.3-4.5c1.4.5 2.4 1.5 2.8 2.5M4 13l-2 1"/><path d="M21 17c1 1.6 1 2.4 0 3-.9-.6-.9-1.4 0-3Z" fill="currentColor"/></>; break
    case 'sowing': drawing = <><path d="M12 21V11m0 4C6 15 4 12 4 8c5 0 8 3 8 7Zm0-4c0-5 3-8 8-8 0 5-3 8-8 8Z"/><path d="M3 22c3-2 6-2 9 0 3-2 6-2 9 0"/><circle cx="6" cy="5" r="1" fill="currentColor" stroke="none"/></>; break
    case 'fertilizing': drawing = <><path d="M6 8 9 3h6l3 5 2 13H4L6 8ZM7 9h10"/><path d="M12 11v7m0-2c-3-1-4-3-4-5 3 0 4 2 4 5Zm0-2c0-3 2-4 4-4 0 3-1 4-4 4Z"/></>; break
    case 'observation': drawing = <><circle cx="10" cy="10" r="6"/><path d="m14.5 14.5 6 6"/><path d="M10 7c-2 2-2 4 0 6m0-3c1-2 3-2 4-2"/></>; break
    case 'harvest': drawing = <><path d="M3 12h18l-2 9H5l-2-9ZM3 16h18M9 12l3-9 4 9M9 16v4m6-4v4"/><path d="M6 10c0-4 3-6 6-6"/></>; break
    case 'filter': drawing = <><path d="M3 4h18l-7 8v7l-4 2v-9L3 4Z"/></>; break
    case 'pin': drawing = <><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></>; break
    case 'person': drawing = <><circle cx="12" cy="8" r="4"/><path d="M4 22v-2a8 8 0 0 1 16 0v2"/></>; break
    case 'plus': drawing = <><path d="M12 4v16M4 12h16"/></>; break
    case 'chevron': drawing = <><path d="m7 10 5 5 5-5"/></>; break
    case 'right': drawing = <><path d="m9 5 7 7-7 7"/></>; break
    case 'close': drawing = <><path d="M5 5 19 19M19 5 5 19"/></>; break
    case 'check': drawing = <><path d="m4 12 5 5L20 6"/></>; break
    case 'archive': drawing = <><rect x="4" y="4" width="16" height="5" rx="1"/><path d="M6 9v11h12V9m-9 5h6"/></>; break
    case 'history': drawing = <><path d="M3 12a9 9 0 1 0 2-6M3 4v5h5"/><path d="M12 7v5l4 2"/></>; break
    case 'photo': drawing = <><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8" cy="8" r="2"/><path d="m3 17 6-6 4 4 3-3 5 5"/></>; break
    case 'weeding': drawing = <><path d="m12 22 1-12m-1 6c-5-2-7-5-8-10 6 1 8 4 8 10Zm1-4c1-5 4-8 8-9-1 6-4 9-8 9ZM3 22h18"/></>; break
    case 'preparation': drawing = <><path d="M4 21 17 7l-3-3 2-2 6 6-2 2-3-3M5 21h7m-5-3 7 3m-5-5 7 3"/></>; break
    case 'hilling': drawing = <><path d="M2 21 12 9l10 12M4 21h16M12 10V2m0 6c-4-1-6-3-6-6 4 0 6 2 6 6Zm0-2c0-3 2-5 5-5-1 4-2 5-5 5Z"/></>; break
    case 'replanting': drawing = <><path d="M4 15a8 8 0 0 1 14-7M18 4v4h-4M20 12a8 8 0 0 1-14 7M6 22v-4h4"/><path d="M12 17v-8m0 4c-3-1-4-3-4-5 3 0 4 2 4 5Zm0-3c0-3 2-4 4-4 0 3-1 4-4 4Z"/></>; break
    case 'file': drawing = <><path d="M6 2h8l5 5v15H6V2Zm8 0v6h5M9 13h7m-7 4h7"/></>; break
    case 'layers': drawing = <><path d="m12 3 9 5-9 5-9-5 9-5Zm-9 9 9 5 9-5M3 16l9 5 9-5"/></>; break
    case 'info': drawing = <><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/></>; break
    case 'flower': drawing = <><circle cx="12" cy="12" r="3" fill="currentColor" stroke="none"/><path d="M12 9C4 9 8 2 12 4c4-2 8 5 0 5Zm3 3c0-8 7-4 5 0 2 4-5 8-5 0Zm-3 3c8 0 4 7 0 5-4 2-8-5 0-5Zm-3-3c0 8-7 4-5 0-2-4 5-8 5 0Z"/></>; break
    default: drawing = <><circle cx="12" cy="12" r="8"/><path d="M8 12h8"/></>
  }
  return <svg {...props} className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" {...stroke} aria-hidden="true">{drawing}</svg>
}
