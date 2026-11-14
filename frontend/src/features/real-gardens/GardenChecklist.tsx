import type { ReactNode } from 'react'

export default function GardenChecklist<T extends string>({ id, label, icon, options, value, multiple = false, required = false, error, onChange }: {
  id: string; label: string; icon: ReactNode; options: Partial<Record<T, string>>; value: T[] | T | ''
  multiple?: boolean; required?: boolean; error?: string; onChange: (value: T) => void
}) {
  return <fieldset className="rg-checklist" id={id} tabIndex={-1} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined}>
    <legend>{icon}<span>{label}{required && <span aria-hidden="true"> *</span>}</span></legend>
    <p>{multiple ? 'Marca las opciones que correspondan.' : 'Elige una opción.'}</p>
    <div className="rg-checklist-options">{(Object.entries(options) as [T, string][]).map(([key, text]) => <label key={key}>
      <input type={multiple ? 'checkbox' : 'radio'} name={id} value={key} checked={Array.isArray(value) ? value.includes(key) : value === key} required={required && !multiple} onChange={() => onChange(key)}/>
      <span className="rg-checklist-mark" aria-hidden="true">✓</span><span>{text}</span>
    </label>)}</div>
    {error && <p className="rg-error" id={`${id}-error`}>{error}</p>}
  </fieldset>
}
