import { preview } from 'vite'

export default async function setupProductionPreview() {
  const port = Number(process.env.KAWSAPACHA_PREVIEW_PORT ?? 5179)
  const server = await preview({ configLoader: 'runner', logLevel: 'warn', preview: { host: '127.0.0.1', port, strictPort: true } })
  return async () => {
    server.httpServer.closeAllConnections()
    await new Promise<void>((resolve, reject) => server.httpServer.close(error => error ? reject(error) : resolve()))
  }
}
