import { createServer } from 'vite'

export default async function setupAppServer() {
  const port = Number(process.env.KAWSAPACHA_E2E_PORT ?? 5174)
  const server = await createServer({ configLoader: 'runner', logLevel: 'warn', server: { host: '127.0.0.1', port, strictPort: true, open: false } })
  try { await server.listen() } catch (error) { await server.close(); throw error }
  return async () => { await server.close() }
}
