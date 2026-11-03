export type CommunityIconName = 'camera' | 'chat' | 'calendar' | 'chevron' | 'edit' | 'check' | 'info'

export default function CommunityIcon({ name }: { name: CommunityIconName }) {
  return <svg className="garden-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    {name === 'camera' && <><path d="M8 6 9.5 3h5L16 6h4a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4Z"/><circle cx="12" cy="13" r="4"/><path d="M18 9h1"/></>}
    {name === 'chat' && <><path d="M20 4H4a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h3v3l5-3h8a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Z"/><circle cx="7" cy="11" r=".6"/><circle cx="12" cy="11" r=".6"/><circle cx="17" cy="11" r=".6"/></>}
    {name === 'calendar' && <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 11h18M7 15h2m6 0h2M7 18h2m6 0h2"/></>}
    {name === 'chevron' && <path d="m9 5 7 7-7 7"/>}
    {name === 'edit' && <><path d="m15 4 5 5M4 20l5-1L21 7a2 2 0 0 0-5-5L4 14v6Z"/></>}
    {name === 'check' && <path d="m5 12 4 4L19 6"/>}
    {name === 'info' && <><circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v.1"/></>}
  </svg>
}
