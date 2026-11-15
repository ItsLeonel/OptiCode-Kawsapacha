export interface PlantRow {
 id:string;plotIndex:number|null;speciesId:string;customName:string;photoUrl:string;photoPath:string;photoMime:string;photoSize:number;
 notes:string;plantingDate:Date;lifecycleStatus:string;observedState:string;lastHarvestDate:Date|null;archivedAt:Date|null;
 reviewStatus:string;registeredById:string;realGardenId:string;createdAt:Date;updatedAt:Date;species:unknown;
 activities:Array<{details:string;type:string;reviewStatus:string}>
}
export interface PlantRemoval {
 id:string;registeredById:string;realGarden:{createdById:string}|null
}
export interface PlantArchive {
 id:string;registeredById:string;
 realGarden:{createdById:string;communityId:string|null;community:{creatorId:string}|null}|null
}
export interface PlantReadRepository {
 listByGarden(gardenId:string):Promise<PlantRow[]>
 findOwner(plantId:string):Promise<{realGardenId:string}|null>
 findPassport(plantId:string):Promise<unknown|null>
}
export interface PlantLifecycleRepository {
 findForRemoval(id:string):Promise<PlantRemoval|null>
 findForArchive(id:string):Promise<PlantArchive|null>
 findMemberRole(communityId:string,userId:string):Promise<string|null>
 remove(id:string):Promise<void>
 archive(id:string,at:Date):Promise<unknown>
}
