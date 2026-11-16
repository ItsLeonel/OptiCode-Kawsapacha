/** Contratos del ciclo de cosecha independientes del ORM. */
export interface HarvestPlant {realGardenId:string;species:{name:string;latinName:string}}
export interface HarvestGarden {id:string;communityId:string|null;createdById:string}
export interface HarvestRecord {
 id:string;realGardenId:string;communityId:string|null;
 speciesName:string;speciesLatinName:string;quantity:string;notes:string;
 harvestedById:string;harvestDate:Date
}
export interface HarvestCreateData {
 realGardenId:string;communityId:string|null;speciesName:string;speciesLatinName:string;
 quantity:string;notes:string;harvestedById:string
}
export interface HarvestResourceData {
 communityId:string;name:string;category:'SUPPLY';quantity:number;unit:string;
 status:'DISPONIBLE';description:string
}
export interface HarvestRepository {
 findPlant(id:string):Promise<HarvestPlant|null>
 findGarden(id:string):Promise<HarvestGarden|null>
 findAcceptedMembership(userId:string):Promise<string|null>
 findCreatedCommunity(creatorIds:string[]):Promise<string|null>
 linkGarden(gardenId:string,communityId:string):Promise<void>
 createHarvest(data:HarvestCreateData):Promise<HarvestRecord>
 findResource(communityId:string,name:string):Promise<{id:string;unit:string}|null>
 incrementResource(id:string,quantity:number,unit:string,description:string):Promise<void>
 createResource(data:HarvestResourceData):Promise<void>
 markPlantRegrowing(plantId:string,harvestDate:Date):Promise<void>
 listByGarden(gardenId:string):Promise<unknown[]>
 listByCommunity(communityId:string):Promise<unknown[]>
}
