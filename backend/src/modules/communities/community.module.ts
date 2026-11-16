import { createCommunityService } from './application/community.service'
import { prismaCommunityRepository, communityPhotoStorage } from './infrastructure/prisma-community.repository'
import { isCommunityResponsable } from './member.module'

export const {createCommunity,listCommunities,getCommunityById,updateCommunity}=
 createCommunityService(prismaCommunityRepository,communityPhotoStorage,isCommunityResponsable)

import { createCommunityRoleService } from './application/community-role.service'
import { prismaCommunityRoleRepository } from './infrastructure/prisma-community-role.repository'
export const checkCommunityRole = createCommunityRoleService(prismaCommunityRoleRepository)
