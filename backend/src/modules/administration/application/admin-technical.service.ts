import type { TechnicalAdministrationRepository, TechnicalAudit } from './ports/admin-technical.repository'

/** Administración técnica sin dependencias de hashing concreto, HTTP o Prisma. */
export function createTechnicalAdminService(
 repository:TechnicalAdministrationRepository,
 hashPassword:(password:string)=>Promise<string>,
 logAudit:TechnicalAudit
) {
 async function provisionMspUser(input:{name:string;email:string;password:string},actorId:string) {
  const normalizedEmail=input.email.trim().toLowerCase()
  const existing=await repository.findByEmail(normalizedEmail)
  if(existing)throw Object.assign(new Error('Ya existe una cuenta con ese correo electrónico.'),{code:'EMAIL_IN_USE'})
  const passwordHash=await hashPassword(input.password)
  const user=await repository.createMsp({
   name:input.name.trim(),email:normalizedEmail,passwordHash,role:'ADMIN_MSP',isActive:true,
  })
  await logAudit({
   actorId,action:'PROVISION_MSP',targetResource:'user',targetId:user.id,
   details:{email:user.email,name:user.name,role:user.role},
  })
  return user
 }

 async function toggleUserStatus(targetUserId:string,isActive:boolean,actorId:string,reason?:string) {
  const targetUser=await repository.findById(targetUserId)
  if(!targetUser)throw Object.assign(new Error('Usuario objetivo no encontrado.'),{code:'NOT_FOUND'})
  if(targetUser.role==='ADMIN_TECNICO'&&!isActive){
   const activeAdminsCount=await repository.countActiveTechnicalAdmins()
   if(activeAdminsCount<=1){
    throw Object.assign(new Error('Operación denegada: no se puede desactivar al único Administrador Técnico activo del sistema.'),{code:'PROTECTED_LAST_ADMIN'})
   }
  }
  const updated=await repository.changeStatus(targetUserId,isActive)
  await logAudit({
   actorId,action:isActive?'ACTIVATE_USER':'DEACTIVATE_USER',targetResource:'user',targetId:targetUser.id,
   details:{
    previousState:targetUser.isActive,newState:isActive,role:targetUser.role,
    reason:reason||'Acción ejecutada por ADMIN_TECNICO',
   },
  })
  return updated
 }
 function listAdministrativeUsers(){return repository.listUsers()}
 return {provisionMspUser,toggleUserStatus,listAdministrativeUsers}
}
