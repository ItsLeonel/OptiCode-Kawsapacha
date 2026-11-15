/** Composición: aplica el puerto a la implementación concreta sin contaminar casos de uso. */
import { createNotificationService } from './application/notification.service'
import { prismaNotificationRepository } from './infrastructure/prisma-notification.repository'

export const {
  createNotification,
  listUserNotifications,
  clearReadNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} = createNotificationService(prismaNotificationRepository)
