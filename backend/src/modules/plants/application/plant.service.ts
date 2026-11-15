/** Fachada V1: se conservan nombres y firmas durante la migración modular. */
export { registerPlant } from './plant-registration.service'
export { listPlantsByGarden, getPlantPassport } from './plant-query.service'
export { removePlant, archivePlant } from './plant-lifecycle.service'
export { updatePlantDetails } from './plant-update.service'
export type { RegisterPlantInput, UpdatePlantInput } from './plant-input'
