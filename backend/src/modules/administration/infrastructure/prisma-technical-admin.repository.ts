import bcrypt from 'bcryptjs'
import { prisma } from '../../../infrastructure/database/prisma'
import type { TechnicalAdministrationRepository } from '../application/ports/admin-technical.repository'

export const prismaTechnicalAdminRepository:TechnicalAdministrationRepository={
 findByEmail(email){return prisma.user.findFirst({where:{email}})},
 findById(id){return prisma.user.findUnique({where:{id}})},
 createMsp(data){
  return prisma.user.create({
   data,
   select:{id:true,name:true,email:true,role:true,isActive:true,createdAt:true},
  })
 },
 countActiveTechnicalAdmins(){
  return prisma.user.count({where:{role:'ADMIN_TECNICO',isActive:true}})
 },
 changeStatus(id,isActive){
  return prisma.user.update({
   where:{id},data:{isActive},
   select:{id:true,name:true,email:true,role:true,isActive:true,updatedAt:true},
  })
 },
 listUsers(){
  return prisma.user.findMany({
   select:{id:true,name:true,email:true,role:true,isActive:true,createdAt:true,updatedAt:true},
   orderBy:{createdAt:'desc'},
  })
 },
}
export const technicalPasswordHasher=(password:string)=>bcrypt.hash(password,10)
