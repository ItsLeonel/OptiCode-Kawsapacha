'use strict'
const { test } = require('node:test')
const assert = require('node:assert/strict')
const { createNotificationService } = require('../dist/modules/notifications/application/notification.service')

function fakeRepository(initial = []) {
  const notifications = [...initial]
  const calls = []
  return {
    calls, notifications,
    async create(input) {
      calls.push('create')
      const item = { id: String(notifications.length + 1), ...input, resourceId: input.resourceId ?? null, createdAt: new Date(), isRead: false }
      notifications.push(item)
      return item
    },
    async deleteReadBefore(userId, cutoff) {
      calls.push('cleanup')
      const count = notifications.length
      for (let i = notifications.length - 1; i >= 0; i--) {
        const n = notifications[i]
        if (n.userId === userId && n.isRead && n.createdAt < cutoff) notifications.splice(i, 1)
      }
      return count - notifications.length
    },
    async findLatestByUser(userId, limit) {
      calls.push('find')
      return notifications.filter(n => n.userId === userId).sort((a,b)=>b.createdAt-a.createdAt).slice(0,limit)
    },
    async countUnreadByUser(userId) {
      calls.push('count')
      return notifications.filter(n => n.userId === userId && !n.isRead).length
    },
    async deleteReadByUser(userId) {
      let count = 0
      for (let i = notifications.length - 1; i >= 0; i--) if (notifications[i].userId === userId && notifications[i].isRead) { notifications.splice(i,1); count++ }
      return count
    },
    async findById(id) {
      calls.push('find-by-id')
      return notifications.find(n => n.id === id) ?? null
    },
    async markRead(id) {
      const n = notifications.find(x => x.id === id)
      n.isRead = true
      return n
    },
    async markAllUnreadByUser(userId) {
      let count = 0
      for (const n of notifications) if (n.userId === userId && !n.isRead) { n.isRead = true; count++ }
      return count
    },
  }
}

test('aplicación: crear, consultar y marcar notificaciones sin usar Prisma', async () => {
  const repo = fakeRepository()
  const service = createNotificationService(repo)
  const item = await service.createNotification({userId: 'u1',type:'TEST',title:'Aviso',message:'Hola'})
  await service.createNotification({userId: 'u2',type:'TEST',title:'Otro',message:'Privado'})
  assert.equal((await service.listUserNotifications('u1')).unreadCount,1)
  assert.deepEqual((await service.listUserNotifications('u1')).notifications.map(n=>n.id), [item.id])
  await assert.rejects(service.markNotificationAsRead(item.id,'u2'), error=>error.code==='NOT_FOUND')
  assert.equal((await service.markNotificationAsRead(item.id,'u1')).isRead,true)
  assert.deepEqual(await service.markAllNotificationsAsRead('u2'),{updated:1})
  assert.deepEqual(await service.clearReadNotifications('u1'),{deleted:1})
  assert.equal((await service.listUserNotifications('u1')).unreadCount,0)
})

test('aplicación: depuración de leídas antiguas conserva recientes y otros usuarios',async()=>{
  const old=new Date(Date.now()-9*24*60*60*1000), recent=new Date()
  const repo=fakeRepository([
    {id:'old',userId:'u',createdAt:old,isRead:true},
    {id:'recent',userId:'u',createdAt:recent,isRead:true},
    {id:'other',userId:'other',createdAt:old,isRead:true},
  ])
  const service=createNotificationService(repo)
  const data=await service.listUserNotifications('u')
  assert.deepEqual(data.notifications.map(n=>n.id),['recent'])
  assert.equal(repo.notifications.some(n=>n.id==='other'),true)
})
