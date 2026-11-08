import type { CommunityType } from './communities'

export default function CommunityTypeEmblem({ type }: { type: CommunityType }) {
  return <svg className="cw-type-emblem" viewBox="0 0 120 100" aria-hidden="true" focusable="false" fill="currentColor" stroke="#6c3b12" strokeWidth="2.5" strokeLinejoin="round">
    {type === 'personal' && <><circle cx="60" cy="30" r="21"/><path d="M24 91V76a36 36 0 0 1 72 0v15Z"/></>}
    {type === 'familiar' && <><circle cx="42" cy="32" r="20"/><circle cx="85" cy="38" r="17"/><path d="M8 92V76a34 34 0 0 1 68 0v16ZM76 92V76a43 43 0 0 0-5-20 28 28 0 0 1 42 24v12Z"/></>}
    {type === 'condominio' && <><path d="m12 45 48-35 48 35-8 12-9-6v41H29V51l-9 6Z"/><path d="M60 87V60m0 17c-20 0-25-11-24-21 16-1 24 8 24 21Zm0-8c0-14 10-23 24-21 0 12-8 21-24 21Z" fill="#65a819"/></>}
    {type === 'barrial' && <><path d="m32 25 28-20 28 20-5 8-6-4v28H43V29l-6 4ZM5 68l28-21 28 21-5 8-6-4v26H16V72l-6 4ZM64 68l27-21 26 21-5 8-6-4v26H75V72l-6 4Z"/><path d="M54 57V39h12v18M27 98V81h12v17m46 0V81h11v17" fill="#80512a"/></>}
  </svg>
}
