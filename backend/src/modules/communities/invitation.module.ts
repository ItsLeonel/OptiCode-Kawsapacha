import { createInvitationService } from './application/invitation.service'
import { prismaInvitationRepository } from './infrastructure/prisma-invitation.repository'
export const {getPendingInvitationsForEmail,acceptInvitation,rejectInvitation}=
 createInvitationService(prismaInvitationRepository)
