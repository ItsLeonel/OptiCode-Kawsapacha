import { useEffect, useRef, useState, type FormEvent } from 'react'
import AuthIcon from './AuthIcon'
import { AUTH_FIELDS, toAuthSubmission, validateAuth, type AuthFieldName, type AuthMode, type AuthSubmitHandler, type AuthValues } from './auth'

const FIELD_DETAILS = {
  name: { label: 'Nombre completo', placeholder: '¿Cómo te llamas?', autoComplete: 'name', icon: 'user' },
  email: { label: 'Correo electrónico', placeholder: 'nombre@correo.com', autoComplete: 'email', icon: 'mail' },
  password: { label: 'Contraseña', placeholder: 'Tu contraseña', autoComplete: 'current-password', icon: 'lock' },
  confirmPassword: { label: 'Confirmar contraseña', placeholder: 'Repite tu contraseña', autoComplete: 'new-password', icon: 'lock' },
} as const

type Props = {
  mode: AuthMode
  onProgress: (validFields: number) => void
  onSubmit?: AuthSubmitHandler
}

export default function AuthForm({ mode, onProgress, onSubmit }: Props) {
  const [values, setValues] = useState<AuthValues>({ name: '', email: '', password: '', confirmPassword: '' })
  const [touched, setTouched] = useState<Partial<Record<AuthFieldName, boolean>>>({})
  const [submitted, setSubmitted] = useState(false)
  const [visible, setVisible] = useState<Partial<Record<AuthFieldName, boolean>>>({})
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const sending = useRef(false)
  const errors = validateAuth(values, mode)
  const fields = AUTH_FIELDS[mode]
  const validFields = fields.filter(field => !errors[field]).length
  const visibleErrorCount = fields.filter(field => errors[field] && (touched[field] || submitted)).length

  useEffect(() => { onProgress(validFields) }, [validFields, onProgress])

  function updateField(field: AuthFieldName, value: string) {
    setValues(current => ({ ...current, [field]: value }))
    setMessage('')
    setSubmitted(false)
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (sending.current) return
    setSubmitted(true)
    setTouched(Object.fromEntries(fields.map(field => [field, true])))
    setMessage('')
    const firstError = fields.find(field => errors[field])
    if (firstError) {
      formRef.current?.querySelector<HTMLInputElement>(`[name="${firstError}"]`)?.focus()
      return
    }
    if (!onSubmit) {
      setMessage(mode === 'register'
        ? 'Tus datos cumplen los requisitos. La conexión con el servidor está pendiente; tu cuenta aún no se ha creado.'
        : 'Los campos son válidos. La conexión con el servidor está pendiente; no se ha iniciado sesión.')
      return
    }
    sending.current = true
    setBusy(true)
    try {
      const result = await onSubmit(toAuthSubmission(values, mode))
      setMessage(result.message)
    } catch {
      setMessage('No pudimos completar la solicitud. Inténtalo de nuevo más tarde.')
    } finally {
      sending.current = false
      setBusy(false)
    }
  }

  return <form className="auth-form" ref={formRef} onSubmit={submit} noValidate aria-label={mode === 'register' ? 'Crear cuenta' : 'Iniciar sesión'} aria-busy={busy}>
    <p className="auth-required">Todos los campos son obligatorios.</p>
    {fields.map(field => {
      const details = FIELD_DETAILS[field]
      const passwordField = field === 'password' || field === 'confirmPassword'
      const error = (submitted || touched[field]) ? errors[field] : undefined
      const inputId = `auth-${mode}-${field}`
      const hintId = field === 'password' && mode === 'register' ? `${inputId}-hint` : undefined
      return <div className="auth-field" key={field}>
        <label htmlFor={inputId}>{details.label}</label>
        <div className={`auth-input-wrap ${error ? 'has-error' : ''}`}>
          <AuthIcon name={details.icon}/>
          <input id={inputId} name={field} type={passwordField ? (visible[field] ? 'text' : 'password') : field === 'email' ? 'email' : 'text'}
            value={values[field]} onChange={event => updateField(field, event.target.value)}
            onBlur={() => setTouched(current => ({ ...current, [field]: true }))}
            placeholder={details.placeholder} required disabled={busy}
            autoComplete={field === 'password' && mode === 'register' ? 'new-password' : details.autoComplete}
            autoCapitalize={passwordField || field === 'email' ? 'none' : 'words'}
            spellCheck={field === 'name'} maxLength={field === 'email' ? 254 : field === 'name' ? 100 : undefined}
            aria-invalid={Boolean(error)} aria-describedby={[hintId, error ? `${inputId}-error` : undefined].filter(Boolean).join(' ') || undefined}/>
          {passwordField && <button className="auth-password-toggle" type="button" onClick={() => setVisible(current => ({ ...current, [field]: !current[field] }))}
            aria-label={`${visible[field] ? 'Ocultar' : 'Mostrar'} ${field === 'confirmPassword' ? 'confirmación de contraseña' : 'contraseña'}`} aria-pressed={Boolean(visible[field])} aria-controls={inputId} disabled={busy}>
            <AuthIcon name={visible[field] ? 'eye' : 'eye-off'}/>
          </button>}
        </div>
        {hintId && <span className="auth-field-hint" id={hintId}>Mínimo 8 caracteres, una letra y un número.</span>}
        {error && <span className="auth-field-error" id={`${inputId}-error`}>{error}</span>}
      </div>
    })}
    <p className="auth-sr-only" role="status" aria-atomic="true">{visibleErrorCount > 0 ? `Revisa ${visibleErrorCount} ${visibleErrorCount === 1 ? 'campo con error' : 'campos con errores'}.` : ''}</p>
    <button className="auth-submit" type="submit" disabled={busy}>
      <AuthIcon name={mode === 'register' ? 'leaf' : 'user'}/>
      {busy ? 'Conectando…' : mode === 'register' ? 'Crear mi cuenta' : 'Iniciar sesión'}
      <AuthIcon name="arrow"/>
    </button>
    <div className={`auth-submit-message ${message ? 'is-visible' : ''}`} role="status" aria-live="polite" aria-atomic="true">{message}</div>
    <p className="auth-connection-note"><AuthIcon name="lock"/> Conexión con el servidor pendiente.</p>
  </form>
}
