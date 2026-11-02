import { useId } from 'react'

export default function PlantIllustration({ stage = 2, potted = false }: { stage?: number; potted?: boolean }) {
  const uniqueId = useId().replace(/:/g, '')
  const leafId = `plant-leaf-${uniqueId}`
  const potId = `plant-pot-${uniqueId}`
  return <svg className={`auth-plant stage-${stage} ${potted ? 'is-potted' : ''}`} viewBox={potted ? '0 0 260 340' : stage === 0 ? '85 175 90 90' : '35 50 190 215'} fill="none" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id={leafId} x1="70" y1="45" x2="168" y2="188" gradientUnits="userSpaceOnUse"><stop stopColor="#e5f78c"/><stop offset=".42" stopColor="#9dda32"/><stop offset="1" stopColor="#3e8c2e"/></linearGradient>
      <linearGradient id={potId} x1="45" y1="225" x2="225" y2="300" gradientUnits="userSpaceOnUse"><stop stopColor="#7f4227"/><stop offset=".35" stopColor="#d08c4a"/><stop offset=".72" stopColor="#b16a35"/><stop offset="1" stopColor="#67391f"/></linearGradient>
    </defs>
    <ellipse cx="132" cy={potted ? 320 : 246} rx="99" ry="13" fill="#071d13" opacity=".4"/>
    {potted ? <g>
      <path d="m49 227 16 75c6 29 125 29 132 0l16-75" fill={`url(#${potId})`} stroke="#dca763" strokeWidth="2"/>
      <path d="m65 266 18 20 20-20 22 20 22-20 22 20 23-20m-123 31 16-15 19 20 20-20 22 20 23-20 22 20" stroke="#59351e" strokeWidth="3" opacity=".65"/>
      <path d="M61 258h139M69 304c43 11 88 11 123 0" stroke="#e3aa61" strokeWidth="3" opacity=".65"/>
      <ellipse cx="131" cy="226" rx="88" ry="24" fill="#93552e" stroke="#eab573" strokeWidth="9"/>
      <ellipse cx="131" cy="224" rx="76" ry="16" fill="#372c17"/>
      <path d="m67 225 19-8 16 5 16-11 21 9 18-4 17 7 19-2" stroke="#765025" strokeWidth="5"/>
      <path d="M52 238c38 17 119 20 158 0" stroke="#f2c37c" strokeWidth="2"/>
    </g> : <g><ellipse cx="131" cy="242" rx="74" ry="12" fill="#674b29"/><path d="m66 239 17-10 12 3 25-8 23 6 15-2 23 11" fill="#91703d"/></g>}
    <g className="plant-seed"><ellipse cx="129" cy="221" rx="18" ry="24" transform="rotate(35 129 221)" fill="#e2b96d" stroke="#f9df99" strokeWidth="2"/><path d="m121 236 16-29" stroke="#785020" strokeWidth="3" strokeLinecap="round"/></g>
    <g className="plant-growth">
      <path d="M131 226c4-33-6-54 1-95" stroke="#8abd3f" strokeWidth="7" strokeLinecap="round"/>
      <g className="plant-leaves-low" fill={`url(#${leafId})`} stroke="#cee770" strokeWidth="1.4">
        <path d="M131 183c-38 3-62-16-71-47 35-4 66 9 71 47Z"/><path d="M132 173c3-31 26-52 59-50-1 33-26 53-59 50Z"/>
        <path d="m75 146 55 37m3-10 46-39" stroke="#e1f29a" fill="none"/>
      </g>
      <g className="plant-leaves-high" fill={`url(#${leafId})`} stroke="#daef7a" strokeWidth="1.5">
        <path d="M132 143c-47-4-75-34-78-67 44 2 79 25 78 67Z"/><path d="M134 132c7-45 38-68 78-64-7 42-37 67-78 64Z"/>
        <path d="M133 134c-15-23-14-50 3-68 16 23 14 48-3 68Z"/>
        <path d="m65 86 66 56m5-12 63-51m-65 51 2-50" fill="none" stroke="#eff8b1"/>
        <path d="m87 102 0-12m12 25 15-1m57-10 0-13m-15 25 18 0" stroke="#d6ef83"/>
      </g>
    </g>
    {potted && <g className="plant-sparkles" fill="#e1f58e"><circle cx="54" cy="149" r="2"/><circle cx="206" cy="172" r="2.5"/><circle cx="92" cy="67" r="2"/><circle cx="175" cy="42" r="1.5"/><circle cx="42" cy="202" r="1.5"/><path d="m217 111 2-6 2 6 6 2-6 2-2 6-2-6-6-2 6-2Z"/></g>}
  </svg>
}
