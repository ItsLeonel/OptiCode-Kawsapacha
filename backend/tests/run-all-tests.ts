// backend/tests/run-all-tests.ts
import { runLunarTests } from './lunar-calendar.test'
import { runRewardsAndMissionsTests } from './rewards-missions.test'
import { runActivityTests } from './activity.test'
import { runPhase45MspRbacTests } from './phase4-5-msp-rbac.test'
import { prisma } from '../src/config/prisma'

async function main() {
  console.log('==================================================================')
  console.log('🚀 EJECUTANDO SUITE COMPLETA DE PRUEBAS DE KAWSAPACHA V1.1 (P1) 🚀')
  console.log('==================================================================\n')

  try {
    await runLunarTests()
    console.log('')
    await runRewardsAndMissionsTests()
    console.log('')
    await runActivityTests()
    console.log('')
    await runPhase45MspRbacTests()
    console.log('\n==================================================================')
    console.log('🎉 TODAS LAS PRUEBAS AUTOMATIZADAS PASARON SATISFACTORIAMENTE 🎉')
    console.log('==================================================================')
  } catch (error) {
    console.error('\n❌ ERROR EN LA EJECUCIÓN DE PRUEBAS:')
    console.error(error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()

