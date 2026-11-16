import type { CommunityRepository, CommunityPhotoStorage, UploadedCommunityPhoto } from './ports/community.repository'

export interface CreateCommunityInput {
 name:string;responsible:string;location:string;description:string;type?:string;
 province?:string;cantonCode?:string;parishCode?:string;sector?:string;
 file?:UploadedCommunityPhoto;removePhoto?:boolean;creatorId:string
}

/** Operaciones de comunidades: las reglas son ajenas a Prisma y al disco. */
export function createCommunityService(
 repository:CommunityRepository,
 photos:CommunityPhotoStorage,
 isCommunityResponsable:(communityId:string,userId:string)=>Promise<boolean>
) {
 async function createCommunity(input:CreateCommunityInput) {
  // Regla de negocio V1: cada usuario puede crear como máximo UNA comunidad propia.
  const existingCreated=await repository.findCreated(input.creatorId)
  if(existingCreated) {
   const error=new Error('Cada usuario puede crear como máximo una comunidad propia.')
   ;(error as {code?:string}).code='COMMUNITY_LIMIT_REACHED'
   throw error
  }
  return photos.withPhoto(input.file,false,null,photoUrl=>repository.create({
   name:input.name,
   responsible:input.responsible,
   location:input.location,
   description:input.description,
   type:input.type||'personal',
   province:input.province,
   cantonCode:input.cantonCode,
   parishCode:input.parishCode,
   sector:input.sector,
   photoUrl,
   creatorId:input.creatorId,
  }))
 }

 /** Solo creador o miembro con estado ACCEPTED aparece en el listado. */
 function listCommunities(userId:string) {return repository.listForUser(userId)}

 async function getCommunityById(id:string,viewerUserId?:string,viewerRole?:string) {
  const comm=await repository.getDetail(id)
  if(!comm)return null
  const isPrivileged=
   viewerRole==='ADMIN_MSP'||
   viewerRole==='ADMIN_TECNICO'||
   comm.creatorId===viewerUserId||
   comm.members.some(m=>m.userId===viewerUserId&&m.status==='ACCEPTED')

  if(!isPrivileged) {
   // Privacidad geográfica: las coordenadas exactas son solo de miembros acreditados.
   return {...comm,gardens:comm.gardens.map(g=>({...g,latitude:null,longitude:null}))}
  }
  return comm
 }

 async function updateCommunity(id:string,userId:string,data:Partial<Omit<CreateCommunityInput,'creatorId'>>) {
  const isResponsable=await isCommunityResponsable(id,userId)
  if(!isResponsable){
   const error=new Error('Solo el Responsable puede modificar los datos de la comunidad.')
   ;(error as {code?:string}).code='FORBIDDEN'
   throw error
  }
  const previous=await repository.getMetadata(id)
  const {file,removePhoto,...fields}=data
  const resubmit=previous.status==='NEEDS_CHANGES'||previous.status==='REJECTED'
  return photos.withPhoto(file,removePhoto,previous.photoUrl,photoUrl=>repository.update(id,{
   ...fields,photoUrl,
   ...(resubmit?{status:'PENDING',reviewReason:null,reviewedAt:null,reviewedById:null}:{})
  }))
 }
 return {createCommunity,listCommunities,getCommunityById,updateCommunity}
}
