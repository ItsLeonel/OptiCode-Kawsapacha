// backend/src/services/notification.service.ts
import { prisma } from '../config/prisma'

export interface CreateNotificationInput {
  userId: string
  type: string
  title: string
  message: string
  resourceId?: string | null
}

export async function createNotification(input: CreateNotificationInput) {
  return prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      message: input.message,
      resourceId: input.resourceId,
    },
  })
}

export async function listUserNotifications(userId: string) {
  // Depuración automática: eliminar notificaciones leídas de más de 7 días
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  try {
    await prisma.notification.deleteMany({
      where: {
        userId,
        isRead: true,
        createdAt: { lt: sevenDaysAgo },
      },
    })
  } catch (err) {
    console.warn('Error en auto-depuración de notificaciones:', err)
  }

  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
    prisma.notification.count({
      where: { userId, isRead: false },
    }),
  ])

  return { notifications, unreadCount }
}

export async function clearReadNotifications(userId: string) {
  const result = await prisma.notification.deleteMany({
    where: { userId, isRead: true },
  })
  return { deleted: result.count }
}

export async function markNotificationAsRead(id: string, userId: string) {
  const notification = await prisma.notification.findUnique({
    where: { id },
  })
  if (!notification || notification.userId !== userId) {
    throw Object.assign(new Error('Notificación no encontrada o no pertenece al usuario.'), { code: 'NOT_FOUND' })
  }

  return prisma.notification.update({
    where: { id },
    data: { isRead: true },
  })
}

export async function markAllNotificationsAsRead(userId: string) {
  const result = await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  })
  return { updated: result.count }
}
