import type { ActivityReadRepository, ActivityReadFilter } from './ports/activity-read.repository'
import { VALID_ACTIVITY_TYPES, type ActivityType } from '../domain/activity-types'

export type ActivityFilters={
 plantId?:string;type?:string;from?:string;to?:string;includeVoided?:boolean
}

/** Caso de uso: valida filtros y permisos; el adaptador traduce a consultas SQL. */
export function createActivityReadService(
 repository:ActivityReadRepository,
 assertGardenAccess:(gardenId:string,userId:string,options?:{requireApproved?:boolean})=>Promise<boolean>
) {
 async function listGardenActivities(gardenId:string,userId:string,filters:ActivityFilters) {
  await assertGardenAccess(gardenId,userId,{requireApproved:false})
  const filter:ActivityReadFilter={
   gardenId,
   includeVoided:Boolean(filters.includeVoided),
   ...(filters.plantId?{plantId:filters.plantId}:{}),
   ...(filters.type&&VALID_ACTIVITY_TYPES.includes(filters.type as ActivityType)?{type:filters.type}:{}),
   ...(filters.from?{from:filters.from}:{}),
   ...(filters.to?{to:filters.to}:{}),
  }
  return repository.list(filter)
 }
 async function getGardenActivityDetail(activityId:string,userId:string) {
  const activity=await repository.getDetail(activityId)
  if(!activity)throw new Error('Actividad no encontrada.')
  await assertGardenAccess(activity.gardenId,userId)
  return activity
 }
 return {listGardenActivities,getGardenActivityDetail}
}
