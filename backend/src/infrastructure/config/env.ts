import 'dotenv/config'

function required(key: string): string {
  const value = process.env[key]
  if (!value) throw new Error(`Variable de entorno requerida: ${key}`)
  return value
}

export const env = {
  port: parseInt(process.env['PORT'] ?? '3000', 10),
  databaseUrl: required('DATABASE_URL'),
  jwtSecret: required('JWT_SECRET'),
  jwtExpiresIn: process.env['JWT_EXPIRES_IN'] ?? '7d',
  corsOrigin: process.env['CORS_ORIGIN'] ?? 'http://localhost:5173',
} as const

