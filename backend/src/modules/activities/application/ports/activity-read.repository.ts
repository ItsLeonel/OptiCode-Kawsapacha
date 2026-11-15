/** Filtros del dominio agrícola, sin detalles de consultas Prisma. */
export interface ActivityReadFilter {
 gardenId:string;includeVoided:boolean;plantId?:string;type?:string;from?:string;to?:string
}
export interface ActivitySummary {id:string;gardenId:string;plant?:{id:string}|null}
export interface ActivityListRecord {id:string;type:string;performedDate:string}
export interface ActivityReadRepository {
 list(filter:ActivityReadFilter):Promise<ActivityListRecord[]>
 getDetail(activityId:string):Promise<ActivitySummary|null>
}
