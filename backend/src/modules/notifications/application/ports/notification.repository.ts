import type { CreateNotificationInput, NotificationRecord } from '../../domain/notification'

/** Puerto de persistencia; no depende de Prisma ni del transporte HTTP. */
export interface NotificationRepository {
  create(input: CreateNotificationInput): Promise<NotificationRecord>
  deleteReadBefore(userId: string, cutoff: Date): Promise<number>
  findLatestByUser(userId: string, limit: number): Promise<NotificationRecord[]>
  countUnreadByUser(userId: string): Promise<number>
  deleteReadByUser(userId: string): Promise<number>
  findById(id: string): Promise<NotificationRecord | null>
  markRead(id: string): Promise<NotificationRecord>
  markAllUnreadByUser(userId: string): Promise<number>
}
