'use strict'
const test=require('node:test')
const assert=require('node:assert/strict')
const {createCarePlantAccessService}=require('../dist/modules/activities/application/care-access.service')
const {createHarvestAccessService}=require('../dist/modules/harvest/application/harvest-access.service')
const {createHarvestRoleService}=require('../dist/modules/harvest/application/harvest-role.service')
const {createUserLookupService}=require('../dist/modules/users/application/user-lookup.service')
const {createGlobalRoleService}=require('../dist/modules/auth/application/global-role.service')
const {createCommunityRoleService}=require('../dist/modules/communities/application/community-role.service')

test('autorización de cuidados resuelve la parcela sin Prisma',async()=>{
 const calls=[]
 const check=createCarePlantAccessService({async findGardenIdByPlant(id){return id==='plant'?'garden':null}},
  async(id,user,options)=>{calls.push({id,user,options});return true})
 await check('plant','u1',false)
 assert.deepEqual(calls,[{id:'garden',user:'u1',options:{requireApproved:false}}])
 await assert.rejects(check('missing','u1',true),e=>e.code==='NOT_FOUND')
})

test('cosechas mantienen revisión de creador y membresía aceptada',async()=>{
 const repo={
  async findPlantGardenId(){return 'g'},
  async findCommunityCreator(id){return id==='missing'?null:'owner'},
  async findMembershipStatus(_,uid){return uid==='accepted'?'ACCEPTED':'PENDING'},
 }
 const s=createHarvestAccessService(repo)
 assert.equal(await s.findHarvestPlantGardenId('plant'),'g')
 assert.equal(await s.checkCommunityHarvestAccess('missing','x'),'NOT_FOUND')
 assert.equal(await s.checkCommunityHarvestAccess('c','owner'),'ALLOWED')
 assert.equal(await s.checkCommunityHarvestAccess('c','accepted'),'ALLOWED')
 assert.equal(await s.checkCommunityHarvestAccess('c','pending'),'FORBIDDEN')
})

test('roles de cosecha protegen huertos personales y comunitarios',async()=>{
 let garden={communityId:null,createdById:'owner'}
 let role=null
 const s=createHarvestRoleService({
  async findPlantGardenId(id){return id==='missing'?null:'garden'},
  async findHarvestGarden(){return garden},
  async findAcceptedHarvestRole(){return role},
 })
 assert.equal(await s('missing','owner'),'PLANT_NOT_FOUND')
 assert.equal(await s('plant','owner'),'ALLOWED')
 assert.equal(await s('plant','visitor'),'NOT_CREATOR')
 garden={communityId:'community',createdById:'owner'}
 assert.equal(await s('plant','owner'),'NOT_MEMBER')
 role='PARTICIPANTE'; assert.equal(await s('plant','member'),'INSUFFICIENT_ROLE')
 role='CUIDADOR'; assert.equal(await s('plant','member'),'ALLOWED')
})

test('búsqueda de usuarios prioriza membresía antes que invitaciones pendientes',async()=>{
 let membership=null
 let invite={role:'CUIDADOR'}
 let emails=[]
 const lookup=createUserLookupService({
  async findUserByEmail(raw,clean){emails=[raw,clean];return {id:'u',name:'Rosa',email:clean}},
  async findMembership(){return membership},
  async findPendingInvitation(){return invite},
 })
 const invited=await lookup('Rosa@Example.com','community')
 assert.deepEqual(emails,['Rosa@Example.com','rosa@example.com'])
 assert.equal(invited.isPending,true)
 assert.equal(invited.roleInCommunity,'CUIDADOR')
 membership={roleInCommunity:'RESPONSABLE',status:'ACCEPTED'}
 const accepted=await lookup('Rosa@Example.com','community')
 assert.equal(accepted.isMember,true)
 assert.equal(accepted.isPending,false)
 assert.equal(accepted.roleInCommunity,'RESPONSABLE')
})

test('RBAC global distingue usuario inexistente, inactivo y rol no autorizado',async()=>{
 let user=null
 const check=createGlobalRoleService({async findUserRole(){return user}})
 assert.equal((await check('u',['ADMIN_MSP'])).status,'USER_NOT_FOUND')
 user={role:'ADMIN_MSP',isActive:false}
 assert.equal((await check('u',['ADMIN_MSP'])).status,'ACCOUNT_DEACTIVATED')
 user.isActive=true
 assert.equal((await check('u',['ADMIN_TECNICO'])).status,'FORBIDDEN')
 assert.deepEqual(await check('u',['ADMIN_MSP']),{status:'ALLOWED',role:'ADMIN_MSP'})
})

test('roles comunitarios no permiten miembros pendientes ni participantes sin permisos',async()=>{
 let role=null
 const check=createCommunityRoleService({async findAcceptedRole(){return role}})
 assert.equal(await check('c','u',['RESPONSABLE']),'NOT_MEMBER')
 role='PARTICIPANTE'
 assert.equal(await check('c','u',['RESPONSABLE']),'FORBIDDEN')
 role='RESPONSABLE'
 assert.equal(await check('c','u',['RESPONSABLE']),'ALLOWED')
})
