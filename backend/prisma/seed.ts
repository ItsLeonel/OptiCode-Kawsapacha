import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Prisma } from '@prisma/client'

const regionalSpecies = JSON.parse(readFileSync(join(__dirname, 'regional-species.json'), 'utf8')) as Array<Prisma.MedicinalCatalogUncheckedCreateInput>

const TECHNICAL_ADMINS = [
  {
    name: 'Administrador Técnico 1',
    email: 'admin1@mail.com',
    password: 'Password123',
  },
  {
    name: 'Administrador Técnico 2',
    email: 'admin2@mail.com',
    password: 'Password123',
  },
] as const

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

  console.log('🔐 Verificando cuentas ADMIN_TECNICO base…')
  for (const admin of TECHNICAL_ADMINS) {
    const passwordHash = await bcrypt.hash(admin.password, 10)
    await prisma.user.upsert({
      where: { email: admin.email },
      update: {},
      create: {
        name: admin.name,
        email: admin.email,
        passwordHash,
        role: 'ADMIN_TECNICO',
        isActive: true,
      },
    })
    console.log('   ✓ ' + admin.email + ' (ADMIN_TECNICO)')
  }
}

main()
  .catch(error => { console.error(error); process.exitCode = 1 })
  .finally(async () => { await prisma.$disconnect() })
