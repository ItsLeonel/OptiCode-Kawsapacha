export type AuthMode = 'register' | 'login'
export type AuthValues = { name: string; email: string; password: string; confirmPassword: string }
export type AuthFieldName = keyof AuthValues
export type AuthErrors = Partial<Record<AuthFieldName, string>>
export type AuthSubmission =
  | { mode: 'register'; name: string; email: string; password: string }
  | { mode: 'login'; email: string; password: string }
export type AuthSubmitHandler = (submission: AuthSubmission) => Promise<{ message: string }>

export const AUTH_FIELDS: Record<AuthMode, AuthFieldName[]> = {
  register: ['name', 'email', 'password', 'confirmPassword'],
  login: ['email', 'password'],
}

export function validateAuth(values: AuthValues, mode: AuthMode): AuthErrors {
  const errors: AuthErrors = {}
  if (mode === 'register' && values.name.trim().length < 2) {
    errors.name = 'Escribe tu nombre completo (al menos 2 caracteres).'
  }
  if (!values.email.trim()) {
    errors.email = 'Escribe tu correo electrónico.'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    errors.email = 'Escribe un correo válido, por ejemplo: nombre@correo.com.'
  }
  if (!values.password) {
    errors.password = 'Escribe tu contraseña.'
  } else if (mode === 'register' && (values.password.length < 8 || !/\p{L}/u.test(values.password) || !/\d/.test(values.password))) {
    errors.password = 'Usa al menos 8 caracteres, una letra y un número.'
  }
  if (mode === 'register') {
    if (!values.confirmPassword) {
      errors.confirmPassword = 'Confirma tu contraseña.'
    } else if (values.confirmPassword !== values.password) {
      errors.confirmPassword = 'Las contraseñas deben coincidir.'
    }
  }
  return errors
}

export function toAuthSubmission(values: AuthValues, mode: AuthMode): AuthSubmission {
  const credentials = { email: values.email.trim(), password: values.password }
  return mode === 'register'
    ? { mode, name: values.name.trim(), ...credentials }
    : { mode, ...credentials }
}
