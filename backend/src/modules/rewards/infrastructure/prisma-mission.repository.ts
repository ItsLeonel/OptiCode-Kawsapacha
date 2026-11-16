import { prisma } from '../../../infrastructure/database/prisma'
import type { MissionRepository, MissionProgressData, MissionLedgerData } from '../application/ports/mission.repository'
export const prismaMissionRepository: MissionRepository = {
  listApprovedActivities(userId) {
    return prisma.gardenActivity.findMany({
      where:{actorUserId:userId,voidedAt:null,reviewStatus:'APPROVED'},
      include:{evidences:true},orderBy:{performedDate:'asc'},
    })
  },
  deleteBadge(userId,badgeId) {
    return prisma.userBadge.deleteMany({where:{userId,badgeId}})
  },
  listBadges(userId) {
    return prisma.userBadge.findMany({where:{userId},orderBy:{earnedAt:'asc'}})
  },
  listMissions(userId) {
    return prisma.userMissionProgress.findMany({where:{userId}})
  },
  findMission(userId,missionId) {
    return prisma.userMissionProgress.findUnique({where:{userId_missionId:{userId,missionId}}})
  },
  createMission(data:MissionProgressData) {
    return prisma.userMissionProgress.create({data})
  },
  updateMission(id,data) {
    return prisma.userMissionProgress.update({where:{id},data})
  },
  getMissionLedger(userId,missionId) {
    return prisma.rewardLedger.findMany({
      where:{userId,sourceId:missionId,eventType:{startsWith:'mission.completed'}},
      orderBy:{awardedAt:'asc'},
    })
  },
  createLedger(data:MissionLedgerData) {
    return prisma.rewardLedger.create({data})
  },
  findBadge(userId,badgeId) {
    return prisma.userBadge.findUnique({where:{userId_badgeId:{userId,badgeId}}})
  },
  createBadge(userId,badgeId) {
    return prisma.userBadge.create({data:{userId,badgeId}})
  },
}
