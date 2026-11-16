import type { ReactNode } from 'react'

export type AdminIconName =
  | 'home' | 'users' | 'calendar' | 'book' | 'shield' | 'chart' | 'bell' | 'settings'
  | 'server' | 'database' | 'clipboard' | 'check' | 'alert' | 'map' | 'pin'
  | 'clock' | 'arrow' | 'right' | 'logout' | 'leaf' | 'plus' | 'file'
  | 'image' | 'message' | 'search' | 'lock' | 'globe' | 'refresh' | 'menu'
  | 'close' | 'eye' | 'download' | 'filter' | 'sun' | 'edit' | 'info'

export default function AdminIcon({ name, size = 20, className = '' }: { name: AdminIconName; size?: number; className?: string }) {
  let shapes: ReactNode
  switch (name) {
    case 'home': shapes = <><path d="m3 10 9-7 9 7v10H3z"/><path d="M9 20v-7h6v7"/></>; break
    case 'users': shapes = <><circle cx="9" cy="8" r="3"/><path d="M3 21v-2a6 6 0 0 1 12 0v2M17 5a3 3 0 0 1 0 6M18 14a5 5 0 0 1 3 5v2"/></>; break
    case 'calendar': shapes = <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18M8 14h2M14 14h2M8 18h2"/></>; break
    case 'book': shapes = <><path d="M12 6C8 3 5 4 3 4v15c4-1 7 0 9 2 2-2 5-3 9-2V4c-2 0-5-1-9 2Z"/><path d="M12 6v15M6 9h3M15 9h3M6 13h3M15 13h3"/></>; break
    case 'shield': shapes = <><path d="M12 2 4 6v6c0 5 3 8 8 10 5-2 8-5 8-10V6l-8-4Z"/><path d="m9 12 2 2 4-4"/></>; break
    case 'chart': shapes = <><path d="M3 21h18M6 18v-5h3v5M11 18V8h3v10M16 18V4h3v14"/></>; break
    case 'bell': shapes = <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 8-3 10h18c0-2-3-3-3-10ZM10 21h4"/></>; break
    case 'settings': shapes = <><circle cx="12" cy="12" r="3"/><path d="m10 2-.5 2.4-2 .9-2.2-1.1-2.1 2.1 1.1 2.2-.9 2L1 11v3l2.4.5.9 2-1.1 2.2 2.1 2.1 2.2-1.1 2 .9L10 23h4l.5-2.4 2-.9 2.2 1.1 2.1-2.1-1.1-2.2.9-2L23 14v-3l-2.4-.5-.9-2 1.1-2.2-2.1-2.1-2.2 1.1-2-.9L14 2Z"/></>; break
    case 'server': shapes = <><rect x="3" y="3" width="18" height="8" rx="2"/><rect x="3" y="13" width="18" height="8" rx="2"/><path d="M7 7h.01M7 17h.01M11 7h6M11 17h6"/></>; break
    case 'database': shapes = <><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 2 4 3 9 3s9-1 9-3V5M3 12c0 2 4 3 9 3s9-1 9-3"/></>; break
    case 'clipboard': shapes = <><rect x="5" y="4" width="14" height="18" rx="2"/><rect x="9" y="2" width="6" height="4" rx="1"/><path d="M9 11h6M9 15h6M9 19h4"/></>; break
    case 'check': shapes = <path d="m4 12 5 5L20 6"/>; break
    case 'alert': shapes = <><path d="M12 3 2 21h20L12 3Z"/><path d="M12 9v5M12 18h.01"/></>; break
    case 'map': shapes = <><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6ZM9 3v15M15 6v15"/></>; break
    case 'pin': shapes = <><path d="M12 22s8-7 8-13a8 8 0 1 0-16 0c0 6 8 13 8 13Z"/><circle cx="12" cy="9" r="2.5"/></>; break
    case 'clock': shapes = <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l4 2"/></>; break
    case 'arrow': shapes = <><path d="M4 12h16M14 6l6 6-6 6"/></>; break
    case 'right': shapes = <path d="m9 5 7 7-7 7"/>; break
    case 'logout': shapes = <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></>; break
    case 'leaf': shapes = <><path d="M21 3C10 3 4 9 4 16c0 3 2 5 5 5 7 0 12-6 12-18ZM4 21c3-5 7-8 13-11"/></>; break
    case 'plus': shapes = <path d="M12 5v14M5 12h14"/>; break
    case 'file': shapes = <><path d="M6 2h8l5 5v15H6zM14 2v6h5M9 13h7M9 17h7"/></>; break
    case 'image': shapes = <><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8" cy="8" r="2"/><path d="m4 18 6-6 4 4 3-3 4 5"/></>; break
    case 'message': shapes = <><path d="M20 4H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4l4 4 4-4h4a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Z"/><path d="M6 9h12M6 13h8"/></>; break
    case 'search': shapes = <><circle cx="10.5" cy="10.5" r="7"/><path d="m16 16 5 5"/></>; break
    case 'lock': shapes = <><rect x="5" y="10" width="14" height="12" rx="2"/><path d="M8 10V7a4 4 0 1 1 8 0v3M12 15v3"/></>; break
    case 'globe': shapes = <><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c-3 3-4 6-4 9s1 6 4 9M12 3c3 3 4 6 4 9s-1 6-4 9"/></>; break
    case 'refresh': shapes = <><path d="M20 7V3l-4 4M4 17v4l4-4"/><path d="M20 7a8 8 0 0 0-14-2M4 17a8 8 0 0 0 14 2"/></>; break
    case 'menu': shapes = <path d="M4 7h16M4 12h16M4 17h16"/>; break
    case 'close': shapes = <path d="M5 5 19 19M19 5 5 19"/>; break
    case 'eye': shapes = <><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></>; break
    case 'download': shapes = <><path d="M12 2v13m-5-5 5 5 5-5M4 18v3h16v-3"/></>; break
    case 'filter': shapes = <><path d="M3 4h18l-7 8v8l-4-2v-6Z"/></>; break
    case 'sun': shapes = <><circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/></>; break
    case 'edit': shapes = <><path d="M4 20h5l11-11-5-5L4 15v5ZM13 6l5 5"/></>; break
    case 'info': shapes = <><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/></>; break
  }
  return <svg aria-hidden="true" className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round">{shapes}</svg>
}
