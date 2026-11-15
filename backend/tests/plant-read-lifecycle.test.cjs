'use strict'
const test=require('node:test')
const assert=require('node:assert/strict')
const {createPlantReadService}=require('../dist/modules/plants/application/plant-query.service')
const {createPlantLifecycleService}=require('../dist/modules/plants/application/plant-lifecycle.service')

test('consulta de plantas preserva evidencia y no infiere etapas rechazadas',async()=>{
 const actions=[]
 const repo={
  async listByGarden(){return [
   {id:'p1',photoUrl:'/uploads/plants/p1.jpg',activities:[
    {type:'observation',reviewStatus:'REJECTED',details:'{"growthStage":"flowering"}'},
    {type:'observation',reviewStatus:'APPROVED',details:'{"growthStage":"vegetative"}'},
   ]},
  ]},
  async findOwner(){return {realGardenId:'g1'}},
  async findPassport(){return {id:'p1',photoUrl:'/uploads/plants/p1.jpg'}},
 }
 const auth=async (id,user,opts)=>{actions.push([id,user,opts]);return true}
 const s=createPlantReadService(repo,auth)
 const rows=await s.listPlantsByGarden('g1','u1')
 assert.equal(rows[0].growthStage,'vegetative')
 assert.equal(rows[0].photoUrl,'/uploads/plants/p1.jpg')
 assert.equal(rows[0].activities,undefined)
 const pass=await s.getPlantPassport('p1','u1')
 assert.equal(pass.photoUrl,'/uploads/plants/p1.jpg')
 assert.deepEqual(actions.map(x=>x[2]),[{requireApproved:false},{requireApproved:false}])
})
test('remover planta respeta propiedad y no elimina fichas ajenas',async()=>{
 const calls=[]
 const repo={
  async findForRemoval(){return {id:'p',registeredById:'owner',realGarden:{createdById:'garden-owner'}}},
  async remove(id){calls.push(id)},
  async findForArchive(){return null},
 }
 const app=createPlantLifecycleService(repo)
 await assert.rejects(app.removePlant('p','stranger'),e=>e.code==='FORBIDDEN')
 assert.equal(calls.length,0)
 await app.removePlant('p','owner')
 assert.deepEqual(calls,['p'])
})
test('archivo de comunidad exige Responsable; el creador del huerto es autorizado',async()=>{
 const events=[]
 const repo={
  async findForArchive(){return {id:'p',registeredById:'u',realGarden:{
   createdById:'creator',communityId:'c',community:{creatorId:'community-creator'},
  }}},
  async findMemberRole(){return 'PARTICIPANTE'},
  async archive(id,date){events.push([id,date]);return {id,lifecycleStatus:'ARCHIVED',plotIndex:null}},
 }
 const app=createPlantLifecycleService(repo)
 await assert.rejects(app.archivePlant('p','guest'),e=>e.code==='FORBIDDEN')
 const result=await app.archivePlant('p','creator')
 assert.equal(result.lifecycleStatus,'ARCHIVED')
 assert.equal(result.plotIndex,null)
 assert.ok(events[0][1] instanceof Date)
})
