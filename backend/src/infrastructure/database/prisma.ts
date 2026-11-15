import { PrismaClient } from '@prisma/client'

// Instancia singleton del cliente Prisma
export const prisma = new PrismaClient({
  log: process.env['NODE_ENV'] === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

