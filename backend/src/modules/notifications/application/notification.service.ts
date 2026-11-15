import type { CreateNotificationInput } from '../domain/notification'
import type { NotificationRepository } from './ports/notification.repository'

export type { CreateNotificationInput } from '../domain/notification'

/**
 * Casos de uso inyectables; conservan respuestas, errores y política de
 * depuración existentes. No contienen consultas SQL ni dependencias HTTP.
 */
export function createNotificationService(repository: NotificationRepository) {
  return {
    createNotification(input: CreateNotificationInput) {
      return repository.create(input)
    },

    async listUserNotifications(userId: string) {
      // Depuración automática: eliminar notificaciones leídas de más de 7 días
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      try {
        await repository.deleteReadBefore(userId, sevenDaysAgo)
      } catch (err) {
        console.warn('Error en auto-depuración de notificaciones:', err)
      }

      const [notifications, unreadCount] = await Promise.all([
        repository.findLatestByUser(userId, 100),
        repository.countUnreadByUser(userId),
      ])

      return { notifications, unreadCount }
    },

    async clearReadNotifications(userId: string) {
      const deleted = await repository.deleteReadByUser(userId)
      return { deleted }
    },

    async markNotificationAsRead(id: string, userId: string) {
      const notification = await repository.findById(id)
      if (!notification || notification.userId !== userId) {
        throw Object.assign(new Error('Notificación no encontrada o no pertenece al usuario.'), { code: 'NOT_FOUND' })
      }
      return repository.markRead(id)
    },

    async markAllNotificationsAsRead(userId: string) {
      const updated = await repository.markAllUnreadByUser(userId)
      return { updated }
    },
  }
}
