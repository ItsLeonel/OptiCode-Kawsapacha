// backend/tests/phase4-5-msp-rbac.test.ts
import assert from 'assert'
import bcrypt from 'bcryptjs'
import { prisma } from '../src/config/prisma'
import { registerUser, loginUser } from '../src/services/auth.service'
import {
  provisionMspUser,
  toggleUserStatus,
  listAdministrativeUsers,
} from '../src/services/admin-technical.service'
import {
  listCommunitiesForMsp,
  reviewCommunity,
  listActivitiesForMsp,
  reviewActivity,
  listInstitutionalEvents,
  createInstitutionalEvent,
  deleteInstitutionalEvent,
  listEducationalResources,
  createEducationalResource,
  deleteEducationalResource,
} from '../src/services/admin-msp.service'
import { createGardenActivity } from '../src/services/activity.service'
import { getUserRewardsSummary } from '../src/services/rewards.service'
import {
  listUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../src/services/notification.service'
import { listAuditLogs } from '../src/services/audit.service'

export async function runPhase45MspRbacTests() {
  console.log('========================================================================')
  console.log('🧪 INICIANDO SUITE DE PRUEBAS DE FASE 4.5: RBAC GLOBAL Y SUPERVISIÓN MSP')
  console.log('========================================================================\n')

  const timestamp = Date.now()

  // ─── 1. BOOTSTRAP DEL ADMIN TÉCNICO Y PROVISIÓN DE ADMIN MSP ─────────────────
  console.log('1️⃣  Prueba: Bootstrap seguro y aprovisionamiento de cuentas MSP...')
  const techAdminEmail = `admin.tech.${timestamp}@kawsapacha.gob.ec`
  const techAdmin = await prisma.user.create({
    data: {
      name: 'Admin Técnico QA',
      email: techAdminEmail,
      passwordHash: await bcrypt.hash('TechAdmin2026*', 10),
      role: 'ADMIN_TECNICO',
      isActive: true,
    },
  })
  assert.equal(techAdmin.role, 'ADMIN_TECNICO')
  assert.equal(techAdmin.isActive, true)

  // Provisionar un funcionario del MSP
  const mspEmail = `supervisor.msp.${timestamp}@msp.gob.ec`
  const mspUser = await provisionMspUser(
    {
      name: 'Dra. María Elena MSP',
      email: mspEmail,
      password: 'MspPassword2026*',
    },
    techAdmin.id
  )
  assert.equal(mspUser.role, 'ADMIN_MSP')
  assert.equal(mspUser.isActive, true)

  // Intentar crear cuenta MSP duplicada debe fallar
  await assert.rejects(
    async () => {
      await provisionMspUser(
        {
          name: 'Duplicado',
          email: mspEmail,
          password: 'Password123*',
        },
        techAdmin.id
      )
    },
    { code: 'EMAIL_IN_USE' }
  )
  console.log('   ✓ Cuentas ADMIN_TECNICO y ADMIN_MSP aprovisionadas y auditadas correctamente.')

  // ─── 2. REGISTRO PÚBLICO Y SEGURIDAD RBAC (USUARIO NORMAL) ───────────────────
  console.log('2️⃣  Prueba: Registro público asigna estrictamente rol USUARIO...')
  const citizenEmail = `ciudadano.${timestamp}@gmail.com`
  const registrationResult = await registerUser(
    'Juan Ciudadano Agricultor',
    citizenEmail,
    'Ciudadano2026*'
  )
  assert.equal(registrationResult.user.role, 'USUARIO', 'El registro público DEBE asignar rol USUARIO')
  assert.equal(registrationResult.user.isActive, true)

  // Comprobar inicio de sesión
  const loginResult = await loginUser(citizenEmail, 'Ciudadano2026*')
  assert.equal(loginResult.user.role, 'USUARIO')

  // El Administrador Técnico debe poder listar todas las cuentas del sistema (MSP, Técnicos y Usuarios)
  const listedUsers = await listAdministrativeUsers()
  assert.ok(listedUsers.some(u => u.id === registrationResult.user.id), 'El listado técnico debe incluir cuentas USUARIO')
  assert.ok(listedUsers.some(u => u.id === mspUser.id), 'El listado técnico debe incluir cuentas ADMIN_MSP')
  console.log('   ✓ Registro público, login de USUARIO y visibilidad completa en panel técnico verificados.')

  // ─── 3. CREACIÓN Y SUPERVISIÓN DE COMUNIDADES POR EL MSP ─────────────────────
  console.log('3️⃣  Prueba: Flujo de comunidad (PENDING -> Revisión MSP -> Aprobación)...')
  const community = await prisma.community.create({
    data: {
      name: `Comunidad Andina San Roque ${timestamp}`,
      responsible: 'Juan Ciudadano Agricultor',
      location: 'Otavalo, Imbabura',
      description: 'Comunidad dedicada a la preservación de plantas medicinales.',
      province: 'Imbabura',
      creatorId: registrationResult.user.id,
      status: 'PENDING',
    },
  })
  assert.equal(community.status, 'PENDING', 'Una nueva comunidad debe iniciar en estado PENDING')

  // MSP lista comunidades pendientes
  const mspCommunities = await listCommunitiesForMsp({
    status: 'PENDING',
    province: 'Imbabura',
  })
  assert.ok(mspCommunities.communities.some(c => c.id === community.id))

  // Intentar rechazar sin motivo debe fallar por validación
  await assert.rejects(
    async () => {
      await reviewCommunity(community.id, 'REJECTED', mspUser.id, ' ')
    },
    { code: 'VALIDATION_ERROR' }
  )

  // MSP aprueba la comunidad
  const approvedCommunity = await reviewCommunity(community.id, 'APPROVED', mspUser.id)
  assert.equal(approvedCommunity.status, 'APPROVED')
  assert.equal(approvedCommunity.reviewedById, mspUser.id)

  // El creador debe haber recibido una notificación de aprobación
  const creatorNotifs = await listUserNotifications(registrationResult.user.id)
  assert.ok(creatorNotifs.notifications.some(n => n.type === 'COMMUNITY_APPROVED'))
  console.log('   ✓ Comunidad aprobada por el MSP y notificada al responsable.')

  // ─── 4. FLUJO DE ACTIVIDAD AGRÍCOLA: AUDITORÍA MSP Y CRÉDITO DE PUNTOS ───────
  console.log('4️⃣  Prueba: Registro de actividad (PENDING) -> Auditoría MSP -> Acreditación...')
  // Crear huerto para el usuario
  const garden = await prisma.realGarden.create({
    data: {
      name: 'Huerto Familiar Otavalo',
      kind: 'ground',
      areaM2: 30,
      province: 'Imbabura',
      provinceCode: '10',
      communityId: community.id,
      createdById: registrationResult.user.id,
    },
  })

  // Obtener o crear especie medicinal
  let species = await prisma.medicinalCatalog.findFirst()
  if (!species) {
    species = await prisma.medicinalCatalog.create({
      data: {
        name: 'Manzanilla Andina',
        latinName: 'Matricaria chamomilla',
        icon: '🌼',
      },
    })
  }

  const plant = await prisma.cultivatedPlant.create({
    data: {
      realGardenId: garden.id,
      speciesId: species.id,
      plotIndex: 0,
      customName: 'Manzanilla Parcela 1',
      registeredById: registrationResult.user.id,
      plantingDate: new Date('2026-11-01'),
      reviewStatus: 'APPROVED',
    },
  })

  // Saldo inicial del usuario antes de la actividad
  const initialSummary = await getUserRewardsSummary(registrationResult.user.id)
  assert.equal(initialSummary.points, 0)

  // Usuario registra actividad con fotografía (riego)
  const act1Result = await createGardenActivity({
    gardenId: garden.id,
    actorUserId: registrationResult.user.id,
    type: 'watering',
    performedDate: '2026-11-10',
    targetKind: 'plant',
    plantId: plant.id,
    notes: 'Riego con infusión orgánica al pie del cultivo',
    evidenceFile: {
      filename: `riego-${timestamp}.jpg`,
      path: `/uploads/activities/riego-${timestamp}.jpg`,
      mimetype: 'image/jpeg',
      size: 24500,
    },
  })

  assert.ok(act1Result.activity)
  assert.equal(act1Result.activity.reviewStatus, 'PENDING', 'La actividad debe quedar en PENDING')
  assert.equal(act1Result.reward?.pointsAwarded, 5, 'Se entregan puntos provisionales al registrar')

  // Verificar que el saldo del usuario sigue en 0 (puntos retenidos hasta aprobación)
  const pendingSummary = await getUserRewardsSummary(registrationResult.user.id)
  assert.equal(pendingSummary.points, 0, 'El saldo confirmado debe mantenerse en 0 hasta aprobación')

  // Verificar que mientras exista un riego PENDING en la planta, no se puede repetir otro riego sobre la misma planta
  await assert.rejects(
    async () => {
      await createGardenActivity({
        gardenId: garden.id,
        actorUserId: registrationResult.user.id,
        type: 'watering',
        performedDate: '2026-11-10',
        targetKind: 'plant',
        plantId: plant.id,
        notes: 'Intento duplicado mientras el riego sigue en revisión',
      })
    },
    { code: 'ACTIVITY_ALREADY_PENDING' }
  )

  // MSP consulta la bandeja de actividades pendientes
  const pendingActivities = await listActivitiesForMsp({ status: 'PENDING' })
  assert.ok(pendingActivities.activities.some(a => a.id === act1Result.activity!.id))

  // MSP aprueba la actividad
  const reviewResult = await reviewActivity(act1Result.activity!.id, 'APPROVED', mspUser.id)
  assert.equal(reviewResult.activity.reviewStatus, 'APPROVED')
  assert.equal(reviewResult.reward?.pointsAwarded, 5, 'Riego debe acreditar 5 Semillas de vida')

  // Ahora el saldo confirmado del usuario debe reflejar exactamente los 5 puntos
  const approvedSummary = await getUserRewardsSummary(registrationResult.user.id)
  assert.equal(approvedSummary.points, 5, 'El saldo del usuario debe ser exactamente 5 puntos confirmados')

  // Idempotencia: una segunda llamada de aprobación no duplica puntos
  const reApproval = await reviewActivity(act1Result.activity!.id, 'APPROVED', mspUser.id)
  assert.equal(reApproval.reward?.pointsAwarded, 0, 'La segunda aprobación no debe duplicar puntos')
  const afterReApprove = await getUserRewardsSummary(registrationResult.user.id)
  assert.equal(afterReApprove.points, 5)

  // Una aprobación ya acreditada no puede pasar a REJECTED y dejar puntos inconsistentes
  await assert.rejects(
    () => reviewActivity(act1Result.activity!.id, 'REJECTED', mspUser.id, 'Rechazo posterior a aprobación'),
    { code: 'REVIEW_FINALIZED' }
  )
  const afterBlockedRejection = await getUserRewardsSummary(registrationResult.user.id)
  assert.equal(afterBlockedRejection.points, 5, 'No se deben perder ni conservar saldos inconsistentes tras una revisión inválida')

  // El usuario debe tener la notificación de actividad aprobada
  const notifsAfterApprove = await listUserNotifications(registrationResult.user.id)
  assert.ok(notifsAfterApprove.notifications.some(n => n.type === 'ACTIVITY_APPROVED'))
  console.log('   ✓ Actividad en auditoría aprobada formalmente: +5 puntos acreditados sin duplicidad.')

  // ─── 5. RECHAZO DE ACTIVIDAD POR EL MSP ──────────────────────────────────────
  console.log('5️⃣  Prueba: Rechazo de actividad con motivo obligatorio...')
  const act2Result = await createGardenActivity({
    gardenId: garden.id,
    actorUserId: registrationResult.user.id,
    type: 'fertilizing',
    performedDate: '2026-11-11',
    targetKind: 'plant',
    plantId: plant.id,
    notes: 'Abonado con composta',
    evidenceFile: {
      filename: `abono-${timestamp}.jpg`,
      path: `/uploads/activities/abono-${timestamp}.jpg`,
      mimetype: 'image/jpeg',
      size: 21000,
    },
  })
  assert.equal(act2Result.activity!.reviewStatus, 'PENDING')

  // MSP rechaza la actividad indicando el motivo
  const rejectResult = await reviewActivity(
    act2Result.activity!.id,
    'REJECTED',
    mspUser.id,
    'La fotografía no muestra la zona radicular ni el abono aplicado claramente.'
  )
  assert.equal(rejectResult.activity.reviewStatus, 'REJECTED')
  assert.equal(rejectResult.reward, null)

  // El saldo debe seguir intacto en 5 puntos (sin cambios ni puntos sumados indebidamente)
  const afterRejectSummary = await getUserRewardsSummary(registrationResult.user.id)
  assert.equal(afterRejectSummary.points, 5)

  // El usuario debe recibir la notificación de rechazo con la justificación
  const notifsAfterReject = await listUserNotifications(registrationResult.user.id)
  const rejectNotif = notifsAfterReject.notifications.find(n => n.type === 'ACTIVITY_REJECTED')
  assert.ok(rejectNotif)
  assert.ok(rejectNotif.message.includes('fotografía no muestra la zona radicular'))
  console.log('   ✓ Actividad rechazada correctamente: puntos no acreditados y usuario notificado con motivo.')

  // ─── 6. PROTECCIÓN DEL ÚLTIMO ADMIN TÉCNICO ──────────────────────────────────
  console.log('6️⃣  Prueba: Protección contra bloqueo/desactivación del último ADMIN_TECNICO...')
  // Asegurar que techAdmin sea el único activo en esta verificación temporal
  await prisma.user.updateMany({
    where: { role: 'ADMIN_TECNICO', id: { not: techAdmin.id } },
    data: { isActive: false },
  })

  await assert.rejects(
    async () => {
      await toggleUserStatus(techAdmin.id, false, techAdmin.id, 'Intento de auto-desactivación')
    },
    { code: 'PROTECTED_LAST_ADMIN' },
    'El sistema debe impedir desactivar al último ADMIN_TECNICO'
  )

  // Restaurar estado activo de administradores predefinidos de desarrollo
  await prisma.user.updateMany({
    where: { email: { in: ['admin1@mail.com', 'admin2@mail.com'] } },
    data: { isActive: true },
  })

  // Desactivar un funcionario del MSP sí está permitido
  const deactivatedMsp = await toggleUserStatus(mspUser.id, false, techAdmin.id, 'Fin de funciones en zona')
  assert.equal(deactivatedMsp.isActive, false)
  console.log('   ✓ Regla de protección del último ADMIN_TECNICO verificada.')

  // ─── 7. GESTIÓN Y LECTURA DE NOTIFICACIONES ──────────────────────────────────
  console.log('7️⃣  Prueba: Bandeja de notificaciones y marcado de lectura...')
  const beforeRead = await listUserNotifications(registrationResult.user.id)
  assert.ok(beforeRead.unreadCount >= 2)

  const firstNotif = beforeRead.notifications[0]
  await markNotificationAsRead(firstNotif.id, registrationResult.user.id)

  const midRead = await listUserNotifications(registrationResult.user.id)
  assert.equal(midRead.unreadCount, beforeRead.unreadCount - 1)

  await markAllNotificationsAsRead(registrationResult.user.id)
  const afterAllRead = await listUserNotifications(registrationResult.user.id)
  assert.equal(afterAllRead.unreadCount, 0)
  console.log('   ✓ Notificaciones leídas y sincronizadas correctamente.')

  // ─── 8. AUDITORÍA INMUTABLE ──────────────────────────────────────────────────
  console.log('8️⃣  Prueba: Trazabilidad completa en tabla de auditoría...')
  const auditResult = await listAuditLogs({ limit: 10 })
  assert.ok(auditResult.total >= 4, 'Deben existir al menos 4 registros de auditoría')
  assert.ok(auditResult.logs.some(l => l.action === 'PROVISION_MSP'))
  assert.ok(auditResult.logs.some(l => l.action === 'COMMUNITY_APPROVED'))
  assert.ok(auditResult.logs.some(l => l.action === 'ACTIVITY_APPROVED'))
  assert.ok(auditResult.logs.some(l => l.action === 'ACTIVITY_REJECTED'))
  console.log('   ✓ Todos los eventos críticos quedaron registrados en AuditLog con actor y timestamp.')

  // ─── 9. BLOQUEO DE ACTIVIDADES Y PREPARACIÓN SIN COMUNIDAD APROBADA ─────────
  console.log('9️⃣  Prueba: Bloqueo estricto de actividades (incluida preparación) sin comunidad aprobada...')
  const pendingComm = await prisma.community.create({
    data: {
      name: `Comunidad Sin Aprobar ${timestamp}`,
      responsible: 'Agricultor Pendiente',
      location: 'Cayambe, Pichincha',
      description: 'Comunidad en proceso de registro',
      province: 'Pichincha',
      creatorId: registrationResult.user.id,
      status: 'PENDING',
    },
  })

  const pendingGarden = await prisma.realGarden.create({
    data: {
      name: 'Huerto Terreno Pendiente',
      kind: 'ground',
      areaM2: 25,
      province: 'Pichincha',
      provinceCode: '17',
      communityId: pendingComm.id,
      createdById: registrationResult.user.id,
    },
  })

  // Intentar registrar preparación de terreno debe fallar con COMMUNITY_NOT_APPROVED
  await assert.rejects(
    async () => {
      await createGardenActivity({
        gardenId: pendingGarden.id,
        actorUserId: registrationResult.user.id,
        type: 'preparation',
        performedDate: '2026-11-10',
        targetKind: 'plot',
        plotIndex: 1,
        notes: 'Preparando cama de siembra con abono verde',
      })
    },
    { code: 'COMMUNITY_NOT_APPROVED' }
  )

  // Intentar aprobar una actividad perteneciente a una comunidad no aprobada debe ser rechazado
  const unapprovedAct = await prisma.gardenActivity.create({
    data: {
      gardenId: pendingGarden.id,
      actorUserId: registrationResult.user.id,
      type: 'preparation',
      performedDate: '2026-11-10',
      targetKind: 'plot',
      plotIndex: 2,
      reviewStatus: 'PENDING',
    },
  })

  await assert.rejects(
    async () => {
      await reviewActivity(unapprovedAct.id, 'APPROVED', mspUser.id)
    },
    { code: 'COMMUNITY_NOT_APPROVED' }
  )

  // Ahora el MSP aprueba la comunidad
  await reviewCommunity(pendingComm.id, 'APPROVED', mspUser.id)

  // Tras la aprobación, la preparación del terreno se registra sin problemas
  const successfulPrep = await createGardenActivity({
    gardenId: pendingGarden.id,
    actorUserId: registrationResult.user.id,
    type: 'preparation',
    performedDate: '2026-11-10',
    targetKind: 'plot',
    plotIndex: 1,
    notes: 'Preparación autorizada tras aprobación de la comunidad',
  })
  assert.ok(successfulPrep.activity)
  assert.equal(successfulPrep.activity.reviewStatus, 'PENDING')
  console.log('   ✓ Actividades bloqueadas antes de la aprobación y desbloqueadas exitosamente tras aval del MSP.')

  // ─── 10. PERSISTENCIA MSP Y AUSENCIA DE SIEMBRA AUTOMÁTICA DE DEMOS ──────
  console.log('🔟  Prueba: eventos, recursos y enlaces educativos persistentes...')
  const eventsBefore = await prisma.mspInstitutionalEvent.count()
  const resourcesBefore = await prisma.mspEducationalResource.count()
  await listInstitutionalEvents()
  await listEducationalResources()
  assert.equal(await prisma.mspInstitutionalEvent.count(), eventsBefore, 'Consultar eventos no debe crear ejemplos ficticios')
  assert.equal(await prisma.mspEducationalResource.count(), resourcesBefore, 'Consultar recursos no debe crear ejemplos ficticios')

  const testEvent = await createInstitutionalEvent({
    name: `Evento MSP QA ${timestamp}`,
    date: '2026-12-05',
    province: 'Pichincha',
    createdById: mspUser.id,
  })
  assert.ok((await listInstitutionalEvents()).some(event => event.id === testEvent.id))
  await deleteInstitutionalEvent(testEvent.id)
  assert.equal(await prisma.mspInstitutionalEvent.count(), eventsBefore)

  const testResource = await createEducationalResource({
    title: `Recurso MSP QA ${timestamp}`,
    kind: 'GUIA',
    fileUrl: '/docs/guia-plantas-medicinales-msp.html',
    createdById: mspUser.id,
  })
  assert.ok((await listEducationalResources()).some(resource => resource.id === testResource.id))
  await deleteEducationalResource(testResource.id)
  assert.equal(await prisma.mspEducationalResource.count(), resourcesBefore)

  await assert.rejects(
    () => createEducationalResource({ title: 'URL insegura', fileUrl: 'javascript:alert(1)' }),
    /El enlace debe utilizar HTTPS\/HTTP/
  )
  console.log('   ✓ CRUD persistente, consulta sin ejemplos nuevos y URLs validadas.')

  // ─── LIMPIEZA AUTOMÁTICA DE DATOS DE PRUEBA ──────────────────────────────────
  try {
    const testCommIds = [community.id, pendingComm.id]
    const testUserIds = [techAdmin.id, mspUser.id, registrationResult.user.id]
    const testGardenIds = [garden.id, pendingGarden.id]

    await prisma.activityEvidence.deleteMany({
      where: { activity: { gardenId: { in: testGardenIds } } },
    }).catch(() => {})
    await prisma.gardenActivity.deleteMany({
      where: { gardenId: { in: testGardenIds } },
    }).catch(() => {})
    await prisma.cultivatedPlant.deleteMany({
      where: { realGardenId: { in: testGardenIds } },
    }).catch(() => {})
    await prisma.realGarden.deleteMany({
      where: { id: { in: testGardenIds } },
    }).catch(() => {})
    await prisma.communityMember.deleteMany({
      where: { communityId: { in: testCommIds } },
    }).catch(() => {})
    await prisma.community.deleteMany({
      where: { id: { in: testCommIds } },
    }).catch(() => {})
    await prisma.rewardLedger.deleteMany({
      where: { userId: { in: testUserIds } },
    }).catch(() => {})
    await prisma.userMissionProgress.deleteMany({
      where: { userId: { in: testUserIds } },
    }).catch(() => {})
    await prisma.userBadge.deleteMany({
      where: { userId: { in: testUserIds } },
    }).catch(() => {})
    await prisma.notification.deleteMany({
      where: { userId: { in: testUserIds } },
    }).catch(() => {})
    await prisma.auditLog.deleteMany({
      where: { actorId: { in: testUserIds } },
    }).catch(() => {})
    await prisma.user.deleteMany({
      where: { id: { in: testUserIds } },
    }).catch(() => {})
  } catch (cleanErr) {
    console.warn('Advertencia en limpieza automática de tests:', cleanErr)
  }

  console.log('\n========================================================================')
  console.log('🎉 TODAS LAS PRUEBAS DE FASE 4.5 PASARON CON ÉXITO (100% SATISFACTORIO) 🎉')
  console.log('========================================================================\n')
}

// Ejecutar si se invoca directamente con ts-node
if (require.main === module) {
  runPhase45MspRbacTests()
    .catch(err => {
      console.error('\n❌ Error en la suite de pruebas de Fase 4.5:', err)
      process.exit(1)
    })
    .finally(async () => {
      await prisma.$disconnect()
    })
}
