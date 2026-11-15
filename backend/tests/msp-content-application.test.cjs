'use strict'
const test=require('node:test')
const assert=require('node:assert/strict')
const {createInstitutionalContentService}=require('../dist/modules/administration/application/admin-msp-content.service')
function mock(){
  const calls=[]
  const repo={
    async listEvents(){calls.push('events');return []},
    async createEvent(data){calls.push(data);return {id:'e',...data}},
    async deleteEvent(id){calls.push(id);return {id}},
    async listResources(){calls.push('resources');return []},
    async createResource(data){calls.push(data);return {id:'r',...data}},
    async deleteResource(id){calls.push(id);return {id}},
  }
  return {service:createInstitutionalContentService(repo),calls}
}
test('eventos institucionales: conservar orden, normalización y valores por defecto',async()=>{
  const {service,calls}=mock()
  assert.deepEqual(await service.listInstitutionalEvents(),[])
  const x=await service.createInstitutionalEvent({name:'  Feria medicinal  ',date:' 2026-12-01 '})
  assert.equal(x.name,'Feria medicinal')
  assert.equal(x.date,'2026-12-01')
  assert.equal(x.province,'Pichincha')
  assert.equal(x.scope,'NACIONAL')
  assert.equal(x.canton,null)
  assert.ok(calls.includes('events'))
  await assert.rejects(service.createInstitutionalEvent({name:'',date:'2026-12-01'}),/nombre del evento/)
})
test('recursos educativos: preservar validación URL, tipo y publicación',async()=>{
  const {service}=mock()
  const r=await service.createEducationalResource({title:' Guía ',fileUrl:'/docs/plantas.html'})
  assert.equal(r.title,'Guía')
  assert.equal(r.kind,'GUIA')
  assert.equal(r.published,true)
  assert.equal(r.fileUrl,'/docs/plantas.html')
  await assert.rejects(service.createEducationalResource({title:'Guía',fileUrl:'javascript:alert(1)'}),/enlace/)
  await assert.rejects(service.createEducationalResource({title:'Guía',fileUrl:'https://a:b@example.com/doc'}),/enlace/)
  assert.equal((await service.createEducationalResource({title:'Guía',fileUrl:'https://example.org'})).fileUrl,'https://example.org')
})
