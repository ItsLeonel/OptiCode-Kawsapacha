export type RealGardenIconName = 'soil' | 'pots' | 'vertical' | 'hanging' | 'water' | 'area' | 'digital' | 'link' | 'check' | 'edit'

export default function RealGardenIcon({ name }: { name: RealGardenIconName }) {
  return <svg className="garden-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    {name === 'soil' && <><path d="m3 8 9-5 9 5-9 5-9-5Zm0 5 9 5 9-5M3 18l9 5 9-5"/></>}
    {name === 'pots' && <><path d="M4 10h16v3H4zM6 13l2 8h8l2-8M12 10V6m0 0C7 6 6 4 6 2c4 0 6 2 6 4Zm0 0c0-4 3-5 6-5 0 4-3 5-6 5Z"/></>}
    {name === 'vertical' && <><path d="M5 2v20m14-20v20M3 8h18M3 16h18M8 8V5h3v3m2 0V4h3v4M8 16v-4h3v4m2 0v-3h3v3"/></>}
    {name === 'hanging' && <><path d="M12 3 3 13h18L12 3Zm-8 10 3 8h10l3-8M12 3V1m-4 15h8"/></>}
    {name === 'water' && <><path d="M12 2S5 10 5 15a7 7 0 0 0 14 0c0-5-7-13-7-13Z"/><path d="M8 15a4 4 0 0 0 4 4"/></>}
    {name === 'area' && <><path d="M3 3h18v18H3zM7 3v4m5-4v2m5-2v4M3 7h4m-4 5h2m-2 5h4" strokeDasharray="3 2"/><path d="m8 16 8-8m-4 0h4v4"/></>}
    {name === 'digital' && <><rect x="4" y="3" width="16" height="13" rx="1"/><path d="m4 16-3 5h22l-3-5M9 18h6M12 13V8m0 2c-3 0-4-2-4-4 3 0 4 2 4 4Zm0-2c0-3 2-4 4-4 0 3-2 4-4 4Z"/></>}
    {name === 'link' && <><path d="m10 7 3-3a4 4 0 0 1 6 6l-3 3m-2 4-3 3a4 4 0 0 1-6-6l3-3m0 5 8-8"/></>}
    {name === 'check' && <path d="m5 12 4 4L19 6"/>}
    {name === 'edit' && <><path d="m15 4 5 5M4 20l5-1L21 7a2 2 0 0 0-5-5L4 14v6Z"/></>}
  </svg>
}
