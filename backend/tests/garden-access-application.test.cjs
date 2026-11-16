'use strict'
const {test}=require('node:test')
const assert=require('node:assert/strict')
const {createGardenAccessService}=require('../dist/modules/gardens/application/garden-access.service')
function garden(status='APPROVED') {
 return {id:'g',createdById:'creator',communityId:'c',community:{id:'c',status,name:'Test',reviewReason:null}}
}
function access(record, status='ACCEPTED') {
 return createGardenAccessService({async findGarden(){return record},async findMembershipStatus(){return status}})
}
test('permiso de huerto inexistente conserva error',async()=>{
 await assert.rejects(access(null)('x','u'),/El huerto especificado no existe/)
})
test('crear y registrar funciona en PENDING para creador o miembro',async()=>{
 assert.equal(await access(garden('PENDING'))('g','creator'),true)
 assert.equal(await access(garden('PENDING'))('g','member'),true)
})
test('comunidades REJECTED/SUSPENDED son bloqueadas salvo consulta histórica',async()=>{
 for(const state of ['REJECTED','SUSPENDED']){
  await assert.rejects(access(garden(state))('g','creator'),e=>e.code==='COMMUNITY_NOT_APPROVED')
  assert.equal(await access(garden(state))('g','creator',{requireApproved:false}),true)
 }
})
test('miembro no aceptado es denegado',async()=>{
 await assert.rejects(access(garden(),'PENDING')('g','member'),e=>e.code==='FORBIDDEN')
})
