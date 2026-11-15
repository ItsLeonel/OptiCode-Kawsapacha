'use strict'
const test=require('node:test')
const assert=require('node:assert/strict')
const {createActivityReadService}=require('../dist/modules/activities/application/activity-query.service')

test('consulta aplica solo filtros válidos y omite anulados',async()=>{
 let received
 const repo={
  async list(filter){received=filter;return [{id:'a1'}]},
  async getDetail(){return null},
 }
 const calls=[]
 const app=createActivityReadService(repo,async(...args)=>{calls.push(args);return true})
 const result=await app.listGardenActivities('garden','user',{plantId:'p',type:'tipo-inexistente',from:'2026-10-01'})
 assert.deepEqual(result,[{id:'a1'}])
 assert.deepEqual(received,{gardenId:'garden',includeVoided:false,plantId:'p',from:'2026-10-01'})
 assert.deepEqual(calls[0][2],{requireApproved:false})
 await app.listGardenActivities('garden','user',{type:'watering',includeVoided:true})
 assert.equal(received.type,'watering')
 assert.equal(received.includeVoided,true)
})
test('detalle exige existencia y acceso al jardín',async()=>{
 const calls=[]
 const repo={async list(){return []},async getDetail(){return {id:'a',gardenId:'garden'}}}
 const s=createActivityReadService(repo,async(...args)=>{calls.push(args);return true})
 assert.equal((await s.getGardenActivityDetail('a','u')).gardenId,'garden')
 assert.deepEqual(calls[0],['garden','u'])
 const empty=createActivityReadService({async list(){return []},async getDetail(){return null}},async()=>true)
 await assert.rejects(empty.getGardenActivityDetail('missing','u'),/Actividad no encontrada/)
})
