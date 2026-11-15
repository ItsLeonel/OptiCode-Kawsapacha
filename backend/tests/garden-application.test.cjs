'use strict'
const test=require('node:test')
const assert=require('node:assert/strict')
const {createGardenService}=require('../dist/modules/gardens/application/garden.service')

function fixture(communityId=null) {
 return {id:'g1',name:'Huerto',kind:'ground',areaM2:14,province:'Pichincha',provinceCode:'17',canton:'Quito',cantonCode:null,parish:'',parishCode:null,reference:'',latitude:null,longitude:null,irrigationAvailability:'yes',soilType:null,characteristics:'{}',communityId,createdById:'user1',photoUrl:'/uploads/gardens/old.jpg',createdAt:new Date(),updatedAt:new Date()}
}
function input(communityId=null) {
 const {id,photoUrl,createdAt,updatedAt,...data}=fixture(communityId)
 return data
}
function setup(existing=null,authorized=true) {
 const calls=[]
 const repo={
  async findLatestByCommunity(id){calls.push('community:'+id);return existing},
  async findLatestByCreator(id){calls.push('creator:'+id);return existing},
  async findById(id){calls.push('find:'+id);return existing},
  async create(data){calls.push(['create',data]);return {...fixture(),...data}},
  async update(id,data){calls.push(['update',id,data]);return {...existing,...data}},
  async listAccessible(id,community){calls.push(['list',id,community]);return []},
  async getDetails(id){calls.push('details:'+id);return existing},
 }
 const photos={async withPhoto(file,remove,previous,save){
  calls.push(['photo',Boolean(file),Boolean(remove),previous])
  return save(remove?null:undefined)
 }}
 const service=createGardenService(repo,photos,async()=>authorized)
 return {service,calls}
}
test('registro de huerto individual mantiene datos y crea registro persistente',async()=>{
 const {service,calls}=setup()
 const r=await service.createGarden(input())
 assert.equal(r.name,'Huerto')
 assert.equal(calls[0],'creator:user1')
 assert.equal(calls[1][0],'photo')
 assert.equal(calls[2][0],'create')
 assert.equal(calls[2][1].province,'Pichincha')
})
test('registro de comunidad ya vinculada actualiza sin eliminar la foto anterior',async()=>{
 const {service,calls}=setup(fixture('community'))
 const result=await service.createGarden(input('community'))
 assert.equal(result.photoUrl,'/uploads/gardens/old.jpg')
 assert.equal(calls[0],'community:community')
 assert.equal(calls[1][3],'/uploads/gardens/old.jpg')
 assert.equal(calls[2][0],'update')
})
test('vincular huerto comunitario exige ser Responsable',async()=>{
 const {service}=setup(null,false)
 await assert.rejects(service.createGarden(input('community')),e=>e.code==='FORBIDDEN')
})
test('listar y consultar conserva contratos del repositorio sin ORM',async()=>{
 const {service,calls}=setup(fixture())
 assert.deepEqual(await service.listGardens('user1','community'),[])
 assert.equal((await service.getGardenById('g1')).name,'Huerto')
 assert.deepEqual(calls.slice(0,2),[['list','user1','community'],'details:g1'])
})
