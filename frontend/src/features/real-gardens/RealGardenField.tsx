import type { ReactNode } from 'react'

type ControlProps = { id: string; required: boolean; 'aria-invalid': boolean; 'aria-describedby': string | undefined }

export default function RealGardenField({ id, label, required = false, error, hint, children }: {
  id: string; label: string; required?: boolean; error?: string; hint?: string
  children: (props: ControlProps) => ReactNode
}) {
  return <div className="rg-field">
    <label htmlFor={id}>{label}{required ? <span aria-hidden="true"> *</span> : <small> (opcional)</small>}</label>
    {children({ id, required, 'aria-invalid': Boolean(error), 'aria-describedby': error ? `${id}-error` : hint ? `${id}-hint` : undefined })}
    {error ? <p className="rg-error" id={`${id}-error`}>{error}</p> : hint && <small className="rg-hint" id={`${id}-hint`}>{hint}</small>}
  </div>
}
