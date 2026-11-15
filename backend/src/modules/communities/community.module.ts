import { createCommunityService } from './application/community.service'
import { prismaCommunityRepository, communityPhotoStorage } from './infrastructure/prisma-community.repository'
import { isCommunityResponsable } from './member.module'

export const {createCommunity,listCommunities,getCommunityById,updateCommunity}=
 createCommunityService(prismaCommunityRepository,communityPhotoStorage,isCommunityResponsable)
