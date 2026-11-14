import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import regionalSpecies from './regional-species.json'

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
