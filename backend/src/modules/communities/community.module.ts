import { createCommunityService } from './application/community.service'
import { prismaCommunityRepository, communityPhotoStorage } from './infrastructure/prisma-community.repository'
import { isCommunityResponsable } from './application/member.service'

export const {createCommunity,listCommunities,getCommunityById,updateCommunity}=
 createCommunityService(prismaCommunityRepository,communityPhotoStorage,isCommunityResponsable)
