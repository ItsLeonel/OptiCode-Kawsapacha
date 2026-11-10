import { createServer } from 'vite'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)

export default async function setup() {
  const { prepareDatabase } = require('../../backend/tests/setup-db.cjs')
  const database = await prepareDatabase()
  process.env.DATABASE_URL = database.databaseUrl
  process.env.UPLOADS_DIR = database.uploads
  process.env.JWT_SECRET = 'isolated-browser-photo-test-secret'
  const app = require('../../backend/dist/app').default
  const backend = app.listen(0, '127.0.0.1')
  await new Promise<void>(resolve => backend.once('listening', resolve))
  process.env.KAWSAPACHA_API_TARGET = `http://127.0.0.1:${backend.address().port}`
  const frontend = await createServer({ configLoader: 'runner', cacheDir: 'node_modules/.vite-regional-photos', logLevel: 'warn', server: { host: '127.0.0.1', port: 5190, strictPort: true, open: false } })
  try { await frontend.listen() }
  catch (error) { backend.close(); await frontend.close(); throw error }
  return async () => {
    await frontend.close()
    backend.closeAllConnections()
    await new Promise<void>(resolve => backend.close(resolve))
    await require('../../backend/dist/config/prisma').prisma.$disconnect()
  }
}
