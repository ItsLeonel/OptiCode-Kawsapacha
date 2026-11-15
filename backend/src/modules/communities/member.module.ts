import { createMemberService } from './application/member.service'
import { prismaCommunityMemberRepository } from './infrastructure/prisma-member.repository'

export const {isCommunityResponsable,inviteMember,listMembers,updateMemberRole,removeMember}=
 createMemberService(prismaCommunityMemberRepository)
