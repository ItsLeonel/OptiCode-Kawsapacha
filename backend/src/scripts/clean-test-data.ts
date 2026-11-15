/**
 * Script de saneamiento seguro: elimina datos de prueba generados por los tests
 * sin afectar las comunidades reales de desarrollo ni los técnicos predefinidos.
 *
 * Uso: npx ts-node src/scripts/clean-test-data.ts
 *      (o desde backend/): npm run ts-node src/scripts/clean-test-data.ts
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Emails de técnicos protegidos que NUNCA se eliminan
const PROTECTED_EMAILS = new Set([
  'admin1@mail.com',
  'admin2@mail.com',
  'carlosperez@mail.ec',
  'marialopez@mail.ec',
  'ronny@kawsapacha.ec',
  'cuidador@kawsapacha.ec',
  'maria@mail.com',
  'carlos@mail.com',
  'carlos@kawsapacha.ec',
  'juan@mail.com',
  'pedro@mail.com',
  'bob@mail.com',
  'natalia@mail.com',
])

// Prefijos de emails de usuarios de test que sí se eliminan
const TEST_EMAIL_PATTERNS = [
  'admin.tech.',
  'supervisor.msp.',
  'ciudadano.',
  'test-rewards-',
  'test-activity-',
  'test.',
  'testuser',
]

// Patrones de nombres de comunidades de prueba
const TEST_COMMUNITY_PATTERNS = [
  'Comunidad Sin Aprobar',
  'Comunidad Andina San Roque',
  'Test Community',
  'test-comunidad',
]

// Nombres de comunidades reales de desarrollo que NUNCA se eliminan
const PROTECTED_COMMUNITIES = [
  'Comunidad Maria',
  'Comunidad Señora Rosa',
  'Comunidad1',
  'Comunidad Natalia',
]

async function main() {
  console.log('🧹 Iniciando limpieza de datos de prueba...\n')

  // ── 1. Buscar usuarios de prueba (excluyendo protegidos) ──────────────────────
  const testUsers = await prisma.user.findMany({
    where: {
      AND: [
        { email: { notIn: [...PROTECTED_EMAILS] } },
        {
          OR: TEST_EMAIL_PATTERNS.map(prefix => ({
            email: { startsWith: prefix },
          })),
        },
      ],
    },
    select: { id: true, email: true, name: true, role: true },
  })

  console.log(`👤 Usuarios de prueba encontrados: ${testUsers.length}`)
  testUsers.forEach(u => console.log(`   - [${u.role}] ${u.email} (${u.name})`))

  // ── 2. Buscar comunidades de prueba (excluyendo protegidas) ──────────────────
  const testCommunities = await prisma.community.findMany({
    where: {
      AND: [
        { name: { notIn: PROTECTED_COMMUNITIES } },
        {
          OR: TEST_COMMUNITY_PATTERNS.map(p => ({
            name: { startsWith: p.replace('%', '') },
          })),
        },
      ],
    },
    select: { id: true, name: true, status: true },
  })

  console.log(`\n🏘️  Comunidades de prueba encontradas: ${testCommunities.length}`)
  testCommunities.forEach(c => console.log(`   - [${c.status}] ${c.name}`))

  // ── 3. Eliminar comunidades de prueba y datos relacionados ───────────────────
  for (const community of testCommunities) {
    // Obtener IDs de huertos de esta comunidad
    const gardens = await prisma.realGarden.findMany({
      where: { communityId: community.id },
      select: { id: true },
    })
    const gardenIds = gardens.map(g => g.id)

    if (gardenIds.length > 0) {
      await prisma.gardenActivity.deleteMany({ where: { gardenId: { in: gardenIds } } }).catch(() => {})
      await prisma.cultivatedPlant.deleteMany({ where: { realGardenId: { in: gardenIds } } }).catch(() => {})
      await prisma.realGarden.deleteMany({ where: { id: { in: gardenIds } } }).catch(() => {})
    }
    await prisma.communityMember.deleteMany({ where: { communityId: community.id } }).catch(() => {})
    await prisma.communityInvitation.deleteMany({ where: { communityId: community.id } }).catch(() => {})
    await prisma.community.delete({ where: { id: community.id } })
      .catch((err: Error) => console.warn(`   ⚠️ No se pudo eliminar ${community.name}: ${err.message}`))

    console.log(`   ✓ Eliminada comunidad: ${community.name}`)
  }

  // ── 4. Eliminar usuarios de prueba ───────────────────────────────────────────
  for (const user of testUsers) {
    if (PROTECTED_EMAILS.has(user.email)) {
      console.log(`   🔒 Protegido (no eliminado): ${user.email}`)
      continue
    }
    // Limpiar dependencias del usuario de prueba
    await prisma.rewardLedger.deleteMany({ where: { userId: user.id } }).catch(() => {})
    await prisma.userMissionProgress.deleteMany({ where: { userId: user.id } }).catch(() => {})
    await prisma.userBadge.deleteMany({ where: { userId: user.id } }).catch(() => {})
    await prisma.activityEvidence.deleteMany({
      where: { activity: { actorUserId: user.id } },
    }).catch(() => {})
    await prisma.gardenActivity.deleteMany({ where: { actorUserId: user.id } }).catch(() => {})
    await prisma.cultivatedPlant.deleteMany({ where: { registeredById: user.id } }).catch(() => {})
    await prisma.realGarden.deleteMany({ where: { createdById: user.id } }).catch(() => {})
    await prisma.communityMember.deleteMany({ where: { userId: user.id } }).catch(() => {})
    await prisma.auditLog.deleteMany({ where: { actorId: user.id } }).catch(() => {})
    await prisma.notification.deleteMany({ where: { userId: user.id } }).catch(() => {})
    await prisma.user.delete({ where: { id: user.id } }).catch((err: Error) => {
      console.warn(`   ⚠️ No se pudo eliminar ${user.email}: ${err.message}`)
    })
    console.log(`   ✓ Eliminado usuario de prueba: ${user.email}`)
  }

  // ── 5. Resumen final ──────────────────────────────────────────────────────────
  const remaining = await prisma.community.count()
  const remainingUsers = await prisma.user.count({ where: { role: { in: ['ADMIN_TECNICO', 'ADMIN_MSP'] } } })
  console.log(`\n✅ Limpieza completada.`)
  console.log(`   Comunidades restantes en BD: ${remaining}`)
  console.log(`   Usuarios admin restantes en BD: ${remainingUsers}`)
}

main()
  .catch(err => {
    console.error('\n❌ Error durante la limpieza:', err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
