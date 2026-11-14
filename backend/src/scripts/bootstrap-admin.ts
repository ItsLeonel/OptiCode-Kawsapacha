// backend/src/scripts/bootstrap-admin.ts
import bcrypt from 'bcryptjs'
import { prisma } from '../config/prisma'

async function bootstrapAdmin() {
  const email = (process.env['BOOTSTRAP_ADMIN_EMAIL'] || process.argv[2] || 'admin.tecnico@kawsapacha.gob.ec').trim().toLowerCase()
  const password = process.env['BOOTSTRAP_ADMIN_PASS'] || process.argv[3] || 'AdminTecnico2026*'
  const name = process.env['BOOTSTRAP_ADMIN_NAME'] || process.argv[4] || 'Administrador Técnico Kawsapacha'

  console.log(`\n🔧 Iniciando Bootstrap del primer ADMIN_TECNICO para: ${email}...`)

  const existing = await prisma.user.findFirst({
    where: { email },
  })

  if (existing) {
    if (existing.role === 'ADMIN_TECNICO' && existing.isActive) {
      console.log(`✓ El usuario ${email} ya cuenta con rol ADMIN_TECNICO y se encuentra activo.`)
      return
    }
    const updated = await prisma.user.update({
      where: { id: existing.id },
      data: { role: 'ADMIN_TECNICO', isActive: true },
    })
    console.log(`✓ Usuario existente ${updated.email} ascendido a rol ADMIN_TECNICO exitosamente.`)
    return
  }

  const passwordHash = await bcrypt.hash(password, 10)
  const created = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: 'ADMIN_TECNICO',
      isActive: true,
    },
  })

  console.log(`✨ Primer ADMIN_TECNICO creado exitosamente (ID: ${created.id}, Email: ${created.email}).`)
}

bootstrapAdmin()
  .catch(err => {
    console.error('❌ Error en bootstrap del administrador:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
