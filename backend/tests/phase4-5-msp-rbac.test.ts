// backend/tests/phase4-5-msp-rbac.test.ts
import assert from 'assert'
import bcrypt from 'bcryptjs'
import { prisma } from '../src/infrastructure/database/prisma'
import { registerUser, loginUser } from '../src/modules/auth/application/auth.service'
import {
  provisionMspUser,
  toggleUserStatus,
  listAdministrativeUsers,
} from '../src/modules/administration/application/admin-technical.service'
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
} from '../src/modules/administration/application/admin-msp.service'
import { createGardenActivity } from '../src/modules/activities/application/activity.service'
import { getUserRewardsSummary } from '../src/modules/rewards/application/rewards.service'
import {
  listUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../src/modules/notifications/notification.module'
import { listAuditLogs } from '../src/modules/administration/application/audit.service'

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
  console.log('4️⃣  Prueba: Registro válido y puntos inmediatos -> auditoría MSP...')
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
  assert.equal(act1Result.activity.reviewStatus, 'APPROVED', 'La actividad debe ser válida desde el registro')
  assert.equal(act1Result.reward?.pointsAwarded, 5, 'Se acreditan 5 Semillas al registrar')

  // El saldo acreditado no depende de la auditoría humana.
  const pendingSummary = await getUserRewardsSummary(registrationResult.user.id)
  assert.equal(pendingSummary.points, 5)
  assert.equal(pendingSummary.review.totals.confirmed, 5)
  assert.equal(pendingSummary.review.totals.provisional, 0)

  // Una actividad pendiente no bloquea registrar otra acción legítima.
  const signage1 = await createGardenActivity({
    gardenId: garden.id, actorUserId: registrationResult.user.id,
    type: 'signage', performedDate: '2026-11-10', targetKind: 'plant', plantId: plant.id,
  })
  const signage2 = await createGardenActivity({
    gardenId: garden.id, actorUserId: registrationResult.user.id,
    type: 'signage', performedDate: '2026-11-11', targetKind: 'plant', plantId: plant.id,
  })
  assert.equal(signage1.activity?.reviewStatus, 'APPROVED')
  assert.equal(signage2.activity?.reviewStatus, 'APPROVED')

  // El MSP consulta también registros válidos todavía sin auditoría humana.
  const registeredActivities = await listActivitiesForMsp({ status: 'APPROVED' })
  const beforeHumanAudit = registeredActivities.activities.find(a => a.id === act1Result.activity!.id)
  assert.ok(beforeHumanAudit)
  assert.equal(beforeHumanAudit.reviewedAt, null)

  // MSP aprueba la actividad
  const reviewResult = await reviewActivity(act1Result.activity!.id, 'APPROVED', mspUser.id)
  assert.equal(reviewResult.activity.reviewStatus, 'APPROVED')
  assert.equal(reviewResult.activity.reviewedById, mspUser.id)
  assert.equal(reviewResult.reward?.pointsAwarded, 0, 'Verificar no vuelve a otorgar los puntos')

  // Verificar conserva exactamente los mismos 5 puntos; registra al auditor.
  const approvedSummary = await getUserRewardsSummary(registrationResult.user.id)
  assert.equal(approvedSummary.points, 5, 'El saldo del usuario debe ser exactamente 5 puntos confirmados')

  // Idempotencia: una segunda llamada de aprobación no duplica puntos
  const reApproval = await reviewActivity(act1Result.activity!.id, 'APPROVED', mspUser.id)
  assert.equal(reApproval.reward?.pointsAwarded, 0, 'La segunda aprobación no debe duplicar puntos')
  const afterReApprove = await getUserRewardsSummary(registrationResult.user.id)
  assert.equal(afterReApprove.points, 5)

  // Una evidencia verificada puede invalidarse con reversión auditada.
  const retrospective = await reviewActivity(act1Result.activity!.id, 'REJECTED', mspUser.id, 'La evidencia no coincide con el riego registrado')
  assert.equal(retrospective.pointsReverted, -5)
  const afterRetrospective = await getUserRewardsSummary(registrationResult.user.id)
  assert.equal(afterRetrospective.points, 0)
  await reviewActivity(act1Result.activity!.id, 'REJECTED', mspUser.id, 'La evidencia no coincide con el riego registrado')
  assert.equal((await getUserRewardsSummary(registrationResult.user.id)).points, 0)

  // El usuario debe tener la notificación de actividad aprobada
  const notifsAfterApprove = await listUserNotifications(registrationResult.user.id)
  assert.ok(notifsAfterApprove.notifications.some(n => n.type === 'ACTIVITY_APPROVED'))
  console.log('   ✓ Actividad ya válida auditada por MSP sin duplicar sus 5 puntos.')

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
  assert.equal(act2Result.activity!.reviewStatus, 'APPROVED')

  // MSP rechaza la actividad indicando el motivo
  const rejectResult = await reviewActivity(
    act2Result.activity!.id,
    'REJECTED',
    mspUser.id,
    'La fotografía no muestra la zona radicular ni el abono aplicado claramente.'
  )
  assert.equal(rejectResult.activity.reviewStatus, 'REJECTED')
  assert.equal(rejectResult.reward, null)

  // El abonado recibió sus puntos y los pierde al invalidarse.
  const afterRejectSummary = await getUserRewardsSummary(registrationResult.user.id)
  assert.equal(afterRejectSummary.points, 0)

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
  console.log('9️⃣  Prueba: Actividades válidas mientras comunidad está pendiente...')
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

  // La comunidad PENDING funciona sin bloquear el cultivo ni su historial.
  const provisionalPrep = await createGardenActivity({
    gardenId: pendingGarden.id,
    actorUserId: registrationResult.user.id,
    type: 'preparation',
    performedDate: '2026-11-10',
    targetKind: 'plot',
    plotIndex: 1,
    notes: 'Preparando cama de siembra antes del aval institucional',
  })
  assert.equal(provisionalPrep.activity?.reviewStatus, 'APPROVED')
  assert.equal(provisionalPrep.reward?.pointsAwarded, 10)
  const verifiedPrep = await reviewActivity(provisionalPrep.activity!.id, 'APPROVED', mspUser.id)
  assert.equal(verifiedPrep.reward?.pointsAwarded, 0)
  assert.equal(verifiedPrep.activity.reviewStatus, 'APPROVED')
  // Aprobar la comunidad no altera ni duplica las actividades ya registradas.
  await reviewCommunity(pendingComm.id, 'APPROVED', mspUser.id)
  assert.equal((await prisma.gardenActivity.findUnique({ where: { id: provisionalPrep.activity!.id } }))?.reviewStatus, 'APPROVED')
  console.log('   ✓ Comunidad PENDING operativa, actividad válida y verificación MSP sin duplicar puntos.')

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
