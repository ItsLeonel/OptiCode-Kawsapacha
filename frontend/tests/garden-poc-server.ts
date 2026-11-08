import { createServer, preview } from 'vite'

/** Test infrastructure only; never imported by the application. */
export default async function setupGardenPocServer() {
  const port = Number(process.env.KAWSAPACHA_POC_PORT ?? 5177)
  const address = { host: '127.0.0.1', port, strictPort: true }
  const config = { configFile: 'vite.garden-poc.config.ts', configLoader: 'runner' as const, logLevel: 'warn' as const }
  if (process.env.GARDEN_POC_PREVIEW === '1') {
    const server = await preview({ ...config, preview: address })
    return async () => {
      server.httpServer.closeAllConnections()
      await new Promise<void>((resolve, reject) => server.httpServer.close(error => error ? reject(error) : resolve()))
    }
  }
  const server = await createServer({ ...config, server: { ...address, open: false } })
  try { await server.listen() } catch (error) { await server.close(); throw error }
  return async () => { await server.close() }
}
