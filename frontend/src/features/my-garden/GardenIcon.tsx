type IconName = 'leaf' | 'garden' | 'community' | 'history' | 'plus' | 'book' | 'map' | 'seed' | 'target' | 'arrow' | 'close' | 'mountain' | 'back' | 'pot' | 'vertical' | 'hanging'

export default function GardenIcon({ name, className = '' }: { name: IconName; className?: string }) {
  return <svg className={`garden-icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    {name === 'leaf' && <><path d="M20 3C9 2 3 7 5 14c4 8 15 1 15-11Z" fill="currentColor" fillOpacity=".15"/><path d="M4 21 16 7m-6 8-1-5m4 2 5 1"/></>}
    {name === 'garden' && <><path d="m3 11 9-8 9 8M5 10v11h14V10M12 21v-8m0 3c-4 0-6-2-6-5 4 0 6 2 6 5Zm0-3c0-4 3-6 6-6 0 4-2 6-6 6Z"/></>}
    {name === 'community' && <><circle cx="12" cy="7" r="3"/><path d="M6 21v-3a6 6 0 0 1 12 0v3H6ZM4 6a3 3 0 0 0 0 6m16-6a3 3 0 0 1 0 6M2 15v5m20-5v5"/></>}
    {name === 'history' && <><path d="M12 5C9 3 6 3 2 4v15c4-1 7-1 10 1 3-2 6-2 10-1V4c-4-1-7-1-10 1Zm0 0v15M5 8h3m-3 4h3m8-4h3m-3 4h3"/></>}
    {name === 'plus' && <path d="M12 4v16M4 12h16"/>}
    {name === 'book' && <><rect x="5" y="3" width="15" height="18" rx="2"/><path d="M5 7H2m3 5H2m3 5H2m8-9h6m-6 4h6m-6 4h3"/></>}
    {name === 'map' && <><path d="M16 10c0 4-4 8-4 8s-4-4-4-8a4 4 0 0 1 8 0Z"/><circle cx="12" cy="9" r="1"/><path d="m6 14-3 7h18l-3-7"/></>}
    {name === 'seed' && <><path d="M12 21V11m0 4C5 15 3 12 3 7c6 0 9 3 9 8Zm0-4c0-6 4-9 9-8 0 6-3 9-9 8Z" fill="currentColor" fillOpacity=".12"/><path d="M7 21h10"/></>}
    {name === 'target' && <><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><path d="m12 12 8-9M16 3h4v4"/></>}
    {name === 'arrow' && <path d="M4 12h16m-6-6 6 6-6 6"/>}
    {name === 'back' && <path d="M20 12H4m6-6-6 6 6 6"/>}
    {name === 'close' && <path d="m5 5 14 14M5 19 19 5"/>}
    {name === 'mountain' && <><path d="m2 21 8-16 5 8 2-3 5 11H2Zm5-10 3 2 3-3"/></>}
    {name === 'pot' && <><path d="M3 10h18v3H3ZM5 13l3 8h8l3-8M12 10V6m0 0C7 6 6 4 6 2c4 0 6 2 6 4Zm0 0c0-4 3-5 6-5 0 4-3 5-6 5Z"/><path d="m9 17 3 2 3-2"/></>}
    {name === 'vertical' && <><path d="M4 2v20m16-20v20M3 9h18M3 18h18M7 6v3m5-5v5m5-3v3M7 14v4m5-6v6m5-4v4"/><path d="M6 2h12M6 22h12"/></>}
    {name === 'hanging' && <><path d="M12 1v3M12 4 3 14h18L12 4ZM4 14l4 8h8l4-8M8 18h8"/><path d="M12 14V9m0 3c-3 0-4-2-4-4 3 0 4 2 4 4Z"/></>}
  </svg>
}
