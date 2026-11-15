/** Puerto de huertos. Tipos propios de la aplicación, sin ORM. */
export interface UploadedPhoto { buffer: Buffer; size: number; mimetype: string }
export interface GardenRecord {
 id:string; name:string; kind:string; areaM2:number; province:string; provinceCode:string;
 canton:string; cantonCode:string|null; parish:string; parishCode:string|null;
 reference:string; latitude:number|null; longitude:number|null;
 irrigationAvailability:string; soilType:string|null; characteristics:string|null;
 photoUrl:string|null; communityId:string|null; createdById:string; createdAt:Date; updatedAt:Date;
}
export type GardenChanges=Partial<Omit<GardenRecord,'id'|'createdAt'|'updatedAt'>>
export type GardenNew=Omit<GardenRecord,'id'|'createdAt'|'updatedAt'|'photoUrl'> & {photoUrl:string|null|undefined}
export interface GardenRepository {
 findLatestByCommunity(id:string):Promise<GardenRecord|null>
 findLatestByCreator(id:string):Promise<GardenRecord|null>
 findById(id:string):Promise<GardenRecord|null>
 update(id:string,changes:GardenChanges):Promise<GardenRecord>
 create(data:GardenNew):Promise<GardenRecord>
 listAccessible(userId:string,communityId?:string):Promise<unknown[]>
 getDetails(id:string):Promise<unknown|null>
}
export interface GardenPhotoStorage {
 withPhoto<T>(file:UploadedPhoto|undefined,remove:boolean|undefined,previous:string|null|undefined,save:(url:string|null|undefined)=>Promise<T>):Promise<T>
}
