import { Router } from 'express'
import { create, list, getById, update } from '../controllers/garden.controller'
import { register as registerPlant, listByGarden } from '../controllers/plant.controller'
import { requireAuth } from '../middlewares/auth.middleware'
import { uploadPlantPhoto } from '../middlewares/upload.middleware'

const router = Router()

router.get('/', requireAuth, list)
// Crear huerto: solo usuarios autenticados (la verificación de que sea RESPONSABLE
// se hace opcionalmente; cualquier usuario puede crear su propio huerto)
router.post('/', requireAuth, create)
router.get('/:id', requireAuth, getById)
// Actualizar huerto: solo el creador (verificado en el controlador)
router.put('/:id', requireAuth, update)

// Plantas del huerto virtual (anidadas bajo el huerto)
router.get('/:gardenId/plants', requireAuth, listByGarden)
router.post('/:gardenId/plants', requireAuth, uploadPlantPhoto, registerPlant)

export default router
