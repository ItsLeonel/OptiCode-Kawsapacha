const fs = require('node:fs')
const path = require('node:path')
const { execFileSync } = require('node:child_process')
const { PrismaClient } = require('@prisma/client')

/** Every test run owns a new database and upload directory. Never uses .env's DB. */
async function prepareDatabase({ verifyUpgrade = false } = {}) {
  const root = path.resolve(__dirname, '..')
  fs.mkdirSync(path.join(root, 'test-results'), { recursive: true })
  const directory = fs.mkdtempSync(path.join(root, 'test-results', 'photos-'))
  const databaseUrl = `file:${path.join(directory, 'test.db').replaceAll('\\', '/')}`
  const schema = path.join(directory, 'schema.prisma')
  fs.copyFileSync(path.join(root, 'prisma/schema.prisma'), schema)
  const migrations = path.join(directory, 'migrations')
  fs.mkdirSync(migrations)
  const latest = '20261109160000_regional_locations_and_photos'
  for (const entry of fs.readdirSync(path.join(root, 'prisma/migrations'))) {
    if (entry === latest) continue
    fs.cpSync(path.join(root, 'prisma/migrations', entry), path.join(migrations, entry), { recursive: true })
  }
  const deploy = () => execFileSync(process.execPath, [require.resolve('prisma/build/index.js'), 'migrate', 'deploy', '--schema', schema], {
    cwd: root, env: { ...process.env, DATABASE_URL: databaseUrl }, stdio: 'pipe',
  })
  deploy()
  const client = new PrismaClient({ datasources: { db: { url: databaseUrl } } })
  // The existing V1 DB contains these fields, but its historical migrations
  // do not. Reproduce that pre-existing baseline without editing those migrations.
  await client.$executeRawUnsafe('ALTER TABLE communities ADD COLUMN type TEXT NOT NULL DEFAULT \'personal\'')
  await client.$executeRawUnsafe('ALTER TABLE real_gardens ADD COLUMN characteristics TEXT DEFAULT \'{}\'')
  await client.$executeRawUnsafe('ALTER TABLE cultivated_plants ADD COLUMN archivedAt DATETIME')
  if (verifyUpgrade) {
    await client.$executeRawUnsafe("INSERT INTO users (id,name,email,passwordHash,updatedAt) VALUES ('legacy-user','Legacy','legacy@example.test','test',CURRENT_TIMESTAMP)")
    await client.$executeRawUnsafe("INSERT INTO communities (id,name,responsible,location,description,creatorId,updatedAt) VALUES ('legacy-community','Existing community','Legacy','Napo','Preserved','legacy-user',CURRENT_TIMESTAMP)")
    await client.$executeRawUnsafe("INSERT INTO real_gardens (id,name,kind,areaM2,province,provinceCode,communityId,createdById,updatedAt) VALUES ('legacy-garden','Existing garden','ground',25,'Napo','15','legacy-community','legacy-user',CURRENT_TIMESTAMP)")
  }
  await client.$disconnect()
  fs.cpSync(path.join(root, 'prisma/migrations', latest), path.join(migrations, latest), { recursive: true })
  deploy()
  return { directory, databaseUrl, uploads: path.join(directory, 'uploads') }
}
module.exports = { prepareDatabase }
