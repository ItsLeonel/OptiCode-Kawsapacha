'use strict'
const test=require('node:test')
const assert=require('node:assert/strict')
const {createActivityVoidService}=require('../dist/modules/activities/application/activity-void.service')

function fixture(override={}){
 const calls=[]
 const repo={
  async findForVoid(){return {id:'a',actorUserId:'actor',voidedAt:null,garden:{createdById:'owner'},...override}},
  async voidAndRevert(id,reason,userId){
   calls.push(['transaction',id,reason,userId])
   return {updatedActivity:{id,voidedAt:new Date('2026-11-15'),voidReason:reason},pointsReverted:5}
  },
 }
 const app=createActivityVoidService(repo,async id=>{calls.push(['sync',id])})
 return {app,calls}
}
test('anulación válida hace reversión transaccional y sincroniza misiones del autor',async()=>{
 const {app,calls}=fixture()
 const result=await app('a','owner','Duplicado comprobado')
 assert.equal(result.pointsReverted,5)
 assert.equal(result.activity.voidReason,'Duplicado comprobado')
 assert.deepEqual(calls[0],['transaction','a','Duplicado comprobado','owner'])
 assert.deepEqual(calls[1],['sync','actor'])
})
test('un tercero no puede anular y motivo inválido no dispara persistencia',async()=>{
 const {app,calls}=fixture()
 await assert.rejects(app('a','stranger','Motivo válido'),/Solo el autor/)
 await assert.rejects(app('a','owner','no'),/mínimo 3 caracteres/)
 assert.equal(calls.length,0)
})
test('anulación previa es idempotentemente rechazada',async()=>{
 const {app}=fixture({voidedAt:new Date()})
 await assert.rejects(app('a','owner','Segunda anulación'),/ya ha sido anulada/)
})
