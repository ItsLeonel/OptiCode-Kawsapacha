import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Prisma } from '@prisma/client'

const regionalSpecies = JSON.parse(readFileSync(join(__dirname, 'regional-species.json'), 'utf8')) as Array<Prisma.MedicinalCatalogUncheckedCreateInput>

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Actualizando el catálogo medicinal regional…')
  for (const entry of regionalSpecies) {
    const { id, ...fields } = entry
    // Los ocho IDs históricos se mantienen intactos; ningún registro cultivado se elimina.
    await prisma.medicinalCatalog.upsert({
      where: { id },
      update: fields,
      create: { id, ...fields },
    })
    console.log('   ✓ ' + entry.name)
  }
  console.log('Catálogo sincronizado: ' + regionalSpecies.length + ' fichas.')
}

main()
  .catch(error => { console.error(error); process.exitCode = 1 })
  .finally(async () => { await prisma.$disconnect() })
