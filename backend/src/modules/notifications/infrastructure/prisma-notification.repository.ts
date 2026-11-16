import { prisma } from '../../../infrastructure/database/prisma'
import type { NotificationRepository } from '../application/ports/notification.repository'

/** Adaptador Prisma; conserva filtros, límites y orden de las consultas previas. */
export const prismaNotificationRepository: NotificationRepository = {
  create(input) {
    return prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        message: input.message,
        resourceId: input.resourceId,
      },
    })
  },
  async deleteReadBefore(userId, cutoff) {
    const result = await prisma.notification.deleteMany({
      where: { userId, isRead: true, createdAt: { lt: cutoff } },
    })
    return result.count
  },
  findLatestByUser(userId, limit) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
  },
  countUnreadByUser(userId) {
    return prisma.notification.count({ where: { userId, isRead: false } })
  },
  async deleteReadByUser(userId) {
    const result = await prisma.notification.deleteMany({
      where: { userId, isRead: true },
    })
    return result.count
  },
  findById(id) {
    return prisma.notification.findUnique({ where: { id } })
  },
  markRead(id) {
    return prisma.notification.update({ where: { id }, data: { isRead: true } })
  },
  async markAllUnreadByUser(userId) {
    const result = await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    })
    return result.count
  },
}
