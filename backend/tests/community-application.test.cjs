'use strict'
const test=require('node:test')
const assert=require('node:assert/strict')
const {createCommunityService}=require('../dist/modules/communities/application/community.service')
function setup(owned=false,approved=true,status='PENDING') {
 const calls=[]
 const detail={
  creatorId:'owner',
  members:[{userId:'member',status:'ACCEPTED'},{userId:'other',status:'PENDING'}],
  gardens:[{latitude:-0.2,longitude:-78.5},{latitude:-1,longitude:-77}],
 }
 const repo={
  async findCreated(){return owned?{id:'c1'}:null},
  async create(data){calls.push(['create',data]);return {id:'c1',...data}},
  async listForUser(userId){calls.push('list:'+userId);return []},
  async getDetail(){return detail},
  async getMetadata(){return {photoUrl:'/uploads/communities/old.jpg',status,name:'Huerto comunitario'}},
  async update(id,data){calls.push(['update',id,data]);return {id,...data}},
 }
 const photos={async withPhoto(file,remove,previous,save){
  calls.push(['photo',Boolean(file),remove,previous])
  return save(remove?null:undefined)
 }}
 return {service:createCommunityService(repo,photos,async()=>approved),calls,detail}
}
const input={name:'Huerto',responsible:'Rosa',location:'Quito',description:'Comunidad',creatorId:'owner'}
test('registra una comunidad y su responsable usando el puerto de persistencia',async()=>{
 const {service,calls}=setup()
 const saved=await service.createCommunity(input)
 assert.equal(saved.name,'Huerto')
 assert.equal(calls[0][0],'photo')
 assert.equal(calls[1][0],'create')
 assert.equal(calls[1][1].type,'personal')
})
test('impide crear una segunda comunidad propia',async()=>{
 const {service}=setup(true)
 await assert.rejects(service.createCommunity(input),e=>e.code==='COMMUNITY_LIMIT_REACHED')
})
test('oculta coordenadas a visitantes y las conserva para miembros acreditados',async()=>{
 const {service,detail}=setup()
 const publicView=await service.getCommunityById('c1')
 assert.equal(publicView.gardens[0].latitude,null)
 assert.equal(publicView.gardens[0].longitude,null)
 const member=await service.getCommunityById('c1','member')
 assert.equal(member.gardens[0].latitude,-0.2)
 assert.equal(detail.gardens[0].latitude,-0.2)
 const msp=await service.getCommunityById('c1','admin','ADMIN_MSP')
 assert.equal(msp.gardens[1].longitude,-77)
})
test('responsable puede reenviar comunidad rechazada conservando foto anterior',async()=>{
 const {service,calls}=setup(false,true,'REJECTED')
 const result=await service.updateCommunity('c1','owner',{name:'Nuevo nombre'})
 assert.equal(result.status,'PENDING')
 assert.equal(result.reviewReason,null)
 assert.equal(calls[0][3],'/uploads/communities/old.jpg')
})
test('sin privilegios, la actualización se rechaza',async()=>{
 const {service}=setup(false,false)
 await assert.rejects(service.updateCommunity('c1','outsider',{name:'Nuevo'}),e=>e.code==='FORBIDDEN')
})
