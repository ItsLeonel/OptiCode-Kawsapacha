import type { ActivityVoidRepository } from './ports/activity-void.repository'

/** Reglas de autorización y reversión sin detalles de la transacción Prisma. */
export function createActivityVoidService(repository:ActivityVoidRepository,syncUserMissions:(id:string)=>Promise<unknown>) {
 return async function voidGardenActivity(activityId:string,userId:string,voidReason:string){
  if(!voidReason||voidReason.trim().length<3){
   throw new Error('Debe proporcionar un motivo válido de anulación (mínimo 3 caracteres).')
  }
  const activity=await repository.findForVoid(activityId)
  if(!activity)throw new Error('Actividad no encontrada.')
  if(activity.voidedAt)throw new Error('Esta actividad ya ha sido anulada previamente.')
  if(activity.actorUserId!==userId&&activity.garden.createdById!==userId){
   throw new Error('Solo el autor de la actividad o el responsable del huerto pueden anularla.')
  }
  const {updatedActivity,pointsReverted}=await repository.voidAndRevert(activityId,voidReason,userId)
  await syncUserMissions(activity.actorUserId)
  return {activity:updatedActivity,pointsReverted}
 }
}
