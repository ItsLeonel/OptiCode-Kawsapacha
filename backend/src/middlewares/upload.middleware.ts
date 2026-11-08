import multer from 'multer'
import path from 'path'
import fs from 'fs'

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE_BYTES = 3 * 1024 * 1024 // 3 MB

// Garantizar que la carpeta de uploads existe
const uploadDir = path.resolve(__dirname, '../../uploads/plants')
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
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
