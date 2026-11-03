import { useId } from 'react'

type ShortcutIconName = 'communities' | 'garden' | 'activities'

export default function CommunityShortcutIcon({ name }: { name: ShortcutIconName }) {
  const id = useId()
  const paint = (material: string) => `url(#${id}-${material})`

  return <svg className="community-shortcut-art" viewBox="0 0 64 64" fill="none" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id={`${id}-skin`} x1=".2" y1="0" x2=".8" y2="1">
        <stop stopColor="#fff1c5"/><stop offset=".45" stopColor="#f8c487"/><stop offset="1" stopColor="#d78242"/>
      </linearGradient>
      <linearGradient id={`${id}-leaf`} x1=".15" y1="0" x2=".8" y2="1">
        <stop stopColor="#efff95"/><stop offset=".42" stopColor="#a5e73e"/><stop offset="1" stopColor="#3d8d0b"/>
      </linearGradient>
      <linearGradient id={`${id}-fabric`} x1="0" y1="0" x2=".85" y2="1">
        <stop stopColor="#ffd878"/><stop offset=".35" stopColor="#ee9850"/><stop offset=".7" stopColor="#ca4b36"/><stop offset="1" stopColor="#87263c"/>
      </linearGradient>
      <linearGradient id={`${id}-gold`} x1=".15" y1="0" x2=".7" y2="1">
        <stop stopColor="#fff3be"/><stop offset=".45" stopColor="#efc66c"/><stop offset="1" stopColor="#b3752a"/>
      </linearGradient>
      <linearGradient id={`${id}-soil`} x1="0" y1="0" x2=".3" y2="1">
        <stop stopColor="#c79045"/><stop offset=".5" stopColor="#8a4f21"/><stop offset="1" stopColor="#4b2a14"/>
      </linearGradient>
      <linearGradient id={`${id}-paper`} x1=".1" y1="0" x2=".85" y2="1">
        <stop stopColor="#fffce1"/><stop offset=".7" stopColor="#f0e4b8"/><stop offset="1" stopColor="#bbaa77"/>
      </linearGradient>
      <linearGradient id={`${id}-calendar`} x1=".15" y1="0" x2=".7" y2="1">
        <stop stopColor="#ffe29a"/><stop offset=".5" stopColor="#efa54d"/><stop offset="1" stopColor="#bc6626"/>
      </linearGradient>
      <filter id={`${id}-relief`} x="-25%" y="-25%" width="150%" height="160%" colorInterpolationFilters="sRGB">
        <feDropShadow dx="0" dy="1.6" stdDeviation="1" floodColor="#052609" floodOpacity=".7"/>
      </filter>
    </defs>

    {name === 'communities' && <g filter={paint('relief')}>
      <path d="M5 49V43c0-5 4-9 9-9s10 4 10 9v8Z" fill={paint('fabric')} stroke="#f6c76a" strokeWidth=".7"/>
      <path d="M40 51v-8c0-5 5-9 10-9s9 4 9 9v6Z" fill={paint('fabric')} stroke="#f6c76a" strokeWidth=".7"/>
      <path d="m7 41 7 6 7-6m22 0 7 6 7-6" stroke="#f7d35d" strokeWidth="1.6"/>
      <ellipse cx="14" cy="27" rx="4.5" ry="5.3" fill={paint('skin')}/>
      <ellipse cx="50" cy="27" rx="4.5" ry="5.3" fill={paint('skin')}/>
      <path d="M17 49V39c0-6 7-10 15-10s15 4 15 10v10L32 58Z" fill={paint('fabric')} stroke="#fbd16e" strokeWidth=".9"/>
      <path d="m20 36 12 9 12-9m-24 8 12 9 12-9" stroke="#f6d456" strokeWidth="2" strokeLinejoin="round"/>
      <path d="m24 35 8 6 8-6m-16 11 8 6 8-6" stroke="#662f67" strokeWidth="1.7" strokeLinejoin="round"/>
      <path d="m27 32 5 6 5-6" fill="#1b6848" stroke="#e5cc6a" strokeWidth=".8"/>
      <ellipse cx="32" cy="23" rx="6.5" ry="7.4" fill={paint('skin')}/>
      <path d="M26 16 27.5 9c.6-3 8.4-3 9 0L38 16Z" fill={paint('gold')} stroke="#ffe7a9" strokeWidth=".7"/>
      <path d="M26.5 13h11l.5 3H26Z" fill="#c47939"/>
      <ellipse cx="32" cy="17" rx="12" ry="2.7" fill={paint('gold')} stroke="#fff0b2" strokeWidth=".7"/>
      <path d="M8 51c8-2 13 1 17 8-8 0-14-2-17-8Zm48 0c-8-2-13 1-17 8 8 0 14-2 17-8Z" fill={paint('leaf')} stroke="#a9d84b" strokeWidth=".6"/>
      <path d="m11 52 11 5m31-5-11 5" stroke="#4a841e" strokeWidth=".8" strokeLinecap="round"/>
    </g>}

    {name === 'garden' && <g filter={paint('relief')}>
      <ellipse cx="32" cy="41" rx="15" ry="7.5" fill={paint('soil')} stroke="#d3a55d" strokeWidth=".7"/>
      <path d="M32 41V25c0-4-1-6-4-9" stroke="#63951c" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M30 26C16 26 10 18 8 7c14 0 24 6 22 19Z" fill={paint('leaf')} stroke="#c0ed69" strokeWidth=".8"/>
      <path d="M33 25C33 12 42 7 56 7c-2 12-8 20-23 18Z" fill={paint('leaf')} stroke="#c0ed69" strokeWidth=".8"/>
      <path d="m12 10 17 15m24-15L33 25m-15-9 1-5m2 8-7 1m31-3 1-5m-5 8 7 1" stroke="#5a9822" strokeWidth="1" strokeLinecap="round"/>
      <path d="M11 9c7 1 11 3 14 6m13 1c4-4 9-6 14-7" stroke="#f3ffc1" strokeOpacity=".65" strokeWidth="1.1" strokeLinecap="round"/>
      <g fill="#e0b474"><circle cx="24" cy="38" r="1.2"/><circle cx="38" cy="40" r="1.1"/><circle cx="29" cy="44" r=".9"/><circle cx="34" cy="36" r=".8"/><circle cx="21" cy="42" r=".7"/><circle cx="43" cy="41" r=".7"/></g>
      <path id={`${id}-hand`} d="M27 59c-6 0-12-4-15-9L5 35c-1.5-3.3 2-5.2 4-2l6 10 6 3-7-8c-2-2.4 1-5 3.5-3L26 42c4 2 5 6 5 10v7Z" fill={paint('skin')} stroke="#f6d096" strokeWidth=".7"/>
      <use href={`#${id}-hand`} transform="translate(64 0) scale(-1 1)"/>
      <path d="m8 34 7 13 7 4m34-17-7 13-7 4" stroke="#fff1c7" strokeWidth="1.4" strokeOpacity=".8" strokeLinecap="round"/>
      <path d="m16 44 7 5m25-5-7 5" stroke="#b7763d" strokeWidth=".8" strokeLinecap="round"/>
    </g>}

    {name === 'activities' && <g filter={paint('relief')}>
      <rect x="11" y="12" width="42" height="45" rx="5" fill={paint('gold')}/>
      <rect x="12" y="12" width="40" height="42" rx="4" fill={paint('paper')} stroke="#fff4ca" strokeWidth=".8"/>
      <path d="M16 12h32a4 4 0 0 1 4 4v10H12V16a4 4 0 0 1 4-4Z" fill={paint('calendar')} stroke="#f9d48a" strokeWidth=".8"/>
      <path d="M12 25h40" stroke="#a96527" strokeWidth="1.4"/>
      <g fill="#966631"><ellipse cx="20" cy="16" rx="2.5" ry="2"/><ellipse cx="32" cy="16" rx="2.5" ry="2"/><ellipse cx="44" cy="16" rx="2.5" ry="2"/></g>
      <g fill={paint('gold')} stroke="#fff0bd" strokeWidth=".8"><rect x="18.4" y="5" width="3.2" height="12" rx="1.6"/><rect x="30.4" y="5" width="3.2" height="12" rx="1.6"/><rect x="42.4" y="5" width="3.2" height="12" rx="1.6"/></g>
      <g fill="#d19843"><rect x="17" y="31" width="3" height="4" rx=".9"/><rect x="23" y="31" width="3" height="4" rx=".9"/></g>
      <g fill="#85a749"><rect x="17" y="38" width="3" height="4" rx=".9"/><rect x="23" y="38" width="3" height="4" rx=".9"/><rect x="17" y="45" width="3" height="4" rx=".9"/></g>
      <path d="M25 48c-2-11 5-18 22-19-1 14-8 22-22 19Z" fill={paint('leaf')} stroke="#9abe3b" strokeWidth=".8"/>
      <path d="m23 51 20-19m-10 9-5-1m10-4v6" stroke="#50851c" strokeWidth="1.2" strokeLinecap="round"/>
      <path d="M29 38c3-4 8-6 14-7" stroke="#f1ffae" strokeWidth="1" strokeOpacity=".75" strokeLinecap="round"/>
    </g>}
  </svg>
}
