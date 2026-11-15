/** Contrato propio de Comunidades, sin dependencia de Prisma o Express. */
export interface UploadedCommunityPhoto {buffer:Buffer;size:number;mimetype:string}
export interface CommunityDetail {
 creatorId:string
 members:Array<{userId:string;status:string}>
 gardens:Array<{latitude:number|null;longitude:number|null}>
}
export interface CommunityCreateData {
 name:string;responsible:string;location:string;description:string;type:string;
 province?:string;cantonCode?:string;parishCode?:string;sector?:string;
 photoUrl:string|null|undefined;creatorId:string
}
export interface CommunityUpdateData {
 name?:string;responsible?:string;location?:string;description?:string;type?:string;
 province?:string;cantonCode?:string;parishCode?:string;sector?:string;
 photoUrl?:string|null;status?:string;reviewReason?:string|null;reviewedAt?:Date|null;reviewedById?:string|null
}
export interface CommunityRepository {
 findCreated(creatorId:string):Promise<{id:string}|null>
 create(data:CommunityCreateData):Promise<unknown>
 listForUser(userId:string):Promise<unknown[]>
 getDetail(id:string):Promise<CommunityDetail|null>
 getMetadata(id:string):Promise<{photoUrl:string|null;status:string;name:string}>
 update(id:string,data:CommunityUpdateData):Promise<unknown>
}
export interface CommunityPhotoStorage {
 withPhoto<T>(file:UploadedCommunityPhoto|undefined,remove:boolean|undefined,previous:string|null|undefined,save:(url:string|null|undefined)=>Promise<T>):Promise<T>
}
