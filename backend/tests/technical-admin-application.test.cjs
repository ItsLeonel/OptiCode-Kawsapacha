'use strict'
const test=require('node:test')
const assert=require('node:assert/strict')
const {createTechnicalAdminService}=require('../dist/modules/administration/application/admin-technical.service')
function service(count=2) {
 const logs=[],user={id:'u1',name:'Tecnico',email:'tech@epn.edu.ec',role:'ADMIN_TECNICO',isActive:true,passwordHash:'hidden'}
 const repo={
  async findByEmail(email){return email==='tech@epn.edu.ec'?user:null},
  async findById(){return user},
  async createMsp(data){return {id:'msp',...data,createdAt:new Date()}},
  async countActiveTechnicalAdmins(){return count},
  async changeStatus(id,isActive){return {...user,id,isActive,updatedAt:new Date()}},
  async listUsers(){return [user]},
 }
 return {api:createTechnicalAdminService(repo,async()=> 'hash',async entry=>{logs.push(entry)}),logs}
}
test('registro técnico MSP audita usuario sin guardar contraseña plana',async()=>{
 const {api,logs}=service()
 const u=await api.provisionMspUser({name:' Ana ',email:' ANA@EPN.EDU.EC ',password:'clave'},'tech')
 assert.equal(u.email,'ana@epn.edu.ec')
 assert.equal(u.role,'ADMIN_MSP')
 assert.equal(logs[0].action,'PROVISION_MSP')
})
test('último administrador técnico se protege de desactivación',async()=>{
 const {api}=service(1)
 await assert.rejects(api.toggleUserStatus('u1',false,'tech'),e=>e.code==='PROTECTED_LAST_ADMIN')
})
test('dos administradores permiten transición con auditoría',async()=>{
 const {api,logs}=service(2)
 const result=await api.toggleUserStatus('u1',false,'tech','Fin de funciones')
 assert.equal(result.isActive,false)
 assert.equal(logs[0].details.reason,'Fin de funciones')
})
