export interface ManagedUser {id:string;name:string;email:string;role:string;isActive:boolean}
export interface CreatedManagedUser extends ManagedUser {createdAt:Date}
export interface UpdatedManagedUser extends ManagedUser {updatedAt:Date}
export interface ManagedUserRecord extends ManagedUser {passwordHash:string}
export interface TechnicalAdministrationRepository {
 findByEmail(email:string):Promise<ManagedUserRecord|null>
 findById(id:string):Promise<ManagedUserRecord|null>
 createMsp(data:{name:string;email:string;passwordHash:string;role:'ADMIN_MSP';isActive:true}):Promise<CreatedManagedUser>
 countActiveTechnicalAdmins():Promise<number>
 changeStatus(id:string,isActive:boolean):Promise<UpdatedManagedUser>
 listUsers():Promise<Array<ManagedUser & {createdAt:Date;updatedAt:Date}>>
}
export interface TechnicalAudit {
 (input:{actorId:string;action:string;targetResource:string;targetId:string;details:Record<string,unknown>}):Promise<unknown>
}
