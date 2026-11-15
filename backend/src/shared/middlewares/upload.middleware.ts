import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { uploadsRoot } from '../../modules/media/media.module'

const ALLOWED_MIME = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const MAX_SIZE_BYTES = 5 * 1024 * 1024 // Margen de seguridad (el cliente comprime a <= 3 MB)

function safePhotoExtension(originalname: string, mimetype: string): string {
  const ext = path.extname(originalname || '').toLowerCase()
  if (['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) return ext === '.jpeg' ? '.jpg' : ext
  if (mimetype === 'image/png') return '.png'
  if (mimetype === 'image/webp') return '.webp'
  return '.jpg'
}

// Garantizar que la carpeta de uploads existe
const uploadDir = path.join(uploadsRoot, 'plants')
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = safePhotoExtension(file.originalname, file.mimetype)
    const uniqueName = `plant-${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`
    cb(null, uniqueName)
  },
})

export const uploadPlantPhoto = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Solo se permiten imágenes JPG, PNG o WebP.'))
    }
  },
  limits: { fileSize: MAX_SIZE_BYTES },
}).single('picture')

// ─── Subida de fotos de actividades de la Bitácora Viva ─────────────────────────
const activityUploadDir = path.join(uploadsRoot, 'activities')
if (!fs.existsSync(activityUploadDir)) fs.mkdirSync(activityUploadDir, { recursive: true })

const activityStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, activityUploadDir),
  filename: (_req, file, cb) => {
    const ext = safePhotoExtension(file.originalname, file.mimetype)
    const uniqueName = `activity-${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`
    cb(null, uniqueName)
  },
})

export const uploadActivityPhoto = multer({
  storage: activityStorage,
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Solo se permiten imágenes JPG, PNG o WebP.'))
    }
  },
  limits: { fileSize: MAX_SIZE_BYTES },
}).single('photo')

