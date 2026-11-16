/** Registro de notificación tal como se entrega a la API REST actual. */
export interface NotificationRecord {
  id: string
  userId: string
  type: string
  title: string
  message: string
  resourceId: string | null
  isRead: boolean
  createdAt: Date
}

export interface CreateNotificationInput {
  userId: string
  type: string
  title: string
  message: string
  resourceId?: string | null
}
