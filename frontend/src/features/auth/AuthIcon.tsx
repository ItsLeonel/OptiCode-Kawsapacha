type IconName = 'leaf' | 'sprout' | 'user' | 'mail' | 'lock' | 'eye' | 'eye-off' | 'arrow' | 'back' | 'book' | 'people' | 'check' | 'mountain'

export default function AuthIcon({ name, className = '' }: { name: IconName; className?: string }) {
  return <svg className={`auth-icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    {name === 'leaf' && <><path d="M19 3C8 2 2 7 5 14c4 8 15 1 14-11Z" fill="currentColor" fillOpacity=".2"/><path d="M4 21 15 8M9 15l-1-5m4 2 5 1"/></>}
    {name === 'sprout' && <><path d="M12 21V11M12 15C4 16 2 11 3 7c6 0 9 2 9 8ZM12 11c0-6 4-9 9-8 0 6-3 9-9 8Z" fill="currentColor" fillOpacity=".18"/><path d="M8 21h8"/></>}
    {name === 'user' && <><circle cx="12" cy="7" r="3.5"/><path d="M5 21v-3a7 7 0 0 1 14 0v3"/></>}
    {name === 'mail' && <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 6 9 7 9-7"/></>}
    {name === 'lock' && <><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V6a4 4 0 0 1 8 0v4m-4 5v2"/></>}
    {(name === 'eye' || name === 'eye-off') && <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>{name === 'eye-off' && <path d="m3 3 18 18"/>}</>}
    {name === 'arrow' && <path d="M4 12h16m-6-6 6 6-6 6"/>}
    {name === 'back' && <path d="M20 12H4m6-6-6 6 6 6"/>}
    {name === 'book' && <><path d="M12 5C9 3 6 3 2 4v15c4-1 7-1 10 1 3-2 6-2 10-1V4c-4-1-7-1-10 1Zm0 0v15M5 8h3m-3 4h3m8-4h3m-3 4h3"/></>}
    {name === 'people' && <><circle cx="12" cy="7" r="3"/><path d="M6 21v-3a6 6 0 0 1 12 0v3H6ZM4 6a3 3 0 0 0 0 6m16-6a3 3 0 0 1 0 6M2 15v5m20-5v5"/></>}
    {name === 'check' && <path d="m5 12 4 4L19 6"/>}
    {name === 'mountain' && <><path d="m2 20 8-15 5 8 2-3 5 10H2Zm5-9 3 2 3-3"/></>}
  </svg>
}
