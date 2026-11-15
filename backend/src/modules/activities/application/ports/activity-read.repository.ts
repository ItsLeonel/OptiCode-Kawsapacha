/** Filtros del dominio agrícola, sin detalles de consultas Prisma. */
export interface ActivityReadFilter {
 gardenId:string;includeVoided:boolean;plantId?:string;type?:string;from?:string;to?:string
}
export interface ActivitySummary {gardenId:string}
export interface ActivityReadRepository {
 list(filter:ActivityReadFilter):Promise<unknown[]>
 getDetail(activityId:string):Promise<ActivitySummary|null>
}
