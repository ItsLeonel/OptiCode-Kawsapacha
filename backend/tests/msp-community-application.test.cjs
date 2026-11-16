'use strict'
const test=require('node:test'),assert=require('node:assert/strict')
const {createMspCommunityService}=require('../dist/modules/administration/application/admin-msp-community.service')
function fixture(){
 const calls=[]
 const repository={
  async count(where){calls.push(['count',where]);return 2},
  async findMany(where,skip,limit){calls.push(['find',where,skip,limit]);return [{id:'c1'}]},
  async findForReview(id){calls.push(['read',id]);return {id,creatorId:'u1',status:'PENDING',name:'Comunidad'}},
  async updateReview(id,changes){calls.push(['update',changes]);return {id,...changes}},
 }
 const services={
  async logAudit(input){calls.push(['audit',input])},
  async createNotification(input){calls.push(['notify',input])},
 }
 return {service:createMspCommunityService(repository,services),calls}
}
test('listado mantiene filtros, página y orden de búsqueda',async()=>{
 const {service,calls}=fixture()
 const result=await service.listCommunitiesForMsp({page:2,limit:1,status:'PENDING',province:'Pichincha',search:'Andes'})
 assert.equal(result.total,2)
 assert.equal(result.totalPages,2)
 assert.equal(result.communities[0].id,'c1')
 assert.equal(calls[1][2],1)
 assert.deepEqual(calls[0][1].OR,[{name:{contains:'Andes'}},{responsible:{contains:'Andes'}},{location:{contains:'Andes'}}])
})
test('revisión conserva auditoría y notificación sin ORM',async()=>{
 const {service,calls}=fixture()
 const reviewed=await service.reviewCommunity('c1','APPROVED','msp')
 assert.equal(reviewed.status,'APPROVED')
 assert.equal(calls.find(x=>x[0]==='audit')[1].details.previousStatus,'PENDING')
 assert.equal(calls.find(x=>x[0]==='notify')[1].userId,'u1')
 await assert.rejects(service.reviewCommunity('c1','REJECTED','msp','no'),e=>e.code==='VALIDATION_ERROR')
})
