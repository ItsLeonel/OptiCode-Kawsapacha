import { createCareService } from './application/care-implementation'
import { prismaCareRepository } from './infrastructure/prisma-care.repository'

export const {addCareLog,getCareLogs,calculateGrowth,getCalendarTips}=createCareService(prismaCareRepository)
